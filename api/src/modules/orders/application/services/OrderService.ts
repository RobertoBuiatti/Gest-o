import { IOrderRepository } from "../../domain/repositories/IOrderRepository";
import { IProductRepository } from "../../../products/domain/repositories/IProductRepository";
import { IStockRepository } from "../../../stock/domain/repositories/IStockRepository";
import { getSystemContext } from "../../../../config/context";
import Logger from "../../../../config/logger";

export class OrderService {
	constructor(
		private orderRepository: IOrderRepository,
		private productRepository: IProductRepository,
		private stockRepository: IStockRepository,
	) {}

	async createOrder(input: any) {
		const products = await Promise.all(
			input.items.map(async (item: any) => {
				const product = await this.productRepository.findById(
					item.productId,
				);
				if (!product)
					throw new Error(
						`Produto não encontrado: ${item.productId}`,
					);
				return {
					...product,
					requestedQuantity: item.quantity,
					notes: item.notes,
				};
			}),
		);

		let subtotal = 0;
		const orderItems = products.map((p) => {
			const itemTotal = Number(p.salePrice) * p.requestedQuantity;
			subtotal += itemTotal;
			return {
				productId: p.id,
				quantity: p.requestedQuantity,
				unitPrice: p.salePrice,
				notes: p.notes,
			};
		});

		const lastNumber = await this.orderRepository.findLastOrderNumber();

		return this.orderRepository.create({
			orderNumber: lastNumber + 1,
			type: input.type,
			tableNumber: input.tableNumber,
			customerName: input.customerName,
			customerPhone: input.customerPhone,
			notes: input.notes,
			subtotal,
			total: subtotal,
			userId: input.userId,
			items: {
				create: orderItems,
			},
		});
	}

	async listOrders(params: any) {
		return this.orderRepository.findAll(params);
	}

	async getOrder(id: string) {
		const order = await this.orderRepository.findById(id);
		if (!order) throw new Error("Pedido não encontrado");
		return order;
	}

	async updateStatus(id: string, status: string) {
		const order = await this.orderRepository.findById(id);
		if (!order) throw new Error("Pedido não encontrado");

		return this.orderRepository.updateStatus(id, status);
	}

	async getMetrics(startDate: Date, endDate: Date) {
		const context = getSystemContext();
		const result = await this.orderRepository.getMetrics(
			startDate,
			endDate,
			context,
		);

		if (context !== "salao") {
			const orders = result;
			const totalOrders = orders.length;
			const totalRevenue = orders.reduce(
				(sum: number, o: any) => sum + Number(o.total),
				0,
			);
			const averageTicket =
				totalOrders > 0 ? totalRevenue / totalOrders : 0;

			let totalCost = 0;
			for (const order of orders) {
				for (const item of order.items) {
					for (const recipe of item.product.recipes) {
						const ingredientCost =
							Number(recipe.quantity) *
							Number(recipe.ingredient.costPrice);
						totalCost += ingredientCost * item.quantity;
					}
				}
			}

			const cmv = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
			return {
				totalOrders,
				totalRevenue,
				averageTicket,
				totalCost,
				cmv: cmv.toFixed(2),
				margin: (100 - cmv).toFixed(2),
			};
		}

		const appointments = result;
		const totalOrders = appointments.length;
		const totalRevenue = appointments.reduce(
			(sum: number, a: any) => sum + Number(a.service?.price || 0),
			0,
		);
		const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

		let totalCost = 0;
		for (const a of appointments) {
			const requirements = a.service?.requirements || [];
			for (const req of requirements) {
				const qtyUsed = Number(req.quantity || 0);
				const ingredientCost =
					qtyUsed * Number(req.ingredient?.costPrice || 0);
				totalCost += ingredientCost;
			}
		}

		const cmv = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
		return {
			totalOrders,
			totalRevenue,
			averageTicket,
			totalCost,
			cmv: cmv.toFixed(2),
			margin: (100 - cmv).toFixed(2),
		};
	}

	async clearAll() {
		return this.orderRepository.deleteMany();
	}
}
