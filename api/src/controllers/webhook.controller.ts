// Controller de Webhooks
import { Request, Response } from "express";
import { paymentService } from "../services/payment.service";
import Logger from "../config/logger";
import { ifoodService } from "../integrations/ifood";
import { orderService } from "../services/order.service";
import { prisma } from "../config/database";

export class WebhookController {
	// Webhook Mercado Pago (IPN)
	async mercadoPago(req: Request, res: Response) {
		try {
			const { type, data } = req.body;

			Logger.info(
				`Webhook MP recebido: ${JSON.stringify({ type, data })}`,
			);

			if (type === "payment" && data?.id) {
				const result = await paymentService.processWebhook(data.id);
				console.log("Resultado processamento:", result);
			}

			// Mercado Pago espera 200 OK
			return res.sendStatus(200);
		} catch (error) {
			console.error("Erro no webhook MP:", error);
			return res.sendStatus(200); // Retorna 200 para evitar retry
		}
	}

	// Webhook iFood
	async ifood(req: Request, res: Response) {
		try {
			const events = req.body;

			console.log("Webhook iFood recebido:", events);

			for (const event of Array.isArray(events) ? events : [events]) {
				if (event.code === "PLACED") {
					await this.processIfoodOrder(event);
				}
			}

			return res.sendStatus(200);
		} catch (error) {
			Logger.error(`Erro no webhook iFood: ${error}`);
			return res.sendStatus(200);
		}
	}

	private async processIfoodOrder(event: any) {
		try {
			// Converte pedido iFood para formato interno
			const convertedOrder = ifoodService.convertOrder(event.order);

			// Busca admin para vincular o pedido
			const admin = await prisma.user.findFirst({
				where: { role: "ADMIN" },
			});

			if (!admin) {
				console.error(
					"Admin não encontrado para vincular pedido iFood",
				);
				return;
			}

			// Mapeia produtos iFood para produtos internos
			// (Aqui você precisa ter um mapeamento de SKUs)
			const items = [];
			for (const item of convertedOrder.items) {
				// Busca produto pelo nome ou SKU externo
				const product = await prisma.product.findFirst({
					where: { name: { contains: item.productName } },
				});

				if (product) {
					items.push({
						productId: product.id,
						quantity: item.quantity,
						notes: item.notes,
					});
				}
			}

			if (items.length === 0) {
				console.warn(
					"Nenhum produto mapeado para pedido iFood:",
					convertedOrder.ifoodOrderId,
				);
				return;
			}

			// Cria pedido interno
			const order = await prisma.order.create({
				data: {
					type: "IFOOD",
					customerName: convertedOrder.customerName,
					customerPhone: convertedOrder.customerPhone,
					subtotal: convertedOrder.subtotal,
					discount: convertedOrder.discount,
					total: convertedOrder.total,
					notes: convertedOrder.notes,
					userId: admin.id,
					ifoodOrderId: convertedOrder.ifoodOrderId,
					items: {
						create: items.map((item) => ({
							productId: item.productId,
							quantity: item.quantity,
							unitPrice: 0, // Será atualizado
							notes: item.notes,
						})),
					},
				},
			});

			// Confirma recebimento no iFood
			await ifoodService.acknowledgeOrder(convertedOrder.ifoodOrderId);

			console.log("Pedido iFood criado:", order.id);
		} catch (error) {
			console.error("Erro ao processar pedido iFood:", error);
		}
	}
}

export const webhookController = new WebhookController();
