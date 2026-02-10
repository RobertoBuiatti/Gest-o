// Rotas de Estoque
import { Router } from "express";
import { stockController } from "../controllers/stock.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

// Listagens
router.get(
	"/ingredients",
	stockController.listIngredients.bind(stockController),
);
router.get("/sectors", stockController.listSectors.bind(stockController));
router.get("/critical", stockController.critical.bind(stockController));
router.get("/movements", stockController.movements.bind(stockController));

// Gestão de Setores
router.post(
	"/sectors",
	requireRole("ADMIN", "MANAGER"),
	stockController.createSector.bind(stockController),
);
router.put(
	"/sectors/:id",
	requireRole("ADMIN", "MANAGER"),
	stockController.updateSector.bind(stockController),
);
router.delete(
	"/sectors/:id",
	requireRole("ADMIN", "MANAGER"),
	stockController.deleteSector.bind(stockController),
);

// Operações (apenas Admin, Manager, Stockist)
router.post(
	"/transfer",
	requireRole("ADMIN", "MANAGER", "STOCKIST"),
	stockController.transfer.bind(stockController),
);
router.post(
	"/entry",
	requireRole("ADMIN", "MANAGER", "STOCKIST"),
	stockController.entry.bind(stockController),
);
router.post(
	"/adjustment",
	requireRole("ADMIN", "MANAGER"),
	stockController.adjustment.bind(stockController),
);

router.delete(
	"/ingredients/:id",
	requireRole("ADMIN", "MANAGER"),
	stockController.deleteIngredient.bind(stockController),
);

export default router;
