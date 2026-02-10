import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupTestData() {
	console.log("🔍 Buscando dados de teste...\n");

	// 1. Buscar categorias de teste
	const testCategories = await prisma.category.findMany({
		where: {
			OR: [
				{ name: { contains: "Cat_" } },
				{ name: { contains: "IngCat_" } },
			],
			isActive: false,
		},
	});

	const testCategoryIds = testCategories.map((c) => c.id);
	console.log(
		`📊 Encontradas ${testCategories.length} categorias de teste\n`,
	);

	// 2. Buscar produtos associados a essas categorias
	const testProducts = await prisma.product.findMany({
		where: {
			categoryId: { in: testCategoryIds },
		},
		include: {
			recipes: true,
			orderItems: true,
		},
	});

	console.log(`📦 Encontrados ${testProducts.length} produtos de teste:`);
	testProducts.forEach((p) => {
		console.log(
			`  - ${p.name} (${p.recipes.length} receitas, ${p.orderItems.length} pedidos)`,
		);
	});

	// 3. Buscar ingredientes associados a essas categorias
	const testIngredients = await prisma.ingredient.findMany({
		where: {
			categoryId: { in: testCategoryIds },
		},
		include: {
			recipes: true,
			stockBalance: true,
			movements: true,
		},
	});

	console.log(
		`\n🥕 Encontrados ${testIngredients.length} ingredientes de teste:`,
	);
	testIngredients.forEach((i) => {
		console.log(
			`  - ${i.name} (${i.recipes.length} receitas, ${i.stockBalance.length} balanços, ${i.movements.length} movimentos)`,
		);
	});

	// Verificar se há dados críticos
	const productsWithOrders = testProducts.filter(
		(p) => p.orderItems.length > 0,
	);
	const ingredientsWithMovements = testIngredients.filter(
		(i) => i.movements.length > 0,
	);

	if (productsWithOrders.length > 0 || ingredientsWithMovements.length > 0) {
		console.log(
			"\n⚠️  ATENÇÃO: Alguns dados de teste têm histórico de pedidos ou movimentos!",
		);
		console.log(
			"   Recomenda-se manter esses dados ou fazer backup antes de deletar.",
		);
		console.log(
			"\n   Para deletar mesmo assim, execute o script com --force",
		);
		await prisma.$disconnect();
		return;
	}

	console.log("\n✅ Nenhum dado crítico encontrado. Seguro para deletar.\n");
	console.log("🗑️  Deletando dados de teste...\n");

	// 4. Deletar receitas
	const recipeIds = testProducts.flatMap((p) => p.recipes.map((r) => r.id));
	if (recipeIds.length > 0) {
		await prisma.recipe.deleteMany({
			where: { id: { in: recipeIds } },
		});
		console.log(`  ✅ ${recipeIds.length} receitas deletadas`);
	}

	// 5. Deletar balanços de estoque
	const balanceIds = testIngredients.flatMap((i) =>
		i.stockBalance.map((b) => b.id),
	);
	if (balanceIds.length > 0) {
		await prisma.stockBalance.deleteMany({
			where: { id: { in: balanceIds } },
		});
		console.log(`  ✅ ${balanceIds.length} balanços de estoque deletados`);
	}

	// 6. Deletar produtos
	if (testProducts.length > 0) {
		await prisma.product.deleteMany({
			where: { id: { in: testProducts.map((p) => p.id) } },
		});
		console.log(`  ✅ ${testProducts.length} produtos deletados`);
	}

	// 7. Deletar ingredientes
	if (testIngredients.length > 0) {
		await prisma.ingredient.deleteMany({
			where: { id: { in: testIngredients.map((i) => i.id) } },
		});
		console.log(`  ✅ ${testIngredients.length} ingredientes deletados`);
	}

	// 8. Deletar categorias
	if (testCategories.length > 0) {
		await prisma.category.deleteMany({
			where: { id: { in: testCategoryIds } },
		});
		console.log(`  ✅ ${testCategories.length} categorias deletadas`);
	}

	console.log("\n✅ Limpeza concluída com sucesso!");
	await prisma.$disconnect();
}

cleanupTestData();
