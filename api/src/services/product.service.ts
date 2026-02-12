import { prisma } from "../config/database";
import { getSystemContext } from "../config/context";

interface CreateCategoryInput {
	name: string;
	type: "INGREDIENT" | "PRODUCT";
	description?: string;
}

interface CreateProductInput {
	name: string;
	description?: string;
	salePrice: number;
	categoryId: string;
	sectorId: string;
	imageUrl?: string;
	recipes?: Array<{
		ingredientId: string;
		quantity: number;
		unit?: string;
	}>;
}

interface CreateIngredientInput {
	name: string;
	unit: string;
	costPrice: number;
	minStock: number;
	categoryId: string;
}

class ProductService {
	// ==================== CATEGORIAS ====================

	async listCategories(type?: "INGREDIENT" | "PRODUCT") {
		return prisma.category.findMany({
			where: {
				isActive: true,
				system: getSystemContext(),
				...(type && { type }),
			},
			orderBy: { name: "asc" },
			include: {
				_count: {
					select: {
						ingredients: { where: { isActive: true } },
						products: { where: { isActive: true } },
					},
				},
			},
		});
	}

	async createCategory(data: CreateCategoryInput) {
		return prisma.category.create({
			data: {
				name: data.name,
				type: data.type,
				description: data.description,
				system: getSystemContext(),
			},
		});
	}

	async updateCategory(id: string, data: Partial<CreateCategoryInput>) {
		const context = getSystemContext();
		// Primeiro verifica se pertence ao sistema
		const category = await prisma.category.findFirst({
			where: { id, system: context },
		});

		if (!category) {
			throw new Error("Categoria não encontrada ou acesso negado");
		}

		return prisma.category.update({
			where: { id },
			data,
		});
	}

	async deleteCategory(id: string) {
		const context = getSystemContext();
		// Verificar se tem produtos ou insumos ATIVOS vinculados e se pertence ao sistema
		const category = await prisma.category.findFirst({
			where: { id, system: context },
			include: {
				_count: {
					select: {
						ingredients: { where: { isActive: true } },
						products: { where: { isActive: true } },
					},
				},
			},
		});

		if (!category) {
			throw new Error("Categoria não encontrada ou acesso negado");
		}

		if (category._count.ingredients > 0 || category._count.products > 0) {
			throw new Error(
				"Não é possível excluir categoria com itens ativos vinculados",
			);
		}

		return prisma.category.update({
			where: { id },
			data: { isActive: false },
		});
	}

	// ==================== PRODUTOS ====================

