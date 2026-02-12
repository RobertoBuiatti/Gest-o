// Service de Pedidos
import { convertToStockUnit, Unit } from "../utils/unit.utils";
import Logger from "../config/logger";
import { prisma } from "../config/database";
import { getSystemContext } from "../config/context";
import { stockDeductionService } from "./stock-deduction.service";

interface CreateOrderInput {
	type: string;
	tableNumber?: number;
	customerName?: string;
	customerPhone?: string;
	notes?: string;
	userId: string;
	items: Array<{
		productId: string;
		quantity: number;
		notes?: string;
	}>;
}

export class OrderService {
	async create(input: CreateOrderInput) {
		// Busca produtos, incluindo receitas para validação de estoque
		const products = await prisma.product.findMany({
			where: {
				id: { in: input.items.map((i) => i.productId) },
				isActive: true,
				system: getSystemContext(),
			},
			include: {
				recipes: {
					include: { ingredient: true },
				},
			},
		});

		if (products.length !== input.items.length) {
			throw new Error("Um ou mais produtos não encontrados");
		}

		const productMap = new Map(products.map((p) => [p.id, p]));

		// Validação de Estoque (Antes de criar o pedido)
		const validationErrors =
			await stockDeductionService.validateStockAvailability({
				items: input.items.map((item) => ({
					product: productMap.get(item.productId)!,
					quantity: item.quantity,
				})),
			});

		if (validationErrors.length > 0) {
			throw new Error(
				`Estoque insuficiente: ${validationErrors.join(", ")}`,
			);
		}

		let subtotal = 0;
		const orderItems = input.items.map((item) => {
			const product = productMap.get(item.productId)!;
			const itemTotal = Number(product.salePrice) * item.quantity;
			subtotal += itemTotal;

			return {
				productId: item.productId,
				quantity: item.quantity,
				unitPrice: product.salePrice,
				notes: item.notes,
			};
		});

		// Busca último número de pedido
		const lastOrder = await prisma.order.findFirst({
			orderBy: { orderNumber: "desc" },
		});
		const nextOrderNumber = (lastOrder?.orderNumber || 0) + 1;

		const order = await prisma.order.create({
			data: {
				orderNumber: nextOrderNumber,
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
				system: getSystemContext(),
			},
			include: {
				items: {
					include: { product: true },
				},
				user: {
					select: { id: true, name: true },
				},
			},
		});

		// Baixa de estoque IMEDIATA (para evitar double spending)
		const deductionResult = await stockDeductionService.deductByOrder(
			order.id,
		);

		if (!deductionResult.success) {
			// Se falhar a baixa (ex: condição de corrida rara), cancela o pedido
			await prisma.order.update({
				where: { id: order.id },
				data: { status: "CANCELLED" },
			});
			throw new Error(
				`Erro ao baixar estoque: ${deductionResult.errors.join(", ")}`,
			);
		}

		return order;
	}

	async findById(id: string) {
		return prisma.order.findFirst({
			where: { id, system: getSystemContext() },
			include: {
				items: {
					include: { product: true },
				},
				user: {
					select: { id: true, name: true },
				},
				transactions: true,
			},
		});
	}

