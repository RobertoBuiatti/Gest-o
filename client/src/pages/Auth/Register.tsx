import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Login.module.css"; // Reutilizando os estilos de login para consistência

export function Register() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { register } = useAuth();

	const navigate = useNavigate();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("As senhas não coincidem");
			return;
		}

		setLoading(true);

		const result = await register(name, email, password);

		if (!result.success) {
			setError(result.error || "Erro ao realizar cadastro");
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
						Crie sua conta agora
					</div>
				</div>

				<form className={styles.form} onSubmit={handleSubmit}>
					{error && <div className={styles.error}>{error}</div>}

					<div className={styles.field}>
						<label className={styles.label}>Nome Completo</label>
						<input
							type="text"
							className={styles.input}
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Seu Nome"
							required
						/>
					</div>

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

					<div className={styles.field}>
						<label className={styles.label}>Confirmar Senha</label>
						<input
							type="password"
							className={styles.input}
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="••••••••"
							required
						/>
					</div>

					<button
						type="submit"
						className={styles.button}
						disabled={loading}
					>
						{loading ? "Cadastrando..." : "Cadastrar"}
					</button>
				</form>

				<div
					className={styles.footer}
					style={{ marginTop: "20px", textAlign: "center" }}
				>
					<span style={{ color: "#64748b" }}>Já tem uma conta? </span>
					<Link
						to="/login"
						style={{
							color: "#2563eb",
							fontWeight: "600",
							textDecoration: "none",
						}}
					>
						Faça Login
					</Link>
				</div>
			</div>
		</div>
	);
}
