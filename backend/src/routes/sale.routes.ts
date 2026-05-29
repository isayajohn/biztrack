import { Router } from "express";
import * as saleController from "../controllers/sale.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { idParamsSchema } from "../validators/common.validators";
import { createSaleSchema, updateSaleSchema } from "../validators/sale.validators";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(saleController.listSales));
router.post("/", validate({ body: createSaleSchema }), asyncHandler(saleController.createSale));
router.get("/:id", validate({ params: idParamsSchema }), asyncHandler(saleController.getSale));
router.put(
  "/:id",
  validate({ params: idParamsSchema, body: updateSaleSchema }),
  asyncHandler(saleController.updateSale),
);
router.delete("/:id", validate({ params: idParamsSchema }), asyncHandler(saleController.deleteSale));

export default router;
