import { z } from "zod";
import { dateStringSchema, optionalStringSchema, paymentMethodSchema } from "./common.validators";

export const expenseCategorySchema = z.enum([
  "Stock Purchase",
  "Rent",
  "Transport",
  "Salary",
  "Electricity",
  "Internet",
  "Food",
  "Marketing",
  "Other",
]);

export const createExpenseSchema = z.object({
  category: expenseCategorySchema,
  description: z.string().trim().min(2).max(200),
  amount: z.number().nonnegative(),
  paymentMethod: paymentMethodSchema,
  expenseDate: dateStringSchema,
  notes: optionalStringSchema,
});

export const updateExpenseSchema = createExpenseSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required.",
  },
);
