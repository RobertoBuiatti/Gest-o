import { Router } from "express";
import { authMiddleware } from "../../../../middlewares/auth.middleware";
import { ProductController } from "../controllers/ProductController";
import { ProductService } from "../../application/services/ProductService";
import { PrismaProductRepository } from "../../infra/prisma/PrismaProductRepository";
import { PrismaIngredientRepository } from "../../infra/prisma/PrismaIngredientRepository";
import { PrismaStockRepository } from "../../../stock/infra/prisma/PrismaStockRepository";

const productRouter = Router();

// Injeção de Dependências
const productRepository = new PrismaProductRepository();
const ingredientRepository = new PrismaIngredientRepository();
const stockRepository = new PrismaStockRepository();
const productService = new ProductService(
	productRepository,
	ingredientRepository,
	stockRepository,
);
const productController = new ProductController(productService);

// Middleware global de autenticação para estas rotas
productRouter.use(authMiddleware);

// CATEGORIAS
productRouter.get("/categories", (req, res) =>
	productController.listCategories(req, res),
);
productRouter.post("/categories", (req, res) =>
	productController.createCategory(req, res),
);
productRouter.put("/categories/:id", (req, res) =>
	productController.updateCategory(req, res),
);

// PRODUTOS
productRouter.get("/", (req, res) => productController.listProducts(req, res));
productRouter.get("/:id", (req, res) => productController.getProduct(req, res));
productRouter.post("/", (req, res) =>
	productController.createProduct(req, res),
);
productRouter.put("/:id", (req, res) =>
	productController.updateProduct(req, res),
);
productRouter.delete("/:id", (req, res) =>
	productController.deleteProduct(req, res),
);

// INSUMOS
productRouter.get("/ingredients/list", (req, res) =>
	productController.listIngredients(req, res),
);
productRouter.post("/ingredients", (req, res) =>
	productController.createIngredient(req, res),
);
productRouter.put("/ingredients/:id", (req, res) =>
	productController.updateIngredient(req, res),
);
productRouter.delete("/ingredients/:id", (req, res) =>
	productController.deleteIngredient(req, res),
);

export { productRouter };
