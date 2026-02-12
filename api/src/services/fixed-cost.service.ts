import { prisma } from "../config/database";
import { getSystemContext } from "../config/context";

type FixedCostInput = {
  name: string;
  amount: number;
  dueDay: number;
  category?: string | null;
  isActive?: boolean;
  system?: string;
};

class FixedCostService {
  async getAll(system?: string) {
    const ctx = system || getSystemContext();
    return prisma.fixedCost.findMany({
      where: { system: ctx },
      orderBy: { createdAt: "asc" },
    });
  }

  async getActiveBySystem(system?: string) {
    const ctx = system || getSystemContext();
    return prisma.fixedCost.findMany({
      where: { isActive: true, system: ctx },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(data: FixedCostInput) {
    const ctx = data.system || getSystemContext();
    return prisma.fixedCost.create({
      data: {
        name: data.name,
        amount: data.amount,
        dueDay: data.dueDay,
        category: data.category ?? null,
        isActive: data.isActive ?? true,
        system: ctx,
      },
    });
  }

  async update(id: string, data: Partial<FixedCostInput>) {
    return prisma.fixedCost.update({
      where: { id },
      data: {
        name: data.name,
        amount: data.amount,
        dueDay: data.dueDay,
        category: data.category ?? undefined,
        isActive: data.isActive,
      },
    });
  }

  async remove(id: string) {
    return prisma.fixedCost.delete({ where: { id } });
  }
}

export const fixedCostService = new FixedCostService();