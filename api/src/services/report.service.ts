import { prisma } from "../config/database";
import { getSystemContext } from "../config/context";
import { fixedCostService } from "./fixed-cost.service";

/**
 * Domain helper encapsulando regras financeiras por sistema
 */
class FinancialDomain {
  system: string;

  constructor(system?: string) {
    this.system = system || getSystemContext();
  }

  // Calcula CMV de um pedido (produtos) a partir das receitas (recipes)
  calculateOrderCMV(order: any) {
    let cmv = 0;
    if (!order?.items) return 0;
    for (const item of order.items) {
      const product = item.product;
      if (!product?.recipes) continue;
      for (const recipe of product.recipes) {
        const qtyUsed = Number(recipe.quantity) * Number(item.quantity);
        const cost = qtyUsed * Number(recipe.ingredient.costPrice || 0);
        cmv += cost;
      }
    }
    return cmv;
  }

  // Calcula CMV de um agendamento/serviço a partir de requirements (insumos)
  calculateServiceCMV(appointmentOrService: any) {
    let cmv = 0;
    // appointment.service.requirements[] (SalonServiceRequirement)
    const requirements = appointmentOrService?.service
      ? appointmentOrService.service.requirements
      : appointmentOrService?.requirements;
    if (!requirements) return 0;
    for (const req of requirements) {
      const qtyUsed = Number(req.quantity || 0);
      const cost = qtyUsed * Number(req.ingredient?.costPrice || 0);
      cmv += cost;
    }
    return cmv;
  }
}

interface OrderMarginDetail {
  id: string;
  orderNumber: number;
  total: number;
  cmv: number;
  margin: number;
}

interface DailyReport {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalCMV: number;
  profit: number;
  averageTicket: number;
  orders: OrderMarginDetail[];
}

