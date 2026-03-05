import { useState } from "react";
import { useFarm } from "../../../hooks/useFarm";
import styles from "./Piscicultura.module.css";

const FARM_ID = "default-farm";

export function Piscicultura() {
	const { useFishTanks, useCreateFishTank } = useFarm();
	const { data: tanks, isLoading } = useFishTanks(FARM_ID);
	const createTankMutation = useCreateFishTank();

	const [formData, setFormData] = useState({
		name: "",
		capacity: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await createTankMutation.mutateAsync({
				...formData,
				farmId: FARM_ID,
				status: "ACTIVE",
			});
			setFormData({ name: "", capacity: "" });
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h2>🐟 Piscicultura</h2>
				<p>Gestão de Tanques e Produção de Peixes</p>
			</header>

			<section className={styles.card}>
				<h3>Novo Tanque</h3>
				<form onSubmit={handleSubmit} className={styles.form}>
					<input
						type="text"
						placeholder="Identificação do Tanque"
						value={formData.name}
						onChange={(e) =>
							setFormData({ ...formData, name: e.target.value })
						}
						required
					/>
					<input
						type="text"
						placeholder="Capacidade (Liters/Volume)"
						value={formData.capacity}
						onChange={(e) =>
							setFormData({
								...formData,
								capacity: e.target.value,
							})
						}
					/>
					<button
						type="submit"
						disabled={createTankMutation.isPending}
					>
						{createTankMutation.isPending
							? "Salvando..."
							: "Adicionar"}
					</button>
				</form>
			</section>

			<section className={styles.list}>
				<h3>Tanques em Operação</h3>
				{isLoading ? (
					<p>Carregando...</p>
				) : (
					<div className={styles.grid}>
						{tanks?.map((tank: any) => (
							<div key={tank.id} className={styles.listItem}>
								<div>
									<strong>{tank.name}</strong>
									<div className={styles.meta}>
										<span>
											Capacidade: {tank.capacity || "N/A"}
										</span>
									</div>
								</div>
								<span className={styles.statusBadge}>
									{tank.status}
								</span>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
