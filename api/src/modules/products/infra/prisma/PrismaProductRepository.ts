import { prisma } from "../../../../config/database";
import { getSystemContext } from "../../../../config/context";
import {
	IProductRepository,
	IProductWithDetails,
} from "../../domain/repositories/IProductRepository";
import { Category } from "@prisma/client";

export class PrismaProductRepository implements IProductRepository {
	async findAll(categoryId?: string): Promise<IProductWithDetails[]> {
		return prisma.product.findMany({
			where: {
				isActive: true,
				system: getSystemContext(),
				...(categoryId && { categoryId }),
			},
			include: {
				category: true,
				sector: true,
				recipes: {
					include: {
						ingredient: true,
					},
				},
			},
			orderBy: { name: "asc" },
		}) as unknown as IProductWithDetails[];
	}

	async findById(id: string): Promise<IProductWithDetails | null> {
		if (!id) return null;

		return prisma.product.findFirst({
			where: { id, system: getSystemContext() },
			include: {
				category: true,
				sector: true,
				recipes: {
					include: {
						ingredient: true,
					},
				},
			},
		}) as unknown as IProductWithDetails;
	}

	async create(data: any): Promise<IProductWithDetails> {
		return prisma.product.create({
			data: {
				...data,
				system: getSystemContext(),
			},
			include: {
				category: true,
				sector: true,
				recipes: {
					include: { ingredient: true },
				},
			},
		}) as unknown as IProductWithDetails;
	}

	async update(id: string, data: any): Promise<IProductWithDetails> {
		if (!id)
			throw new Error("ID do produto é obrigatório para atualização");

		return prisma.product.update({
			where: { id },
			data,
			include: {
				category: true,
				sector: true,
				recipes: { include: { ingredient: true } },
			},
		}) as unknown as IProductWithDetails;
	}

	async delete(id: string): Promise<void> {
		if (!id) throw new Error("ID do produto é obrigatório para exclusão");

		await prisma.product.update({
			where: { id },
			data: { isActive: false },
		});
	}

	// Categorias
	async findAllCategories(
		type?: "INGREDIENT" | "PRODUCT",
	): Promise<Category[]> {
		return prisma.category.findMany({
			where: {
				isActive: true,
				system: getSystemContext(),
				...(type && { type }),
			},
			include: {
				_count: {
					select: {
						ingredients: true,
						products: true,
					},
				},
			},
			orderBy: { name: "asc" },
		}) as any;
	}

	async findCategoryById(id: string): Promise<Category | null> {
		if (!id) return null;
		return prisma.category.findFirst({
			where: { id, system: getSystemContext() },
		});
	}

	async createCategory(data: any): Promise<Category> {
		return prisma.category.create({
			data: {
				...data,
				system: getSystemContext(),
			},
		});
	}

	async updateCategory(id: string, data: any): Promise<Category> {
		if (!id)
			throw new Error("ID da categoria é obrigatório para atualização");
		return prisma.category.update({
			where: { id },
			data,
		});
	}
}
