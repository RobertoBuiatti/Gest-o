import { prisma } from "../../../../config/database";
import { getSystemContext } from "../../../../config/context";
import { IStockRepository } from "../../domain/repositories/IStockRepository";
import { StockMovement, StockBalance, StockSector } from "@prisma/client";

export class PrismaStockRepository implements IStockRepository {
	// SETORES
	async findAllSectors(): Promise<any[]> {
		return prisma.stockSector.findMany({
			where: { system: getSystemContext() },
			include: {
				stockBalance: {
					where: {
						ingredient: {
							isActive: true,
						},
					},
					include: {
						ingredient: {
							include: { category: true },
						},
					},
				},
				products: {
					where: { isActive: true },
				},
				_count: {
					select: {
						stockBalance: true,
						products: true,
					},
				},
			},
		});
	}

	async findSectorById(id: string): Promise<any | null> {
		if (!id) return null;
		return prisma.stockSector.findUnique({
			where: { id },
		});
	}

	async findSectorByName(name: string): Promise<any | null> {
		return prisma.stockSector.findFirst({
			where: { name, system: getSystemContext() },
		});
	}

	async createSector(data: any): Promise<any> {
		return prisma.stockSector.create({
			data: {
				...data,
				system: getSystemContext(),
			},
		});
	}

	async updateSector(id: string, data: any): Promise<any> {
		if (!id) throw new Error("ID do setor é obrigatório para atualização");
		return prisma.stockSector.update({
			where: { id },
			data,
		});
	}

	async deleteSector(id: string): Promise<void> {
		if (!id) throw new Error("ID do setor é obrigatório para exclusão");
		await prisma.stockSector.delete({
			where: { id },
		});
	}

	// SALDOS
	async findBalance(
		ingredientId: string,
		sectorId: string,
	): Promise<StockBalance | null> {
		if (!ingredientId || !sectorId) return null;
		return prisma.stockBalance.findUnique({
			where: {
				ingredientId_sectorId: { ingredientId, sectorId },
			},
		});
	}

	async findAllBalances(
		ingredientId: string,
	): Promise<(StockBalance & { sector: StockSector })[]> {
		return prisma.stockBalance.findMany({
			where: {
				ingredientId,
				ingredient: { system: getSystemContext() },
			},
			include: { sector: true },
		});
	}

	async updateBalance(id: string, quantity: number): Promise<StockBalance> {
		if (!id) throw new Error("ID do saldo é obrigatório para atualização");
		return prisma.stockBalance.update({
			where: { id },
			data: { quantity },
		});
	}

	async createBalance(data: any): Promise<StockBalance> {
		return prisma.stockBalance.create({
			data: {
				...data,
				system: getSystemContext(),
			},
		});
	}

	// MOVIMENTAÇÕES
	async createMovement(data: any): Promise<StockMovement> {
		return prisma.stockMovement.create({
			data: {
				...data,
				system: getSystemContext(),
			},
		});
	}

	async findMovements(filters: any): Promise<StockMovement[]> {
		return prisma.stockMovement.findMany({
			where: {
				...filters,
				system: getSystemContext(),
			},
			include: {
				ingredient: true,
				fromSector: true,
				toSector: true,
			},
			orderBy: { createdAt: "desc" },
		});
	}
}
