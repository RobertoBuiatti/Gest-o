import { Router } from "express";
import {
	authMiddleware,
	requireRole,
} from "../../../../middlewares/auth.middleware";
import { OrderController } from "../controllers/OrderController";
import { OrderService } from "../../application/services/OrderService";
import { PrismaOrderRepository } from "../../infra/prisma/PrismaOrderRepository";
import { PrismaProductRepository } from "../../../products/infra/prisma/PrismaProductRepository";
import { PrismaStockRepository } from "../../../stock/infra/prisma/PrismaStockRepository";

const orderRouter = Router();

// Injeção de Dependências
const orderRepository = new PrismaOrderRepository();
const productRepository = new PrismaProductRepository();
const stockRepository = new PrismaStockRepository();
const orderService = new OrderService(
	orderRepository,
	productRepository,
	stockRepository,
);
const orderController = new OrderController(orderService);

orderRouter.use(authMiddleware);

orderRouter.post("/", (req, res) => orderController.create(req, res));
orderRouter.get("/", (req, res) => orderController.list(req, res));
orderRouter.get("/metrics", requireRole("ADMIN", "MANAGER"), (req, res) =>
	orderController.metrics(req, res),
);
orderRouter.get("/:id", (req, res) => orderController.findById(req, res));
orderRouter.patch("/:id/status", (req, res) =>
	orderController.updateStatus(req, res),
);
orderRouter.delete("/", requireRole("ADMIN"), (req, res) =>
	orderController.clearAll(req, res),
);

export { orderRouter };
