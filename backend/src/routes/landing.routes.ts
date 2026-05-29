import { Router } from "express";
import * as landingController from "../controllers/landing.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/branding", asyncHandler(landingController.getBranding));
router.get("/branding/logo", asyncHandler(landingController.getBrandingLogo));
router.get("/", asyncHandler(landingController.getPublicLandingPage));

export default router;
