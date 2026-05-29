import { Router } from "express";
import * as aiController from "../controllers/ai.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/business-summary", requireAuth, asyncHandler(aiController.generateBusinessSummary));

export default router;
