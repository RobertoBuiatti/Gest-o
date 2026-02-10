// Rotas de Relatórios
import { Router } from "express";
import { reportController } from "../controllers/report.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("ADMIN", "MANAGER"));

router.get("/daily", reportController.dailyReport.bind(reportController));
router.get(
	"/top-products",
	reportController.topProducts.bind(reportController),
);
router.get(
	"/month-summary",
	reportController.monthSummary.bind(reportController),
);
router.get("/export", reportController.exportToExcel.bind(reportController));

export default router;
