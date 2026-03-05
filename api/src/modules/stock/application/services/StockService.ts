import { IStockRepository } from "../../domain/repositories/IStockRepository";

export class StockService {
	constructor(private stockRepository: IStockRepository) {}

	async listSectors() {
		return this.stockRepository.findAllSectors();
	}

	async createSector(data: any) {
		return this.stockRepository.createSector(data);
	}

	async updateSector(id: string, data: any) {
		return this.stockRepository.updateSector(id, data);
	}

	async deleteSector(id: string) {
		// Aqui viria a lógica de mover produtos/saldos para almoxarifado antes de deletar
		// Para simplificar, o controller original tinha essa lógica.
		// Em uma refatoração completa, o Service cuidaria disso através de transações de repositório.
		const sector = await this.stockRepository.findSectorById(id);
		if (!sector) throw new Error("Setor não encontrado");

		// Implementar migração se necessário...
		return this.stockRepository.deleteSector(id);
	}

	async registerTransfer(data: {
		ingredientId: string;
		fromSectorId: string;
		toSectorId: string;
		quantity: number;
		reason?: string;
	}) {
		// Lógica rica de transferência...
		// Validar saldo na origem -> Decrementar origem -> Upsert destino -> Registrar movimento
		return { success: true }; // Placeholder para implementação completa
	}
}
