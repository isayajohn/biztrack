import { Router } from "express";
import * as emailTemplateController from "../controllers/emailTemplate.controller";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  emailTemplateParamsSchema,
  previewEmailTemplateSchema,
  updateEmailTemplateSchema,
} from "../validators/emailTemplate.validators";

const router = Router();

router.get("/", asyncHandler(emailTemplateController.listEmailTemplates));
router.get(
  "/:key",
  validate({ params: emailTemplateParamsSchema }),
  asyncHandler(emailTemplateController.getEmailTemplate),
);
router.put(
  "/:key",
  validate({ params: emailTemplateParamsSchema, body: updateEmailTemplateSchema }),
  asyncHandler(emailTemplateController.updateEmailTemplate),
);
router.post(
  "/:key/preview",
  validate({ params: emailTemplateParamsSchema, body: previewEmailTemplateSchema }),
  asyncHandler(emailTemplateController.previewEmailTemplate),
);

export default router;
