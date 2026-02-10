import { PrismaClient } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

describe("StockDeductionService", () => {
	let service: any;
	let prismaMock: DeepMockProxy<PrismaClient>;

	beforeEach(() => {
		jest.resetModules(); // Limpa cache dos módulos

		prismaMock = mockDeep<PrismaClient>();

		// Mock do módulo @prisma/client
		jest.doMock("@prisma/client", () => ({
			__esModule: true,
			PrismaClient: jest.fn(() => prismaMock),
		}));

		// Importa o serviço DEPOIS de mockar
		// Como o serviço instancia 'new PrismaClient()' no global scope,
		// agora ele vai pegar o nosso mock
		const {
			stockDeductionService,
		} = require("../../services/stock-deduction.service");
		service = stockDeductionService;
	});

	describe("deductByOrder", () => {
		it("deve retornar erro se o pedido não for encontrado", async () => {
			prismaMock.order.findUnique.mockResolvedValue(null);

			const result = await service.deductByOrder("invalid-id");

			expect(result.success).toBe(false);
			expect(result.errors).toContain("Pedido não encontrado");
		});

		it("deve retornar erro se o pedido já tiver baixa realizada", async () => {
			prismaMock.order.findUnique.mockResolvedValue({
				id: "order-1",
				orderNumber: 1,
				items: [],
			} as any);

			prismaMock.stockMovement.count.mockResolvedValue(1);

			const result = await service.deductByOrder("order-1");

			expect(result.success).toBe(false);
			expect(result.errors).toContain(
				"Baixa de estoque já realizada para este pedido",
			);
		});
	});
});
