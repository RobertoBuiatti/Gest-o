import { ICropRepository } from "../domain/repositories/ICropRepository";

export class CropService {
	constructor(
		private cropRepository: ICropRepository,
		private submodule: string,
	) {}

	async createCrop(data: any) {
		return this.cropRepository.create({
			...data,
			submodule: this.submodule,
		});
	}

	async listCrops(farmId: string) {
		return this.cropRepository.findAll(farmId, this.submodule);
	}

	async getCrop(id: string) {
		const crop = await this.cropRepository.findById(id);
		if (!crop || crop.submodule !== this.submodule)
			throw new Error("Cultura não encontrada.");
		return crop;
	}

	async updateCrop(id: string, data: any) {
		return this.cropRepository.update(id, data);
	}

	async deleteCrop(id: string) {
		return this.cropRepository.delete(id);
	}
}
