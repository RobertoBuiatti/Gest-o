import { IFishTankRepository } from "../domain/repositories/IFishTankRepository";

export class FishFarmingService {
	constructor(private fishTankRepository: IFishTankRepository) {}

	async createTank(data: any) {
		return this.fishTankRepository.create(data);
	}

	async listTanks(farmId: string) {
		return this.fishTankRepository.findAll(farmId);
	}

	async getTank(id: string) {
		const tank = await this.fishTankRepository.findById(id);
		if (!tank) throw new Error("Tanque não encontrado.");
		return tank;
	}

	async updateTank(id: string, data: any) {
		return this.fishTankRepository.update(id, data);
	}

	async deleteTank(id: string) {
		return this.fishTankRepository.delete(id);
	}
}
