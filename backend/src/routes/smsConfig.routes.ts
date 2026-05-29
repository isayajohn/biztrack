import { Router } from "express";
import * as smsConfigController from "../controllers/smsConfig.controller";
import { requireAuth, requireSuperAdmin } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  smsConfigSchema,
  testSmsSchema,
} from "../validators/smsConfig.validators";

const router = Router();

router.use(requireAuth, requireSuperAdmin);

router.get("/", asyncHandler(smsConfigController.getSmsConfig));
router.put(
  "/",
  validate({ body: smsConfigSchema }),
  asyncHandler(smsConfigController.updateSmsConfig),
);
router.post(
  "/test",
  validate({ body: testSmsSchema }),
  asyncHandler(smsConfigController.testSmsConfig),
);

export default router;
