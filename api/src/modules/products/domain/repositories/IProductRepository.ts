import { Product, Category, Recipe, Ingredient } from "@prisma/client";

export interface IProductWithDetails extends Product {
	category: Category;
	sector: any; // Ajustar conforme necessário ou usar interfaces específicas
	recipes: (Recipe & { ingredient: Ingredient })[];
}

export interface IProductRepository {
	findAll(categoryId?: string): Promise<IProductWithDetails[]>;
	findById(id: string): Promise<IProductWithDetails | null>;
	create(data: any): Promise<IProductWithDetails>;
	update(id: string, data: any): Promise<IProductWithDetails>;
	delete(id: string): Promise<void>;

	// Categorias
	findAllCategories(type?: "INGREDIENT" | "PRODUCT"): Promise<Category[]>;
	findCategoryById(id: string): Promise<Category | null>;
	createCategory(data: any): Promise<Category>;
	updateCategory(id: string, data: any): Promise<Category>;
}
