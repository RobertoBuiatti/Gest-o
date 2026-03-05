import { Request, Response } from "express";
import { LivestockService } from "../../application/services/LivestockService";

export class PoultryController {
	constructor(private livestockService: LivestockService) {}

	async create(req: Request, res: Response) {
		try {
			const animal = await this.livestockService.createAnimal({
				...req.body,
				type: "AVE",
			});
			return res.status(201).json(animal);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async list(req: Request, res: Response) {
		try {
			const { farmId } = req.query;
			if (!farmId) throw new Error("farmId is required");
			// Filtra por GRANJA via service se necessário, ou filtra o resultado
			const animals = await this.livestockService.listAnimals(
				farmId as string,
			);
			const poultry = animals.filter(
				(a: any) => a.submodule === "GRANJA",
			);
			return res.json(poultry);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}
}
