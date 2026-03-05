import { prisma } from "../../../../config/database";
import { getSystemContext } from "../../../../config/context";
import {
	IOrderRepository,
	IOrderWithDetails,
} from "../../domain/repositories/IOrderRepository";
import { Order } from "@prisma/client";

export class PrismaOrderRepository implements IOrderRepository {
	async findAll(params: any): Promise<any> {
		const {
			status,
			type,
			startDate,
			endDate,
			page = 1,
			limit = 20,
		} = params;
		const skip = (page - 1) * limit;
		const system = getSystemContext();

		const where: any = { system };
		if (status) where.status = status;
		if (type) where.type = type;
		if (startDate || endDate) {
			where.createdAt = {};
			if (startDate) where.createdAt.gte = startDate;
			if (endDate) where.createdAt.lte = endDate;
		}

		const data = await prisma.order.findMany({
			where,
			include: {
				items: { include: { product: true } },
				user: { select: { id: true, name: true } },
			},
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			skip,
			take: Number(limit),
		});

		// Contagem via Raw Query para garantir precisão (conforme padrão original)
		let sql = `SELECT COUNT(*) as total FROM "Order" WHERE "system" = ?`;
		const args: any[] = [system];

		if (status) {
			sql += ` AND "status" = ?`;
			args.push(status);
		}
		if (type) {
			sql += ` AND "type" = ?`;
			args.push(type);
		}
		if (startDate) {
			sql += ` AND "createdAt" >= ?`;
			args.push(new Date(startDate).toISOString());
		}
		if (endDate) {
			sql += ` AND "createdAt" <= ?`;
			args.push(new Date(endDate).toISOString());
		}

		const countResult: any = await prisma.$queryRawUnsafe(sql, ...args);
		const totalCount = countResult[0] ? Number(countResult[0].total) : 0;

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

	async findById(id: string): Promise<IOrderWithDetails | null> {
		if (!id) return null;
		return prisma.order.findFirst({
			where: { id, system: getSystemContext() },
			include: {
				items: { include: { product: true } },
				user: { select: { id: true, name: true } },
				transactions: true,
			},
		}) as unknown as IOrderWithDetails;
	}

	async findLastOrderNumber(): Promise<number> {
		const lastOrder = await prisma.order.findFirst({
			orderBy: { orderNumber: "desc" },
		});
		return lastOrder?.orderNumber || 0;
	}

	async create(data: any): Promise<IOrderWithDetails> {
		return prisma.order.create({
			data: {
				...data,
				system: getSystemContext(),
			},
			include: {
				items: { include: { product: true } },
				user: { select: { id: true, name: true } },
			},
		}) as unknown as IOrderWithDetails;
	}

	async update(id: string, data: any): Promise<IOrderWithDetails> {
		if (!id) throw new Error("ID do pedido é obrigatório");
		return prisma.order.update({
			where: { id },
			data,
			include: {
				items: { include: { product: true } },
				user: { select: { id: true, name: true } },
			},
		}) as unknown as IOrderWithDetails;
	}

	async updateStatus(id: string, status: string): Promise<Order> {
		if (!id) throw new Error("ID do pedido é obrigatório");
		return prisma.order.update({
			where: { id },
			data: { status },
		});
	}

	async deleteMany(): Promise<void> {
		await prisma.$transaction([
			prisma.orderItem.deleteMany(),
			prisma.transaction.deleteMany({
				where: { orderId: { not: null } },
			}),
			prisma.order.deleteMany(),
		]);
	}

	async getMetrics(
		startDate: Date,
		endDate: Date,
		context: string,
	): Promise<any> {
		if (context !== "salao") {
			const orders = await prisma.order.findMany({
				where: {
					status: "PAID",
					createdAt: { gte: startDate, lte: endDate },
					system: context,
				},
				include: {
					items: {
						include: {
							product: {
								include: {
									recipes: { include: { ingredient: true } },
								},
							},
						},
					},
				},
			});
			return orders;
		}

		const appointments = await prisma.appointment.findMany({
			where: {
				system: context,
				status: "COMPLETED",
				date: { gte: startDate, lte: endDate },
			},
			include: {
				service: {
					include: {
						requirements: { include: { ingredient: true } },
					},
				},
			},
		});
		return appointments;
	}
}
