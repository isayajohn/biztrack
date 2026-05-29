import { Router } from "express";
import * as adminSubscriptionController from "../controllers/adminSubscription.controller";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import {
  adminSubscriptionParamsSchema,
  adminSubscriptionsQuerySchema,
  assignSubscriptionSchema,
  extendSubscriptionSchema,
  updateSubscriptionStatusSchema,
} from "../validators/adminSubscription.validators";

const router = Router();

router.get(
  "/",
  validate({ query: adminSubscriptionsQuerySchema }),
  asyncHandler(adminSubscriptionController.listSubscriptions),
);
router.post(
  "/",
  validate({ body: assignSubscriptionSchema }),
  asyncHandler(adminSubscriptionController.assignSubscription),
);
router.get(
  "/:id",
  validate({ params: adminSubscriptionParamsSchema }),
  asyncHandler(adminSubscriptionController.getSubscriptionById),
);
router.patch(
  "/:id/status",
  validate({ params: adminSubscriptionParamsSchema, body: updateSubscriptionStatusSchema }),
  asyncHandler(adminSubscriptionController.updateSubscriptionStatus),
);
router.patch(
  "/:id/extend",
  validate({ params: adminSubscriptionParamsSchema, body: extendSubscriptionSchema }),
  asyncHandler(adminSubscriptionController.extendSubscription),
);

export default router;
