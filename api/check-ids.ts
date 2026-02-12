import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function check() {
	const users = await p.user.findMany({ select: { id: true, email: true } });
	const clients = await p.client.findMany({
		select: { id: true, name: true },
	});
	const services = await p.salonService.findMany({
		select: { id: true, name: true },
	});

	console.log("--- USERS ---");
	console.log(users);
	console.log("--- CLIENTS ---");
	console.log(clients);
	console.log("--- SERVICES ---");
	console.log(services);
}
check().finally(() => p.$disconnect());
