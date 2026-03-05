import { Router } from "express";
import { FarmController } from "../controllers/farm.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const farmController = new FarmController();

router.use(authMiddleware);

// FARMS
router.get("/", (req, res) => farmController.listFarms(req, res));
router.post("/", (req, res) => farmController.storeFarm(req, res));
router.get("/:id", (req, res) => farmController.getFarm(req, res));
router.put("/:id", (req, res) => farmController.updateFarm(req, res));

// PRODUCTS
router.get("/products", (req, res) => farmController.listProducts(req, res));
router.post("/products", (req, res) => farmController.storeProduct(req, res));
router.put("/products/:id", (req, res) => farmController.updateProduct(req, res));
router.post("/products/:id/sell", (req, res) => farmController.sellProduct(req, res));

// CROPS
router.get("/crops", (req, res) => farmController.listCrops(req, res));
router.post("/crops", (req, res) => farmController.storeCrop(req, res));
router.put("/crops/:id", (req, res) => farmController.updateCrop(req, res));

// ANIMALS
router.get("/animals", (req, res) => farmController.listAnimals(req, res));
router.post("/animals", (req, res) => farmController.storeAnimal(req, res));
router.put("/animals/:id", (req, res) => farmController.updateAnimal(req, res));

// FEED REQUIREMENTS
router.get("/feed-requirements", (req, res) => farmController.listFeedRequirements(req, res));
router.post("/feed-requirements", (req, res) => farmController.storeFeedRequirement(req, res));

// ACTIVITIES
router.post("/activities", (req, res) => farmController.recordActivity(req, res));

export default router;