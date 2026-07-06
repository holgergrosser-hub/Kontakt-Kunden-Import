import { parseContactText } from "../../contact-parser.mjs";

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const { text } = await req.json();
    const parsed = await parseContactText(text, process.env.ANTHROPIC_API_KEY);

    return Response.json(parsed);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = { path: "/api/parse-contact" };
