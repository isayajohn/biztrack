import { Router } from "express";
import adminRoutes from "./admin.routes";
import aiRoutes from "./ai.routes";
import authRoutes from "./auth.routes";
import businessRoutes from "./business.routes";
import dashboardRoutes from "./dashboard.routes";
import expenseRoutes from "./expense.routes";
import landingRoutes from "./landing.routes";
import productRoutes from "./product.routes";
import profileRoutes from "./profile.routes";
import publicPackageRoutes from "./publicPackage.routes";
import reportRoutes from "./report.routes";
import saleRoutes from "./sale.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

router.use("/auth", authRoutes);
router.use("/ai", aiRoutes);
router.use("/public/landing-page", landingRoutes);
router.use("/public/packages", publicPackageRoutes);
router.use("/landing-page", landingRoutes);
router.use("/admin", adminRoutes);
router.use("/profile", profileRoutes);
router.use("/business", businessRoutes);
router.use("/products", productRoutes);
router.use("/sales", saleRoutes);
router.use("/expenses", expenseRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);

export default router;
