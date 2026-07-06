export async function parseContactText(text, apiKey) {
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
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

  const data = await response.json();
  if (!response.ok) {
    const apiError = data?.error?.message || data?.error || "Anthropic API request failed";
    throw new Error(apiError);
  }

  const content = data.content?.[0]?.text || "{}";
  const clean = content.replace(/```json\s*|```/g, "").trim();
  return JSON.parse(clean);
}