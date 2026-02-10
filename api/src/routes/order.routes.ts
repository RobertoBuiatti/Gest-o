// Rotas de Pedidos
import { Router } from "express";
import { orderController } from "../controllers/order.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", orderController.create.bind(orderController));
router.get("/", orderController.list.bind(orderController));
router.get(
	"/metrics",
	requireRole("ADMIN", "MANAGER"),
	orderController.metrics.bind(orderController),
);
router.get("/:id", orderController.findById.bind(orderController));
router.patch("/:id/status", orderController.updateStatus.bind(orderController));
router.delete(
	"/:id",
	requireRole("ADMIN", "MANAGER"),
	orderController.cancel.bind(orderController),
);
router.delete(
	"/",
	requireRole("ADMIN"),
	orderController.clearAll.bind(orderController),
);

export default router;
