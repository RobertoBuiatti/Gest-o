// Integração com API iFood Partners
// Recepção e conversão de pedidos

interface IFoodOrderItem {
	id: string;
	name: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	observations?: string;
	options?: Array<{
		name: string;
		addition: number;
	}>;
}

interface IFoodOrder {
	id: string;
	displayId: string;
	createdAt: string;
	type: "DELIVERY" | "TAKEOUT";
	merchant: {
		id: string;
		name: string;
	};
	customer: {
		name: string;
		phone?: string;
	};
	items: IFoodOrderItem[];
	payments: {
		methods: Array<{
			type: string;
			value: number;
		}>;
	};
	total: {
		subTotal: number;
		deliveryFee: number;
		benefits: number;
		orderAmount: number;
	};
	delivery?: {
		address: {
			streetName: string;
			streetNumber: string;
			neighborhood: string;
			city: string;
			state: string;
			postalCode: string;
			complement?: string;
			reference?: string;
		};
	};
}

interface ConvertedOrder {
	ifoodOrderId: string;
	type: string;
	customerName: string;
	customerPhone?: string;
	subtotal: number;
	discount: number;
	total: number;
	notes?: string;
	items: Array<{
		externalProductId: string;
		productName: string;
		quantity: number;
		unitPrice: number;
		notes?: string;
	}>;
}

interface IFoodTokenResponse {
	access_token: string;
	expires_in: number;
}

export class IFoodService {
	private clientId: string;
	private clientSecret: string;
	private accessToken: string | null = null;
	private tokenExpiry: Date | null = null;

	constructor() {
		this.clientId = process.env.IFOOD_CLIENT_ID || "";
		this.clientSecret = process.env.IFOOD_CLIENT_SECRET || "";
	}

	/**
	 * Obtém access token da API iFood
	 */
	private async getAccessToken(): Promise<string | null> {
		// Se token ainda é válido, reutiliza
		if (
			this.accessToken &&
			this.tokenExpiry &&
			new Date() < this.tokenExpiry
		) {
			return this.accessToken;
		}

		try {
			const response = await fetch(
				"https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						grant_type: "client_credentials",
						client_id: this.clientId,
						client_secret: this.clientSecret,
					}),
				},
			);

			if (!response.ok) {
				console.error(
					"Erro ao obter token iFood:",
					response.statusText,
				);
				return null;
			}

			const data = (await response.json()) as IFoodTokenResponse;
			this.accessToken = data.access_token;
			this.tokenExpiry = new Date(
				Date.now() + (data.expires_in - 60) * 1000,
			);

			return this.accessToken;
		} catch (error) {
			console.error("Erro de conexão com iFood:", error);
			return null;
		}
	}

	/**
	 * Converte pedido iFood para formato interno
	 */
	convertOrder(ifoodOrder: IFoodOrder): ConvertedOrder {
		const notes: string[] = [];

		if (ifoodOrder.delivery?.address) {
			const addr = ifoodOrder.delivery.address;
			notes.push(
				`Endereço: ${addr.streetName}, ${addr.streetNumber}`,
				addr.complement ? `Complemento: ${addr.complement}` : "",
				`${addr.neighborhood} - ${addr.city}/${addr.state}`,
				addr.reference ? `Referência: ${addr.reference}` : "",
			);
		}

		return {
			ifoodOrderId: ifoodOrder.id,
			type: "IFOOD",
			customerName: ifoodOrder.customer.name,
			customerPhone: ifoodOrder.customer.phone,
			subtotal: ifoodOrder.total.subTotal,
			discount: ifoodOrder.total.benefits,
			total: ifoodOrder.total.orderAmount,
			notes: notes.filter(Boolean).join("\n"),
			items: ifoodOrder.items.map((item) => ({
				externalProductId: item.id,
				productName: item.name,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				notes: item.observations,
			})),
		};
	}

	/**
	 * Confirma recebimento de pedido
	 */
	async acknowledgeOrder(orderId: string): Promise<boolean> {
		const token = await this.getAccessToken();
		if (!token) return false;

		try {
			const response = await fetch(
				`https://merchant-api.ifood.com.br/order/v1.0/orders/${orderId}/confirm`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				},
			);

			return response.ok;
		} catch (error) {
			console.error("Erro ao confirmar pedido iFood:", error);
			return false;
		}
	}

	/**
	 * Inicia preparo do pedido
	 */
	async startPreparation(orderId: string): Promise<boolean> {
		const token = await this.getAccessToken();
		if (!token) return false;

		try {
			const response = await fetch(
				`https://merchant-api.ifood.com.br/order/v1.0/orders/${orderId}/startPreparation`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			return response.ok;
		} catch (error) {
			console.error("Erro ao iniciar preparo iFood:", error);
			return false;
		}
	}

	/**
	 * Marca pedido como pronto
	 */
	async readyForPickup(orderId: string): Promise<boolean> {
		const token = await this.getAccessToken();
		if (!token) return false;

		try {
			const response = await fetch(
				`https://merchant-api.ifood.com.br/order/v1.0/orders/${orderId}/readyForPickup`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			return response.ok;
		} catch (error) {
			console.error("Erro ao marcar pronto iFood:", error);
			return false;
		}
	}

	/**
	 * Verifica se está configurado
	 */
	isConfigured(): boolean {
		return !!this.clientId && !!this.clientSecret;
	}
}

export const ifoodService = new IFoodService();
