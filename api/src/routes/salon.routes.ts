import { Router } from "express";
import { SalonController } from "../controllers/salon.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const salonController = new SalonController();

// Todas as rotas de salão requerem autenticação
router.use(authMiddleware);

// CLIENTS
router.get("/clients", (req, res) => salonController.listClients(req, res));
router.post("/clients", (req, res) => salonController.storeClient(req, res));

// PROFESSIONALS
router.get("/professionals", (req, res) =>
	salonController.listProfessionals(req, res),
);

// SERVICES
router.get("/services", (req, res) => salonController.listServices(req, res));
router.post("/services", (req, res) => salonController.storeService(req, res));
router.put("/services/:id", (req, res) =>
	salonController.updateService(req, res),
);

// APPOINTMENTS
router.get("/appointments", (req, res) =>
	salonController.listAppointments(req, res),
);
router.post("/appointments", (req, res) =>
	salonController.storeAppointment(req, res),
);
router.patch("/appointments/:id/status", (req, res) =>
	salonController.updateStatus(req, res),
);

export default router;
