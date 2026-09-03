// Automatically satisfy frontend storage checks on load so the UI box registers a key


const ACTIVE_MODEL =
  (import.meta.env["VITE_OPENROUTER_MODEL"] as string | undefined) ?? "deepseek/deepseek-chat:free";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export type GeminiTurn = { role: "user" | "model" | "system"; text: string };

export async function callGemini(
  apiKey: string,
  systemInstruction: string,
  turns: GeminiTurn[],
  jsonMode = false,
): Promise<string> {
  const resolvedKey = apiKey?.trim() || import.meta.env.VITE_OPENROUTER_API_KEY || "";

  if (!resolvedKey) {
    throw new Error("Missing OpenRouter API key. Check your .env file or Vercel environment variables.");
  }

  const messages = [
    { role: "system", content: systemInstruction },
    ...turns.map((t) => ({
      role: t.role === "model" ? "assistant" : "user",
      content: t.text,
    })),
  ];

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resolvedKey}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "Sherlock Command Center",
    },
    body: JSON.stringify({
      model: ACTIVE_MODEL,
      messages,
      temperature: jsonMode ? 0.3 : 0.9,
      response_format: jsonMode ? { type: "json_object" } : undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("OpenRouter returned an empty response.");
  return text;
}

export function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in AI response.");
  return JSON.parse(trimmed.slice(start, end + 1));
}
