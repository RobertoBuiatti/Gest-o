import { prisma } from "../config/database";
import { getSystemContext } from "../config/context";

class FarmService {
  // FARMS
  async getFarms() {
    return prisma.farm.findMany({
      where: { system: getSystemContext() },
      orderBy: { name: "asc" },
    });
  }

  async createFarm(data: { name: string; location?: string; description?: string; ownerId?: string }) {
    return prisma.farm.create({
      data: { ...data, system: getSystemContext() },
    });
  }

  async getFarmById(id: string) {
    return prisma.farm.findFirst({
      where: { id, system: getSystemContext() },
      include: {
        products: true,
        crops: true,
        animals: true,
        owner: { select: { id: true, name: true } },
      },
    });
  }

  async updateFarm(id: string, data: { name?: string; location?: string; description?: string; ownerId?: string }) {
    return prisma.farm.update({
      where: { id },
      data,
    });
  }

  // FARM PRODUCTS
  async getProducts(farmId?: string) {
    const where: any = { system: getSystemContext() };
    if (farmId) where.farmId = farmId;
    return prisma.farmProduct.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async createProduct(data: { name: string; salePrice: number; farmId: string; description?: string; quantityInStock?: number }) {
    return prisma.farmProduct.create({
      data: { ...data, quantityInStock: data.quantityInStock ?? 0, system: getSystemContext() },
    });
  }

  async updateProduct(id: string, data: { name?: string; salePrice?: number; description?: string; isActive?: boolean; quantityInStock?: number }) {
    return prisma.farmProduct.update({
      where: { id },
      data,
    });
  }

  // Venda de produto da fazenda (baixa de estoque + transação)
  async sellProduct(productId: string, quantity: number, unitPrice: number, description?: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.farmProduct.findUnique({ where: { id: productId } });
      if (!product) throw new Error("Produto da fazenda não encontrado");
      if (product.quantityInStock < quantity) throw new Error("Estoque insuficiente");

      // Atualiza estoque
      await tx.farmProduct.update({
        where: { id: productId },
        data: { quantityInStock: { decrement: quantity } },
      });

      // Registra transação financeira
      await tx.transaction.create({
        data: {
          type: "INCOME",
          amount: unitPrice * quantity,
          fee: 0,
          netAmount: unitPrice * quantity,
          description: description ?? `Venda: ${product.name}`,
          system: "fazenda",
        },
      });

      // Registra atividade de venda
      await tx.farmActivity.create({
        data: {
          farmId: product.farmId,
          type: "SALE",
          referenceId: productId,
          description: `Venda de ${quantity} x ${product.name}`,
        },
      });

      return { productId, soldQuantity: quantity };
    });
  }

  // CROPS
  async getCrops(farmId?: string) {
    const where: any = { system: getSystemContext() };
    if (farmId) where.farmId = farmId;
    return prisma.crop.findMany({ where, orderBy: { plantedAt: "desc" } });
  }

  async createCrop(data: { farmId: string; name: string; variety?: string; area?: number; plantedAt?: Date; expectedYield?: number; notes?: string }) {
    return prisma.crop.create({ data: { ...data, system: getSystemContext() } });
  }

  async updateCrop(id: string, data: Partial<{ name: string; variety?: string; area?: number; harvestedAt?: Date; expectedYield?: number; notes?: string }>) {
    return prisma.crop.update({ where: { id }, data });
  }

  // ANIMALS
  async getAnimals(farmId?: string) {
    const where: any = { system: getSystemContext() };
    if (farmId) where.farmId = farmId;
    return prisma.animal.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async createAnimal(data: { farmId: string; name?: string; tag?: string; type: string; birthDate?: Date; notes?: string }) {
    return prisma.animal.create({ data: { ...data, system: getSystemContext() } });
  }

  async updateAnimal(id: string, data: Partial<{ name?: string; tag?: string; status?: string; notes?: string }>) {
    return prisma.animal.update({ where: { id }, data });
  }

  // FEED REQUIREMENTS
  async getFeedRequirements(animalType?: string) {
    const where: any = { system: getSystemContext() };
    if (animalType) where.animalType = animalType;
    return prisma.feedRequirement.findMany({ where, include: { ingredient: true } });
  }

  async createFeedRequirement(data: { animalType: string; ingredientId: string; quantity: number; unit?: string }) {
    return prisma.feedRequirement.create({ data: { ...data, system: getSystemContext() } });
  }

  // FARM ACTIVITIES
  async recordActivity(data: { farmId: string; type: string; referenceId?: string; description?: string; recordedAt?: Date }) {
    return prisma.farmActivity.create({
      data: { ...data, recordedAt: data.recordedAt ?? new Date(), system: getSystemContext() },
    });
  }
}

export const farmService = new FarmService();