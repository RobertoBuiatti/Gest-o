// Service de Autenticação
import bcrypt from "bcryptjs";
import { prisma } from "../config/database";
import { generateToken } from "../middlewares/auth.middleware";

interface RegisterInput {
	name: string;
	email: string;
	password: string;
	role?: string;
}

interface LoginInput {
	email: string;
	password: string;
}

interface AuthResult {
	success: boolean;
	token?: string;
	user?: {
		id: string;
		name: string;
		email: string;
		role: string;
	};
	error?: string;
}

export class AuthService {
	async register(input: RegisterInput): Promise<AuthResult> {
		const existingUser = await prisma.user.findUnique({
			where: { email: input.email },
		});

		if (existingUser) {
			return { success: false, error: "E-mail já cadastrado" };
		}

		const hashedPassword = await bcrypt.hash(input.password, 10);

		const user = await prisma.user.create({
			data: {
				name: input.name,
				email: input.email,
				password: hashedPassword,
				role: input.role || "WAITER",
			},
		});

		const token = generateToken(user);

		return {
			success: true,
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		};
	}

	async login(input: LoginInput): Promise<AuthResult> {
		const user = await prisma.user.findUnique({
			where: { email: input.email },
		});

		if (!user) {
			return { success: false, error: "Credenciais inválidas" };
		}

		if (!user.isActive) {
			return { success: false, error: "Usuário desativado" };
		}

		const validPassword = await bcrypt.compare(
			input.password,
			user.password,
		);

		if (!validPassword) {
			return { success: false, error: "Credenciais inválidas" };
		}

		const token = generateToken(user);

		return {
			success: true,
			token,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
		};
	}

	async getProfile(userId: string) {
		return prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				createdAt: true,
			},
		});
	}
}

export const authService = new AuthService();
