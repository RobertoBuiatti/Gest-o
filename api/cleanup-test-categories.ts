import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupTestCategories() {
	console.log("🔍 Buscando categorias de teste...\n");

	// Buscar categorias inativas com nomes de teste
	const testCategories = await prisma.category.findMany({
		where: {
			OR: [
				{ name: { contains: "Cat_" } },
				{ name: { contains: "IngCat_" } },
				{ name: { contains: "Cat_Prod_" } },
				{ name: { contains: "Cat_Ing_" } },
				{ name: { contains: "Cat_Del_" } },
			],
			isActive: false,
		},
		include: {
			products: true,
			ingredients: true,
		},
	});

	console.log(
		`📊 Encontradas ${testCategories.length} categorias de teste inativas:\n`,
	);

	for (const cat of testCategories) {
		console.log(`  - ${cat.name} (${cat.type})`);
		console.log(`    Produtos: ${cat.products.length}`);
		console.log(`    Ingredientes: ${cat.ingredients.length}`);
	}

	// Verificar se há produtos ou ingredientes associados
	const categoriesWithData = testCategories.filter(
		(c) => c.products.length > 0 || c.ingredients.length > 0,
	);

	if (categoriesWithData.length > 0) {
		console.log(
			`\n⚠️  ${categoriesWithData.length} categorias têm dados associados e NÃO serão deletadas:`,
		);
		categoriesWithData.forEach((c) => {
			console.log(
				`  - ${c.name} (${c.products.length} produtos, ${c.ingredients.length} ingredientes)`,
			);
		});
	}

	// Deletar categorias vazias
	const emptyCategories = testCategories.filter(
		(c) => c.products.length === 0 && c.ingredients.length === 0,
	);

	if (emptyCategories.length > 0) {
		console.log(
			`\n🗑️  Deletando ${emptyCategories.length} categorias vazias...`,
		);

		for (const cat of emptyCategories) {
			await prisma.category.delete({
				where: { id: cat.id },
			});
			console.log(`  ✅ Deletada: ${cat.name}`);
		}

		console.log(
			`\n✅ Limpeza concluída! ${emptyCategories.length} categorias removidas.`,
		);
	} else {
		console.log("\n✅ Nenhuma categoria vazia para deletar.");
	}

	await prisma.$disconnect();
}

cleanupTestCategories();
