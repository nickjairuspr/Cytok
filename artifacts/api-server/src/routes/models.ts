import { Router, type IRouter } from "express";
import { ListModelsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /models — list available CytoAI models
router.get("/models", async (_req, res): Promise<void> => {
  const models = ListModelsResponse.parse([
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

  res.json(models);
});

export default router;
