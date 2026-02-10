import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkPorcoesProducts() {
	console.log('🔍 Verificando produtos na categoria "Porções"...\n');

	const porcoes = await prisma.category.findFirst({
		where: {
			name: "Porções",
		},
		include: {
			products: {
				where: {
					isActive: true,
				},
			},
		},
	});

	if (!porcoes) {
		console.log('❌ Categoria "Porções" não encontrada!');
		return;
	}

	console.log(`✅ Categoria "Porções" encontrada!`);
	console.log(`   Tipo: ${porcoes.type}`);
	console.log(`   Ativa: ${porcoes.isActive ? "Sim" : "Não"}`);
	console.log(`\n📦 Produtos ATIVOS na categoria:`);

	if (porcoes.products.length === 0) {
		console.log("   ❌ NENHUM produto ativo encontrado!");
		console.log("\n💡 SOLUÇÃO:");
		console.log(
			'   A categoria "Porções" não aparece nas páginas de Produtos e PDV',
		);
		console.log(
			"   porque essas páginas extraem as categorias DOS PRODUTOS.",
		);
		console.log(
			'   Você precisa CRIAR PELO MENOS UM PRODUTO na categoria "Porções"',
		);
		console.log("   para que ela apareça nessas páginas.");
	} else {
		console.log(
			`   ✅ ${porcoes.products.length} produto(s) encontrado(s):`,
		);
		porcoes.products.forEach((p, i) => {
			console.log(
				`   ${i + 1}. ${p.name} - R$ ${Number(p.salePrice).toFixed(2)}`,
			);
		});
	}

	await prisma.$disconnect();
}

checkPorcoesProducts();
