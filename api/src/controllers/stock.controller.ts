// Controller de Estoque
import { Request, Response } from "express";
import { stockTransferService } from "../services/stock-transfer.service";
import { stockDeductionService } from "../services/stock-deduction.service";
import Logger from "../config/logger";
import { productService } from "../services/product.service";
import { prisma } from "../config/database";
import { getSystemContext } from "../config/context";

export class StockController {
	// Lista todos os insumos com saldo por setor
	async listIngredients(req: Request, res: Response) {
		try {
			const ingredients = await prisma.ingredient.findMany({
				where: {
					isActive: true,
					system: getSystemContext(),
				},
				include: {
					category: true,
					stockBalance: {
						include: { sector: true },
					},
				},
				orderBy: { name: "asc" },
			});

			return res.json(ingredients);
		} catch (error) {
			console.error("Erro ao listar insumos:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	// Lista setores com seus saldos
	async listSectors(req: Request, res: Response) {
		try {
			const sectors = await prisma.stockSector.findMany({
				where: { system: getSystemContext() },
				include: {
					stockBalance: {
						where: {
							ingredient: {
								isActive: true,
							},
						},
						include: {
							ingredient: {
								include: { category: true },
							},
						},
					},
					products: {
						where: { isActive: true },
					},
				},
			});

			return res.json(sectors);
		} catch (error) {
			console.error("Erro ao listar setores:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	// Criar setor
	async createSector(req: Request, res: Response) {
		try {
			const { name, description } = req.body;
			if (!name)
				return res.status(400).json({ error: "Nome é obrigatório" });

			const sector = await prisma.stockSector.create({
				data: {
					name,
					description,
					system: getSystemContext(),
				},
			});
			return res.json(sector);
		} catch (error) {
			console.error("Erro criar setor:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	// Atualizar setor
	async updateSector(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { name, description } = req.body;

			const sector = await prisma.stockSector.update({
				where: { id },
				data: { name, description },
			});
			return res.json(sector);
		} catch (error) {
			console.error("Erro atualizar setor:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	// Excluir setor
	async deleteSector(req: Request, res: Response) {
		try {
			const { id } = req.params;

			// Verificar vínculos
			const sector = await prisma.stockSector.findUnique({
				where: { id },
				include: {
					_count: {
						select: {
							stockBalance: true,
							products: true,
							fromMovements: true,
							toMovements: true,
						},
					},
					stockBalance: true,
					products: true,
				},
			});

			if (!sector)
				return res.status(404).json({ error: "Setor não encontrado" });

			if (sector.name === "Almoxarifado") {
				return res.status(400).json({
					error: "O setor Almoxarifado não pode ser excluído",
				});
			}

			// Se houver itens vinculados, mover para Almoxarifado
			if (sector._count.stockBalance > 0 || sector._count.products > 0) {
				const almoxarifado = await prisma.stockSector.findUnique({
					where: { name: "Almoxarifado" },
				});

				if (!almoxarifado) {
					return res.status(500).json({
						error: "Setor Almoxarifado não encontrado para migração",
					});
				}

				// Mover Produtos
				if (sector._count.products > 0) {
					await prisma.product.updateMany({
						where: { sectorId: id },
						data: { sectorId: almoxarifado.id },
					});
				}

				// Mover Estoque (StockBalance)
				if (sector._count.stockBalance > 0) {
					for (const balance of sector.stockBalance) {
						// Verifica se já existe no Almoxarifado
						const existingInAlmoxarifado =
							await prisma.stockBalance.findUnique({
								where: {
									ingredientId_sectorId: {
										ingredientId: balance.ingredientId,
										sectorId: almoxarifado.id,
									},
								},
							});

						if (existingInAlmoxarifado) {
							// Soma a quantidade e deleta o antigo
							await prisma.stockBalance.update({
								where: { id: existingInAlmoxarifado.id },
								data: {
									quantity: { increment: balance.quantity },
								},
							});
							await prisma.stockBalance.delete({
								where: { id: balance.id },
							});
						} else {
							// Move o registro para o Almoxarifado
							await prisma.stockBalance.update({
								where: { id: balance.id },
								data: { sectorId: almoxarifado.id },
							});
						}
					}
				}

				// Atualizar referências de movimentação para null (preservar histórico mas remover dependência)
				await prisma.stockMovement.updateMany({
					where: { fromSectorId: id },
					data: { fromSectorId: null },
				});
				await prisma.stockMovement.updateMany({
					where: { toSectorId: id },
					data: { toSectorId: null },
				});
			}

			await prisma.stockSector.delete({ where: { id } });
			return res.status(204).send();
		} catch (error) {
			console.error("Erro excluir setor:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	// Transferência entre setores
	async transfer(req: Request, res: Response) {
		try {
			const { ingredientId, fromSectorId, toSectorId, quantity, reason } =
				req.body;

			const result = await stockTransferService.transfer(
				ingredientId,
				fromSectorId,
				toSectorId,
				quantity,
				reason,
			);

			if (!result.success) {
				return res.status(400).json({ error: result.message });
			}

			return res.json(result);
		} catch (error) {
			console.error("Erro na transferência:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	// Entrada de estoque (compra)
	async entry(req: Request, res: Response) {
		try {
			const { ingredientId, sectorId, quantity, reason } = req.body;

			const result = await stockTransferService.registerEntry(
				ingredientId,
				sectorId,
				quantity,
				reason,
			);

			if (!result.success) {
				return res.status(400).json({ error: result.message });
			}

			return res.json(result);
		} catch (error) {
			console.error("Erro na entrada:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	// Ajuste de inventário
	async adjustment(req: Request, res: Response) {
		try {
			const { ingredientId, sectorId, newQuantity, reason } = req.body;

			const result = await stockTransferService.registerAdjustment(
				ingredientId,
				sectorId,
				newQuantity,
				reason,
			);

			if (!result.success) {
				return res.status(400).json({ error: result.message });
			}

			return res.json(result);
		} catch (error) {
			console.error("Erro no ajuste:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	// Itens com estoque crítico
	async critical(req: Request, res: Response) {
		try {
			const critical = await stockDeductionService.getCriticalStock();
			return res.json(critical);
		} catch (error) {
			console.error("Erro ao buscar críticos:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	// Histórico de movimentações
	async movements(req: Request, res: Response) {
		try {
			const {
				ingredientId,
				type,
				startDate,
				endDate,
				limit = 50,
			} = req.query;

			const movements = await prisma.stockMovement.findMany({
				where: {
					ingredientId: ingredientId as string,
					type: type as any,
					system: getSystemContext(),
					createdAt: {
						gte: startDate
							? new Date(startDate as string)
							: undefined,
						lte: endDate ? new Date(endDate as string) : undefined,
					},
				},
				include: {
					ingredient: true,
					fromSector: true,
					toSector: true,
				},
				orderBy: { createdAt: "desc" },
				take: Number(limit),
			});

			return res.json(movements);
		} catch (error) {
			Logger.error(`Erro ao listar movimentações: ${error}`);
			return res.status(500).json({ error: "Erro interno" });
		}
	}
	// Exclusão de insumo (Soft Delete)
	async deleteIngredient(req: Request, res: Response) {
		try {
			const { id } = req.params;
			await productService.deleteIngredient(id);
			res.status(204).send();
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}
}

export const stockController = new StockController();
