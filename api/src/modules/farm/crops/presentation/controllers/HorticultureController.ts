import { Request, Response } from "express";
import { CropService } from "../../application/services/CropService";

export class HorticultureController {
	constructor(private cropService: CropService) {}

	async create(req: Request, res: Response) {
		try {
			const crop = await this.cropService.createCrop(req.body);
			return res.status(201).json(crop);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async list(req: Request, res: Response) {
		try {
			const { farmId } = req.query;
			if (!farmId) throw new Error("farmId is required");
			const crops = await this.cropService.listCrops(
				farmId as string,
				"HORTICULTURA",
			);
			return res.json(crops);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async findById(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const crop = await this.cropService.getCrop(id);
			return res.json(crop);
		} catch (error: any) {
			return res.status(404).json({ error: error.message });
		}
	}
}
