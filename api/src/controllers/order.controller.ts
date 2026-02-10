// Controller de Pedidos
import { Request, Response } from "express";
import { orderService } from "../services/order.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export class OrderController {
	async create(req: AuthRequest, res: Response) {
		try {
			const order = await orderService.create({
				...req.body,
				userId: req.user!.id,
			});

			return res.status(201).json(order);
		} catch (error) {
			console.error("Erro ao criar pedido:", error);
			return res.status(400).json({
				error:
					error instanceof Error
						? error.message
						: "Erro ao criar pedido",
			});
		}
	}

	async findById(req: Request, res: Response) {
		try {
			const order = await orderService.findById(req.params.id);

			if (!order) {
				return res.status(404).json({ error: "Pedido não encontrado" });
			}

			return res.json(order);
		} catch (error) {
			console.error("Erro ao buscar pedido:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	async list(req: Request, res: Response) {
		try {
			const { status, type, startDate, endDate, page, limit } = req.query;

			const result = await orderService.list({
				status: status as string,
				type: type as string,
				startDate: startDate
					? new Date(startDate as string)
					: undefined,
				endDate: endDate ? new Date(endDate as string) : undefined,
				page: page ? Number(page) : undefined,
				limit: limit ? Number(limit) : undefined,
			});

			return res.json(result);
		} catch (error) {
			console.error("Erro ao listar pedidos:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	async updateStatus(req: Request, res: Response) {
		try {
			const { status } = req.body;
			const order = await orderService.updateStatus(
				req.params.id,
				status,
			);
			return res.json(order);
		} catch (error) {
			console.error("Erro ao atualizar status:", error);
			return res.status(400).json({
				error:
					error instanceof Error
						? error.message
						: "Erro ao atualizar",
			});
		}
	}

	async cancel(req: Request, res: Response) {
		try {
			const order = await orderService.cancel(req.params.id);
			return res.json(order);
		} catch (error) {
			console.error("Erro ao cancelar pedido:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	async metrics(req: Request, res: Response) {
		try {
			const { startDate, endDate } = req.query;

			const start = startDate
				? new Date(startDate as string)
				: new Date(new Date().setHours(0, 0, 0, 0));

			const end = endDate ? new Date(endDate as string) : new Date();

			const metrics = await orderService.getMetrics(start, end);
			return res.json(metrics);
		} catch (error) {
			console.error("Erro ao buscar métricas:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	async clearAll(req: Request, res: Response) {
		try {
			await orderService.clearAll();
			return res.json({ message: "Todos os pedidos foram removidos" });
		} catch (error) {
			console.error("Erro ao limpar pedidos:", error);
			return res
				.status(500)
				.json({ error: "Erro interno ao limpar pedidos" });
		}
	}
}

export const orderController = new OrderController();
