import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const CYTOAI_BASE_URL = "https://cytoai.jemph.workers.dev/v1";

// POST /chat — proxy to CytoAI chat completions with SSE streaming support
router.post("/chat", async (req, res): Promise<void> => {
  // Prefer user-supplied key from x-api-key header, fall back to env var
  const apiKey =
    (req.headers["x-api-key"] as string) || process.env.CYTOAI_API_KEY;

  if (!apiKey) {
    res.status(401).json({
      error:
        "No API key provided. Set CYTOAI_API_KEY or pass x-api-key header.",
    });
    return;
  }

  const { model, messages, stream, temperature, max_tokens } = req.body;

  if (!model || !messages) {
    res.status(400).json({ error: "model and messages are required" });
    return;
  }

  const requestBody = {
    model,
    messages,
    stream: stream ?? true,
    ...(temperature !== undefined && { temperature }),
    ...(max_tokens !== undefined && { max_tokens }),
  };

  try {
    const upstream = await fetch(`${CYTOAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      req.log.error(
        { status: upstream.status, body: errorText },
        "CytoAI upstream error"
      );

      // Handle rate limiting specifically
      if (upstream.status === 429) {
        res
          .status(429)
          .json({ error: "Rate limit reached. Please try again later." });
        return;
      }

      if (upstream.status === 401) {
        res.status(401).json({ error: "Invalid API key." });
        return;
      }

      res.status(upstream.status).json({ error: errorText });
      return;
    }

    // Stream the SSE response back to the client
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    if (!upstream.body) {
      res.end();
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    // Handle client disconnect
    req.on("close", () => {
      reader.cancel().catch(() => {});
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }

    res.end();
  } catch (err) {
    req.log.error({ err }, "Error proxying to CytoAI");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to connect to AI service" });
    } else {
      res.end();
    }
  }
});

export default router;
