import { Router } from "express";
import * as businessController from "../controllers/business.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { businessProfileSchema } from "../validators/business.validators";

const router = Router();

router.get("/", requireAuth, asyncHandler(businessController.getBusinessProfile));
router.put(
  "/",
  requireAuth,
  validate({ body: businessProfileSchema }),
  asyncHandler(businessController.updateBusinessProfile),
);

export default router;
