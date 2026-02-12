// Service de Relatórios Financeiros
import { prisma } from "../config/database";
import { getSystemContext } from "../config/context";

interface OrderMarginDetail {
	id: string;
	orderNumber: number;
	total: number;
	cmv: number;
	margin: number;
}

interface DailyReport {
	date: string;
	totalOrders: number;
	totalRevenue: number;
	totalCMV: number;
	profit: number;
	averageTicket: number;
	orders: OrderMarginDetail[];
}

interface ProductSales {
	productId: string;
	productName: string;
	quantity: number;
	revenue: number;
}

class ReportService {
	// Relatório diário de vendas
	async getDailyReport(
		startDate: Date,
		endDate: Date,
	): Promise<DailyReport[]> {
		const context = getSystemContext();

		// Busca todas as transações de entrada do sistema no período
		const transactions = await prisma.transaction.findMany({
			where: {
				type: "INCOME",
				system: context,
				createdAt: {
					gte: startDate,
					lte: endDate,
				},
			},
			include: {
				order: {
					include: {
						items: {
							include: {
								product: {
									include: {
										recipes: {
											include: { ingredient: true },
										},
									},
								},
							},
						},
					},
				},
			},
			orderBy: { createdAt: "asc" },
		});

		// Agrupa por data
		const reportByDate = new Map<string, DailyReport>();

		for (const tx of transactions) {
			const dateKey = tx.createdAt.toISOString().split("T")[0];

			let cmv = 0;
			// Se a transação for de um pedido, calcula CMV
			if (tx.order) {
				for (const item of tx.order.items) {
					for (const recipe of item.product.recipes) {
						cmv +=
							Number(recipe.quantity) *
							Number(recipe.ingredient.costPrice) *
							item.quantity;
					}
				}
			}

			if (!reportByDate.has(dateKey)) {
				reportByDate.set(dateKey, {
					date: dateKey,
					totalOrders: 0,
					totalRevenue: 0,
					totalCMV: 0,
					profit: 0,
					averageTicket: 0,
					orders: [],
				});
			}

			const report = reportByDate.get(dateKey)!;
			report.totalOrders++;
			report.totalRevenue += Number(tx.amount);
			report.totalCMV += cmv;
			report.profit = report.totalRevenue - report.totalCMV;
			report.averageTicket = report.totalRevenue / report.totalOrders;

			if (tx.order) {
				report.orders.push({
					id: tx.orderId!,
					orderNumber: tx.order.orderNumber || 0,
					total: Number(tx.amount),
					cmv: cmv,
					margin: Number(tx.amount) - cmv,
				});
			} else {
				// Para agendamentos ou outros ganhos sem Order atrelado
				report.orders.push({
					id: tx.id,
					orderNumber: 0, // Ou algum identificador de agendamento se preferir
					total: Number(tx.amount),
					cmv: 0, // Agendamentos puro serviço? Ou considerar CMV de insumos se houver?
					margin: Number(tx.amount),
				});
			}
		}

		return Array.from(reportByDate.values());
	}

	// Produtos mais vendidos
	async getTopProducts(
		startDate: Date,
		endDate: Date,
		limit = 10,
	): Promise<ProductSales[]> {
		const context = getSystemContext();
		const items = await prisma.orderItem.findMany({
			where: {
				order: {
					status: { in: ["PAID", "DELIVERED"] },
					system: context,
					createdAt: {
						gte: startDate,
						lte: endDate,
					},
				},
			},
			include: {
				product: true,
			},
		});

		// Agrupa por produto
		const salesByProduct = new Map<string, ProductSales>();

		for (const item of items) {
			const key = item.productId;

			if (!salesByProduct.has(key)) {
				salesByProduct.set(key, {
					productId: item.productId,
					productName: item.product.name,
					quantity: 0,
					revenue: 0,
				});
			}

			const sales = salesByProduct.get(key)!;
			sales.quantity += item.quantity;
			sales.revenue += Number(item.unitPrice) * item.quantity;
		}

		return Array.from(salesByProduct.values())
			.sort((a, b) => b.quantity - a.quantity)
			.slice(0, limit);
	}

	// Resumo financeiro do mês
	async getMonthSummary(year: number, month: number) {
		const context = getSystemContext();
		const startDate = new Date(year, month - 1, 1);
		const endDate = new Date(year, month, 0, 23, 59, 59);

		// Busca transações de entrada
		const transactions = await prisma.transaction.findMany({
			where: {
				type: "INCOME",
				system: context,
				createdAt: {
					gte: startDate,
					lte: endDate,
				},
			},
			include: {
				order: {
					include: {
						items: {
							include: {
								product: {
									include: {
										recipes: {
											include: { ingredient: true },
										},
									},
								},
							},
						},
					},
				},
			},
		});

		const fixedCosts = await prisma.fixedCost.findMany({
			where: {
				isActive: true,
				system: context,
			},
		});

		let totalRevenue = 0;
		let totalCMV = 0;

		for (const tx of transactions) {
			totalRevenue += Number(tx.amount);
			if (tx.order) {
				for (const item of tx.order.items) {
					for (const recipe of item.product.recipes) {
						totalCMV +=
							Number(recipe.quantity) *
							Number(recipe.ingredient.costPrice) *
							item.quantity;
					}
				}
			}
		}

		const totalFixedCosts = fixedCosts.reduce(
			(sum, cost) => sum + Number(cost.amount),
			0,
		);
		const grossProfit = totalRevenue - totalCMV;
		const netProfit = grossProfit - totalFixedCosts;

		return {
			period: `${year}-${String(month).padStart(2, "0")}`,
			totalTransactions: transactions.length,
			totalRevenue,
			totalCMV,
			cmvPercentage:
				totalRevenue > 0
					? ((totalCMV / totalRevenue) * 100).toFixed(1)
					: "0",
			grossProfit,
			totalFixedCosts,
			netProfit,
			profitMargin:
				totalRevenue > 0
					? ((netProfit / totalRevenue) * 100).toFixed(1)
					: "0",
		};
	}

