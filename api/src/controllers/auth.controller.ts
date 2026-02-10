// Controller de Autenticação
import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { AuthRequest } from "../middlewares/auth.middleware";

export class AuthController {
	async register(req: Request, res: Response) {
		try {
			const { name, email, password, role } = req.body;
			const result = await authService.register({
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
			const result = await authService.login({ email, password });

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
			const user = await authService.getProfile(req.user!.id);
			return res.json(user);
		} catch (error) {
			console.error("Erro ao buscar perfil:", error);
			return res.status(500).json({ error: "Erro interno" });
		}
	}
}

export const authController = new AuthController();
