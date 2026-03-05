import { ILivestockRepository } from "../../domain/repositories/ILivestockRepository";

export class LivestockService {
	constructor(private livestockRepository: ILivestockRepository) {}

	async createAnimal(data: any) {
		if (data.tag) {
			const existing = await this.livestockRepository.findByTag(data.tag);
			if (existing) {
				throw new Error("Já existe um animal com este brinco/tag.");
			}
		}
		return this.livestockRepository.create(data);
	}

	async listAnimals(farmId: string) {
		return this.livestockRepository.findAll(farmId);
	}

	async getAnimal(id: string) {
		const animal = await this.livestockRepository.findById(id);
		if (!animal) throw new Error("Animal não encontrado.");
		return animal;
	}

	async updateAnimal(id: string, data: any) {
		return this.livestockRepository.update(id, data);
	}

	async deleteAnimal(id: string) {
		return this.livestockRepository.delete(id);
	}
}
