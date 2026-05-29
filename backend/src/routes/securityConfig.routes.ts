import { Router } from "express";
import * as securityConfigController from "../controllers/securityConfig.controller";
import { requireAuth, requireSuperAdmin } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { securityConfigSchema } from "../validators/securityConfig.validators";

const router = Router();

router.use(requireAuth, requireSuperAdmin);

router.get("/", asyncHandler(securityConfigController.getSecurityConfig));
router.put(
  "/",
  validate({ body: securityConfigSchema }),
  asyncHandler(securityConfigController.updateSecurityConfig),
);

export default router;