interface ProductSales {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

class ReportService {
  // Relatório diário de vendas — adapta para restaurante ou salão
  async getDailyReport(startDate: Date, endDate: Date): Promise<DailyReport[]> {
    const context = getSystemContext();
    const domain = new FinancialDomain(context);

    const isSalon = context === "salao";

    const reportByDate = new Map<string, DailyReport>();

    if (isSalon) {
      // Buscar appointments COMPLETED do sistema
      const appointments = await prisma.appointment.findMany({
        where: {
          system: context,
          status: "COMPLETED",
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          service: {
            include: {
              requirements: {
                include: { ingredient: true },
              },
              category: true,
            },
          },
          client: true,
          user: { select: { name: true } },
        },
        orderBy: { date: "asc" },
      });

      if (appointments.length === 0) {
        // Fallback: usar transações INCOME caso não existam appointments COMPLETED
        const txs = await prisma.transaction.findMany({
          where: {
            system: context,
            type: "INCOME",
            createdAt: { gte: startDate, lte: endDate },
          },
          orderBy: { createdAt: "asc" },
        });

        for (const t of txs) {
          const dateKey = t.createdAt.toISOString().split("T")[0];
          const total = Number(t.amount || 0);
          if (!reportByDate.has(dateKey)) {
            reportByDate.set(dateKey, {
              date: dateKey,
              totalOrders: 0,
              totalRevenue: 0,
              totalCMV: 0,
              profit: 0,
              averageTicket: 0,
              orders: [],
            });
          }
          const report = reportByDate.get(dateKey)!;
          report.totalOrders++;
          report.totalRevenue += total;
          // Não temos CMV por transação; manter 0
          report.profit = report.totalRevenue - report.totalCMV;
          report.averageTicket =
            report.totalOrders > 0 ? report.totalRevenue / report.totalOrders : 0;

          report.orders.push({
            id: t.id,
            orderNumber: 0,
            total,
            cmv: 0,
            margin: total,
          });
        }
      } else {
        for (const a of appointments) {
          const dateKey = a.date.toISOString().split("T")[0];
          const total = Number(a.service.price || 0);
          const cmv = domain.calculateServiceCMV(a);
          if (!reportByDate.has(dateKey)) {
            reportByDate.set(dateKey, {
              date: dateKey,
              totalOrders: 0,
              totalRevenue: 0,
              totalCMV: 0,
              profit: 0,
              averageTicket: 0,
              orders: [],
            });
          }
          const report = reportByDate.get(dateKey)!;
          report.totalOrders++;
          report.totalRevenue += total;
          report.totalCMV += cmv;
          report.profit = report.totalRevenue - report.totalCMV;
          report.averageTicket =
            report.totalOrders > 0 ? report.totalRevenue / report.totalOrders : 0;

          report.orders.push({
            id: a.id,
            orderNumber: 0,
            total,
            cmv,
            margin: total - cmv,
          });
        }
      }
    } else {
      // Restaurante: buscar pedidos PAID/DELIVERED diretamente
      const orders = await prisma.order.findMany({
        where: {
          system: context,
          status: { in: ["PAID", "DELIVERED"] },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  recipes: { include: { ingredient: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      for (const order of orders) {
        const dateKey = order.createdAt.toISOString().split("T")[0];
        const total = Number(order.total || 0);
        const cmv = domain.calculateOrderCMV(order);

        if (!reportByDate.has(dateKey)) {
          reportByDate.set(dateKey, {
            date: dateKey,
            totalOrders: 0,
            totalRevenue: 0,
            totalCMV: 0,
            profit: 0,
            averageTicket: 0,
            orders: [],
          });
        }

        const report = reportByDate.get(dateKey)!;
        report.totalOrders++;
        report.totalRevenue += total;
        report.totalCMV += cmv;
        report.profit = report.totalRevenue - report.totalCMV;
        report.averageTicket =
          report.totalOrders > 0 ? report.totalRevenue / report.totalOrders : 0;

        report.orders.push({
          id: order.id,
          orderNumber: order.orderNumber || 0,
          total,
          cmv,
          margin: total - cmv,
        });
      }
    }

    return Array.from(reportByDate.values());
  }

  // Produtos mais vendidos (restaurante)
  async getTopProducts(startDate: Date, endDate: Date, limit = 10): Promise<ProductSales[]> {
    const context = getSystemContext();
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          status: { in: ["PAID", "DELIVERED"] },
          system: context,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        product: true,
      },
    });

    const salesByProduct = new Map<string, ProductSales>();

    for (const item of items) {
      const key = item.productId;
      if (!salesByProduct.has(key)) {
        salesByProduct.set(key, {
          productId: item.productId,
          productName: item.product.name,
          quantity: 0,
          revenue: 0,
        });
      }
      const sales = salesByProduct.get(key)!;
      sales.quantity += item.quantity;
      sales.revenue += Number(item.unitPrice) * item.quantity;
    }

    return Array.from(salesByProduct.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }

  // Serviços mais prestados (salao)
  async getTopServices(startDate: Date, endDate: Date, limit = 10) {
    const context = getSystemContext();
    // Contar appointments COMPLETED por service
    const services = await prisma.appointment.groupBy({
      by: ["serviceId"],
      where: {
        system: context,
        status: "COMPLETED",
        date: { gte: startDate, lte: endDate },
      },
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: "desc" } },
      take: limit,
    });

    // Buscar detalhes dos serviços
    const result = [];
    for (const s of services) {
      const svc = await prisma.salonService.findUnique({
        where: { id: s.serviceId },
      });
      result.push({
        serviceId: s.serviceId,
        serviceName: svc?.name ?? "N/A",
        quantity: s._count.serviceId,
        revenue: svc ? Number(svc.price) * s._count.serviceId : 0,
      });
    }
    return result;
  }

  // Resumo mensal com isolamento por sistema e custos fixos pelo FixedCostService
  async getMonthSummary(year: number, month: number) {
    const context = getSystemContext();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const domain = new FinancialDomain(context);

    let totalRevenue = 0;
    let totalCMV = 0;
    let totalOrders = 0;

    if (context === "salao") {
      // Considerar appointments COMPLETED como receita
      const appointments = await prisma.appointment.findMany({
        where: {
          system: context,
          status: "COMPLETED",
          date: { gte: startDate, lte: endDate },
        },
        include: {
          service: { include: { requirements: { include: { ingredient: true } } } },
        },
      });

      totalOrders = appointments.length;
      for (const a of appointments) {
        const total = Number(a.service.price || 0);
        totalRevenue += total;
        totalCMV += domain.calculateServiceCMV(a);
      }
    } else {
      // Restaurante: buscar pedidos PAID/DELIVERED diretamente
      const orders = await prisma.order.findMany({
        where: {
          system: context,
          status: { in: ["PAID", "DELIVERED"] },
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          items: {
            include: {
              product: { include: { recipes: { include: { ingredient: true } } } },
            },
          },
        },
      });

      totalOrders = orders.length;
      for (const order of orders) {
        totalRevenue += Number(order.total || 0);
        totalCMV += domain.calculateOrderCMV(order);
      }
    }

    const fixedCosts = await fixedCostService.getActiveBySystem(context);
    const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + Number(cost.amount || 0), 0);

    const grossProfit = totalRevenue - totalCMV;
    const netProfit = grossProfit - totalFixedCosts;

    return {
      period: `${year}-${String(month).padStart(2, "0")}`,
      totalOrders,
      totalFixedCosts,
      totalRevenue,
      totalCMV,
      cmvPercentage: totalRevenue > 0 ? ((totalCMV / totalRevenue) * 100).toFixed(1) : "0",
      grossProfit,
      netProfit,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0",
    };
  }

