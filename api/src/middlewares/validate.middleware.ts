// Middleware de Validação com Zod
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validate(schema: ZodSchema) {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			schema.parse({
				body: req.body,
				query: req.query,
				params: req.params,
			});
			return next();
		} catch (error) {
			if (error instanceof ZodError) {
				return res.status(400).json({
					error: "Dados inválidos",
					details: error.errors.map((e) => ({
						field: e.path.join("."),
						message: e.message,
					})),
				});
			}
			return next(error);
		}
	};
}
