import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.json([
    {
      id: "cyto-2.4",
      name: "Cyto 2.4",
      description: "Fast and capable — great for most tasks",
    },
    {
      id: "cyto-2.4-thinking",
      name: "Cyto 2.4 Thinking",
      description: "Extended reasoning for complex problems",
    },
  ]);
}
