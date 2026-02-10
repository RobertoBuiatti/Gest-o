// Controller de Relatórios
import { Request, Response } from "express";
import { reportService } from "../services/report.service";
import * as XLSX from "xlsx";

class ReportController {
	async exportToExcel(req: Request, res: Response) {
		try {
			const { startDate, endDate } = req.query;

			const start = startDate
				? new Date(startDate as string)
				: new Date(new Date().setDate(new Date().getDate() - 30));
			const end = endDate ? new Date(endDate as string) : new Date();

			const data = await reportService.getExportData(start, end);

			const wb = XLSX.utils.book_new();

			// Planilha de Pedidos
			const wsOrders = XLSX.utils.json_to_sheet(data.orders);
			XLSX.utils.book_append_sheet(wb, wsOrders, "Pedidos");

			// Planilha Diária
			const wsDaily = XLSX.utils.json_to_sheet(data.daily);
			XLSX.utils.book_append_sheet(wb, wsDaily, "Relatório Diário");

			// Planilha Top Produtos
			const wsTop = XLSX.utils.json_to_sheet(data.top);
			XLSX.utils.book_append_sheet(wb, wsTop, "Mais Vendidos");

			const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

			res.setHeader(
				"Content-Type",
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			);
			res.setHeader(
				"Content-Disposition",
				`attachment; filename=relatorio_${start.toISOString().split("T")[0]}_a_${end.toISOString().split("T")[0]}.xlsx`,
			);

			return res.send(buffer);
		} catch (error) {
			console.error("Erro ao exportar Excel:", error);
			return res
				.status(500)
				.json({ error: "Erro ao gerar arquivo Excel" });
		}
	}

	async dailyReport(req: Request, res: Response) {
		try {
			const { startDate, endDate } = req.query;

			const start = startDate
				? new Date(startDate as string)
				: new Date(new Date().setDate(new Date().getDate() - 30));
			const end = endDate ? new Date(endDate as string) : new Date();

			const report = await reportService.getDailyReport(start, end);
			return res.json(report);
		} catch (error) {
			console.error("Erro ao gerar relatório diário:", error);
			return res.status(500).json({ error: "Erro ao gerar relatório" });
		}
	}

	async topProducts(req: Request, res: Response) {
		try {
			const { startDate, endDate, limit } = req.query;

			const start = startDate
				? new Date(startDate as string)
				: new Date(new Date().setDate(new Date().getDate() - 30));
			const end = endDate ? new Date(endDate as string) : new Date();

			const products = await reportService.getTopProducts(
				start,
				end,
				limit ? parseInt(limit as string) : 10,
			);
			return res.json(products);
		} catch (error) {
			console.error("Erro ao buscar top produtos:", error);
			return res.status(500).json({ error: "Erro ao buscar produtos" });
		}
	}

	async monthSummary(req: Request, res: Response) {
		try {
			const { year, month } = req.query;

			const now = new Date();
			const y = year ? parseInt(year as string) : now.getFullYear();
			const m = month ? parseInt(month as string) : now.getMonth() + 1;

			const summary = await reportService.getMonthSummary(y, m);
			return res.json(summary);
		} catch (error) {
			console.error("Erro ao gerar resumo mensal:", error);
			return res.status(500).json({ error: "Erro ao gerar resumo" });
		}
	}
}

export const reportController = new ReportController();
