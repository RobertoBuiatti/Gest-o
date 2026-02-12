// Rotas Públicas (sem autenticação)
import { Router } from "express";
import { prisma } from "../config/database";

const router = Router();

// Cardápio público
router.get("/menu", async (req, res) => {
	try {
		const products = await prisma.product.findMany({
			where: { isActive: true },
			include: {
				category: true,
				sector: true,
			},
			orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
		});

		// Buscar apenas categorias que têm produtos ativos
		const productCategoryIds = new Set(products.map((p) => p.category.id));

		const categories = await prisma.category.findMany({
			where: {
				type: "PRODUCT",
				isActive: true,
				id: { in: Array.from(productCategoryIds) }, // ✅ Apenas categorias com produtos
			},
			orderBy: { name: "asc" },
		});

		return res.json({ products, categories });
	} catch (error) {
		console.error("Erro ao buscar cardápio:", error);
		return res.status(500).json({ error: "Erro ao buscar cardápio" });
	}
});

// Informações do restaurante para QR Code
router.get("/info", async (req, res) => {
	return res.json({
		name: "Gestão ERP Restaurante",
		menuUrl: `${req.protocol}://${req.get("host")}/cardapio`,
		apiUrl: `${req.protocol}://${req.get("host")}/api`,
	});
});

// Criar pedido público (cliente via cardápio)
router.post("/orders", async (req, res) => {
	try {
		const {
			type,
			customerName,
			customerPhone,
			notes,
			items,
			subtotal,
			total,
		} = req.body;

		if (!customerName || !items || items.length === 0) {
			return res
				.status(400)
				.json({ error: "Nome do cliente e itens são obrigatórios" });
		}

		// Gerar número do pedido
		const lastOrder = await prisma.order.findFirst({
			orderBy: { orderNumber: "desc" },
		});
		const orderNumber = (lastOrder?.orderNumber || 0) + 1;

		// Buscar um usuário admin para associar o pedido
		const adminUser = await prisma.user.findFirst({
			where: { role: "ADMIN" },
		});

		if (!adminUser) {
			return res
				.status(500)
				.json({ error: "Configuração incompleta do sistema" });
		}

		// Criar o pedido
		const order = await prisma.order.create({
			data: {
				orderNumber,
				userId: adminUser.id,
				type: type || "DELIVERY",
				status: "PENDING",
				customerName,
				customerPhone,
				notes,
				subtotal: subtotal || total,
				total,
				items: {
					create: items.map(
						(item: {
							productId: string;
							quantity: number;
							unitPrice: number;
						}) => ({
							productId: item.productId,
							quantity: item.quantity,
							unitPrice: item.unitPrice,
						}),
					),
				},
			},
			include: {
				items: {
					include: { product: true },
				},
			},
		});

		return res.status(201).json({
			success: true,
			orderNumber: order.orderNumber,
			message: "Pedido recebido com sucesso!",
		});
	} catch (error) {
		console.error("Erro ao criar pedido público:", error);
		return res.status(500).json({ error: "Erro ao processar pedido" });
	}
});

/**
 * Rotas públicas para Salão
 * - GET /public/salon/services -> lista serviços ativos do salão (sem autenticação)
 * - GET /public/salon/appointments?start=ISO&end=ISO -> lista agendamentos do salão no intervalo
 */
router.get("/salon/services", async (req, res) => {
  try {
    const services = await prisma.salonService.findMany({
      where: { isActive: true, system: "salao" },
      include: { category: true, requirements: { include: { ingredient: true } } },
      orderBy: { name: "asc" },
    });
    return res.json(services);
  } catch (error) {
    console.error("Erro ao buscar serviços do salão (público):", error);
    return res.status(500).json({ error: "Erro ao buscar serviços do salão" });
  }
});

router.get("/salon/appointments", async (req, res) => {
  try {
    const { start, end } = req.query;
    const where: any = { system: "salao" };

    if (start || end) {
      where.date = {
        ...(start ? { gte: new Date(String(start)) } : {}),
        ...(end ? { lte: new Date(String(end)) } : {}),
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        service: { include: { category: true } },
      },
      orderBy: { date: "asc" },
    });

    return res.json(appointments);
  } catch (error) {
    console.error("Erro ao buscar agendamentos do salão (público):", error);
    return res.status(500).json({ error: "Erro ao buscar agendamentos do salão" });
  }
});

export default router;
