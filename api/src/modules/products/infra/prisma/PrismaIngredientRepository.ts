import { prisma } from "../../../../config/database";
import { getSystemContext } from "../../../../config/context";
import {
	IIngredientRepository,
	IIngredientWithDetails,
} from "../../domain/repositories/IIngredientRepository";

export class PrismaIngredientRepository implements IIngredientRepository {
	async findAll(categoryId?: string): Promise<IIngredientWithDetails[]> {
		return prisma.ingredient.findMany({
			where: {
				isActive: true,
				system: getSystemContext(),
				...(categoryId && { categoryId }),
			},
			include: {
				category: true,
				stockBalance: {
					include: {
						sector: true,
					},
				},
			},
			orderBy: { name: "asc" },
		}) as unknown as IIngredientWithDetails[];
	}

	async findById(id: string): Promise<IIngredientWithDetails | null> {
		if (!id) return null;

		return prisma.ingredient.findFirst({
			where: { id, system: getSystemContext() },
			include: {
				category: true,
				stockBalance: {
					include: {
						sector: true,
					},
				},
			},
		}) as unknown as IIngredientWithDetails;
	}

	async create(data: any): Promise<IIngredientWithDetails> {
		return prisma.ingredient.create({
			data: {
				...data,
				system: getSystemContext(),
			},
			include: {
				category: true,
			},
		}) as unknown as IIngredientWithDetails;
	}

	async update(id: string, data: any): Promise<IIngredientWithDetails> {
		if (!id) throw new Error("ID do insumo é obrigatório para atualização");

		return prisma.ingredient.update({
			where: { id },
			data,
			include: {
				category: true,
			},
		}) as unknown as IIngredientWithDetails;
	}

	async delete(id: string): Promise<void> {
		if (!id) throw new Error("ID do insumo é obrigatório para exclusão");

		await prisma.ingredient.update({
			where: { id },
			data: { isActive: false },
		});
	}

	async addRecipeItem(
		productId: string,
		ingredientId: string,
		quantity: number,
		unit?: string,
	): Promise<any> {
		return prisma.recipe.create({
			data: {
				productId,
				ingredientId,
				quantity,
				unit,
			},
			include: {
				ingredient: true,
			},
		});
	}
}
