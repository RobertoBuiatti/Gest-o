import { Crop } from "@prisma/client";

export interface ICropRepository {
	create(data: any): Promise<Crop>;
	findById(id: string): Promise<Crop | null>;
	findAll(farmId: string, submodule: string): Promise<Crop[]>;
	update(id: string, data: any): Promise<Crop>;
	delete(id: string): Promise<void>;
}
