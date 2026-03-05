import { Request, Response } from "express";
import { LivestockService } from "../../application/services/LivestockService";

export class LivestockController {
	constructor(private livestockService: LivestockService) {}

	async create(req: Request, res: Response) {
		try {
			const animal = await this.livestockService.createAnimal(req.body);
			return res.status(201).json(animal);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async list(req: Request, res: Response) {
		try {
			const { farmId } = req.query;
			if (!farmId) throw new Error("farmId is required");
			const animals = await this.livestockService.listAnimals(
				farmId as string,
			);
			return res.json(animals);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async findById(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const animal = await this.livestockService.getAnimal(id);
			return res.json(animal);
		} catch (error: any) {
			return res.status(404).json({ error: error.message });
		}
	}

	async update(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const animal = await this.livestockService.updateAnimal(
				id,
				req.body,
			);
			return res.json(animal);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async delete(req: Request, res: Response) {
		try {
			const { id } = req.params;
			await this.livestockService.deleteAnimal(id);
			return res.status(204).send();
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}
}
