// Integração com Mercado Pago PIX
// Geração de QR Code dinâmico e verificação de pagamentos

import MercadoPagoConfig, { Payment } from "mercadopago";

export interface PixPaymentRequest {
	orderId: string;
	amount: number;
	description: string;
	payerEmail?: string;
}

export interface PixPaymentResponse {
	success: boolean;
	paymentId?: number;
	qrCode?: string;
	qrCodeBase64?: string;
	expirationDate?: Date;
	error?: string;
}

export interface PaymentStatus {
	id: number;
	status: string;
	statusDetail: string;
	amount: number;
	fee: number;
	netAmount: number;
	externalReference: string;
}

export class MercadoPagoService {
	private client: MercadoPagoConfig;
	private payment: Payment;

	constructor() {
		const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

		if (!accessToken) {
			console.warn("⚠️ MERCADOPAGO_ACCESS_TOKEN não configurado");
		}

		this.client = new MercadoPagoConfig({
			accessToken: accessToken || "",
		});

		this.payment = new Payment(this.client);
	}

	/**
	 * Cria um pagamento PIX com QR Code dinâmico
	 */
	async createPixPayment(
		request: PixPaymentRequest,
	): Promise<PixPaymentResponse> {
		try {
			const response = await this.payment.create({
				body: {
					transaction_amount: request.amount,
					payment_method_id: "pix",
					description: request.description,
					payer: {
						email: request.payerEmail || "cliente@email.com",
					},
					external_reference: request.orderId,
					notification_url: `${process.env.API_URL}/webhooks/mercadopago`,
				},
			});

			const transactionData =
				response.point_of_interaction?.transaction_data;

			return {
				success: true,
				paymentId: response.id,
				qrCode: transactionData?.qr_code,
				qrCodeBase64: transactionData?.qr_code_base64,
				expirationDate: response.date_of_expiration
					? new Date(response.date_of_expiration)
					: undefined,
			};
		} catch (error) {
			console.error("Erro ao criar pagamento PIX:", error);
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Erro desconhecido",
			};
		}
	}

	/**
	 * Consulta status de um pagamento
	 */
	async getPaymentStatus(paymentId: number): Promise<PaymentStatus | null> {
		try {
			const response = await this.payment.get({ id: paymentId });

			if (!response) return null;

			// Calcula taxa (Mercado Pago cobra por transação)
			const feeDetails = response.fee_details || [];
			const totalFee = feeDetails.reduce(
				(sum, fee) => sum + (fee.amount || 0),
				0,
			);

			return {
				id: response.id!,
				status: response.status || "unknown",
				statusDetail: response.status_detail || "",
				amount: response.transaction_amount || 0,
				fee: totalFee,
				netAmount: (response.transaction_amount || 0) - totalFee,
				externalReference: response.external_reference || "",
			};
		} catch (error) {
			console.error("Erro ao consultar pagamento:", error);
			return null;
		}
	}

	/**
	 * Verifica se o token está configurado
	 */
	isConfigured(): boolean {
		return !!process.env.MERCADOPAGO_ACCESS_TOKEN;
	}
}

export const mercadoPagoService = new MercadoPagoService();
