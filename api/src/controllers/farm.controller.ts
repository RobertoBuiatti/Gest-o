import { Request, Response } from "express";
import { farmService } from "../services/farm.service";

export class FarmController {
  // FARMS
  async listFarms(req: Request, res: Response) {
    try {
      const farms = await farmService.getFarms();
      res.json(farms);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async storeFarm(req: Request, res: Response) {
    try {
      const farm = await farmService.createFarm(req.body);
      res.status(201).json(farm);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getFarm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const farm = await farmService.getFarmById(id);
      res.json(farm);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateFarm(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const farm = await farmService.updateFarm(id, req.body);
      res.json(farm);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // PRODUCTS
  async listProducts(req: Request, res: Response) {
    try {
      const { farmId } = req.query;
      const products = await farmService.getProducts(farmId as string | undefined);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async storeProduct(req: Request, res: Response) {
    try {
      const product = await farmService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await farmService.updateProduct(id, req.body);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async sellProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { quantity, unitPrice, description } = req.body;
      const result = await farmService.sellProduct(id, quantity, unitPrice, description);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // CROPS
  async listCrops(req: Request, res: Response) {
    try {
      const { farmId } = req.query;
      const crops = await farmService.getCrops(farmId as string | undefined);
      res.json(crops);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async storeCrop(req: Request, res: Response) {
    try {
      const crop = await farmService.createCrop(req.body);
      res.status(201).json(crop);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateCrop(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const crop = await farmService.updateCrop(id, req.body);
      res.json(crop);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ANIMALS
  async listAnimals(req: Request, res: Response) {
    try {
      const { farmId } = req.query;
      const animals = await farmService.getAnimals(farmId as string | undefined);
      res.json(animals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async storeAnimal(req: Request, res: Response) {
    try {
      const animal = await farmService.createAnimal(req.body);
      res.status(201).json(animal);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateAnimal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const animal = await farmService.updateAnimal(id, req.body);
      res.json(animal);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // FEED REQUIREMENTS
  async listFeedRequirements(req: Request, res: Response) {
    try {
      const { animalType } = req.query;
      const list = await farmService.getFeedRequirements(animalType as string | undefined);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async storeFeedRequirement(req: Request, res: Response) {
    try {
      const fr = await farmService.createFeedRequirement(req.body);
      res.status(201).json(fr);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ACTIVITIES
  async recordActivity(req: Request, res: Response) {
    try {
      const activity = await farmService.recordActivity(req.body);
      res.status(201).json(activity);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}