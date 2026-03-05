import { Request, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AuthService } from "../application/auth.service";
import { PrismaUserRepository } from "../infra/prisma-user.repository";
import { SecurityService } from "../infra/security.service";

export class AuthController {
	private authService: AuthService;

	constructor() {
		// Injeção de dependências manual (poderia ser via container de DI)
		const userRepository = new PrismaUserRepository();
		const securityService = new SecurityService();
		this.authService = new AuthService(userRepository, securityService);
	}

	async register(req: Request, res: Response) {
		try {
			const { name, email, password, role } = req.body;
			const result = await this.authService.register({
				name,
				email,
				password,
				role,
			});

			if (!result.success) {
				return res.status(400).json({ error: result.error });
			}

			return res.status(201).json(result);
		} catch (error) {
			console.error("Erro no registro:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	async login(req: Request, res: Response) {
		try {
			const { email, password } = req.body;
			const result = await this.authService.login({ email, password });

			if (!result.success) {
				return res.status(401).json({ error: result.error });
			}

			return res.json(result);
		} catch (error) {
			console.error("Erro no login:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}

	async profile(req: AuthRequest, res: Response) {
		try {
			const user = await this.authService.getProfile(req.user!.id);
			return res.json(user);
		} catch (error) {
			console.error("Erro ao buscar perfil:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}
}

export const authController = new AuthController();
