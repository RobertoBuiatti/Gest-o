// Service de Pagamentos
import { prisma } from "../config/database";
import { mercadoPagoService } from "../integrations/mercadopago";
import { stockDeductionService } from "./stock-deduction.service";

export class PaymentService {
	/**
	 * Gera QR Code PIX para pagamento
	 */
	async createPixPayment(orderId: string) {
		const order = await prisma.order.findUnique({
			where: { id: orderId },
		});

		if (!order) {
			throw new Error("Pedido não encontrado");
		}

		if (order.status === "PAID") {
			throw new Error("Pedido já está pago");
		}

		const result = await mercadoPagoService.createPixPayment({
			orderId,
			amount: Number(order.total),
			description: `Pedido #${order.orderNumber}`,
		});

		return result;
	}

	/**
	 * Processa webhook do Mercado Pago (IPN)
	 */
	async processWebhook(paymentId: number) {
		const payment = await mercadoPagoService.getPaymentStatus(paymentId);

		if (!payment) {
			return { success: false, message: "Pagamento não encontrado" };
		}

		if (payment.status !== "approved") {
			return { success: false, message: `Status: ${payment.status}` };
		}

		const orderId = payment.externalReference;

		// Verifica se já foi processado
		const existingTransaction = await prisma.transaction.findUnique({
			where: { paymentId: String(payment.id) },
		});

		if (existingTransaction) {
			return { success: true, message: "Já processado" };
		}

		// Transação atômica
		await prisma.$transaction(async (tx) => {
			// Registra transação financeira
			await tx.transaction.create({
				data: {
					type: "INCOME",
					amount: payment.amount,
					fee: payment.fee,
					netAmount: payment.netAmount,
					description: `Pagamento PIX - Pedido`,
					orderId,
					paymentId: String(payment.id),
				},
			});

			// Atualiza status do pedido
			await tx.order.update({
				where: { id: orderId },
				data: { status: "PAID" },
			});
		});

		// Baixa de estoque
		await stockDeductionService.deductByOrder(orderId);

		return { success: true, message: "Pagamento processado" };
	}

	/**
	 * Registra pagamento manual (dinheiro, cartão presencial)
	 */
	async registerManualPayment(orderId: string, paymentMethod: string) {
		const order = await prisma.order.findUnique({
			where: { id: orderId },
		});

		if (!order) {
			throw new Error("Pedido não encontrado");
		}

		await prisma.$transaction(async (tx) => {
			// Registra transação
			await tx.transaction.create({
				data: {
					type: "INCOME",
					amount: order.total,
					fee: 0,
					netAmount: order.total,
					description: `Pagamento ${paymentMethod} - Pedido #${order.orderNumber}`,
					orderId,
				},
			});

			// Atualiza status
			await tx.order.update({
				where: { id: orderId },
				data: { status: "PAID" },
			});
		});

		// Baixa de estoque
		await stockDeductionService.deductByOrder(orderId);

		return { success: true };
	}
}

export const paymentService = new PaymentService();
