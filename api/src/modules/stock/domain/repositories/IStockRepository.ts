import { StockMovement, StockBalance, StockSector } from "@prisma/client";

export interface IStockRepository {
	// Setores
	findAllSectors(): Promise<any[]>;
	findSectorById(id: string): Promise<any | null>;
	findSectorByName(name: string): Promise<any | null>;
	createSector(data: any): Promise<any>;
	updateSector(id: string, data: any): Promise<any>;
	deleteSector(id: string): Promise<void>;

	// Saldos
	findBalance(
		ingredientId: string,
		sectorId: string,
	): Promise<StockBalance | null>;
	findAllBalances(
		ingredientId: string,
	): Promise<(StockBalance & { sector: StockSector })[]>;
	updateBalance(id: string, quantity: number): Promise<StockBalance>;
	createBalance(data: any): Promise<StockBalance>;

	// Movimentações
	createMovement(data: any): Promise<StockMovement>;
	findMovements(filters: any): Promise<StockMovement[]>;
}
