// Rotas de Webhooks (públicas)
import { Router } from "express";
import { webhookController } from "../controllers/webhook.controller";

const router = Router();

router.post(
	"/mercadopago",
	webhookController.mercadoPago.bind(webhookController),
);
router.post("/ifood", webhookController.ifood.bind(webhookController));

export default router;