	// Dados para exportação (Todos os pedidos detalhados)
	async getExportData(startDate: Date, endDate: Date) {
		const context = getSystemContext();

		const orders = await prisma.order.findMany({
			where: {
				system: context,
				createdAt: {
					gte: startDate,
					lte: endDate,
				},
			},
			include: {
				items: {
					include: {
						product: {
							include: {
								category: true,
								recipes: {
									include: { ingredient: true },
								},
							},
						},
					},
				},
				user: {
					select: { name: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		const appointments = await prisma.appointment.findMany({
			where: {
				system: context,
				status: "COMPLETED",
				createdAt: {
					gte: startDate,
					lte: endDate,
				},
			},
			include: {
				client: true,
				service: {
					include: {
						category: true,
						requirements: {
							include: { ingredient: true },
						},
					},
				},
				user: {
					select: { name: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Busca estoque atual apenas para ingredientes deste sistema
		const allBalances = await prisma.stockBalance.findMany({
			where: {
				ingredient: { system: context },
			},
		});
		const stockMap = new Map<string, number>();
		for (const b of allBalances) {
			stockMap.set(
				b.ingredientId,
				(stockMap.get(b.ingredientId) || 0) + Number(b.quantity),
			);
		}

		const daily = await this.getDailyReport(startDate, endDate);
		const top = await this.getTopProducts(startDate, endDate, 50);

		return {
			orders: [
				...orders.map((o) => {
					let orderCMV = 0;
					const usedIngredients: string[] = [];

					for (const item of o.items) {
						for (const recipe of item.product.recipes) {
							const qtyUsed =
								Number(recipe.quantity) * item.quantity;
							const cost =
								qtyUsed * Number(recipe.ingredient.costPrice);
							orderCMV += cost;

							const currentStock =
								stockMap.get(recipe.ingredientId) || 0;
							usedIngredients.push(
								`${recipe.ingredient.name}: ${qtyUsed.toFixed(3)}${recipe.ingredient.unit} (Estoque: ${currentStock.toFixed(3)}${recipe.ingredient.unit})`,
							);
						}
					}

					const total = Number(o.total);
					const profit = total - orderCMV;
					const marginPercent =
						total > 0 ? ((profit / total) * 100).toFixed(1) : "0";

					return {
						ID: o.id,
						"Nº Pedido": o.orderNumber,
						Data: o.createdAt.toLocaleDateString("pt-BR"),
						Hora: o.createdAt.toLocaleTimeString("pt-BR"),
						Tipo: o.type,
						Status: o.status,
						Cliente: o.customerName || "N/A",
						Subtotal: Number(o.subtotal),
						Total: total,
						"Custo (CMV)": orderCMV,
						Lucro: profit,
						"Margem %": `${marginPercent}%`,
						Usuário: o.user.name,
						Itens: o.items
							.map((i) => `${i.product.name} (x${i.quantity})`)
							.join(", "),
						"Insumos Usados": usedIngredients.join(" | "),
					};
				}),
				...appointments.map((a) => {
					let servCMV = 0;
					const usedIngredients: string[] = [];

					for (const req of a.service.requirements) {
						const qtyUsed = Number(req.quantity);
						const cost = qtyUsed * Number(req.ingredient.costPrice);
						servCMV += cost;

						const currentStock =
							stockMap.get(req.ingredientId) || 0;
						usedIngredients.push(
							`${req.ingredient.name}: ${qtyUsed.toFixed(3)}${req.ingredient.unit} (Estoque: ${currentStock.toFixed(3)}${req.ingredient.unit})`,
						);
					}

					const total = Number(a.service.price);
					const profit = total - servCMV;
					const marginPercent =
						total > 0 ? ((profit / total) * 100).toFixed(1) : "0";

					return {
						ID: a.id,
						"Nº Pedido": "AGEND-" + a.id.substring(0, 4),
						Data: a.date.toLocaleDateString("pt-BR"),
						Hora: a.date.toLocaleTimeString("pt-BR"),
						Tipo: "AGENDAMENTO",
						Status: a.status,
						Cliente: a.client.name,
						Subtotal: total,
						Total: total,
						"Custo (CMV)": servCMV,
						Lucro: profit,
						"Margem %": `${marginPercent}%`,
						Usuário: a.user.name,
						Itens: a.service.name,
						"Insumos Usados": usedIngredients.join(" | "),
					};
				}),
			],
			daily: daily.map((d) => ({
				Data: d.date,
				Pedidos: d.totalOrders,
				Faturamento: d.totalRevenue,
				CMV: d.totalCMV,
				Lucro: d.profit,
				"Ticket Médio": d.averageTicket,
			})),
			top: top.map((t) => ({
				Produto: t.productName,
				Quantidade: t.quantity,
				Faturamento: t.revenue,
			})),
		};
	}
}

export const reportService = new ReportService();
