import { Router } from "express";
import * as publicPackageController from "../controllers/publicPackage.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(publicPackageController.listPackages));

export default router;
