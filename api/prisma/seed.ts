// Seed para dados iniciais do sistema
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Iniciando seed do banco de dados...");

	// Limpeza total das tabelas (Children first -> Parents)
	await prisma.transaction.deleteMany();
	await prisma.appointment.deleteMany();
	await prisma.salonServiceRequirement.deleteMany();
	await prisma.salonService.deleteMany();
	await prisma.orderItem.deleteMany();
	await prisma.order.deleteMany();
	await prisma.recipe.deleteMany();
	await prisma.product.deleteMany();
	await prisma.stockBalance.deleteMany();
	await prisma.stockMovement.deleteMany();
	await prisma.ingredient.deleteMany();
	await prisma.category.deleteMany();
	await prisma.stockSector.deleteMany();
	await prisma.client.deleteMany();
	await prisma.cashRegister.deleteMany();
	await prisma.fixedCost.deleteMany();
	await prisma.user.deleteMany();

	console.log("🧹 Banco de dados limpo!");

	// ==================== USUÁRIOS ====================
	const adminPassword = await bcrypt.hash("admin123", 10);

	const admin = await prisma.user.upsert({
		where: { email: "admin@email.com" },
		update: {},
		create: {
			name: "Administrador",
			email: "admin@email.com",
			password: adminPassword,
			role: "ADMIN",
		},
	});

	console.log("✅ Usuário admin criado:", admin.email);

	// ==================== SETORES DE ESTOQUE ====================
	const setores = await Promise.all([
		prisma.stockSector.upsert({
			where: { name: "Almoxarifado" },
			update: { system: "restaurante" },
			create: {
				name: "Almoxarifado",
				description: "Estoque central",
				system: "restaurante",
			},
		}),
		prisma.stockSector.upsert({
			where: { name: "Cozinha" },
			update: { system: "restaurante" },
			create: {
				name: "Cozinha",
				description: "Estoque da cozinha",
				system: "restaurante",
			},
		}),
		prisma.stockSector.upsert({
			where: { name: "Bar" },
			update: { system: "restaurante" },
			create: {
				name: "Bar",
				description: "Estoque do bar",
				system: "restaurante",
			},
		}),
		prisma.stockSector.upsert({
			where: { name: "Estoque Salão" },
			update: { system: "salao" },
			create: {
				name: "Estoque Salão",
				description: "Insumos para o salão",
				system: "salao",
			},
		}),
	]);

	console.log("✅ Setores criados:", setores.length);

	// ==================== CATEGORIAS DE INSUMOS ====================
	const categoriasInsumos = await Promise.all([
		prisma.category.upsert({
			where: { name: "Proteínas" },
			update: { system: "restaurante" },
			create: {
				name: "Proteínas",
				type: "INGREDIENT",
				system: "restaurante",
			},
		}),
		prisma.category.upsert({
			where: { name: "Hortifruti" },
			update: { system: "restaurante" },
			create: {
				name: "Hortifruti",
				type: "INGREDIENT",
				system: "restaurante",
			},
		}),
		prisma.category.upsert({
			where: { name: "Laticínios" },
			update: { system: "restaurante" },
			create: {
				name: "Laticínios",
				type: "INGREDIENT",
				system: "restaurante",
			},
		}),
		prisma.category.upsert({
			where: { name: "Bebidas Base" },
			update: { system: "restaurante" },
			create: {
				name: "Bebidas Base",
				type: "INGREDIENT",
				system: "restaurante",
			},
		}),
		prisma.category.upsert({
			where: { name: "Grãos e Cereais" },
			update: { system: "restaurante" },
			create: {
				name: "Grãos e Cereais",
				type: "INGREDIENT",
				system: "restaurante",
			},
		}),
		prisma.category.upsert({
			where: { name: "Produtos Cabelo" },
			update: { system: "salao" },
			create: {
				name: "Produtos Cabelo",
				type: "INGREDIENT",
				system: "salao",
			},
		}),
	]);

	console.log("✅ Categorias de insumos criadas:", categoriasInsumos.length);

	// ==================== CATEGORIAS DE PRODUTOS/SERVIÇOS ====================
	const categoriasProdutos = await Promise.all([
		prisma.category.upsert({
			where: { name: "Entradas" },
			update: { system: "restaurante" },
			create: {
				name: "Entradas",
				type: "PRODUCT",
				system: "restaurante",
			},
		}),
		prisma.category.upsert({
			where: { name: "Pratos Principais" },
			update: { system: "restaurante" },
			create: {
				name: "Pratos Principais",
				type: "PRODUCT",
				system: "restaurante",
			},
		}),
		prisma.category.upsert({
			where: { name: "Sobremesas" },
			update: { system: "restaurante" },
			create: {
				name: "Sobremesas",
				type: "PRODUCT",
				system: "restaurante",
			},
		}),
		prisma.category.upsert({
			where: { name: "Bebidas" },
			update: { system: "restaurante" },
			create: { name: "Bebidas", type: "PRODUCT", system: "restaurante" },
		}),
		prisma.category.upsert({
			where: { name: "Combos" },
			update: { system: "restaurante" },
			create: { name: "Combos", type: "PRODUCT", system: "restaurante" },
		}),
		prisma.category.upsert({
			where: { name: "Serviços Cabelo" },
			update: { system: "salao" },
			create: {
				name: "Serviços Cabelo",
				type: "PRODUCT",
				system: "salao",
			},
		}),
	]);

	console.log(
		"✅ Categorias de produtos criadas:",
		categoriasProdutos.length,
	);

	// ==================== INSUMOS RESTAURANTE ====================
	const [
		proteinas,
		hortifruti,
		laticinios,
		bebidasBase,
		graos,
		produtosCabelo,
	] = categoriasInsumos;
	const [almoxarifado, cozinha, bar, estoqueSalao] = setores;

	const insumos = await Promise.all([
		// Proteínas
		prisma.ingredient.create({
			data: {
				name: "Filé de Frango",
				unit: "kg",
				costPrice: 18.9,
				minStock: 5,
				categoryId: proteinas.id,
				system: "restaurante",
			},
		}),
		prisma.ingredient.create({
			data: {
				name: "Carne Bovina (Alcatra)",
				unit: "kg",
				costPrice: 45.0,
				minStock: 3,
				categoryId: proteinas.id,
				system: "restaurante",
			},
		}),
		// Grãos
		prisma.ingredient.create({
			data: {
				name: "Arroz",
				unit: "kg",
				costPrice: 6.5,
				minStock: 10,
				categoryId: graos.id,
				system: "restaurante",
			},
		}),
		prisma.ingredient.create({
			data: {
				name: "Feijão",
				unit: "kg",
				costPrice: 8.0,
				minStock: 5,
				categoryId: graos.id,
				system: "restaurante",
			},
		}),
		prisma.ingredient.create({
			data: {
				name: "Alface",
				unit: "un",
				costPrice: 3.5,
				minStock: 10,
				categoryId: hortifruti.id,
				system: "restaurante",
			},
		}),
		// Bebidas Base
		prisma.ingredient.create({
			data: {
				name: "Refrigerante Cola 2L",
				unit: "un",
				costPrice: 7.5,
				minStock: 20,
				categoryId: bebidasBase.id,
				system: "restaurante",
			},
		}),
		// Salão
		prisma.ingredient.create({
			data: {
				name: "Shampoo Pós-Química 1L",
				unit: "un",
				costPrice: 45.0,
				minStock: 5,
				categoryId: produtosCabelo.id,
				system: "salao",
			},
		}),
		prisma.ingredient.create({
			data: {
				name: "Coloração Castanho Médio",
				unit: "un",
				costPrice: 15.0,
				minStock: 10,
				categoryId: produtosCabelo.id,
				system: "salao",
			},
		}),
	]);

	console.log("✅ Insumos criados:", insumos.length);

	// ==================== SALDO INICIAL ====================
	for (const insumo of insumos) {
		await prisma.stockBalance.create({
			data: {
				ingredientId: insumo.id,
				sectorId: almoxarifado.id,
				quantity: 50, // Quantidade inicial
			},
		});

		// Registra movimentação de entrada
		await prisma.stockMovement.create({
			data: {
				ingredientId: insumo.id,
				toSectorId: almoxarifado.id,
				quantity: 50,
				type: "ENTRY",
				reason: "Estoque inicial",
			},
		});
	}

	console.log("✅ Saldo inicial criado para todos os insumos");

	// ==================== PRODUTOS ====================
	const [entradas, pratosPrincipais, sobremesas, bebidas] =
		categoriasProdutos;
	const [frango, carne, arroz, feijao, alface, refrigerante] = insumos;

	const pratoPrincipal = await prisma.product.create({
		data: {
			name: "Prato Executivo Frango",
			description: "Filé de frango grelhado com arroz, feijão e salada",
			salePrice: 32.9,
			categoryId: pratosPrincipais.id,
			sectorId: cozinha.id,
			system: "restaurante",
		},
	});

	// Ficha técnica do prato
	await prisma.recipe.createMany({
		data: [
			{
				productId: pratoPrincipal.id,
				ingredientId: frango.id,
				quantity: 0.2,
			},
			{
				productId: pratoPrincipal.id,
				ingredientId: arroz.id,
				quantity: 0.15,
			},
			{
				productId: pratoPrincipal.id,
				ingredientId: feijao.id,
				quantity: 0.1,
			},
			{
				productId: pratoPrincipal.id,
				ingredientId: alface.id,
				quantity: 0.5,
			},
		],
	});

	console.log("✅ Produto com ficha técnica criado:", pratoPrincipal.name);

	// Bebida
	const bebidaCola = await prisma.product.create({
		data: {
			name: "Refrigerante Cola 350ml",
			description: "Refrigerante gelado",
			salePrice: 6.0,
			categoryId: bebidas.id,
			sectorId: bar.id,
			system: "restaurante",
		},
	});

	await prisma.recipe.create({
		data: {
			productId: bebidaCola.id,
			ingredientId: refrigerante.id,
			quantity: 0.175,
		},
	});

	console.log("✅ Bebida criada:", bebidaCola.name);

	// ==================== DADOS SALÃO ====================
	const [servicosCabelo] = categoriasProdutos.filter(
		(c) => c.name === "Serviços Cabelo",
	);
	const [shampoo, coloracao] = insumos.filter((i) => i.system === "salao");

	const cliente = await prisma.client.create({
		data: {
			name: "Maria Silva",
			email: "maria@email.com",
			phone: "11999999999",
			system: "salao",
		},
	});

	const servico = await prisma.salonService.create({
		data: {
			name: "Corte e Hidratação",
			price: 150.0,
			duration: 60,
			categoryId: servicosCabelo.id,
			system: "salao",
			requirements: {
				create: [
					{ ingredientId: shampoo.id, quantity: 0.05, unit: "un" },
				],
			},
		},
	});

