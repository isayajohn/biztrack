import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { dateRangeQuerySchema } from "../validators/common.validators";

const router = Router();

router.get(
  "/",
  requireAuth,
  validate({ query: dateRangeQuerySchema }),
  asyncHandler(reportController.getReports),
);

export default router;
