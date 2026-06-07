import { Router } from "express";
import * as adminCollectionController from "../controllers/adminCollection.controller";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { adminCollectionsQuerySchema } from "../validators/adminCollection.validators";

const router = Router();

router.get("/stats", asyncHandler(adminCollectionController.getCollectionStats));
router.get(
  "/",
  validate({ query: adminCollectionsQuerySchema }),
  asyncHandler(adminCollectionController.listCollections),
);

export default router;