	async list(params?: {
		status?: string;
		type?: string;
		startDate?: Date;
		endDate?: Date;
		page?: number;
		limit?: number;
	}) {
		const {
			status,
			type,
			startDate,
			endDate,
			page = 1,
			limit = 20,
		} = params || {};

		const skip = (page - 1) * limit;

		// Construir where clause
		const where: any = {};

		if (status && typeof status === "string") where.status = status;
		if (type && typeof type === "string") where.type = type;
		where.system = getSystemContext();

		if (startDate || endDate) {
			where.createdAt = {};
			if (startDate) where.createdAt.gte = startDate;
			if (endDate) where.createdAt.lte = endDate;
		}

		Logger.debug(
			`DEBUG LIST PARAMS: ${JSON.stringify({
				page,
				limit,
				status,
				startDate,
				endDate,
				search: undefined, // 'search' was not provided in the original params, adding as undefined to match instruction
			})}`,
		);
		const data = await prisma.order.findMany({
			where,
			include: {
				items: {
					include: { product: true },
				},
				user: {
					select: { id: true, name: true },
				},
			},
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			skip,
			take: Number(limit),
		});

		// Fallback NUCLEAR para contagem: Query Raw direta.
		// Se findMany normal falhou com limite injetado, vamos direto ao SQL.

		let sql = `SELECT COUNT(*) as total FROM "Order" WHERE 1=1`;
		const args: any[] = [];

		if (status && typeof status === "string") {
			sql += ` AND "status" = ?`;
			args.push(status);
		}

		if (type && typeof type === "string") {
			sql += ` AND "type" = ?`;
			args.push(type);
		}

		sql += ` AND "system" = ?`;
		args.push(getSystemContext());

		if (startDate) {
			const d = new Date(startDate);
			if (!isNaN(d.getTime())) {
				sql += ` AND "createdAt" >= ?`;
				// SQLite with Prisma stores DateTime as ISO strings
				args.push(d.toISOString());
			}
		}

		if (endDate) {
			const d = new Date(endDate);
			if (!isNaN(d.getTime())) {
				sql += ` AND "createdAt" <= ?`;
				args.push(d.toISOString());
			}
		}

		// Raw query returns BigInt for count usually in many drivers, or just number in SQLite
		const countResult: any = await prisma.$queryRawUnsafe(sql, ...args);

		// Handle different potential return formats (array of objects, BigInt properties)
		let totalCount = 0;
		if (countResult && countResult[0]) {
			const rawTotal = countResult[0].total;
			totalCount =
				typeof rawTotal === "bigint"
					? Number(rawTotal)
					: Number(rawTotal);
		}

		// Se o totalCount for igual ao limit, é suspeito, então vamos confirmar com raw query
		// ou simplesmente usar count normal se funcionar.
		// Dado o erro anterior, vamos tentar limpar qualquer "take" implícito

		return {
			data,
			meta: {
				total: totalCount,
				page: Number(page),
				lastPage: Math.ceil(totalCount / Number(limit)),
				limit: Number(limit),
			},
		};
	}

	async updateStatus(id: string, status: string) {
		const context = getSystemContext();
		const order = await prisma.order.findFirst({
			where: { id, system: context },
		});
		if (!order) throw new Error("Pedido não encontrado ou acesso negado");

		// Se marcado como CANCELADO, devolve insumos para o estoque
		if (status === "CANCELLED" && order.status !== "CANCELLED") {
			console.log(
				`[OrderService] Pedido ${id} cancelado. Necessário estornar estoque.`,
			);
			await stockDeductionService.restoreStockByOrder(id);
		}

		return prisma.order.update({
			where: { id },
			data: { status },
		});
	}

	async cancel(id: string) {
		return this.updateStatus(id, "CANCELLED");
	}

	async getMetrics(startDate: Date, endDate: Date) {
		const orders = await prisma.order.findMany({
			where: {
				status: "PAID",
				createdAt: { gte: startDate, lte: endDate },
				system: getSystemContext(),
			},
			include: {
				items: {
					include: {
						product: {
							include: {
								recipes: {
									include: { ingredient: true },
								},
							},
						},
					},
				},
			},
		});

		const totalOrders = orders.length;
		const totalRevenue = orders.reduce(
			(sum, o) => sum + Number(o.total),
			0,
		);
		const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

		// Calcula CMV (Custo de Mercadoria Vendida)
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
		const margin = 100 - cmv;

		return {
			totalOrders,
			totalRevenue,
			averageTicket,
			totalCost,
			cmv: cmv.toFixed(2),
			margin: margin.toFixed(2),
		};
	}

	async clearAll() {
		return prisma.$transaction([
			prisma.orderItem.deleteMany(),
			prisma.transaction.deleteMany({
				where: { orderId: { not: null } },
			}),
			prisma.order.deleteMany(),
		]);
	}
}

export const orderService = new OrderService();
