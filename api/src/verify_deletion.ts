import { PrismaClient } from "@prisma/client";
import { productService } from "./services/product.service";
import { orderService } from "./services/order.service";

const prisma = new PrismaClient();

async function main() {
	console.log("Starting Deletion Verification...");
	const uniqueId = Date.now().toString();

	let categoryId = "";
	let productId = "";
	let orderId = "";

	try {
		// 1. Setup Data
		const sector = await prisma.stockSector.create({
			data: { name: `Sec_Del_${uniqueId}` },
		});
		const category = await prisma.category.create({
			data: { name: `Cat_Del_${uniqueId}`, type: "PRODUCT" },
		});
		categoryId = category.id;

		const product = await prisma.product.create({
			data: {
				name: `Prod_Del_${uniqueId}`,
				salePrice: 20,
				categoryId: category.id,
				sectorId: sector.id,
			},
		});
		productId = product.id;

		const user = await prisma.user.create({
			data: {
				name: `User_Del_${uniqueId}`,
				email: `u_del_${uniqueId}@t.com`,
				password: "123",
			},
		});

		const order = await orderService.create({
			type: "COUNTER",
			userId: user.id,
			items: [{ productId: product.id, quantity: 1 }],
		});
		orderId = order.id;

		console.log("Setup complete. Trying deletions...");

		// 2. Try to Delete Category (Should FAIL because it has a product)
		try {
			console.log("Attempting to delete Category...");
			await productService.deleteCategory(categoryId);
			console.error("FAIL: Category deleted despite having products!");
		} catch (e: any) {
			console.log(`SUCCESS: Category deletion blocked: ${e.message}`);
		}

		// 3. Try to Delete Product (Should perform Soft Delete)
		try {
			console.log("Attempting to delete Product (Soft Delete)...");
			await productService.deleteProduct(productId);
			const p = await prisma.product.findUnique({
				where: { id: productId },
			});
			if (p?.isActive === false) {
				console.log("SUCCESS: Product soft-deleted (isActive=false).");
			} else {
				console.error("FAIL: Product was not soft-deleted.");
			}
		} catch (e: any) {
			console.error(`FAIL: Product deletion error: ${e.message}`);
		}

		// 4. Try to Delete Order (Does OrderService have delete?)
		// The user says "exclusão de pedidos não funciona".
		try {
			console.log("Attempting to delete Order...");
			// Check if delete method exists or we need to use prisma directly to simulate what user might be trying
			// OrderService currently has 'cancel' but maybe user expects 'delete'?
			// Let's check if there is a delete endpoint.
			// Looking at order.routes.ts... router.delete("/:id", ... orderController.cancel)
			// So DELETE HTTP method maps to CANCEL service method.
			// Let's test `cancel` (which sets status=CANCELLED)
			await orderService.cancel(orderId);
			const o = await prisma.order.findUnique({ where: { id: orderId } });
			if (o?.status === "CANCELLED") {
				console.log("SUCCESS: Order cancelled.");
			} else {
				console.error("FAIL: Order not cancelled.");
			}
		} catch (e: any) {
			console.error(
				`FAIL: Order deletion/cancellation error: ${e.message}`,
			);
		}

		// 5. Try PHYSICAL deletion of Order (Prisma)
		try {
			console.log("Attempting physical deletion of Order (Prisma)...");
			// OrderItem has onDelete: Cascade, so this SHOULD work if no other constraints.
			await prisma.order.delete({ where: { id: orderId } });
			console.log("SUCCESS: Order physically deleted.");
		} catch (e: any) {
			console.log(`INFO: Order physical deletion failed: ${e.message}`);
		}
	} catch (e) {
		console.error("Error:", e);
	} finally {
		await prisma.$disconnect();
	}
}

main();
