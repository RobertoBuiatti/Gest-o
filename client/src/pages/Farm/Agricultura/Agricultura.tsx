import { useState } from "react";
import { useFarm } from "../../../hooks/useFarm";
import styles from "./Agricultura.module.css";

const FARM_ID = "default-farm";

export function Agricultura() {
	const { useAgriculture, useCreateAgricultureCrop } = useFarm();
	const { data: crops, isLoading } = useAgriculture(FARM_ID);
	const createCropMutation = useCreateAgricultureCrop();

	const [formData, setFormData] = useState({
		name: "",
		area: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await createCropMutation.mutateAsync({
				...formData,
				farmId: FARM_ID,
				submodule: "AGRICULTURA",
				status: "PLANTED",
			});
			setFormData({ name: "", area: "" });
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h2>🚜 Agricultura</h2>
				<p>Gestão de Lavouras e Áreas de Plantio</p>
			</header>

			<section className={styles.card}>
				<h3>Novo Plantio</h3>
				<form onSubmit={handleSubmit} className={styles.form}>
					<input
						type="text"
						placeholder="Cultura (ex: Milho)"
						value={formData.name}
						onChange={(e) =>
							setFormData({ ...formData, name: e.target.value })
						}
						required
					/>
					<input
						type="text"
						placeholder="Área (Hectares)"
						value={formData.area}
						onChange={(e) =>
							setFormData({ ...formData, area: e.target.value })
						}
					/>
					<button
						type="submit"
						disabled={createCropMutation.isPending}
					>
						{createCropMutation.isPending
							? "Salvando..."
							: "Registrar"}
					</button>
				</form>
			</section>

			<section className={styles.list}>
				<h3>Cultivos Ativos</h3>
				{isLoading ? (
					<p>Carregando...</p>
				) : (
					<div className={styles.grid}>
						{crops?.map((crop: any) => (
							<div key={crop.id} className={styles.listItem}>
								<div>
									<strong>{crop.name}</strong>
									<div className={styles.meta}>
										<span>Área: {crop.area || "N/A"}</span>
									</div>
								</div>
								<span className={styles.statusBadge}>
									{crop.status}
								</span>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}
