// Transferência de Estoque entre Setores
// Gerencia movimentações entre Almoxarifado, Cozinha e Bar

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TransferResult {
	success: boolean;
	message: string;
	movement?: {
		id: string;
		ingredientId: string;
		fromSectorId: string;
		toSectorId: string;
		quantity: number;
	};
}

export class StockTransferService {
	/**
	 * Transfere insumo de um setor para outro
	 * Valida saldo disponível e usa transação atômica
	 */
	async transfer(
		ingredientId: string,
		fromSectorId: string,
		toSectorId: string,
		quantity: number,
		reason?: string,
	): Promise<TransferResult> {
		if (quantity <= 0) {
			return {
				success: false,
				message: "Quantidade deve ser maior que zero",
			};
		}

		if (fromSectorId === toSectorId) {
			return {
				success: false,
				message: "Origem e destino devem ser diferentes",
			};
		}

		try {
			// Valida existência do ingrediente
			const ingredient = await prisma.ingredient.findUnique({
				where: { id: ingredientId },
			});

			if (!ingredient) {
				return { success: false, message: "Insumo não encontrado" };
			}

			// Valida existência dos setores
			const [fromSector, toSector] = await Promise.all([
				prisma.stockSector.findUnique({ where: { id: fromSectorId } }),
				prisma.stockSector.findUnique({ where: { id: toSectorId } }),
			]);

			if (!fromSector) {
				return {
					success: false,
					message: "Setor de origem não encontrado",
				};
			}

			if (!toSector) {
				return {
					success: false,
					message: "Setor de destino não encontrado",
				};
			}

			// Executa transferência em transação atômica
			const movement = await prisma.$transaction(async (tx) => {
				// Verifica saldo disponível na origem
				const fromBalance = await tx.stockBalance.findUnique({
					where: {
						ingredientId_sectorId: {
							ingredientId,
							sectorId: fromSectorId,
						},
					},
				});

				if (!fromBalance || Number(fromBalance.quantity) < quantity) {
					throw new Error(
						`Saldo insuficiente: disponível ${fromBalance ? Number(fromBalance.quantity).toFixed(3) : 0} ${ingredient.unit}`,
					);
				}

				// Decrementa origem
				await tx.stockBalance.update({
					where: {
						ingredientId_sectorId: {
							ingredientId,
							sectorId: fromSectorId,
						},
					},
					data: { quantity: { decrement: quantity } },
				});

				// Incrementa destino (upsert para criar se não existir)
				await tx.stockBalance.upsert({
					where: {
						ingredientId_sectorId: {
							ingredientId,
							sectorId: toSectorId,
						},
					},
					update: { quantity: { increment: quantity } },
					create: {
						ingredientId,
						sectorId: toSectorId,
						quantity,
					},
				});

				// Registra movimentação
				return tx.stockMovement.create({
					data: {
						ingredientId,
						fromSectorId,
						toSectorId,
						quantity,
						type: "TRANSFER",
						reason:
							reason ||
							`Transferência: ${fromSector.name} → ${toSector.name}`,
					},
				});
			});

			return {
				success: true,
				message: `Transferido ${quantity} ${ingredient.unit} de ${ingredient.name} de ${fromSector.name} para ${toSector.name}`,
				movement: {
					id: movement.id,
					ingredientId: movement.ingredientId,
					fromSectorId: movement.fromSectorId!,
					toSectorId: movement.toSectorId!,
					quantity: Number(movement.quantity),
				},
			};
		} catch (error) {
			return {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Erro ao transferir estoque",
			};
		}
	}

	/**
	 * Registra entrada de estoque (compra)
	 */
	async registerEntry(
		ingredientId: string,
		sectorId: string,
		quantity: number,
		reason?: string,
	): Promise<TransferResult> {
		if (quantity <= 0) {
			return {
				success: false,
				message: "Quantidade deve ser maior que zero",
			};
		}

		try {
			const ingredient = await prisma.ingredient.findUnique({
				where: { id: ingredientId },
			});

			if (!ingredient) {
				return { success: false, message: "Insumo não encontrado" };
			}

			await prisma.$transaction(async (tx) => {
				// Incrementa saldo (upsert)
				await tx.stockBalance.upsert({
					where: {
						ingredientId_sectorId: { ingredientId, sectorId },
					},
					update: { quantity: { increment: quantity } },
					create: { ingredientId, sectorId, quantity },
				});

				// Registra movimentação
				await tx.stockMovement.create({
					data: {
						ingredientId,
						toSectorId: sectorId,
						quantity,
						type: "ENTRY",
						reason: reason || "Entrada de compra",
					},
				});
			});

			return {
				success: true,
				message: `Entrada de ${quantity} ${ingredient.unit} de ${ingredient.name} registrada`,
			};
		} catch (error) {
			return {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Erro ao registrar entrada",
			};
		}
	}

	/**
	 * Registra ajuste de estoque (inventário)
	 */
	async registerAdjustment(
		ingredientId: string,
		sectorId: string,
		newQuantity: number,
		reason: string,
	): Promise<TransferResult> {
		try {
			const balance = await prisma.stockBalance.findUnique({
				where: {
					ingredientId_sectorId: { ingredientId, sectorId },
				},
				include: { ingredient: true },
			});

			const currentQty = balance ? Number(balance.quantity) : 0;
			const diff = newQuantity - currentQty;

			if (diff === 0) {
				return { success: true, message: "Nenhum ajuste necessário" };
			}

			await prisma.$transaction(async (tx) => {
				// Atualiza saldo
				await tx.stockBalance.upsert({
					where: {
						ingredientId_sectorId: { ingredientId, sectorId },
					},
					update: { quantity: newQuantity },
					create: { ingredientId, sectorId, quantity: newQuantity },
				});

				// Registra movimentação
				await tx.stockMovement.create({
					data: {
						ingredientId,
						fromSectorId: diff < 0 ? sectorId : null,
						toSectorId: diff > 0 ? sectorId : null,
						quantity: Math.abs(diff),
						type: "ADJUSTMENT",
						reason,
					},
				});
			});

			return {
				success: true,
				message: `Estoque ajustado: ${currentQty.toFixed(3)} → ${newQuantity.toFixed(3)} (${diff > 0 ? "+" : ""}${diff.toFixed(3)})`,
			};
		} catch (error) {
			return {
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Erro ao ajustar estoque",
			};
		}
	}
}

export const stockTransferService = new StockTransferService();
