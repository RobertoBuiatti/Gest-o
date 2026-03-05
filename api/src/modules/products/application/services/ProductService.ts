import { IProductRepository } from "../../domain/repositories/IProductRepository";
import { IIngredientRepository } from "../../domain/repositories/IIngredientRepository";
import { IStockRepository } from "../../../stock/domain/repositories/IStockRepository";

export class ProductService {
	constructor(
		private productRepository: IProductRepository,
		private ingredientRepository: IIngredientRepository,
		private stockRepository: IStockRepository,
	) {}

	// PRODUTOS
	async listProducts(categoryId?: string) {
		return this.productRepository.findAll(categoryId);
	}

	async getProduct(id: string) {
		const product = await this.productRepository.findById(id);
		if (!product) throw new Error("Produto não encontrado");
		return product;
	}

	async createProduct(data: any) {
		const { recipes, ...productData } = data;
		return this.productRepository.create({
			...productData,
			recipes: recipes
				? {
						create: recipes.map((r: any) => ({
							ingredientId: r.ingredientId,
							quantity: r.quantity,
							unit: r.unit,
						})),
					}
				: undefined,
		});
	}

	async updateProduct(id: string, data: any) {
		const { recipes, ...updateData } = data;

		// O Repositório cuida da transação e exclusão/criação de receitas se houver
		return this.productRepository.update(id, {
			...updateData,
			// Lógica de receitas pode ser mais complexa dependendo da implementação do repositório
			// Aqui estamos simplificando para o repositório lidar com o formato Prisma
		});
	}

	async deleteProduct(id: string) {
		return this.productRepository.delete(id);
	}

	// CATEGORIAS
	async listCategories(type?: "INGREDIENT" | "PRODUCT") {
		return this.productRepository.findAllCategories(type);
	}

	async createCategory(data: any) {
		return this.productRepository.createCategory(data);
	}

	async updateCategory(id: string, data: any) {
		return this.productRepository.updateCategory(id, data);
	}

	// INSUMOS
	async listIngredients(categoryId?: string) {
		return this.ingredientRepository.findAll(categoryId);
	}

	async createIngredient(data: any) {
		const { initialStock, initialSectorId, ...ingredientData } = data;

		const ingredient =
			await this.ingredientRepository.create(ingredientData);

		if (initialStock && initialStock > 0) {
			let sectorId = initialSectorId;

			if (!sectorId) {
				const almox =
					await this.stockRepository.findSectorByName("Almoxarifado");
				if (almox) {
					sectorId = almox.id;
				} else {
					const newAlmox = await this.stockRepository.createSector({
						name: "Almoxarifado",
						description: "Estoque central",
					});
					sectorId = newAlmox.id;
				}
			}

			await this.stockRepository.createBalance({
				ingredientId: ingredient.id,
				sectorId,
				quantity: initialStock,
			});

			await this.stockRepository.createMovement({
				ingredientId: ingredient.id,
				toSectorId: sectorId,
				quantity: initialStock,
				type: "ENTRY",
				reason: "Estoque Inicial",
			});
		}

		return ingredient;
	}

	async updateIngredient(id: string, data: any) {
		return this.ingredientRepository.update(id, data);
	}

	async deleteIngredient(id: string) {
		return this.ingredientRepository.delete(id);
	}
}
