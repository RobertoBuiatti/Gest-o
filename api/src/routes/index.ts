import { Router } from "express";
import { systemMiddleware } from "../middlewares/system.middleware";
import authRoutes from "./auth.routes";
import orderRoutes from "./order.routes";
import stockRoutes from "./stock.routes";
import webhookRoutes from "./webhook.routes";
import productRoutes from "./product.routes";
import publicRoutes from "./public.routes";
import uploadRoutes from "./upload.routes";
import reportRoutes from "./report.routes";
import salonRoutes from "./salon.routes";
import fixedCostRoutes from "./fixed-cost.routes";

const router = Router();

// Middleware de Contexto de Sistema
router.use(systemMiddleware);

router.use("/auth", authRoutes);
router.use("/orders", orderRoutes);
router.use("/stock", stockRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/public", publicRoutes);
router.use("/upload", uploadRoutes);
router.use("/reports", reportRoutes);
router.use("/fixed-costs", fixedCostRoutes);
router.use("/salon", salonRoutes);
router.use("/", productRoutes);

// Health check
router.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
