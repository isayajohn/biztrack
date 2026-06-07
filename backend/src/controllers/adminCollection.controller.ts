import type { Request, Response } from "express";
import * as adminCollectionService from "../services/adminCollection.service";
import type { AdminCollectionsQuery } from "../validators/adminCollection.validators";

export async function listCollections(req: Request, res: Response) {
  const collections = await adminCollectionService.listCollections(
    req.query as unknown as AdminCollectionsQuery,
  );
  res.json({ success: true, data: collections });
}

export async function getCollectionStats(_req: Request, res: Response) {
  const stats = await adminCollectionService.getCollectionStats();
  res.json({ success: true, data: stats });
}
