// Controller de Produtos e Categorias
import { Request, Response } from "express";
import { productService } from "../services/product.service";
import Logger from "../config/logger";

class ProductController {
	// ==================== CATEGORIAS ====================

	async listCategories(req: Request, res: Response) {
		try {
			const { type } = req.query;
			const validType =
				type === "INGREDIENT" || type === "PRODUCT" ? type : undefined;
			const categories = await productService.listCategories(validType);
			return res.json(categories);
		} catch (error) {
			console.error("Erro ao listar categorias:", error);
			return res.status(500).json({ error: "Erro ao listar categorias" });
		}
	}

	async createCategory(req: Request, res: Response) {
		try {
			const { name, type, description } = req.body;

			if (!name || !type) {
				return res
					.status(400)
					.json({ error: "Nome e tipo são obrigatórios" });
			}

			if (type !== "INGREDIENT" && type !== "PRODUCT") {
				return res.status(400).json({ error: "Tipo inválido" });
			}

			const category = await productService.createCategory({
				name,
				type,
				description,
			});
			return res.status(201).json(category);
		} catch (error: any) {
			console.error("Erro ao criar categoria:", error);
			if (error.code === "P2002") {
				return res
					.status(400)
					.json({ error: "Já existe uma categoria com este nome" });
			}
			return res.status(500).json({ error: "Erro ao criar categoria" });
		}
	}

	async updateCategory(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const data = req.body;
			const category = await productService.updateCategory(id, data);
			return res.json(category);
		} catch (error) {
			console.error("Erro ao atualizar categoria:", error);
			return res
				.status(500)
				.json({ error: "Erro ao atualizar categoria" });
		}
	}

	async deleteCategory(req: Request, res: Response) {
		try {
			const { id } = req.params;
			await productService.deleteCategory(id);
			return res.status(204).send();
		} catch (error: any) {
			console.error("Erro ao excluir categoria:", error);
			return res
				.status(400)
				.json({ error: error.message || "Erro ao excluir categoria" });
		}
	}

	// ==================== PRODUTOS ====================

	async listProducts(req: Request, res: Response) {
		try {
			const { categoryId } = req.query;
			const products = await productService.listProducts(
				categoryId as string,
			);
			return res.json(products);
		} catch (error) {
			console.error("Erro ao listar produtos:", error);
			return res.status(500).json({ error: "Erro ao listar produtos" });
		}
	}

	async getProduct(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const product = await productService.getProduct(id);

			if (!product) {
				return res
					.status(404)
					.json({ error: "Produto não encontrado" });
			}

			return res.json(product);
		} catch (error) {
			console.error("Erro ao buscar produto:", error);
			return res.status(500).json({ error: "Erro ao buscar produto" });
		}
	}

	async createProduct(req: Request, res: Response) {
		try {
			const data = req.body;

			if (
				!data.name ||
				!data.salePrice ||
				!data.categoryId ||
				!data.sectorId
			) {
				return res
					.status(400)
					.json({ error: "Campos obrigatórios faltando" });
			}

			const product = await productService.createProduct({
				...data,
				recipes: data.recipes,
			});
			return res.status(201).json(product);
		} catch (error) {
			console.error("Erro ao criar produto:", error);
			return res.status(500).json({ error: "Erro ao criar produto" });
		}
	}

	async updateProduct(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const data = req.body;
			const product = await productService.updateProduct(id, data);
			return res.json(product);
		} catch (error) {
			console.error("Erro ao atualizar produto:", error);
			return res.status(500).json({ error: "Erro ao atualizar produto" });
		}
	}

	async deleteProduct(req: Request, res: Response) {
		try {
			const { id } = req.params;
			await productService.deleteProduct(id);
			return res.status(204).send();
		} catch (error) {
			console.error("Erro ao excluir produto:", error);
			return res.status(500).json({ error: "Erro ao excluir produto" });
		}
	}

	// ==================== INSUMOS ====================

	async createIngredient(req: Request, res: Response) {
		try {
			const data = req.body;

			if (!data.name || !data.unit || !data.categoryId) {
				return res
					.status(400)
					.json({ error: "Campos obrigatórios faltando" });
			}

			const ingredient = await productService.createIngredient({
				name: data.name,
				unit: data.unit,
				costPrice: data.costPrice || 0,
				minStock: data.minStock || 0,
				categoryId: data.categoryId,
				initialStock: data.initialStock ? Number(data.initialStock) : 0,
				initialSectorId: data.initialSectorId,
			});

			return res.status(201).json(ingredient);
		} catch (error) {
			console.error("Erro ao criar insumo:", error);
			return res.status(500).json({ error: "Erro ao criar insumo" });
		}
	}

	async updateIngredient(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const data = req.body;
			const ingredient = await productService.updateIngredient(id, data);
			return res.json(ingredient);
		} catch (error) {
			console.error("Erro ao atualizar insumo:", error);
			return res.status(500).json({ error: "Erro ao atualizar insumo" });
		}
	}

	// ==================== FICHA TÉCNICA ====================

	async getRecipe(req: Request, res: Response) {
		try {
			const { productId } = req.params;
			const recipe = await productService.getProductRecipe(productId);
			return res.json(recipe);
		} catch (error) {
			console.error("Erro ao buscar ficha técnica:", error);
			return res
				.status(500)
				.json({ error: "Erro ao buscar ficha técnica" });
		}
	}

	async addRecipeItem(req: Request, res: Response) {
		try {
			const { productId } = req.params;
			const { ingredientId, quantity } = req.body;

			if (!ingredientId || quantity === undefined) {
				return res.status(400).json({
					error: "ingredientId e quantity são obrigatórios",
				});
			}

			const recipe = await productService.addRecipeItem(
				productId,
				ingredientId,
				quantity,
			);
			return res.status(201).json(recipe);
		} catch (error: any) {
			console.error("Erro ao adicionar item na ficha técnica:", error);
			if (error.code === "P2002") {
				return res
					.status(400)
					.json({ error: "Este insumo já está na ficha técnica" });
			}
			return res.status(500).json({ error: "Erro ao adicionar item" });
		}
	}

	async updateRecipeItem(req: Request, res: Response) {
		try {
			const { productId, ingredientId } = req.params;
			const { quantity } = req.body;

			if (quantity === undefined) {
				return res
					.status(400)
					.json({ error: "quantity é obrigatório" });
			}

			const recipe = await productService.updateRecipeItem(
				productId,
				ingredientId,
				quantity,
			);
			return res.json(recipe);
		} catch (error) {
			console.error("Erro ao atualizar item da ficha técnica:", error);
			return res.status(500).json({ error: "Erro ao atualizar item" });
		}
	}

	async removeRecipeItem(req: Request, res: Response) {
		try {
			const { productId, ingredientId } = req.params;
			await productService.removeRecipeItem(productId, ingredientId);
			return res.status(204).send();
		} catch (error) {
			Logger.error(`Erro ao remover item da ficha técnica: ${error}`);
			return res.status(500).json({ error: "Erro ao remover item" });
		}
	}
}

export const productController = new ProductController();
