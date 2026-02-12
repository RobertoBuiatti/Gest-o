import { Request, Response } from "express";
import { fixedCostService } from "../services/fixed-cost.service";

class FixedCostController {
  async list(req: Request, res: Response) {
    try {
      const costs = await fixedCostService.getAll();
      return res.json(costs);
    } catch (error) {
      console.error("Erro ao listar custos fixos:", error);
      return res.status(500).json({ error: "Erro ao listar custos fixos" });
    }
  }

  async listActive(req: Request, res: Response) {
    try {
      const costs = await fixedCostService.getActiveBySystem();
      return res.json(costs);
    } catch (error) {
      console.error("Erro ao listar custos fixos ativos:", error);
      return res.status(500).json({ error: "Erro ao listar custos fixos ativos" });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { name, amount, dueDay, category, isActive } = req.body;
      const created = await fixedCostService.create({
        name,
        amount: Number(amount),
        dueDay: Number(dueDay),
        category,
        isActive,
      });
      return res.status(201).json(created);
    } catch (error) {
      console.error("Erro ao criar custo fixo:", error);
      return res.status(500).json({ error: "Erro ao criar custo fixo" });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const updated = await fixedCostService.update(id, data);
      return res.json(updated);
    } catch (error) {
      console.error("Erro ao atualizar custo fixo:", error);
      return res.status(500).json({ error: "Erro ao atualizar custo fixo" });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await fixedCostService.remove(id);
      return res.status(204).send();
    } catch (error) {
      console.error("Erro ao remover custo fixo:", error);
      return res.status(500).json({ error: "Erro ao remover custo fixo" });
    }
  }
}

export const fixedCostController = new FixedCostController();