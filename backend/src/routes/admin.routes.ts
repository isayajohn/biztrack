import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { requireAuth, requireSuperAdmin } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import * as adminSubscriptionController from "../controllers/adminSubscription.controller";
import adminPackageRoutes from "./adminPackage.routes";
import adminCollectionRoutes from "./adminCollection.routes";
import adminSubscriptionRoutes from "./adminSubscription.routes";
import emailConfigRoutes from "./emailConfig.routes";
import securityConfigRoutes from "./securityConfig.routes";
import smsConfigRoutes from "./smsConfig.routes";
import * as emailTemplateController from "../controllers/emailTemplate.controller";
import emailTemplateRoutes from "./emailTemplate.routes";
import smsTemplateRoutes from "./smsTemplate.routes";
import {
  businessPackageParamsSchema,
  changeBusinessPackageSchema,
} from "../validators/adminSubscription.validators";
import {
  emailTemplateParamsSchema,
  updateEmailTemplateSchema,
} from "../validators/emailTemplate.validators";
import {
  adminAuditLogsQuerySchema,
  brandingSchema,
  adminBusinessParamsSchema,
  adminBusinessesQuerySchema,
  adminUserParamsSchema,
  adminUsersQuerySchema,
  emailConfigSchema,
  landingPageContentSchema,
  messageTemplateParamsSchema,
  messageTemplateSchema,
  securityConfigSchema,
  smsConfigSchema,
  testSmsSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from "../validators/admin.validators";

const router = Router();

router.use(requireAuth, requireSuperAdmin);

router.get("/stats", asyncHandler(adminController.getAdminStats));
router.get("/summary", asyncHandler(adminController.getSystemSummary));
router.get("/branding", asyncHandler(adminController.getBranding));
router.put(
  "/branding",
  validate({ body: brandingSchema }),
  asyncHandler(adminController.updateBranding),
);
router.delete("/branding/logo", asyncHandler(adminController.removeBrandingLogo));
router.use("/packages", adminPackageRoutes);
router.use("/subscriptions", adminSubscriptionRoutes);
router.use("/collections", adminCollectionRoutes);
router.use("/config/email", emailConfigRoutes);
router.use("/config/security", securityConfigRoutes);
router.use("/config/sms", smsConfigRoutes);
router.use("/templates/email", emailTemplateRoutes);
router.use("/templates/sms", smsTemplateRoutes);
router.get("/landing-page", asyncHandler(adminController.getLandingPageContent));
router.put(
  "/landing-page",
  validate({ body: landingPageContentSchema }),
  asyncHandler(adminController.updateLandingPageContent),
);
router.post("/landing-page/publish", asyncHandler(adminController.publishLandingPageContent));
router.get("/email", asyncHandler(adminController.getEmailSettings));
router.put(
  "/email/config",
  validate({ body: emailConfigSchema }),
  asyncHandler(adminController.updateEmailConfig),
);
router.put(
  "/email/templates/:key",
  validate({ params: emailTemplateParamsSchema, body: updateEmailTemplateSchema }),
  asyncHandler(emailTemplateController.updateEmailTemplate),
);
router.get("/sms", asyncHandler(adminController.getSmsSettings));
router.put(
  "/sms/config",
  validate({ body: smsConfigSchema }),
  asyncHandler(adminController.updateSmsConfig),
);
router.put(
  "/sms/templates/:key",
  validate({ params: messageTemplateParamsSchema, body: messageTemplateSchema }),
  asyncHandler(adminController.updateSmsTemplate),
);
router.post("/sms/test", validate({ body: testSmsSchema }), asyncHandler(adminController.testSms));
router.get("/security", asyncHandler(adminController.getSecurityConfig));
router.put(
  "/security",
  validate({ body: securityConfigSchema }),
  asyncHandler(adminController.updateSecurityConfig),
);
router.get(
  "/businesses",
  validate({ query: adminBusinessesQuerySchema }),
  asyncHandler(adminController.listBusinesses),
);
router.patch(
  "/businesses/:businessId/package",
  validate({ params: businessPackageParamsSchema, body: changeBusinessPackageSchema }),
  asyncHandler(adminSubscriptionController.changeBusinessPackage),
);
router.get(
  "/businesses/:id",
  validate({ params: adminBusinessParamsSchema }),
  asyncHandler(adminController.getBusinessDetails),
);
router.get(
  "/audit-logs",
  validate({ query: adminAuditLogsQuerySchema }),
  asyncHandler(adminController.listAuditLogs),
);
router.get("/users", validate({ query: adminUsersQuerySchema }), asyncHandler(adminController.listUsers));
router.get("/users/:id", validate({ params: adminUserParamsSchema }), asyncHandler(adminController.getUserDetails));
router.patch(
  "/users/:id/status",
  validate({ params: adminUserParamsSchema, body: updateUserStatusSchema }),
  asyncHandler(adminController.updateUserStatus),
);
router.patch(
  "/users/:id/role",
  validate({ params: adminUserParamsSchema, body: updateUserRoleSchema }),
  asyncHandler(adminController.updateUserRole),
);
router.delete(
  "/users/:id",
  validate({ params: adminUserParamsSchema }),
  asyncHandler(adminController.deleteUser),
);

export default router;
