// Rotas de Produtos e Categorias
import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// Rotas públicas (para cardápio)
router.get("/products", productController.listProducts.bind(productController));
router.get(
	"/products/:id",
	productController.getProduct.bind(productController),
);
router.get(
	"/categories",
	productController.listCategories.bind(productController),
);

// Rotas protegidas
router.use(authMiddleware);

// Categorias (Admin/Manager)
router.post(
	"/categories",
	requireRole("ADMIN", "MANAGER"),
	productController.createCategory.bind(productController),
);
router.put(
	"/categories/:id",
	requireRole("ADMIN", "MANAGER"),
	productController.updateCategory.bind(productController),
);
router.delete(
	"/categories/:id",
	requireRole("ADMIN", "MANAGER"),
	productController.deleteCategory.bind(productController),
);

// Produtos (Admin/Manager)
router.post(
	"/products",
	requireRole("ADMIN", "MANAGER"),
	productController.createProduct.bind(productController),
);
router.put(
	"/products/:id",
	requireRole("ADMIN", "MANAGER"),
	productController.updateProduct.bind(productController),
);
router.delete(
	"/products/:id",
	requireRole("ADMIN", "MANAGER"),
	productController.deleteProduct.bind(productController),
);

// Insumos (Admin/Manager/Stockist)
router.post(
	"/ingredients",
	requireRole("ADMIN", "MANAGER", "STOCKIST"),
	productController.createIngredient.bind(productController),
);
router.put(
	"/ingredients/:id",
	requireRole("ADMIN", "MANAGER", "STOCKIST"),
	productController.updateIngredient.bind(productController),
);

// Ficha Técnica (Receitas) - Admin/Manager
router.get(
	"/products/:productId/recipe",
	productController.getRecipe.bind(productController),
);
router.post(
	"/products/:productId/recipe",
	requireRole("ADMIN", "MANAGER"),
	productController.addRecipeItem.bind(productController),
);
router.put(
	"/products/:productId/recipe/:ingredientId",
	requireRole("ADMIN", "MANAGER"),
	productController.updateRecipeItem.bind(productController),
);
router.delete(
	"/products/:productId/recipe/:ingredientId",
	requireRole("ADMIN", "MANAGER"),
	productController.removeRecipeItem.bind(productController),
);

export default router;
