// Setup file for Jest tests
import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

// Mock do prisma globalmente se necessário.
// Por enquanto vamos focar em testes unitários isolados onde mockamos serviços.
// Mas para testes de integração vamos precisar de um banco de teste ou mock.

// Exemplo de mock global (opcional por enquanto)
// jest.mock('./lib/prisma', () => ({
//   __esModule: true,
//   prisma: mockDeep<PrismaClient>(),
// }));

console.log("Test setup complete");
