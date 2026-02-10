import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Login.module.css";

export function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();

	const navigate = useNavigate();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		const result = await login(email, password);

		if (!result.success) {
			setError(result.error || "Erro ao fazer login");
			setLoading(false);
		} else {
			navigate("/");
		}
	};

	return (
		<div className={styles.container}>
			<div className={styles.card}>
				<div className={styles.logo}>
					<div className={styles.logoText}>Gestão ERP</div>
					<div className={styles.logoSubtext}>
						Sistema de Restaurante
					</div>
				</div>

				<form className={styles.form} onSubmit={handleSubmit}>
					{error && <div className={styles.error}>{error}</div>}

					<div className={styles.field}>
						<label className={styles.label}>E-mail</label>
						<input
							type="email"
							className={styles.input}
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="seu@email.com"
							required
						/>
					</div>

					<div className={styles.field}>
						<label className={styles.label}>Senha</label>
						<input
							type="password"
							className={styles.input}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							required
						/>
					</div>

					<button
						type="submit"
						className={styles.button}
						disabled={loading}
					>
						{loading ? "Entrando..." : "Entrar"}
					</button>
				</form>

				<div className={styles.demo}>
					<div className={styles.demoText}>
						Credenciais de demonstração:
					</div>
					<div className={styles.demoCredentials}>
						admin@gestao.com / admin123
					</div>
				</div>
			</div>
		</div>
	);
}
