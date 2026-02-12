import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	const hashedPassword = await bcrypt.hash("admin123", 10);

	const user = await prisma.user.upsert({
		where: { email: "admin@gestao.com" },
		update: {},
		create: {
			name: "Administrador Gestão",
			email: "admin@gestao.com",
			password: hashedPassword,
			role: "ADMIN",
			isActive: true,
		},
	});

	console.log("Usuário admin@gestao.com pronto:", user.email);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
