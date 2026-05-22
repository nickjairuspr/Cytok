export const config = { runtime: "edge" };

const CYTOAI_BASE = "https://cytoai.jemph.workers.dev/v1";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey =
    req.headers.get("x-api-key") ?? process.env.CYTOAI_API_KEY;

  if (!apiKey) {
    return json(
      { error: "No API key. Set CYTOAI_API_KEY in Vercel env vars, or enter one in Settings." },
      401
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { model, messages, stream, temperature, max_tokens, tools } = body;

  if (!model || !messages) {
    return json({ error: "model and messages are required" }, 400);
  }

  const payload: Record<string, unknown> = {
    model,
    messages,
    stream: stream ?? true,
    ...(temperature !== undefined && { temperature }),
    ...(max_tokens !== undefined && { max_tokens }),
    ...(Array.isArray(tools) && tools.length > 0 && { tools }),
  };

  const upstream = await fetch(`${CYTOAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    if (upstream.status === 429) return json({ error: "Rate limit reached. Try again shortly." }, 429);
    if (upstream.status === 401) return json({ error: "Invalid API key." }, 401);
    return json({ error: text }, upstream.status);
  }

  if (!upstream.body) {
    return json({ error: "Empty response from upstream" }, 502);
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
