import type { Request, Response } from "express";
import * as expenseService from "../services/expense.service";

export async function listExpenses(req: Request, res: Response) {
  const expenses = await expenseService.listExpenses(req.user!.id);
  res.json({ success: true, data: expenses });
}

export async function getExpense(req: Request, res: Response) {
  const expense = await expenseService.getExpense(req.user!.id, String(req.params.id));
  res.json({ success: true, data: expense });
}

export async function createExpense(req: Request, res: Response) {
  const expense = await expenseService.createExpense(req.user!.id, req.body);
  res.status(201).json({ success: true, data: expense });
}

export async function updateExpense(req: Request, res: Response) {
  const expense = await expenseService.updateExpense(req.user!.id, String(req.params.id), req.body);
  res.json({ success: true, data: expense });
}

export async function deleteExpense(req: Request, res: Response) {
  await expenseService.deleteExpense(req.user!.id, String(req.params.id));
  res.status(204).send();
}
