// Baixa Automática de Estoque por Ficha Técnica
// Este service é chamado quando um pedido é confirmado/pago

import { PrismaClient } from "@prisma/client";
import { convertToStockUnit, Unit } from "../utils/unit.utils";

const prisma = new PrismaClient();

interface StockDeductionResult {
	success: boolean;
	orderId: string;
	deductions: Array<{
		ingredientId: string;
		ingredientName: string;
		quantity: number;
		sectorId: string;
	}>;
	errors: string[];
}

export class StockDeductionService {
	/**
	 * Realiza a baixa automática de estoque baseado na ficha técnica dos produtos
	 * Usa transação atômica para garantir consistência
	 */
	async deductByOrder(orderId: string): Promise<StockDeductionResult> {
		const result: StockDeductionResult = {
			success: false,
			orderId,
			deductions: [],
			errors: [],
		};

		try {
			const order = await prisma.order.findUnique({
				where: { id: orderId },
				include: {
					items: {
						include: {
							product: {
								include: {
									recipes: {
										include: {
											ingredient: true,
										},
									},
								},
							},
						},
					},
				},
			});

			if (!order) {
				result.errors.push("Pedido não encontrado");
				return result;
			}

			// Verifica se já houve baixa de estoque para este pedido
			const existingMovements = await prisma.stockMovement.count({
				where: {
					reason: {
						startsWith: `Pedido #${order.orderNumber} -`,
					},
					type: "EXIT",
				},
			});

			if (existingMovements > 0) {
				result.errors.push(
					"Baixa de estoque já realizada para este pedido",
				);
				return result;
			}

			// Valida saldo disponível antes de decrementar
			const validationErrors =
				await this.validateStockAvailability(order);
			if (validationErrors.length > 0) {
				result.errors = validationErrors;
				return result;
			}

			// Transação atômica para garantir consistência
			await prisma.$transaction(async (tx) => {
				for (const item of order.items) {
					for (const recipe of item.product.recipes) {
						// Converte a quantidade da receita para a unidade de estoque do insumo
						const qtyInStockUnit = convertToStockUnit(
							Number(recipe.quantity),
							(recipe.unit || recipe.ingredient.unit) as Unit,
							recipe.ingredient.unit as Unit,
						);

						const deductQty = qtyInStockUnit * item.quantity;

						let remainingToDeduct = deductQty;

						// Busca todos os saldos disponíveis para este ingrediente em qualquer setor
						const allBalances = await tx.stockBalance.findMany({
							where: {
								ingredientId: recipe.ingredientId,
								quantity: { gt: 0 },
							},
							orderBy: [
								// Prioriza o setor do produto, depois Almoxarifado, depois maior quantidade
								{
									quantity: "desc",
								},
							],
							include: {
								sector: true,
							},
						});

						// Ordena manualmente para garantir a prioridade correta
						// 1. Setor do Produto
						// 2. Almoxarifado
						// 3. Outros setores (já ordenados por quantidade desc)
						const sortedBalances = allBalances.sort((a, b) => {
							const aIsProductSector =
								a.sectorId === item.product.sectorId;
							const bIsProductSector =
								b.sectorId === item.product.sectorId;

							if (aIsProductSector && !bIsProductSector)
								return -1;
							if (!aIsProductSector && bIsProductSector) return 1;

							const aIsAlmox = a.sector.name === "Almoxarifado";
							const bIsAlmox = b.sector.name === "Almoxarifado";

							if (aIsAlmox && !bIsAlmox) return -1;
							if (!aIsAlmox && bIsAlmox) return 1;

							return 0; // Mantém a ordem de quantidade desc
						});

						// Deduz do saldos existentes
						for (const balance of sortedBalances) {
							if (remainingToDeduct <= 0.0001) break;

							const available = Number(balance.quantity);
							const toDeduct = Math.min(
								available,
								remainingToDeduct,
							);

							// Atualiza saldo
							await tx.stockBalance.update({
								where: { id: balance.id },
								data: {
									quantity: { decrement: toDeduct },
								},
							});

							// Registra movimentação
							await tx.stockMovement.create({
								data: {
									ingredientId: recipe.ingredientId,
									fromSectorId: balance.sectorId,
									quantity: toDeduct,
									type: "EXIT",
									reason: `Pedido #${order.orderNumber} - ${item.product.name} (${balance.sector.name})`,
								},
							});

							result.deductions.push({
								ingredientId: recipe.ingredientId,
								ingredientName: recipe.ingredient.name,
								quantity: toDeduct,
								sectorId: balance.sectorId,
							});

							remainingToDeduct -= toDeduct;
						}

						// Se ainda sobrar algo para deduzir, tenta tirar do Almoxarifado (mesmo que fique negativo ou crie novo)
						// Ou se não tinha saldo nenhum em lugar nenhum
						if (remainingToDeduct > 0.0001) {
							const almoxarifado = await tx.stockSector.findFirst(
								{
									where: { name: "Almoxarifado" },
								},
							);

							if (almoxarifado) {
								const almoxBalance =
									await tx.stockBalance.findUnique({
										where: {
											ingredientId_sectorId: {
												ingredientId:
													recipe.ingredientId,
												sectorId: almoxarifado.id,
											},
										},
									});

								if (almoxBalance) {
									await tx.stockBalance.update({
										where: { id: almoxBalance.id },
										data: {
											quantity: {
												decrement: remainingToDeduct,
											},
										},
									});
								} else {
									await tx.stockBalance.create({
										data: {
											ingredientId: recipe.ingredientId,
											sectorId: almoxarifado.id,
											quantity: -remainingToDeduct,
										},
									});
								}

								await tx.stockMovement.create({
									data: {
										ingredientId: recipe.ingredientId,
										fromSectorId: almoxarifado.id,
										quantity: remainingToDeduct,
										type: "EXIT",
										reason: `Pedido #${order.orderNumber} - ${item.product.name} (Almoxarifado - Saldo Negativo)`,
									},
								});

								result.deductions.push({
									ingredientId: recipe.ingredientId,
									ingredientName: recipe.ingredient.name,
									quantity: remainingToDeduct,
									sectorId: almoxarifado.id,
								});
							} else {
								// Caso extremo: não tem Almoxarifado. Tenta usar o setor do produto mesmo criando saldo negativo
								// Ou apenas loga erro? Vamos tentar o setor do produto
								const fallbackSectorId = item.product.sectorId;
								const fallbackBalance =
									await tx.stockBalance.findUnique({
										where: {
											ingredientId_sectorId: {
												ingredientId:
													recipe.ingredientId,
												sectorId: fallbackSectorId,
											},
										},
									});

								if (fallbackBalance) {
									await tx.stockBalance.update({
										where: { id: fallbackBalance.id },
										data: {
											quantity: {
												decrement: remainingToDeduct,
											},
										},
									});
								} else {
									await tx.stockBalance.create({
										data: {
											ingredientId: recipe.ingredientId,
											sectorId: fallbackSectorId,
											quantity: -remainingToDeduct, // Cria negativo
										},
									});
								}
								// Registra movimento (simplificado)
							}
						}
					}
				}

				// Status update is handled by PaymentService
				// await tx.order.update({
				// 	where: { id: orderId },
				// 	data: { status: "PAID" },
				// });
			});

			result.success = true;
			return result;
		} catch (error) {
			result.errors.push(`Erro ao processar baixa: ${error}`);
			return result;
		}
	}

