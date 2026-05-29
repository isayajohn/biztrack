import { Router } from "express";
import * as emailConfigController from "../controllers/emailConfig.controller";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  emailConfigSchema,
  testEmailSchema,
} from "../validators/emailConfig.validators";

const router = Router();

router.get("/", asyncHandler(emailConfigController.getEmailConfig));
router.put(
  "/",
  validate({ body: emailConfigSchema }),
  asyncHandler(emailConfigController.updateEmailConfig),
);
router.post(
  "/test",
  validate({ body: testEmailSchema }),
  asyncHandler(emailConfigController.testEmailConfig),
);

export default router;
