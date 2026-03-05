import { FishTank } from "@prisma/client";

export interface IFishTankRepository {
	create(data: any): Promise<FishTank>;
	findById(id: string): Promise<FishTank | null>;
	findAll(farmId: string): Promise<FishTank[]>;
	update(id: string, data: any): Promise<FishTank>;
	delete(id: string): Promise<void>;
}
