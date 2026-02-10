import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkProductCategories() {
	console.log("🔍 Verificando categorias de PRODUTO...\n");

	const allCategories = await prisma.category.findMany({
		where: {
			type: "PRODUCT",
		},
		orderBy: {
			name: "asc",
		},
	});

	console.log(`📊 Total de categorias de PRODUTO: ${allCategories.length}\n`);

	if (allCategories.length === 0) {
		console.log("❌ Nenhuma categoria de PRODUTO encontrada!");
	} else {
		console.log("📋 Categorias de PRODUTO:");
		allCategories.forEach((cat, index) => {
			const status = cat.isActive ? "✅ Ativa" : "❌ Inativa";
			console.log(`  ${index + 1}. ${cat.name} - ${status}`);
		});

		const inactive = allCategories.filter((c) => !c.isActive);
		if (inactive.length > 0) {
			console.log(
				`\n⚠️  ${inactive.length} categoria(s) INATIVA(S) não aparecerão nas páginas:`,
			);
			inactive.forEach((c) => console.log(`  - ${c.name}`));
		}
	}

	await prisma.$disconnect();
}

checkProductCategories();