	/**
	 * Devolve o estoque de um pedido cancelado
	 */
	public async restoreStockByOrder(orderId: string): Promise<void> {
		// Busca todas as saídas (EXIT) vinculadas a este pedido
		// Como não temos vínculo direto StockMovement -> Order,
		// precisamos confiar na data ou usar a estrutura de Transaction?
		// Melhor abordagem: Ler os itens do pedido e gerar Entradas (ENTRY)
		// com motivo "Estorno de Pedido Cancelado".

		const order = await prisma.order.findUnique({
			where: { id: orderId },
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
		});

		if (!order) return;

		// Para cada item do pedido, gera entrada dos insumos
		for (const item of order.items) {
			for (const recipe of item.product.recipes) {
				const quantityToRestore =
					Number(recipe.quantity) * Number(item.quantity);

				// Onde restaurar?
				// Tentar devolver pro mesmo setor de onde saiu seria ideal, mas complexo rastrear.
				// Simplificação: Devolve pro setor do Produto ou Almoxarifado.
				const targetSectorId = item.product.sectorId;

				await prisma.stockMovement.create({
					data: {
						ingredientId: recipe.ingredientId,
						toSectorId: targetSectorId,
						quantity: quantityToRestore,
						type: "ENTRY",
						reason: `Estorno Pedido #${order.orderNumber}`,
					},
				});

				// Atualiza saldo
				// Verifica saldo existente no setor alvo
				const stockBalance = await prisma.stockBalance.findUnique({
					where: {
						ingredientId_sectorId: {
							ingredientId: recipe.ingredientId,
							sectorId: targetSectorId,
						},
					},
				});

				if (stockBalance) {
					await prisma.stockBalance.update({
						where: { id: stockBalance.id },
						data: { quantity: { increment: quantityToRestore } },
					});
				} else {
					await prisma.stockBalance.create({
						data: {
							ingredientId: recipe.ingredientId,
							sectorId: targetSectorId,
							quantity: quantityToRestore,
						},
					});
				}
			}
		}
	}

