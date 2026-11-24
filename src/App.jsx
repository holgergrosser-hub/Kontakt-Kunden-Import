import { useState } from "react";

const SCRIPT_URL = import.meta.env.VITE_GAS_URL || "";
const SCRIPT_TOKEN = import.meta.env.VITE_GAS_TOKEN || "";
const PROJECT_LEADERS = [
  "Eudys Guevara",
  "Stephan Schroeder",
  "Nina Schroeder",
  "Holger Grosser",
];

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

function defaultFundingDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 5);
  return formatDateInput(date);
}

// Kalender- und CRM-Termin: einen Monat vor der Vorlagefrist aus dem Bescheid.
function oneMonthBefore(isoDate) {
  const date = new Date(isoDate + "T12:00:00");
  if (isNaN(date.getTime())) return "";
  date.setMonth(date.getMonth() - 1);
  return formatDateInput(date);
}

function formatGerman(isoDate) {
  const p = String(isoDate || "").slice(0, 10).split("-");
  return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : "";
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const MAX_PDF_BYTES = 4 * 1024 * 1024;

const STEPS = [
  { key: "crm", label: "Kunde im CRM anlegen", hint: "CRM Super Master + Ansprechpartner im Blatt Kontakte" },
  { key: "calendar", label: "Kalendertermin anlegen", hint: "QM-Office Termine, Bescheid als Anhang" },
  { key: "drive", label: "Drive-Ablage anlegen", hint: "Kundenordner mit _Verträge: Bescheid und Angebote" },
];

function createEmpty() {
  return {
    salutation: "", prefix: "", firstName: "", lastName: "",
    customerName: "", website: "", projectLeader: "",
    company: "", jobTitle: "",
    emailWork: "", emailPersonal: "",
    phoneMobile: "", phoneWork: "", phoneFax: "",
    street: "", postalCode: "", city: "", country: "",
    fundingDate: defaultFundingDate(),
    deadline: "", vorgang: "", bescheidDate: "",
    notes: "",
  };
}

const sections = [
  { title: "Person", fields: [
    { key: "salutation", label: "Anrede", options: ["Herr", "Frau"] },
    { key: "prefix", label: "Titel", ph: "Dr. / Prof." },
    { key: "firstName", label: "Vorname" },
    { key: "lastName", label: "Nachname" },
  ]},
  { title: "Firma", fields: [
    { key: "customerName", label: "Kundenname" },
    { key: "company", label: "Firma" },
    { key: "jobTitle", label: "Position" },
    { key: "website", label: "Webseite", ph: "https://..." },
    { key: "projectLeader", label: "Projektleiter", options: PROJECT_LEADERS },
  ]},
  { title: "Kontakt", fields: [
    { key: "emailWork", label: "E-Mail gesch." },
    { key: "emailPersonal", label: "E-Mail privat" },
    { key: "phoneMobile", label: "Mobil" },
    { key: "phoneWork", label: "Telefon" },
    { key: "phoneFax", label: "Fax" },
  ]},
  { title: "Adresse", fields: [
    { key: "street", label: "Straße" },
    { key: "postalCode", label: "PLZ", width: "30%" },
    { key: "city", label: "Ort", width: "66%" },
    { key: "country", label: "Land" },
  ]},
  { title: "Sonstiges", fields: [
    { key: "fundingDate", label: "Termin Fördergelder abrechnen (Kalender + CRM)", type: "date" },
    { key: "deadline", label: "Vorlagefrist BAFA laut Bescheid", type: "date" },
    { key: "vorgang", label: "Vorgang (Mein Zeichen)", ph: "UBF-..." },
    { key: "notes", label: "Notizen", multi: true },
  ]},
];

const font = "'DM Sans', sans-serif";

export default function App() {
  const [d, setD] = useState(createEmpty);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [savedRowIndex, setSavedRowIndex] = useState(null);
  const [open, setOpen] = useState({
    Person: true, Firma: true, Kontakt: true, Adresse: true, Sonstiges: true,
  });
  const [steps, setSteps] = useState({ crm: true, calendar: true, drive: true });
  const [pdf, setPdf] = useState(null); // { name, base64 }
  const [check, setCheck] = useState(null); // Ergebnis der Prüfung vor dem Anlegen
  const [pickedOffers, setPickedOffers] = useState({});
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [result, setResult] = useState(null);

  // AI parse state
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [showPaste, setShowPaste] = useState(true);

  const set = (k, v) => { setD((p) => ({ ...p, [k]: v })); setCheck(null); };
  const fullName = [d.prefix, d.firstName, d.lastName].filter(Boolean).join(" ");
  const initials = [d.firstName, d.lastName].map((n) => n?.[0] || "").join("").toUpperCase();
  const toggle = (t) => setOpen((p) => ({ ...p, [t]: !p[t] }));

  /* ── Claude AI Parse ── */
  const choosePdf = async (file) => {
    setParseError("");
    if (!file) { setPdf(null); return; }
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      setParseError("Bitte den Zuwendungsbescheid als PDF auswählen.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setParseError("Das PDF ist größer als 4 MB. Bitte kleiner speichern.");
      return;
    }
    setPdf({ name: file.name, base64: await fileToBase64(file) });
  };

  const parseWithClaude = async () => {
    if (!rawText.trim() && !pdf) return;
    setParsing(true);
    setParseError("");
    try {
      const res = await fetch("/api/parse-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, pdfBase64: pdf ? pdf.base64 : "" }),
      });
      // Antwort immer als JSON lesen, auch bei Fehlerstatus - sonst geht die
      // eigentliche Fehlermeldung vom Backend (z.B. fehlender API-Key,
      // Anthropic-Fehler) verloren und es wird nur "API Fehler" angezeigt.
      const parsed = await res.json().catch(() => ({}));
      if (!res.ok || parsed.error) {
        throw new Error(parsed.error || `Fehler bei der KI-Erkennung (Status ${res.status}).`);
      }

      const anyFieldFound = Object.keys(d).some((key) => parsed[key]);
      if (!anyFieldFound) {
        throw new Error(
          "Es konnten keine Kontaktdaten aus dem Text erkannt werden. Bitte Text prüfen oder Felder manuell ausfüllen."
        );
      }

      setD((prev) => {
        const merged = { ...prev };
        for (const key of Object.keys(prev)) {
          if (parsed[key]) merged[key] = parsed[key];
        }
        const termin = parsed.deadline ? oneMonthBefore(parsed.deadline) : "";
        if (termin) merged.fundingDate = termin;
        return merged;
      });
      setShowPaste(false);
    } catch (e) {
      setParseError(e.message || "Fehler beim Parsen");
    } finally {
      setParsing(false);
    }
  };

  /* ── Google Backend ── */
  const callBackend = async (payload) => {
    if (!SCRIPT_URL) throw new Error("VITE_GAS_URL ist nicht gesetzt.");
    if (!SCRIPT_TOKEN) throw new Error("VITE_GAS_TOKEN ist nicht gesetzt.");
    // Body ohne eigenen Content-Type: Apps Script braucht so keine Vorab-Anfrage (CORS).
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ ...payload, token: SCRIPT_TOKEN }),
    });
    if (!response.ok) throw new Error("Apps Script antwortet nicht erfolgreich.");
    const json = await response.json().catch(() => null);
    if (!json) throw new Error("Antwort vom Apps Script nicht lesbar. Ist die neue Version bereitgestellt?");
    if (json.status === "error") throw new Error(json.message || "Fehler im Apps Script.");
    return json;
  };

  const customerNameValue = () => d.customerName.trim() || d.company.trim() || fullName.trim();
  const anyStep = steps.crm || steps.calendar || steps.drive;

  const validate = () => {
    if (!anyStep) throw new Error("Bitte mindestens einen Schritt anhaken.");
    if (!customerNameValue()) throw new Error("Bitte einen Kundennamen eingeben.");
    if (steps.crm && !d.projectLeader) throw new Error("Bitte einen Projektleiter auswählen.");
    if (steps.calendar && !d.fundingDate) throw new Error("Bitte den Termin für den Kalender eintragen.");
  };

  /* Schritt 1: prüfen – legt noch nichts an */
  const runCheck = async () => {
    setStatus("sending");
    setErrorMessage("");
    try {
      validate();
      const json = await callBackend({
        action: "check",
        customerName: customerNameValue(),
        emailWork: d.emailWork,
        website: d.website,
        searchOffers: steps.drive,
      });
      const picked = {};
      (json.offers || []).forEach((o) => { picked[o.messageId + ":" + o.index] = true; });
      setPickedOffers(picked);
      setAllowDuplicate(false);
      setCheck(json);
      setStatus("idle");
    } catch (error) {
      setErrorMessage(error.message || "Bitte Verbindung prüfen und erneut versuchen.");
      setStatus("error");
    }
  };

  /* Schritt 2: anlegen */
  const send = async () => {
    setStatus("sending");
    setErrorMessage("");
    try {
      validate();
      const json = await callBackend({
        ...d,
        action: "create",
        steps,
        customerName: customerNameValue(),
        phone: d.phoneWork.trim() || d.phoneMobile.trim(),
        calendarDate: d.fundingDate,
        allowDuplicate,
        pdfBase64: pdf && (steps.calendar || steps.drive) ? pdf.base64 : "",
        offers: steps.drive
          ? (check?.offers || []).filter((o) => pickedOffers[o.messageId + ":" + o.index])
          : [],
      });
      setResult(json);
      setStatus("done");
    } catch (error) {
      setErrorMessage(error.message || "Bitte Verbindung prüfen und erneut versuchen.");
      setStatus("error");
    }
  };

  const reset = () => {
    setD(createEmpty());
    setStatus("idle");
    setErrorMessage("");
    setSavedRowIndex(null);
    setPdf(null);
    setCheck(null);
    setResult(null);
    setRawText("");
    setShowPaste(true);
    setParseError("");
  };

  const pills = [
    d.emailWork && { i: "✉", v: d.emailWork },
    d.phoneMobile && { i: "📱", v: d.phoneMobile },
    d.phoneWork && { i: "☎", v: d.phoneWork },
    d.website && { i: "🌐", v: d.website },
    d.city && { i: "📍", v: `${d.postalCode} ${d.city}`.trim() },
    pdf && { i: "📄", v: pdf.name },
    d.deadline && { i: "⏳", v: `Frist ${formatGerman(d.deadline)}` },
  ].filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: "#f0f0ee", fontFamily: font, padding: "24px 16px" }}>

      {/* ── AI Paste Card ── */}
      {showPaste && (
        <div style={{
          maxWidth: 460, margin: "0 auto 12px",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          borderRadius: 20, padding: "22px 22px 20px", color: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Neukunde anlegen</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Zuwendungsbescheid anhängen, Mail-Absender oder Impressum einfügen</div>
            </div>
          </div>
          <label style={{
            display: "block", padding: "10px 14px", marginBottom: 10, fontSize: 13,
            border: "1.5px dashed rgba(255,255,255,0.35)", borderRadius: 12, cursor: "pointer",
            background: "rgba(255,255,255,0.08)",
          }}>
            <input
              type="file" accept="application/pdf,.pdf" style={{ display: "none" }}
              onChange={(e) => choosePdf(e.target.files?.[0])}
            />
            {pdf ? `📄 ${pdf.name}` : "📄 Zuwendungsbescheid (PDF) auswählen – optional"}
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={"Max Mustermann\nGeschäftsführer · Muster GmbH\nmax@muster.de\n+49 171 9876543"}
            rows={4}
            style={{
              width: "100%", padding: "12px 14px", fontSize: 13, fontFamily: font,
              border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 12,
              background: "rgba(255,255,255,0.12)", color: "#fff",
              outline: "none", resize: "vertical", boxSizing: "border-box",
              lineHeight: 1.5,
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.2)")}
          />
          {parseError && (
            <div style={{ fontSize: 12, color: "#fca5a5", marginTop: 8 }}>{parseError}</div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={parseWithClaude}
              disabled={parsing || (!rawText.trim() && !pdf)}
              style={{
                flex: 1, padding: "10px 0", border: "none", borderRadius: 10,
                background: parsing ? "rgba(255,255,255,0.15)" : "#fff",
                color: parsing ? "#fff" : "#4f46e5",
                fontSize: 13, fontWeight: 700, fontFamily: font,
                cursor: parsing ? "wait" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {parsing ? "Wird analysiert …" : "Mit Claude erkennen →"}
            </button>
            <button
              onClick={() => setShowPaste(false)}
              style={{
                padding: "10px 16px", border: "1.5px solid rgba(255,255,255,0.25)",
                borderRadius: 10, background: "none", color: "rgba(255,255,255,0.7)",
                fontSize: 13, fontWeight: 600, fontFamily: font, cursor: "pointer",
              }}
            >Manuell</button>
          </div>
        </div>
      )}

      {/* ── Header Card ── */}
      <div style={{
        maxWidth: 460, margin: "0 auto 14px", background: "#1a1a1a", borderRadius: 20,
        padding: "28px 24px", color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16, flexShrink: 0,
            background: "linear-gradient(135deg,#6366f1,#a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 19, fontWeight: 700, letterSpacing: 1,
          }}>{initials || "?"}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {fullName || "Neuer Kontakt"}
            </div>
            {(d.company || d.jobTitle) && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>
                {[d.jobTitle, d.company].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
        </div>
        {pills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 18 }}>
            {pills.map((p, i) => (
              <span key={i} style={{
                background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "4px 10px",
                fontSize: 11, color: "rgba(255,255,255,0.6)", display: "inline-flex", alignItems: "center", gap: 5,
              }}><span style={{ fontSize: 11 }}>{p.i}</span>{p.v}</span>
            ))}
          </div>
        )}
        {!showPaste && (
          <button
            onClick={() => setShowPaste(true)}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8,
              padding: "5px 10px", fontSize: 14, cursor: "pointer", color: "rgba(255,255,255,0.5)",
            }}
          >✨</button>
        )}
      </div>

      {/* ── Editable Sections ── */}
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        {sections.map((sec) => (
          <div key={sec.title} style={{
            background: "#fff", borderRadius: 16, marginBottom: 8, overflow: "hidden",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}>
            <button onClick={() => toggle(sec.title)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 18px", border: "none", background: "none", cursor: "pointer",
              fontFamily: font, fontSize: 11, fontWeight: 700, color: "#1a1a1a",
              letterSpacing: 1.2, textTransform: "uppercase",
            }}>
              {sec.title}
              <span style={{
                fontSize: 16, color: "#bbb", display: "inline-block",
                transition: "transform 0.2s",
                transform: open[sec.title] ? "rotate(0)" : "rotate(-90deg)",
              }}>▾</span>
            </button>
            {open[sec.title] && (
              <div style={{ padding: "0 18px 16px", display: "flex", flexWrap: "wrap", gap: 10 }}>
                {sec.fields.map((f) => (
                  <div key={f.key} style={{ width: f.width || "100%", flexShrink: 0, minWidth: 0 }}>
                    <label style={{
                      display: "block", fontSize: 9.5, fontWeight: 700, color: "#aaa",
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, paddingLeft: 2,
                    }}>{f.label}</label>
                    {f.multi ? (
                      <textarea rows={2} value={d[f.key]} onChange={(e) => set(f.key, e.target.value)}
                        placeholder={f.ph || ""}
                        style={{
                          width: "100%", padding: "8px 12px", fontSize: 14, fontFamily: font,
                          border: "1.5px solid #ebebea", borderRadius: 10, background: "#fafaf9",
                          outline: "none", resize: "vertical", color: "#1a1a1a", boxSizing: "border-box",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                        onBlur={(e) => (e.target.style.borderColor = "#ebebea")}
                      />
                    ) : f.options ? (
                      <select
                        value={d[f.key]}
                        onChange={(e) => set(f.key, e.target.value)}
                        style={{
                          width: "100%", padding: "8px 12px", fontSize: 14, fontFamily: font,
                          border: `1.5px solid ${d[f.key] ? "#ebebea" : "#e2e2e0"}`,
                          borderRadius: 10, background: d[f.key] ? "#fafaf9" : "#fff",
                          outline: "none", color: "#1a1a1a", boxSizing: "border-box",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                        onBlur={(e) => (e.target.style.borderColor = "#ebebea")}
                      >
                        <option value="">Bitte wählen</option>
                        {f.options.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type || "text"}
                        value={d[f.key]}
                        onChange={(e) => set(f.key, e.target.value)}
                        placeholder={f.ph || ""}
                        style={{
                          width: "100%", padding: "8px 12px", fontSize: 14, fontFamily: font,
                          border: `1.5px solid ${d[f.key] ? "#ebebea" : "#e2e2e0"}`,
                          borderRadius: 10, background: d[f.key] ? "#fafaf9" : "#fff",
                          outline: "none", color: "#1a1a1a", boxSizing: "border-box",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                        onBlur={(e) => (e.target.style.borderColor = "#ebebea")}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* ── Schritte ── */}
        {status !== "done" && (
          <div style={{
            background: "#fff", borderRadius: 16, marginBottom: 8, padding: "14px 18px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
              Was soll angelegt werden?
            </div>
            {STEPS.map((step) => (
              <label key={step.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", cursor: "pointer" }}>
                <input
                  type="checkbox" checked={steps[step.key]} style={{ marginTop: 3 }}
                  onChange={(e) => { setSteps((p) => ({ ...p, [step.key]: e.target.checked })); setCheck(null); }}
                />
                <span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{step.label}</span>
                  <span style={{ display: "block", fontSize: 12, color: "#888" }}>{step.hint}</span>
                </span>
              </label>
            ))}
            {(steps.calendar || steps.drive) && !pdf && (
              <div style={{ fontSize: 12, color: "#b45309", marginTop: 6 }}>
                Kein Zuwendungsbescheid angehängt – Termin und Ordner werden ohne PDF angelegt.
              </div>
            )}
          </div>
        )}

        {/* ── Vorschau nach dem Prüfen ── */}
        {check && status !== "done" && (
          <div style={{
            background: "#fff", borderRadius: 16, marginBottom: 8, padding: "14px 18px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)", fontSize: 13, color: "#333", lineHeight: 1.5,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8, color: "#1a1a1a" }}>
              Vorschau – noch nichts angelegt
            </div>
            {steps.crm && (check.duplicates.length > 0 ? (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#b91c1c", fontWeight: 600 }}>⚠ Im CRM gibt es schon:</div>
                {check.duplicates.map((dup) => (
                  <div key={dup.row}>Zeile {dup.row}: {dup.name} ({dup.reason})</div>
                ))}
                <label style={{ display: "flex", gap: 8, marginTop: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={allowDuplicate} onChange={(e) => setAllowDuplicate(e.target.checked)} />
                  Trotzdem eine neue CRM-Zeile anlegen
                </label>
              </div>
            ) : (
              <div style={{ marginBottom: 10 }}>✓ CRM: {customerNameValue()} ist neu, Projektleiter {d.projectLeader}.</div>
            ))}
            {steps.calendar && (
              <div style={{ marginBottom: 10 }}>
                ✓ Kalender: „{customerNameValue()} - wegen Fördergelder abrechnen“ am {formatGerman(d.fundingDate)}
                {d.deadline ? ` (Vorlagefrist ${formatGerman(d.deadline)})` : ""}.
              </div>
            )}
            {steps.drive && (
              <div>
                <div>
                  ✓ Drive: {check.folder
                    ? <>Ordner „{check.folder.name}“ gibt es schon – es wird nur ergänzt.</>
                    : <>Neuer Ordner „{customerNameValue()}“ mit _Verträge.</>}
                </div>
                <div style={{ marginTop: 6, fontWeight: 600 }}>
                  {check.offers.length > 0 ? "Angebote aus dem Postfach ablegen:" : "Keine Angebots-PDFs im Postfach gefunden."}
                </div>
                {check.offers.map((o) => {
                  const key = o.messageId + ":" + o.index;
                  return (
                    <label key={key} style={{ display: "flex", gap: 8, padding: "4px 0", cursor: "pointer" }}>
                      <input
                        type="checkbox" checked={Boolean(pickedOffers[key])} style={{ marginTop: 3 }}
                        onChange={(e) => setPickedOffers((p) => ({ ...p, [key]: e.target.checked }))}
                      />
                      <span>{o.name}<span style={{ display: "block", fontSize: 11, color: "#888" }}>{o.date} · {o.subject}</span></span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Action Area ── */}
        {status === "done" && result ? (
          <div style={{
            background: "#fff", borderRadius: 16, padding: "22px 24px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)", marginTop: 4, fontSize: 13, color: "#333", lineHeight: 1.6,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
              Ergebnis für {result.customerName}
            </div>
            {[
              result.crm && { label: "CRM", r: result.crm, text: result.crm.ok && `Zeile ${result.crm.rowIndex} angelegt` },
              result.contact && { label: "Kontakte", r: result.contact, text: result.contact.ok && (result.contact.existed ? `gab es schon (Zeile ${result.contact.rowIndex})` : `Zeile ${result.contact.rowIndex} angelegt`) },
              result.calendar && { label: "Kalender", r: result.calendar, text: result.calendar.ok && (result.calendar.existed ? "Termin gab es schon" : "Termin angelegt"), link: result.calendar.eventLink },
              result.drive && { label: "Drive", r: result.drive, text: result.drive.ok && `${result.drive.folderCreated ? "Ordner angelegt" : "Ordner ergänzt"}, ${result.drive.files.length} Datei(en) in _Verträge`, link: result.drive.folderUrl },
            ].filter(Boolean).map((line) => (
              <div key={line.label} style={{ color: line.r.ok ? "#166534" : "#b91c1c" }}>
                {line.r.ok ? "✓" : "✕"} <strong>{line.label}:</strong> {line.r.ok ? line.text : line.r.message}
                {line.r.ok && line.link && <> · <a href={line.link} target="_blank" rel="noreferrer">öffnen</a></>}
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
              Nächste Schritte: Projektstartmail · Fragebogen zur Dokumentation · Dokumentenpaket · Kunde in Billomat
            </div>
            <button onClick={reset} style={{
              marginTop: 16, padding: "8px 28px", border: "1.5px solid #e8e8e6",
              borderRadius: 10, background: "none", fontFamily: font, fontSize: 13,
              fontWeight: 600, cursor: "pointer", color: "#666",
            }}>Nächsten Kunden anlegen</button>
          </div>
        ) : status === "error" ? (
          <div style={{
            background: "#fff", borderRadius: 16, padding: "28px 24px", textAlign: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)", marginTop: 4,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%", margin: "0 auto 12px",
              background: "linear-gradient(135deg,#ef4444,#f87171)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, color: "#fff",
            }}>✕</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>Das hat nicht geklappt</div>
            <div style={{ fontSize: 13, color: "#999", marginTop: 4 }}>{errorMessage || "Bitte Verbindung prüfen und erneut versuchen."}</div>
            <button onClick={() => setStatus("idle")} style={{
              marginTop: 16, padding: "8px 28px", border: "1.5px solid #e8e8e6",
              borderRadius: 10, background: "none", fontFamily: font, fontSize: 13,
              fontWeight: 600, cursor: "pointer", color: "#666",
            }}>Erneut versuchen</button>
          </div>
        ) : (
          <button onClick={check ? send : runCheck} disabled={status === "sending" || !anyStep} style={{
            width: "100%", padding: "16px 0", border: "none", borderRadius: 16,
            background: status === "sending" ? "#4f46e5" : "#1a1a1a",
            color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: font,
            cursor: status === "sending" ? "wait" : "pointer",
            marginTop: 4, letterSpacing: 0.3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
            transition: "background 0.2s",
          }}>
            {status === "sending" ? "Bitte warten …" : check ? "Jetzt anlegen →" : "Prüfen →"}
          </button>
        )}
      </div>
    </div>
  );
}
