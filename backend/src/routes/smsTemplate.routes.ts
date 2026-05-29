import { Router } from "express";
import * as smsTemplateController from "../controllers/smsTemplate.controller";
import { requireAuth, requireSuperAdmin } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  previewSmsTemplateSchema,
  smsTemplateParamsSchema,
  updateSmsTemplateSchema,
} from "../validators/smsTemplate.validators";

const router = Router();

router.use(requireAuth, requireSuperAdmin);

router.get("/", asyncHandler(smsTemplateController.listSmsTemplates));
router.get(
  "/:key",
  validate({ params: smsTemplateParamsSchema }),
  asyncHandler(smsTemplateController.getSmsTemplate),
);
router.put(
  "/:key",
  validate({ params: smsTemplateParamsSchema, body: updateSmsTemplateSchema }),
  asyncHandler(smsTemplateController.updateSmsTemplate),
);
router.post(
  "/:key/preview",
  validate({ params: smsTemplateParamsSchema, body: previewSmsTemplateSchema }),
  asyncHandler(smsTemplateController.previewSmsTemplate),
);

export default router;