	/**
	 * Valida se há saldo suficiente (soma de todos os setores)
	 */
	public async validateStockAvailability(order: {
		items: Array<{
			product: {
				recipes: Array<{
					ingredientId: string;
					quantity: number;
					unit?: string;
					ingredient: {
						name: string;
						unit: string;
					};
				}>;
			};
			quantity: number;
		}>;
	}): Promise<string[]> {
		const errors: string[] = [];
		const requiredStock = new Map<
			string,
			{ name: string; required: number; available: number }
		>();

		for (const item of order.items) {
			for (const recipe of item.product.recipes) {
				const qtyInStockUnit = convertToStockUnit(
					Number(recipe.quantity),
					(recipe.unit || recipe.ingredient.unit) as Unit,
					recipe.ingredient.unit as Unit,
				);
				const deductQty = qtyInStockUnit * item.quantity;
				const key = recipe.ingredientId; // Valida por ingrediente, não por setor

				if (requiredStock.has(key)) {
					requiredStock.get(key)!.required += deductQty;
				} else {
					// Busca saldo TOTAL do ingrediente em todos os setores
					const balances = await prisma.stockBalance.findMany({
						where: { ingredientId: recipe.ingredientId },
					});

					const totalAvailable = balances.reduce(
						(acc, bal) => acc + Number(bal.quantity),
						0,
					);

					requiredStock.set(key, {
						name: recipe.ingredient.name,
						required: deductQty,
						available: totalAvailable,
					});
				}
			}
		}

		for (const [key, value] of requiredStock) {
			if (value.required > value.available) {
				errors.push(
					`Saldo insuficiente de ${value.name}: necessário ${value.required.toFixed(3)}, disponível ${value.available.toFixed(3)}`,
				);
			}
		}

		return errors;
	}

	/**
	 * Verifica quais ingredientes estão abaixo do estoque mínimo
	 */
	async getCriticalStock(): Promise<
		Array<{
			ingredient: {
				id: string;
				name: string;
				unit: string;
				minStock: number;
			};
			sector: { id: string; name: string };
			currentStock: number;
			deficit: number;
		}>
	> {
		const critical = await prisma.stockBalance.findMany({
			where: {
				ingredient: {
					isActive: true,
				},
			},
			include: {
				ingredient: true,
				sector: true,
			},
		});

		return critical
			.filter(
				(balance) =>
					Number(balance.quantity) <
					Number(balance.ingredient.minStock),
			)
			.map((balance) => ({
				ingredient: {
					id: balance.ingredient.id,
					name: balance.ingredient.name,
					unit: balance.ingredient.unit,
					minStock: Number(balance.ingredient.minStock),
				},
				sector: {
					id: balance.sector.id,
					name: balance.sector.name,
				},
				currentStock: Number(balance.quantity),
				deficit:
					Number(balance.ingredient.minStock) -
					Number(balance.quantity),
			}));
	}
}

export const stockDeductionService = new StockDeductionService();
