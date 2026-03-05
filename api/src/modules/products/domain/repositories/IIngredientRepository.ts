import {
	Ingredient,
	Category,
	StockBalance,
	StockSector,
} from "@prisma/client";

export interface IIngredientWithDetails extends Ingredient {
	category: Category;
	stockBalance: (StockBalance & { sector: StockSector })[];
}

export interface IIngredientRepository {
	findAll(categoryId?: string): Promise<IIngredientWithDetails[]>;
	findById(id: string): Promise<IIngredientWithDetails | null>;
	create(data: any): Promise<IIngredientWithDetails>;
	update(id: string, data: any): Promise<IIngredientWithDetails>;
	delete(id: string): Promise<void>;

	// Ficha Técnica (Relacionado a produtos mas usa IDs de ingredientes)
	addRecipeItem(
		productId: string,
		ingredientId: string,
		quantity: number,
		unit?: string,
	): Promise<any>;
}
