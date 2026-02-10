import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkPorcoesCategory() {
	console.log('🔍 Buscando categoria "Porções"...\n');

	const porcoes = await prisma.category.findFirst({
		where: {
			name: {
				contains: "Porções",
				mode: "insensitive",
			},
		},
	});

	if (!porcoes) {
		console.log('❌ Categoria "Porções" não encontrada no banco de dados.');
		console.log("\nVerificando categorias similares...\n");

		const similar = await prisma.category.findMany({
			where: {
				OR: [
					{ name: { contains: "Por", mode: "insensitive" } },
					{ name: { contains: "ção", mode: "insensitive" } },
				],
			},
		});

		if (similar.length > 0) {
			console.log("📋 Categorias encontradas:");
			similar.forEach((c) => {
				console.log(
					`  - ${c.name} (${c.type}) - ${c.isActive ? "Ativa" : "Inativa"}`,
				);
			});
		} else {
			console.log("Nenhuma categoria similar encontrada.");
		}
	} else {
		console.log('✅ Categoria "Porções" encontrada!\n');
		console.log(`📊 Detalhes:`);
		console.log(`  ID: ${porcoes.id}`);
		console.log(`  Nome: ${porcoes.name}`);
		console.log(`  Tipo: ${porcoes.type}`);
		console.log(`  Ativa: ${porcoes.isActive ? "Sim" : "Não"}`);
		console.log(`  Criada em: ${porcoes.createdAt}`);

		if (porcoes.type !== "PRODUCT") {
			console.log(`\n⚠️  PROBLEMA IDENTIFICADO!`);
			console.log(
				`   A categoria foi criada como "${porcoes.type}" mas deveria ser "PRODUCT"`,
			);
			console.log(`   para aparecer na página de Produtos e PDV.`);
			console.log(`\n💡 Solução: Atualizar o tipo para "PRODUCT"`);
		} else if (!porcoes.isActive) {
			console.log(`\n⚠️  PROBLEMA IDENTIFICADO!`);
			console.log(`   A categoria está INATIVA.`);
			console.log(`\n💡 Solução: Ativar a categoria`);
		} else {
			console.log(`\n✅ A categoria está configurada corretamente!`);
			console.log(
				`   Ela deveria aparecer nas páginas de Produtos e PDV.`,
			);
		}
	}

	await prisma.$disconnect();
}

checkPorcoesCategory();
