import { Router } from "express";
import { authMiddleware } from "../../../../middlewares/auth.middleware";
import { StockController } from "../controllers/StockController";
import { StockService } from "../../application/services/StockService";
import { PrismaStockRepository } from "../../infra/prisma/PrismaStockRepository";
import { ProductController } from "../../../products/presentation/controllers/ProductController";
import { ProductService } from "../../../products/application/services/ProductService";
import { PrismaProductRepository } from "../../../products/infra/prisma/PrismaProductRepository";
import { PrismaIngredientRepository } from "../../../products/infra/prisma/PrismaIngredientRepository";

const stockRouter = Router();

// Injeção de Dependências - Stock
const stockRepository = new PrismaStockRepository();
const stockService = new StockService(stockRepository);
const stockController = new StockController(stockService);

// Injeção de Dependências - Insumos (Necessário para compatibilidade com rotas legadas)
const productRepository = new PrismaProductRepository();
const ingredientRepository = new PrismaIngredientRepository();
const productService = new ProductService(
	productRepository,
	ingredientRepository,
	stockRepository,
);
const productController = new ProductController(productService);

// Middleware global de autenticação
stockRouter.use(authMiddleware);

// SETORES
stockRouter.get("/sectors", (req, res) =>
	stockController.listSectors(req, res),
);
stockRouter.post("/sectors", (req, res) =>
	stockController.createSector(req, res),
);
stockRouter.put("/sectors/:id", (req, res) =>
	stockController.updateSector(req, res),
);
stockRouter.delete("/sectors/:id", (req, res) =>
	stockController.deleteSector(req, res),
);

// INSUMOS (Legacy Support: /api/stock/ingredients)
stockRouter.get("/ingredients", (req, res) =>
	productController.listIngredients(req, res),
);
stockRouter.post("/ingredients", (req, res) =>
	productController.createIngredient(req, res),
);
stockRouter.put("/ingredients/:id", (req, res) =>
	productController.updateIngredient(req, res),
);
stockRouter.delete("/ingredients/:id", (req, res) =>
	productController.deleteIngredient(req, res),
);

export { stockRouter };
