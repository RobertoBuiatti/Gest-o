import { Animal } from "@prisma/client";

export interface ILivestockRepository {
	create(data: any): Promise<Animal>;
	findById(id: string): Promise<Animal | null>;
	findAll(farmId: string): Promise<Animal[]>;
	update(id: string, data: any): Promise<Animal>;
	delete(id: string): Promise<void>;
	findByTag(tag: string): Promise<Animal | null>;
}
