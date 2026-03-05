import { FishTank } from "@prisma/client";
import { IFishTankRepository } from "../../domain/repositories/IFishTankRepository";
import { prisma } from "../../../../../../config/database";

export class PrismaFishTankRepository implements IFishTankRepository {
	async create(data: any): Promise<FishTank> {
		return (prisma as any).fishTank.create({
			data: {
				...data,
				system: "fazenda",
			},
		});
	}

	async findById(id: string): Promise<FishTank | null> {
		return (prisma as any).fishTank.findUnique({
			where: { id },
		});
	}

	async findAll(farmId: string): Promise<FishTank[]> {
		return (prisma as any).fishTank.findMany({
			where: { farmId },
		});
	}

	async update(id: string, data: any): Promise<FishTank> {
		return (prisma as any).fishTank.update({
			where: { id },
			data,
		});
	}

	async delete(id: string): Promise<void> {
		await (prisma as any).fishTank.delete({
			where: { id },
		});
	}
}
