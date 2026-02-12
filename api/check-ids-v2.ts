import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function check() {
	const admin = await p.user.findFirst({
		where: { email: "admin@email.com" },
	});
	const client = await p.client.findFirst();
	const service = await p.salonService.findFirst();

	console.log("--- IDs NO BANCO ---");
	console.log("Admin:", admin?.id);
	console.log("Client:", client?.id);
	console.log("Service:", service?.id);
}
check().finally(() => p.$disconnect());
