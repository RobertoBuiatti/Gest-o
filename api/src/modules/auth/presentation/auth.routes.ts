import { Router } from "express";
import { authController } from "./auth.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

router.post("/register", (req, res) => authController.register(req, res));
router.post("/login", (req, res) => authController.login(req, res));
router.get("/profile", authMiddleware, (req: any, res) =>
	authController.profile(req, res),
);

export default router;
