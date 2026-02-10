// Aplicação Express - Ponto de entrada do backend
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import routes from "./routes/index";
import Logger from "./config/logger";
import { apiLimiter } from "./middlewares/rate-limit.middleware";
import { securityMiddleware } from "./middlewares/security.middleware";

const app = express();

// Confiar no proxy (Render, Heroku, Cloudflare, etc)
// Necessário para o rate-limit pegar o IP real do cliente
app.set("trust proxy", 1);

// Segurança
app.use(securityMiddleware); // Helmet

// Middlewares globais
app.use(
	cors({
		origin: process.env.CORS_ORIGIN || "*",
		credentials: true,
	}),
);
app.use(apiLimiter); // Rate Limit
app.use(express.json({ limit: "10mb" })); // Aumentado para suportar upload de imagens
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir arquivos estáticos (uploads)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Log de requisições (desenvolvimento)
if (process.env.NODE_ENV === "development") {
	app.use((req, res, next) => {
		Logger.http(`${req.method} ${req.path}`);
		next();
	});
}

// Rotas da API
app.use("/api", routes);

// Rota raiz
app.get("/", (req, res) => {
	res.json({
		name: "Gestão ERP API",
		version: "1.0.0",
		documentation: "/api/health",
	});
});

// Error handler global
app.use(
	(
		err: Error,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		Logger.error(`Erro não tratado: ${err.message}`);
		res.status(500).json({ error: "Erro interno do servidor" });
	},
);

// Inicialização do servidor
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
	Logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
	Logger.info(`📚 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
