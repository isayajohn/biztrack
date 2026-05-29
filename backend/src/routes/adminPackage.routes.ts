import { Router } from "express";
import * as adminPackageController from "../controllers/adminPackage.controller";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  adminPackageParamsSchema,
  createPackageSchema,
  packageStatusSchema,
  updatePackageSchema,
} from "../validators/adminPackage.validators";

const router = Router();

router.get("/", asyncHandler(adminPackageController.listPackages));
router.post("/", validate({ body: createPackageSchema }), asyncHandler(adminPackageController.createPackage));
router.get(
  "/:id",
  validate({ params: adminPackageParamsSchema }),
  asyncHandler(adminPackageController.getPackageById),
);
router.put(
  "/:id",
  validate({ params: adminPackageParamsSchema, body: updatePackageSchema }),
  asyncHandler(adminPackageController.updatePackage),
);
router.patch(
  "/:id/status",
  validate({ params: adminPackageParamsSchema, body: packageStatusSchema }),
  asyncHandler(adminPackageController.updatePackageStatus),
);
router.delete(
  "/:id",
  validate({ params: adminPackageParamsSchema }),
  asyncHandler(adminPackageController.deletePackage),
);

export default router;
