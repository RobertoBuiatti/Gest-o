import { Request, Response } from "express";
import { OrderService } from "../../application/services/OrderService";

export class OrderController {
	constructor(private orderService: OrderService) {}

	async create(req: Request, res: Response) {
		try {
			const order = await this.orderService.createOrder(req.body);
			return res.status(201).json(order);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async findById(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const order = await this.orderService.getOrder(id);
			return res.json(order);
		} catch (error: any) {
			return res.status(404).json({ error: error.message });
		}
	}

	async list(req: Request, res: Response) {
		try {
			const params = {
				status: req.query.status as string,
				type: req.query.type as string,
				startDate: req.query.startDate
					? new Date(req.query.startDate as string)
					: undefined,
				endDate: req.query.endDate
					? new Date(req.query.endDate as string)
					: undefined,
				page: req.query.page ? Number(req.query.page) : 1,
				limit: req.query.limit ? Number(req.query.limit) : 20,
			};
			const result = await this.orderService.listOrders(params);
			return res.json(result);
		} catch (error: any) {
			return res.status(500).json({ error: error.message });
		}
	}

	async updateStatus(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { status } = req.body;
			const order = await this.orderService.updateStatus(id, status);
			return res.json(order);
		} catch (error: any) {
			return res.status(400).json({ error: error.message });
		}
	}

	async metrics(req: Request, res: Response) {
		try {
			const startDate = req.query.startDate
				? new Date(req.query.startDate as string)
				: new Date();
			const endDate = req.query.endDate
				? new Date(req.query.endDate as string)
				: new Date();
			const metrics = await this.orderService.getMetrics(
				startDate,
				endDate,
			);
			return res.json(metrics);
		} catch (error: any) {
			return res.status(500).json({ error: error.message });
		}
	}

	async clearAll(req: Request, res: Response) {
		try {
			await this.orderService.clearAll();
			return res.status(204).send();
		} catch (error: any) {
			return res.status(500).json({ error: error.message });
		}
	}
}
