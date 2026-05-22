// Edge Runtime — supports SSE streaming natively.
// Vercel pipes the upstream ReadableStream straight to the client.
export const config = { runtime: "edge" };

const CYTOAI_BASE = "https://cytoai.jemph.workers.dev/v1";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // User-supplied key takes precedence; fall back to server env var
  const apiKey =
    req.headers.get("x-api-key") || process.env.CYTOAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "No API key. Set CYTOAI_API_KEY in Vercel env vars, or enter one in Settings." },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { model, messages, stream, temperature, max_tokens, tools } = body as any;

  if (!model || !messages) {
    return Response.json({ error: "model and messages are required" }, { status: 400 });
  }

  const requestBody: Record<string, unknown> = {
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
    body: JSON.stringify(requestBody),
  });

  if (!upstream.ok) {
    const errorText = await upstream.text();
    if (upstream.status === 429) {
      return Response.json({ error: "Rate limit reached. Try again shortly." }, { status: 429 });
    }
    if (upstream.status === 401) {
      return Response.json({ error: "Invalid API key." }, { status: 401 });
    }
    return Response.json({ error: errorText }, { status: upstream.status });
  }

  // Pipe the SSE stream straight through — Edge Runtime handles this natively
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
