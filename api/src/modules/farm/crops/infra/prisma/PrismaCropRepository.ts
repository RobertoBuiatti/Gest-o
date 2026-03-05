import { Crop } from "@prisma/client";
import { ICropRepository } from "../../domain/repositories/ICropRepository";
import { prisma } from "../../../../../../config/database";

export class PrismaCropRepository implements ICropRepository {
	async create(data: any): Promise<Crop> {
		return (prisma.crop as any).create({
			data: {
				...data,
				system: "fazenda",
			},
		});
	}

	async findById(id: string): Promise<Crop | null> {
		return (prisma.crop as any).findUnique({
			where: { id },
		});
	}

	async findAll(farmId: string, submodule: string): Promise<Crop[]> {
		return (prisma.crop as any).findMany({
			where: { farmId, submodule },
		});
	}

	async update(id: string, data: any): Promise<Crop> {
		return (prisma.crop as any).update({
			where: { id },
			data,
		});
	}

	async delete(id: string): Promise<void> {
		await (prisma.crop as any).delete({
			where: { id },
		});
	}
}
