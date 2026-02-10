// Middleware de Autenticação JWT
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";

export interface AuthRequest extends Request {
	user?: {
		id: string;
		email: string;
		role: string;
	};
}

interface JwtPayload {
	userId: string;
	email: string;
	role: string;
}

export function authMiddleware(
	req: AuthRequest,
	res: Response,
	next: NextFunction,
) {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		return res.status(401).json({ error: "Token não fornecido" });
	}

	const [, token] = authHeader.split(" ");

	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET || "default-secret",
		) as JwtPayload;

		req.user = {
			id: decoded.userId,
			email: decoded.email,
			role: decoded.role,
		};

		return next();
	} catch (error) {
		return res.status(401).json({ error: "Token inválido" });
	}
}

// Middleware para verificar roles específicas
export function requireRole(...allowedRoles: string[]) {
	return (req: AuthRequest, res: Response, next: NextFunction) => {
		if (!req.user) {
			return res.status(401).json({ error: "Não autenticado" });
		}

		if (!allowedRoles.includes(req.user.role)) {
			return res.status(403).json({ error: "Acesso negado" });
		}

		return next();
	};
}

// Função para gerar token JWT
export function generateToken(user: {
	id: string;
	email: string;
	role: string;
}): string {
	return jwt.sign(
		{ userId: user.id, email: user.email, role: user.role },
		process.env.JWT_SECRET || "default-secret",
		{ expiresIn: "7d" },
	);
}
