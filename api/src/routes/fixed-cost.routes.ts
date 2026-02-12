// Rotas de Custos Fixos
import { Router } from "express";
import { fixedCostController } from "../controllers/fixed-cost.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("ADMIN", "MANAGER"));

router.get("/", fixedCostController.list.bind(fixedCostController));
router.get("/active", fixedCostController.listActive.bind(fixedCostController));
router.post("/", fixedCostController.create.bind(fixedCostController));
router.put("/:id", fixedCostController.update.bind(fixedCostController));
router.delete("/:id", fixedCostController.remove.bind(fixedCostController));

export default router;