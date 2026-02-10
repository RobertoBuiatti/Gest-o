import rateLimit from "express-rate-limit";
import Logger from "../config/logger";

export const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: process.env.NODE_ENV === "production" ? 500 : 2000, // 500 em prod / 2000 em dev
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		// Pular rate limit para localhost em desenvolvimento
		return (
			process.env.NODE_ENV !== "production" &&
			(req.ip === "::1" || req.ip === "127.0.0.1")
		);
	},
	handler: (req, res, next, options) => {
		Logger.warn(`Rate limit excedido para IP: ${req.ip}`);
		res.status(options.statusCode).json({
			error: "Muitas requisições, tente novamente mais tarde.",
		});
	},
});
