import { Router } from "express";
import { authMiddleware } from "../../../../middlewares/auth.middleware";

// Livestock & Poultry
import { LivestockController } from "../../livestock/presentation/controllers/LivestockController";
import { PoultryController } from "../../livestock/presentation/controllers/PoultryController";
import { LivestockService } from "../../livestock/application/services/LivestockService";
import { PrismaLivestockRepository } from "../../livestock/infra/prisma/PrismaLivestockRepository";

// Crops (Agriculture & Horticulture)
import { AgricultureController } from "../../crops/presentation/controllers/AgricultureController";
import { HorticultureController } from "../../crops/presentation/controllers/HorticultureController";
import { CropService } from "../../crops/application/services/CropService";
import { PrismaCropRepository } from "../../crops/infra/prisma/PrismaCropRepository";

// Fish Farming
import { FishFarmingController } from "../../fish-farming/presentation/controllers/FishFarmingController";
import { FishFarmingService } from "../../fish-farming/application/services/FishFarmingService";
import { PrismaFishTankRepository } from "../../fish-farming/infra/prisma/PrismaFishTankRepository";

const farmRouter = Router();

// Dependency Injection
const livestockRepository = new PrismaLivestockRepository();
const livestockService = new LivestockService(livestockRepository);
const livestockController = new LivestockController(livestockService);
const poultryController = new PoultryController(livestockService);

const cropRepository = new PrismaCropRepository();
const agricultureService = new CropService(cropRepository, "AGRICULTURA");
const agricultureController = new AgricultureController(agricultureService);

const horticultureService = new CropService(cropRepository, "HORTICULTURA");
const horticultureController = new HorticultureController(horticultureService);

const fishTankRepository = new PrismaFishTankRepository();
const fishFarmingService = new FishFarmingService(fishTankRepository);
const fishFarmingController = new FishFarmingController(fishFarmingService);

farmRouter.use(authMiddleware);

// Livestock (Pecuária)
farmRouter.post("/livestock", (req, res) =>
	livestockController.create(req, res),
);
farmRouter.get("/livestock", (req, res) => livestockController.list(req, res));
farmRouter.get("/livestock/:id", (req, res) =>
	livestockController.findById(req, res),
);
farmRouter.put("/livestock/:id", (req, res) =>
	livestockController.update(req, res),
);
farmRouter.delete("/livestock/:id", (req, res) =>
	livestockController.delete(req, res),
);

// Agriculture (Agricultura)
farmRouter.post("/agriculture", (req, res) =>
	agricultureController.create(req, res),
);
farmRouter.get("/agriculture", (req, res) =>
	agricultureController.list(req, res),
);
farmRouter.get("/agriculture/:id", (req, res) =>
	agricultureController.findById(req, res),
);

// Horticulture (Horticultura)
farmRouter.post("/horticulture", (req, res) =>
	horticultureController.create(req, res),
);
farmRouter.get("/horticulture", (req, res) =>
	horticultureController.list(req, res),
);
farmRouter.get("/horticulture/:id", (req, res) =>
	horticultureController.findById(req, res),
);

// Poultry (Granja)
farmRouter.post("/poultry", (req, res) => poultryController.create(req, res));
farmRouter.get("/poultry", (req, res) => poultryController.list(req, res));

// Fish Farming (Piscicultura)
farmRouter.post("/fish-farming/tanks", (req, res) =>
	fishFarmingController.createTank(req, res),
);
farmRouter.get("/fish-farming/tanks", (req, res) =>
	fishFarmingController.listTanks(req, res),
);
farmRouter.get("/fish-farming/tanks/:id", (req, res) =>
	fishFarmingController.getTank(req, res),
);
farmRouter.put("/fish-farming/tanks/:id", (req, res) =>
	fishFarmingController.updateTank(req, res),
);

export { farmRouter };
