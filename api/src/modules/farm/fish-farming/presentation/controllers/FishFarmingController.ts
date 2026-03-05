import { Request, Response } from "express";
import { FishFarmingService } from "../../application/services/FishFarmingService";

export class FishFarmingController {
	constructor(private fishFarmingService: FishFarmingService) {}

	async createTank(req: Request, res: Response) {
		try {
			const tank = await this.fishFarmingService.createTank(req.body);
			return res.status(201).json(tank);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async listTanks(req: Request, res: Response) {
		try {
			const { farmId } = req.query;
			if (!farmId) throw new Error("farmId is required");
			const tanks = await this.fishFarmingService.listTanks(
				farmId as string,
			);
			return res.json(tanks);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async getTank(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const tank = await this.fishFarmingService.getTank(id);
			return res.json(tank);
		} catch (error: any) {
			return res.status(404).json({ error: error.message });
		}
	}

	async updateTank(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const tank = await this.fishFarmingService.updateTank(id, req.body);
			return res.json(tank);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}
}
