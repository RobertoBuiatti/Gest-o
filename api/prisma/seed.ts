// Seed para dados iniciais do sistema
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Iniciando seed do banco de dados...");

	// ==================== USUÁRIOS ====================
	const adminPassword = await bcrypt.hash("admin123", 10);

	const admin = await prisma.user.upsert({
		where: { email: "admin@gestao.com" },
		update: {},
		create: {
			name: "Administrador",
			email: "admin@gestao.com",
			password: adminPassword,
			role: "ADMIN",
		},
	});

	console.log("✅ Usuário admin criado:", admin.email);

	// ==================== SETORES DE ESTOQUE ====================
	const setores = await Promise.all([
		prisma.stockSector.upsert({
			where: { name: "Almoxarifado" },
			update: {},
			create: { name: "Almoxarifado", description: "Estoque central" },
		}),
		prisma.stockSector.upsert({
			where: { name: "Cozinha" },
			update: {},
			create: { name: "Cozinha", description: "Estoque da cozinha" },
		}),
		prisma.stockSector.upsert({
			where: { name: "Bar" },
			update: {},
			create: { name: "Bar", description: "Estoque do bar" },
		}),
	]);

	console.log("✅ Setores criados:", setores.length);

	// ==================== CATEGORIAS DE INSUMOS ====================
	const categoriasInsumos = await Promise.all([
		prisma.category.upsert({
			where: { name: "Proteínas" },
			update: {},
			create: { name: "Proteínas", type: "INGREDIENT" },
		}),
		prisma.category.upsert({
			where: { name: "Hortifruti" },
			update: {},
			create: { name: "Hortifruti", type: "INGREDIENT" },
		}),
		prisma.category.upsert({
			where: { name: "Laticínios" },
			update: {},
			create: { name: "Laticínios", type: "INGREDIENT" },
		}),
		prisma.category.upsert({
			where: { name: "Bebidas Base" },
			update: {},
			create: { name: "Bebidas Base", type: "INGREDIENT" },
		}),
		prisma.category.upsert({
			where: { name: "Grãos e Cereais" },
			update: {},
			create: { name: "Grãos e Cereais", type: "INGREDIENT" },
		}),
	]);

	console.log("✅ Categorias de insumos criadas:", categoriasInsumos.length);

	// ==================== CATEGORIAS DE PRODUTOS ====================
	const categoriasProdutos = await Promise.all([
		prisma.category.upsert({
			where: { name: "Entradas" },
			update: {},
			create: { name: "Entradas", type: "PRODUCT" },
		}),
		prisma.category.upsert({
			where: { name: "Pratos Principais" },
			update: {},
			create: { name: "Pratos Principais", type: "PRODUCT" },
		}),
		prisma.category.upsert({
			where: { name: "Sobremesas" },
			update: {},
			create: { name: "Sobremesas", type: "PRODUCT" },
		}),
		prisma.category.upsert({
			where: { name: "Bebidas" },
			update: {},
			create: { name: "Bebidas", type: "PRODUCT" },
		}),
		prisma.category.upsert({
			where: { name: "Combos" },
			update: {},
			create: { name: "Combos", type: "PRODUCT" },
		}),
	]);

	console.log(
		"✅ Categorias de produtos criadas:",
		categoriasProdutos.length,
	);

	// ==================== INSUMOS ====================
	const [proteinas, hortifruti, laticinios, bebidasBase, graos] =
		categoriasInsumos;
	const [almoxarifado, cozinha, bar] = setores;

	const insumos = await Promise.all([
		// Proteínas
		prisma.ingredient.create({
			data: {
				name: "Filé de Frango",
				unit: "kg",
				costPrice: 18.9,
				minStock: 5,
				categoryId: proteinas.id,
			},
		}),
		prisma.ingredient.create({
			data: {
				name: "Carne Bovina (Alcatra)",
				unit: "kg",
				costPrice: 45.0,
				minStock: 3,
				categoryId: proteinas.id,
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
			},
		}),
		prisma.ingredient.create({
			data: {
				name: "Feijão",
				unit: "kg",
				costPrice: 8.0,
				minStock: 5,
				categoryId: graos.id,
			},
		}),
		prisma.ingredient.create({
			data: {
				name: "Alface",
				unit: "un",
				costPrice: 3.5,
				minStock: 10,
				categoryId: hortifruti.id,
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
