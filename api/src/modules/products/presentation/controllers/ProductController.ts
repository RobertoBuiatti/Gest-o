import { Request, Response } from "express";
import { ProductService } from "../../application/services/ProductService";

export class ProductController {
	constructor(private productService: ProductService) {}

	async listProducts(req: Request, res: Response) {
		try {
			const { categoryId } = req.query;
			const products = await this.productService.listProducts(
				categoryId as string,
			);
			return res.json(products);
		} catch (error: any) {
			return res.status(500).json({ error: error.message });
		}
	}

	async getProduct(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const product = await this.productService.getProduct(id);
			return res.json(product);
		} catch (error: any) {
			return res.status(404).json({ error: error.message });
		}
	}

	async createProduct(req: Request, res: Response) {
		try {
			const product = await this.productService.createProduct(req.body);
			return res.status(201).json(product);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async updateProduct(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const product = await this.productService.updateProduct(
				id,
				req.body,
			);
			return res.json(product);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async deleteProduct(req: Request, res: Response) {
		try {
			const { id } = req.params;
			await this.productService.deleteProduct(id);
			return res.status(204).send();
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	// CATEGORIAS
	async listCategories(req: Request, res: Response) {
		try {
			const { type } = req.query;
			const categories = await this.productService.listCategories(
				type as any,
			);
			return res.json(categories);
		} catch (error: any) {
			return res.status(500).json({ error: error.message });
		}
	}

	async createCategory(req: Request, res: Response) {
		try {
			const category = await this.productService.createCategory(req.body);
			return res.status(201).json(category);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async updateCategory(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const category = await this.productService.updateCategory(
				id,
				req.body,
			);
			return res.json(category);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	// INSUMOS
	async listIngredients(req: Request, res: Response) {
		try {
			const { categoryId } = req.query;
			const ingredients = await this.productService.listIngredients(
				categoryId as string,
			);
			return res.json(ingredients);
		} catch (error: any) {
			return res.status(500).json({ error: error.message });
		}
	}

	async createIngredient(req: Request, res: Response) {
		try {
			const ingredient = await this.productService.createIngredient(
				req.body,
			);
			return res.status(201).json(ingredient);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async updateIngredient(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const ingredient = await this.productService.updateIngredient(
				id,
				req.body,
			);
			return res.json(ingredient);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async deleteIngredient(req: Request, res: Response) {
		try {
			const { id } = req.params;
			await this.productService.deleteIngredient(id);
			return res.status(204).send();
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}
}