console.log("✅ Dados de salão criados:", servico.name);

// ==================== DADOS FAZENDA ====================
const fazenda = await prisma.farm.create({
  data: {
    name: "Fazenda São Bento",
    location: "Interior - SP",
    description: "Fazenda de produção mista (leite, aves e hortaliças)",
    ownerId: admin.id,
    system: "fazenda",
  },
});

const farmProducts = await Promise.all([
  prisma.farmProduct.create({
    data: {
      name: "Leite Fresco 1L",
      description: "Leite pasteurizado da ordenha",
      salePrice: 6.5,
      quantityInStock: 200,
      farmId: fazenda.id,
      system: "fazenda",
    },
  }),
  prisma.farmProduct.create({
    data: {
      name: "Ovos Caipira (dúzia)",
      description: "Ovos produzidos por galinhas caipiras",
      salePrice: 12.0,
      quantityInStock: 150,
      farmId: fazenda.id,
      system: "fazenda",
    },
  }),
  prisma.farmProduct.create({
    data: {
      name: "Milho (saca 20kg)",
      description: "Milho para ração e venda",
      salePrice: 45.0,
      quantityInStock: 50,
      farmId: fazenda.id,
      system: "fazenda",
    },
  }),
]);

console.log("✅ Produtos da fazenda criados:", farmProducts.length);

