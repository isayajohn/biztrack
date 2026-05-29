import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", requireAuth, asyncHandler(reportController.getDashboard));

export default router;
