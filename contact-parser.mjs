export async function parseContactText(text, apiKey) {
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY ist nicht gesetzt (Umgebungsvariable fehlt in Netlify bzw. .env.local)."
    );
  }
  if (!text || !text.trim()) {
    throw new Error("Kein Text zum Erkennen übergeben.");
  }

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
          content: `Extrahiere Kontaktdaten aus folgendem Text. Antworte NUR mit einem JSON-Objekt, keine Erklaerung, kein Markdown.

Die Felder sind:
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

Lasse unbekannte Felder als leeren String "".
Formatiere Telefonnummern im internationalen Format +49 ... wenn moeglich.
Wenn ein Firmenname erkennbar ist, setze ihn bevorzugt in customerName.
Wenn eine URL oder Domain erkennbar ist, setze sie in website.

Text:
${text}`,
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