import { PrismaClient } from "@prisma/client";
import { orderService } from "./services/order.service";

const prisma = new PrismaClient();

async function main() {
	console.log("Starting Concurrency Verification...");
	const uniqueId = Date.now().toString();

	try {
		// 1. Setup: 10 items in stock
		const sector = await prisma.stockSector.create({
			data: { name: `Sec_${uniqueId}` },
		});
		const category = await prisma.category.create({
			data: { name: `Cat_${uniqueId}`, type: "PRODUCT" },
		});
		const ingCategory = await prisma.category.create({
			data: { name: `IngCat_${uniqueId}`, type: "INGREDIENT" },
		});

		const ingredient = await prisma.ingredient.create({
			data: {
				name: `Ing_${uniqueId}`,
				unit: "un",
				costPrice: 5,
				minStock: 0,
				categoryId: ingCategory.id,
			},
		});

		await prisma.stockBalance.create({
			data: {
				ingredientId: ingredient.id,
				sectorId: sector.id,
				quantity: 10,
			},
		});

		const product = await prisma.product.create({
			data: {
				name: `Prod_${uniqueId}`,
				salePrice: 20,
				categoryId: category.id,
				sectorId: sector.id,
			},
		});

		await prisma.recipe.create({
			data: {
				productId: product.id,
				ingredientId: ingredient.id,
				quantity: 1,
			},
		});

		const user = await prisma.user.create({
			data: {
				name: `User_${uniqueId}`,
				email: `u_${uniqueId}@t.com`,
				password: "123",
			},
		});

		// 2. Create Order 1 (Consumes 10)
		console.log("Creating Order 1 (10 items)...");
		const order1 = await orderService.create({
			type: "COUNTER",
			userId: user.id,
			items: [{ productId: product.id, quantity: 10 }],
		});
		console.log(`Order 1 Created: ${order1.id}`);

		// 3. Create Order 2 (Consumes 10) - SHOULD FAIL if we are reserving stock
		console.log(
			"Creating Order 2 (10 items) - Should FAIL if stock is reserved...",
		);
		try {
			const order2 = await orderService.create({
				type: "COUNTER",
				userId: user.id,
				items: [{ productId: product.id, quantity: 10 }],
			});
			console.error(
				`FAIL: Order 2 Created (${order2.id})! Double spending allowed.`,
			);
		} catch (e) {
			console.log(
				"SUCCESS: Order 2 Blocked. Stock is correctly reserved.",
			);
		}
	} catch (e) {
		console.error("Error:", e);
	} finally {
		await prisma.$disconnect();
	}
}

main();
