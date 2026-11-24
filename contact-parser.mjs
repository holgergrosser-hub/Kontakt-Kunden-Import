export async function parseContactText(text, apiKey, pdfBase64 = "") {
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY ist nicht gesetzt (Umgebungsvariable fehlt in Netlify bzw. .env.local)."
    );
  }
  const hasText = Boolean(text && text.trim());
  if (!hasText && !pdfBase64) {
    throw new Error("Kein Text und kein Zuwendungsbescheid zum Erkennen übergeben.");
  }

  // Mit Zuwendungsbescheid: PDF als Dokument mitschicken und die Bescheid-Felder mit abfragen.
  const bescheidPrompt = pdfBase64
    ? `

Zusaetzlich liegt ein BAFA-Zuwendungsbescheid (Erlaubnis zum Beratungsbeginn) als PDF bei. Lies daraus:
- customerName, street, postalCode, city: Firma und Anschrift des ANTRAGSTELLERS. Das ist der Empfaenger des eigentlichen Bescheids mit dem Betreff "Foerderung von Unternehmensberatungen". Ein vorangestelltes Anschreiben an einen Bevollmaechtigten ("als Bevollmaechtigter im Antragsverfahren") ist NICHT der Antragsteller - dessen Name und Anschrift nicht verwenden.
- bescheidDate: Datum des Bescheids im Format YYYY-MM-DD
- deadline: das Datum aus dem Satz "Die Vorlagefrist endet am ..." im Format YYYY-MM-DD
- vorgang: "Mein Zeichen", z.B. UBF-1320981
Firma und Anschrift aus dem Bescheid haben Vorrang vor dem Text. Ansprechpartner, E-Mail, Telefon und Webseite kommen aus dem Text.`
    : "";
  const promptText = (hasText ? text : "(kein Text eingefuegt)") ;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            ...(pdfBase64
              ? [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } }]
              : []),
            { type: "text", text: `Extrahiere Kontaktdaten aus folgendem Text. Antworte NUR mit einem JSON-Objekt, keine Erklaerung, kein Markdown.

Die Felder sind:
- salutation ("Herr" oder "Frau", nur wenn eindeutig)
- prefix (Titel wie Dr., Prof.)
- firstName
- lastName
- customerName (Kundenname oder Firmenname)
- website
- company
- jobTitle
- emailWork
- emailPersonal
- phoneMobile
- phoneWork
- phoneFax
- street
- postalCode
- city
- country
- notes
- bescheidDate
- deadline
- vorgang

Lasse unbekannte Felder als leeren String "".
Formatiere Telefonnummern im internationalen Format +49 ... wenn moeglich.
Wenn ein Firmenname erkennbar ist, setze ihn bevorzugt in customerName.
Wenn eine URL oder Domain erkennbar ist, setze sie in website.${bescheidPrompt}

Text:
${promptText}` },
          ],
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiError =
      data?.error?.message || data?.error || `Anthropic API Fehler (Status ${response.status}).`;
    throw new Error(apiError);
  }

  // Content-Blöcke robust nach dem ersten Text-Block durchsuchen statt blind
  // content[0] anzunehmen (z.B. falls zusätzliche Blocktypen zurückkommen).
  const textBlock = Array.isArray(data.content)
    ? data.content.find((block) => block && block.type === "text" && typeof block.text === "string")
    : null;
  const rawContent = (textBlock?.text || "").trim();

  if (!rawContent) {
    throw new Error("Claude hat keine Textantwort mit Kontaktdaten geliefert.");
  }

  // Claude soll nur reines JSON liefern, aber falls doch Fließtext oder ein
  // Markdown-Codeblock drumherum steht, das erste {...}-Objekt herausziehen.
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  const clean = (jsonMatch ? jsonMatch[0] : rawContent.replace(/```json\s*|```/g, "")).trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (error) {
    throw new Error(
      "Antwort von Claude konnte nicht als JSON gelesen werden: " + rawContent.slice(0, 200)
    );
  }

  const hasAnyValue = Object.values(parsed).some(
    (value) => typeof value === "string" && value.trim() !== ""
  );
  if (!hasAnyValue) {
    throw new Error("Aus dem eingefügten Text konnten keine Kontaktdaten erkannt werden.");
  }

  return parsed;
}