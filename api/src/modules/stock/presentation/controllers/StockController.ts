import { Request, Response } from "express";
import { StockService } from "../../application/services/StockService";

export class StockController {
	constructor(private stockService: StockService) {}

	async listSectors(req: Request, res: Response) {
		try {
			const sectors = await this.stockService.listSectors();
			return res.json(sectors);
		} catch (error: any) {
			return res.status(500).json({ error: error.message });
		}
	}

	async createSector(req: Request, res: Response) {
		try {
			const sector = await this.stockService.createSector(req.body);
			return res.status(201).json(sector);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async updateSector(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const sector = await this.stockService.updateSector(id, req.body);
			return res.json(sector);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async deleteSector(req: Request, res: Response) {
		try {
			const { id } = req.params;
			await this.stockService.deleteSector(id);
			return res.status(204).send();
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}
}
