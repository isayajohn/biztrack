import { Router } from "express";
import * as expenseController from "../controllers/expense.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { idParamsSchema } from "../validators/common.validators";
import { createExpenseSchema, updateExpenseSchema } from "../validators/expense.validators";

const router = Router();

router.use(requireAuth);
router.get("/", asyncHandler(expenseController.listExpenses));
router.post("/", validate({ body: createExpenseSchema }), asyncHandler(expenseController.createExpense));
router.get("/:id", validate({ params: idParamsSchema }), asyncHandler(expenseController.getExpense));
router.put(
  "/:id",
  validate({ params: idParamsSchema, body: updateExpenseSchema }),
  asyncHandler(expenseController.updateExpense),
);
router.delete(
  "/:id",
  validate({ params: idParamsSchema }),
  asyncHandler(expenseController.deleteExpense),
);

export default router;
