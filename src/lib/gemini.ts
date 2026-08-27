const ACTIVE_MODEL =
  import.meta.env.VITE_GEMINI_MODEL ?? "gemini-2.5-flash";

const ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${ACTIVE_MODEL}:generateContent`;

export type GeminiTurn = { role: "user" | "model"; text: string };

export async function callGemini(
  apiKey: string,
  systemInstruction: string,
  turns: GeminiTurn[],
  jsonMode = false,
): Promise<string> {
  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig: jsonMode
        ? { responseMimeType: "application/json", temperature: 1 }
        : { temperature: 0.9 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

export function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in AI response.");
  return JSON.parse(trimmed.slice(start, end + 1));
}