	async listProducts(categoryId?: string) {
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
		});
	}

	async getProduct(id: string) {
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
		});
	}

	async createProduct(data: CreateProductInput) {
		return prisma.product.create({
			data: {
				name: data.name,
				description: data.description,
				salePrice: data.salePrice,
				categoryId: data.categoryId,
				sectorId: data.sectorId,
				imageUrl: data.imageUrl,
				recipes: data.recipes
					? {
							create: data.recipes.map((r) => ({
								ingredientId: r.ingredientId,
								quantity: r.quantity,
								unit: r.unit,
							})),
						}
					: undefined,
				system: getSystemContext(),
			},
			include: {
				category: true,
				sector: true,
				recipes: {
					include: { ingredient: true },
				},
			},
		});
	}

	async updateProduct(
		id: string,
		data: Partial<CreateProductInput & { isActive: boolean }>,
	) {
		const { recipes, ...updateData } = data;

		return prisma.$transaction(async (tx) => {
			const context = getSystemContext();
			// Verifica se o produto pertence ao sistema
			const existingProduct = await tx.product.findFirst({
				where: { id, system: context },
			});

			if (!existingProduct) {
				throw new Error("Produto não encontrado ou acesso negado");
			}

			const product = await tx.product.update({
				where: { id },
				data: updateData,
				include: {
					category: true,
					sector: true,
					recipes: { include: { ingredient: true } },
				},
			});

			if (recipes) {
				await tx.recipe.deleteMany({
					where: { productId: id },
				});

				if (recipes.length > 0) {
					await tx.recipe.createMany({
						data: recipes.map((r) => ({
							productId: id,
							ingredientId: r.ingredientId,
							quantity: r.quantity,
							unit: r.unit,
						})),
					});
				}

				return tx.product.findUnique({
					where: { id },
					include: {
						category: true,
						sector: true,
						recipes: { include: { ingredient: true } },
					},
				});
			}

			return product;
		});
	}

	async deleteProduct(id: string) {
		const context = getSystemContext();
		const product = await prisma.product.findFirst({
			where: { id, system: context },
		});

		if (!product) {
			throw new Error("Produto não encontrado ou acesso negado");
		}

		return prisma.product.update({
			where: { id },
			data: { isActive: false },
		});
	}

	// ==================== INSUMOS ====================

	async listIngredients(categoryId?: string) {
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
		});
	}

	async createIngredient(
		data: CreateIngredientInput & {
			initialStock?: number;
			initialSectorId?: string;
		},
	) {
		return prisma.$transaction(async (tx) => {
			const ingredient = await tx.ingredient.create({
				data: {
					name: data.name,
					unit: data.unit,
					costPrice: data.costPrice,
					minStock: data.minStock,
					categoryId: data.categoryId,
					system: getSystemContext(),
				},
				include: {
					category: true,
				},
			});

			if (data.initialStock && data.initialStock > 0) {
				let sectorId = data.initialSectorId;

				// Se não foi informado setor, busca/cria Almoxarifado
				if (!sectorId) {
					let sector = await tx.stockSector.findFirst({
						where: {
							name: "Almoxarifado",
							system: getSystemContext(),
						},
					});

					if (!sector) {
						// Cria setor "Almoxarifado" se não existir para este sistema
						sector = await tx.stockSector.create({
							data: {
								name: "Almoxarifado",
								description: "Estoque central",
								system: getSystemContext(),
							},
						});
					}
					sectorId = sector.id;
				}

				// Cria saldo inicial
				await tx.stockBalance.create({
					data: {
						ingredientId: ingredient.id,
						sectorId: sectorId,
						quantity: data.initialStock,
						system: getSystemContext(),
					},
				});

				// Registra movimentação de entrada
				await tx.stockMovement.create({
					data: {
						ingredientId: ingredient.id,
						toSectorId: sectorId,
						quantity: data.initialStock,
						type: "ENTRY",
						reason: "Estoque Inicial",
						system: getSystemContext(),
					},
				});
			}

			return ingredient;
		});
	}

	async updateIngredient(
		id: string,
		data: Partial<CreateIngredientInput & { isActive: boolean }>,
	) {
		const context = getSystemContext();

		// Primeiro verifica se pertence ao sistema
		const ingredient = await prisma.ingredient.findFirst({
			where: { id, system: context },
		});

		if (!ingredient) {
			throw new Error("Insumo não encontrado ou acesso negado");
		}

		return prisma.ingredient.update({
			where: { id },
			data,
			include: {
				category: true,
			},
		});
	}

	async deleteIngredient(id: string) {
		return prisma.ingredient.update({
			where: { id },
			data: { isActive: false },
		});
	}

	// ==================== FICHA TÉCNICA (RECEITAS) ====================

	async addRecipeItem(
		productId: string,
		ingredientId: string,
		quantity: number,
		unit?: string,
	) {
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

	async updateRecipeItem(
		productId: string,
		ingredientId: string,
		quantity: number,
		unit?: string,
	) {
		return prisma.recipe.update({
			where: {
				productId_ingredientId: {
					productId,
					ingredientId,
				},
			},
			data: {
				quantity,
				...(unit && { unit }),
			},
			include: {
				ingredient: true,
			},
		});
	}

	async removeRecipeItem(productId: string, ingredientId: string) {
		return prisma.recipe.delete({
			where: {
				productId_ingredientId: {
					productId,
					ingredientId,
				},
			},
		});
	}

	async getProductRecipe(productId: string) {
		return prisma.recipe.findMany({
			where: { productId },
			include: {
				ingredient: {
					include: { category: true },
				},
			},
		});
	}
}

export const productService = new ProductService();
