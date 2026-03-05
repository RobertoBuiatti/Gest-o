import { Animal } from "@prisma/client";
import { ILivestockRepository } from "../../domain/repositories/ILivestockRepository";
import { prisma } from "../../../../../../config/database";

export class PrismaLivestockRepository implements ILivestockRepository {
	async create(data: any): Promise<Animal> {
		return (prisma.animal as any).create({
			data: {
				...data,
				submodule: "PECUARIA",
				system: "fazenda",
			},
		});
	}

	async findById(id: string): Promise<Animal | null> {
		return (prisma.animal as any).findFirst({
			where: { id, submodule: "PECUARIA" },
		});
	}

	async findAll(farmId: string): Promise<Animal[]> {
		return (prisma.animal as any).findMany({
			where: { farmId, submodule: "PECUARIA" },
		});
	}

	async update(id: string, data: any): Promise<Animal> {
		return (prisma.animal as any).update({
			where: { id },
			data,
		});
	}

	async delete(id: string): Promise<void> {
		await (prisma.animal as any).delete({
			where: { id },
		});
	}

	async findByTag(tag: string): Promise<Animal | null> {
		return (prisma.animal as any).findUnique({
			where: { tag },
		});
	}
}
