import { useState } from "react";
import { useFarm } from "../../../hooks/useFarm";
import styles from "./Pecuaria.module.css";

const FARM_ID = "default-farm"; // Idealmente viria de um contexto ou rota

export function Pecuaria() {
	const { useLivestock, useCreateAnimal } = useFarm();
	const { data: animals, isLoading } = useLivestock(FARM_ID);
	const createAnimalMutation = useCreateAnimal();

	const [formData, setFormData] = useState({
		name: "",
		type: "BOVINO",
		tag: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await createAnimalMutation.mutateAsync({
				...formData,
				farmId: FARM_ID,
				status: "ACTIVE",
			});
			setFormData({ name: "", type: "BOVINO", tag: "" });
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h2>🐄 Pecuária</h2>
				<p>Gestão de Animais e Rebanho</p>
			</header>

			<section className={styles.card}>
				<h3>Novo Animal</h3>
				<form onSubmit={handleSubmit} className={styles.form}>
					<input
						type="text"
						placeholder="Nome/Apelido"
						value={formData.name}
						onChange={(e) =>
							setFormData({ ...formData, name: e.target.value })
						}
						required
					/>
					<input
						type="text"
						placeholder="Tag/Brinco"
						value={formData.tag}
						onChange={(e) =>
							setFormData({ ...formData, tag: e.target.value })
						}
					/>
					<select
						value={formData.type}
						onChange={(e) =>
							setFormData({ ...formData, type: e.target.value })
						}
					>
						<option value="BOVINO">Bovino</option>
						<option value="OVINO">Ovino</option>
						<option value="SUINO">Suíno</option>
						<option value="EQUINO">Equino</option>
					</select>
					<button
						type="submit"
						disabled={createAnimalMutation.isPending}
					>
						{createAnimalMutation.isPending
							? "Salvando..."
							: "Adicionar"}
					</button>
				</form>
			</section>

			<section className={styles.list}>
				<h3>Animais no Rebanho</h3>
				{isLoading ? (
					<p>Carregando...</p>
				) : (
					<div className={styles.grid}>
						{animals?.map((animal: any) => (
							<div key={animal.id} className={styles.listItem}>
								<div>
									<strong>{animal.name || "Sem nome"}</strong>
									<div className={styles.meta}>
										<span>Tag: {animal.tag || "N/A"}</span>
										<span>Tipo: {animal.type}</span>
									</div>
								</div>
								<span className={styles.statusBadge}>
									{animal.status}
								</span>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
