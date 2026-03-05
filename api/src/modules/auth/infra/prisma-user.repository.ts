import { prisma } from "../../../config/database";
import { IUserRepository } from "../domain/user.repository";

export class PrismaUserRepository implements IUserRepository {
	async findByEmail(email: string) {
		return prisma.user.findUnique({ where: { email } });
	}

	async findById(id: string) {
		return prisma.user.findUnique({ where: { id } });
	}

	async create(data: any) {
		return prisma.user.create({ data });
	}
}