// Crops
const crop1 = await prisma.crop.create({
  data: {
    farmId: fazenda.id,
    name: "Milho Safra 2026",
    variety: "Híbrido X",
    area: 5.0,
    plantedAt: new Date(),
    expectedYield: 2500,
    notes: "Plantio inicial da estação",
    system: "fazenda",
  },
});

console.log("✅ Lote de cultivo criado:", crop1.name);

// Animals
const animal1 = await prisma.animal.create({
  data: {
    farmId: fazenda.id,
    name: "Vaca Mansa",
    tag: "COW-001",
    type: "COW",
    birthDate: new Date(new Date().setFullYear(new Date().getFullYear() - 3)),
    status: "ACTIVE",
    notes: "Ordenha diária",
    system: "fazenda",
  },
});

const animal2 = await prisma.animal.create({
  data: {
    farmId: fazenda.id,
    name: "Galinha Caipira 1",
    tag: "HEN-001",
    type: "CHICKEN",
    birthDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    status: "ACTIVE",
    notes: "Produção de ovos",
    system: "fazenda",
  },
});

console.log("✅ Animais criados:", 2);

// Feed requirements (exemplo usando ingrediente 'Arroz' como ração base)
await prisma.feedRequirement.createMany({
  data: [
    {
      animalType: "COW",
      ingredientId: arroz.id,
      quantity: 5,
      unit: "kg",
      system: "fazenda",
    },
    {
      animalType: "CHICKEN",
      ingredientId: arroz.id,
      quantity: 0.2,
      unit: "kg",
      system: "fazenda",
    },
  ],
});

console.log("✅ Requisitos de alimentação criados");

// Register initial farm activities
await prisma.farmActivity.create({
  data: {
    farmId: fazenda.id,
    type: "PLANTING",
    referenceId: crop1.id,
    description: `Plantio: ${crop1.name}`,
    system: "fazenda",
  },
});

await prisma.farmActivity.create({
  data: {
    farmId: fazenda.id,
    type: "BIRTH",
    referenceId: animal2.id,
    description: `Registro de animal: ${animal2.name}`,
    system: "fazenda",
  },
});

console.log("✅ Atividades da fazenda registradas");

// Registra transação de entrada pela venda simulada inicial (exemplo)
await prisma.transaction.create({
  data: {
    type: "INCOME",
    amount: farmProducts[0].salePrice * 10, // venda inicial de 10 unidades de leite
    fee: 0,
    netAmount: farmProducts[0].salePrice * 10,
    description: `Venda inicial: ${farmProducts[0].name}`,
    system: "fazenda",
  },
});

console.log("🎉 Seed concluído com sucesso!");
}

main()
.catch((e) => {
console.error("❌ Erro no seed:", e);
process.exit(1);
})
.finally(async () => {
await prisma.$disconnect();
});
