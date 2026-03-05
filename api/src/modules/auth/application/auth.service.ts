import { IUserRepository } from "../domain/user.repository";
import { SecurityService } from "../infra/security.service";
import Logger from "../../../config/logger";

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
	constructor(
		private userRepository: IUserRepository,
		private securityService: SecurityService,
	) {}

	async register(input: RegisterInput): Promise<AuthResult> {
		const existingUser = await this.userRepository.findByEmail(input.email);

		if (existingUser) {
			return { success: false, error: "E-mail já cadastrado" };
		}

		const hashedPassword = await this.securityService.hashPassword(
			input.password,
		);

		const user = await this.userRepository.create({
			name: input.name,
			email: input.email,
			password: hashedPassword,
			role: input.role || "WAITER",
		});

		const token = this.securityService.generateToken({
			userId: user.id,
			email: user.email,
			role: user.role,
		});

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
		const user = await this.userRepository.findByEmail(input.email);

		if (!user) {
			Logger.warn(
				`Tentativa de login falhou: Usuário não encontrado - ${input.email}`,
			);
			return { success: false, error: "Credenciais inválidas" };
		}

		if (!user.isActive) {
			Logger.warn(
				`Tentativa de login falhou: Usuário desativado - ${input.email}`,
			);
			return { success: false, error: "Usuário desativado" };
		}

		const validPassword = await this.securityService.comparePassword(
			input.password,
			user.password,
		);

		if (!validPassword) {
			Logger.warn(
				`Tentativa de login falhou: Senha incorreta - ${input.email}`,
			);
			return { success: false, error: "Credenciais inválidas" };
		}

		Logger.info(`Login realizado com sucesso: ${input.email}`);

		const token = this.securityService.generateToken({
			userId: user.id,
			email: user.email,
			role: user.role,
		});

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
		const user = await this.userRepository.findById(userId);
		if (!user) return null;

		return {
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			createdAt: user.createdAt,
		};
	}
}
