import { Request, Response, NextFunction } from "express";
import { contextStorage } from "../config/context";

export function systemMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const system = (req.headers["x-system-context"] as string) || "restaurante";

	contextStorage.run({ system }, () => {
		next();
	});
}
