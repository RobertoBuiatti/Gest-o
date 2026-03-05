import { Router } from "express";
import { systemMiddleware } from "../middlewares/system.middleware";
import authRoutes from "../modules/auth/presentation/auth.routes";
import { orderRouter } from "../modules/orders/presentation/routes/order.routes";
import { productRouter } from "../modules/products/presentation/routes/product.routes";
import { stockRouter } from "../modules/stock/presentation/routes/stock.routes";
import webhookRoutes from "./webhook.routes";
import publicRoutes from "./public.routes";
import uploadRoutes from "./upload.routes";
import reportRoutes from "./report.routes";
import { farmRouter } from "../modules/farm/presentation/routes/farm.routes";
import salonRoutes from "./salon.routes";
import fixedCostRoutes from "./fixed-cost.routes";

const router = Router();

// Middleware de Contexto de Sistema
router.use(systemMiddleware);

router.use("/auth", authRoutes);
router.use("/orders", orderRouter);
router.use("/stock", stockRouter);
router.use("/webhooks", webhookRoutes);
router.use("/public", publicRoutes);
router.use("/upload", uploadRoutes);
router.use("/reports", reportRoutes);
router.use("/fixed-costs", fixedCostRoutes);
router.use("/farm", farmRouter);
router.use("/salon", salonRoutes);
router.use("/", productRouter);

// Health check
router.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
