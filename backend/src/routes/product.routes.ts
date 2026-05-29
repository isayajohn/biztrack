import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { idParamsSchema } from "../validators/common.validators";
import { createProductSchema, updateProductSchema } from "../validators/product.validators";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(productController.listProducts));
router.post("/", validate({ body: createProductSchema }), asyncHandler(productController.createProduct));
router.get("/:id", validate({ params: idParamsSchema }), asyncHandler(productController.getProduct));
router.put(
  "/:id",
  validate({ params: idParamsSchema, body: updateProductSchema }),
  asyncHandler(productController.updateProduct),
);
router.delete(
  "/:id",
  validate({ params: idParamsSchema }),
  asyncHandler(productController.deleteProduct),
);

export default router;
