// Rotas de Upload de Imagens
import { Router } from "express";
import { Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import path from "path";
import fs from "fs";

const router = Router();

// Diretório de uploads
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Garantir que a pasta existe
if (!fs.existsSync(UPLOADS_DIR)) {
	fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Upload de imagem (base64)
router.post("/image", authMiddleware, async (req: Request, res: Response) => {
	try {
		const { base64, filename } = req.body;

		if (!base64 || !filename) {
			return res
				.status(400)
				.json({ error: "Base64 e filename são obrigatórios" });
		}

		// Remove o prefixo data:image/xxx;base64, se existir
		const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");

		// Gera nome único
		const ext = path.extname(filename) || ".jpg";
		const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
		const filePath = path.join(UPLOADS_DIR, uniqueName);

		// Salva o arquivo
		fs.writeFileSync(filePath, base64Data, "base64");

		// Retorna a URL
		const imageUrl = `/uploads/${uniqueName}`;

		return res.json({ url: imageUrl, filename: uniqueName });
	} catch (error) {
		console.error("Erro ao fazer upload:", error);
		return res
			.status(500)
			.json({ error: "Erro ao fazer upload da imagem" });
	}
});

// Listar imagens
router.get("/images", authMiddleware, async (req: Request, res: Response) => {
	try {
		const files = fs.readdirSync(UPLOADS_DIR);
		const images = files
			.filter((f) => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
			.map((f) => ({
				filename: f,
				url: `/uploads/${f}`,
			}));

		return res.json(images);
	} catch (error) {
		return res.status(500).json({ error: "Erro ao listar imagens" });
	}
});

export default router;