  // Exportação detalhada: orders para restaurante, appointments para salão
  async getExportData(startDate: Date, endDate: Date) {
    const context = getSystemContext();
    const domain = new FinancialDomain(context);

    const stockBalances = await prisma.stockBalance.findMany({
      where: { ingredient: { system: context } },
      include: { ingredient: true },
    });
    const stockMap = new Map<string, number>();
    for (const b of stockBalances) {
      stockMap.set(b.ingredientId, (stockMap.get(b.ingredientId) || 0) + Number(b.quantity || 0));
    }

    if (context === "salao") {
      const appointments = await prisma.appointment.findMany({
        where: {
          system: context,
          status: "COMPLETED",
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          client: true,
          service: { include: { requirements: { include: { ingredient: true } }, category: true } },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const daily = await this.getDailyReport(startDate, endDate);
      const top = await this.getTopServices(startDate, endDate, 50);

      const orders = appointments.map((a) => {
        const servCMV = domain.calculateServiceCMV(a);
        const total = Number(a.service.price || 0);
        const profit = total - servCMV;
        const marginPercent = total > 0 ? ((profit / total) * 100).toFixed(1) : "0";

        const usedIngredients: string[] = [];
        for (const req of a.service.requirements) {
          const qtyUsed = Number(req.quantity || 0);
          const currentStock = stockMap.get(req.ingredientId) || 0;
          usedIngredients.push(
            `${req.ingredient.name}: ${qtyUsed.toFixed(3)}${req.ingredient.unit} (Estoque: ${currentStock.toFixed(3)}${req.ingredient.unit})`
          );
        }

        return {
          ID: a.id,
          "Nº Pedido": "AGEND-" + a.id.substring(0, 4),
          Data: a.date.toLocaleDateString("pt-BR"),
          Hora: a.date.toLocaleTimeString("pt-BR"),
          Tipo: "AGENDAMENTO",
          Status: a.status,
          Cliente: a.client?.name ?? "N/A",
          Subtotal: total,
          Total: total,
          "Custo (CMV)": servCMV,
          Lucro: profit,
          "Margem %": `${marginPercent}%`,
          Usuário: a.user?.name,
          Itens: a.service?.name,
          "Insumos Usados": usedIngredients.join(" | "),
        };
      });

      return {
        orders,
        daily: daily.map((d) => ({
          Data: d.date,
          Pedidos: d.totalOrders,
          Faturamento: d.totalRevenue,
          CMV: d.totalCMV,
          Lucro: d.profit,
          "Ticket Médio": d.averageTicket,
        })),
        top: top.map((t: any) => ({
          Servico: t.serviceName,
          Quantidade: t.quantity,
          Faturamento: t.revenue,
        })),
      };
    } else {
      // Restaurante: buscar pedidos diretamente
      const orders = await prisma.order.findMany({
        where: {
          system: context,
          status: { in: ["PAID", "DELIVERED"] },
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          items: {
            include: { product: { include: { category: true, recipes: { include: { ingredient: true } } } } },
          },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const daily = await this.getDailyReport(startDate, endDate);
      const top = await this.getTopProducts(startDate, endDate, 50);

      const rows = orders.map((o) => {
        const orderCMV = domain.calculateOrderCMV(o);
        const total = Number(o.total || 0);
        const profit = total - orderCMV;
        const marginPercent = total > 0 ? ((profit / total) * 100).toFixed(1) : "0";

        const usedIngredients: string[] = [];
        for (const item of o.items) {
          for (const recipe of item.product.recipes) {
            const qtyUsed = Number(recipe.quantity) * item.quantity;
            const currentStock = stockMap.get(recipe.ingredientId) || 0;
            usedIngredients.push(
              `${recipe.ingredient.name}: ${qtyUsed.toFixed(3)}${recipe.ingredient.unit} (Estoque: ${currentStock.toFixed(3)}${recipe.ingredient.unit})`
            );
          }
        }

        return {
          ID: o.id,
          "Nº Pedido": o.orderNumber,
          Data: o.createdAt.toLocaleDateString("pt-BR"),
          Hora: o.createdAt.toLocaleTimeString("pt-BR"),
          Tipo: o.type,
          Status: o.status,
          Cliente: o.customerName || "N/A",
          Subtotal: Number(o.subtotal || 0),
          Total: total,
          "Custo (CMV)": orderCMV,
          Lucro: profit,
          "Margem %": `${marginPercent}%`,
          Usuário: o.user?.name,
          Itens: o.items.map((i) => `${i.product.name} (x${i.quantity})`).join(", "),
          "Insumos Usados": usedIngredients.join(" | "),
        };
      });

      return {
        orders: rows,
        daily: daily.map((d) => ({
          Data: d.date,
          Pedidos: d.totalOrders,
          Faturamento: d.totalRevenue,
          CMV: d.totalCMV,
          Lucro: d.profit,
          "Ticket Médio": d.averageTicket,
        })),
        top: top.map((t) => ({
          Produto: t.productName,
          Quantidade: t.quantity,
          Faturamento: t.revenue,
        })),
      };
    }
  }
}

export const reportService = new ReportService();