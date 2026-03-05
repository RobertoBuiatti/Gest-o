import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class SecurityService {
	private readonly secret = process.env.JWT_SECRET || "default_secret";

	async hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, 10);
	}

	async comparePassword(password: string, hash: string): Promise<boolean> {
		return bcrypt.compare(password, hash);
	}

	generateToken(payload: any): string {
		return jwt.sign(payload, this.secret, { expiresIn: "1d" });
	}
}
