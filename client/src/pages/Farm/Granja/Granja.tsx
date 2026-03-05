import { useState } from "react";
import { useFarm } from "../../../hooks/useFarm";
import styles from "./Granja.module.css";

const FARM_ID = "default-farm";

export function Granja() {
	const { usePoultry, useCreatePoultry } = useFarm();
	const { data: poultry, isLoading } = usePoultry(FARM_ID);
	const createPoultryMutation = useCreatePoultry();

	const [formData, setFormData] = useState({
		name: "",
		tag: "", // Lote
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await createPoultryMutation.mutateAsync({
				...formData,
				farmId: FARM_ID,
				submodule: "GRANJA",
				status: "ACTIVE",
			});
			setFormData({ name: "", tag: "" });
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h2>🐔 Granja</h2>
				<p>Gestão de Aves e Lotes</p>
			</header>

			<section className={styles.card}>
				<h3>Novo Lote/Aves</h3>
				<form onSubmit={handleSubmit} className={styles.form}>
					<input
						type="text"
						placeholder="Identificação do Lote"
						value={formData.tag}
						onChange={(e) =>
							setFormData({ ...formData, tag: e.target.value })
						}
						required
					/>
					<input
						type="text"
						placeholder="Descrição (ex: Frangos Corte)"
						value={formData.name}
						onChange={(e) =>
							setFormData({ ...formData, name: e.target.value })
						}
					/>
					<button
						type="submit"
						disabled={createPoultryMutation.isPending}
					>
						{createPoultryMutation.isPending
							? "Salvando..."
							: "Registrar"}
					</button>
				</form>
			</section>

			<section className={styles.list}>
				<h3>Lotes Ativos</h3>
				{isLoading ? (
					<p>Carregando...</p>
				) : (
					<div className={styles.grid}>
						{poultry?.map((item: any) => (
							<div key={item.id} className={styles.listItem}>
								<div>
									<strong>Lote: {item.tag}</strong>
									<div className={styles.meta}>
										<span>
											{item.name || "Sem descrição"}
										</span>
									</div>
								</div>
								<span className={styles.statusBadge}>
									{item.status}
								</span>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
