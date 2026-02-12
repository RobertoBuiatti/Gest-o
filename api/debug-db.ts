import { prisma } from "./src/config/database";

async function check() {
	console.log("Checking DB records...");

	const users = await prisma.user.findMany();
	console.log("\n--- USERS ---");
	users.forEach((u) =>
		console.log(`ID: ${u.id}, Name: ${u.name}, Active: ${u.isActive}`),
	);

	const clients = await prisma.client.findMany();
	console.log("\n--- CLIENTS (salao) ---");
	clients
		.filter((c) => c.system === "salao")
		.forEach((c) => console.log(`ID: ${c.id}, Name: ${c.name}`));

	const services = await prisma.salonService.findMany();
	console.log("\n--- SERVICES (salao) ---");
	services
		.filter((s) => s.system === "salao")
		.forEach((s) =>
			console.log(`ID: ${s.id}, Name: ${s.name}, Active: ${s.isActive}`),
		);

	console.log("\n--- COUNTS ---");
	console.log("Total Users:", users.length);
	console.log(
		"Total Clients (salao):",
		clients.filter((c) => c.system === "salao").length,
	);
	console.log(
		"Total Services (salao):",
		services.filter((s) => s.system === "salao").length,
	);
}

check()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
