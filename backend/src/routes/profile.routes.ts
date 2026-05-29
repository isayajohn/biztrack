import { Router } from "express";
import * as profileController from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", requireAuth, asyncHandler(profileController.getProfile));

export default router;
