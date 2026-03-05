import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFarm } from "../../hooks/useFarm";
import styles from "./Farm.module.css";

export function FarmDashboard() {
	const navigate = useNavigate();
	const { useProducts } = useFarm();
	const { data: products } = useProducts();

	const modules = [
		{ name: "Pecuária", path: "pecuaria", icon: "🐄" },
		{ name: "Agricultura", path: "agricultura", icon: "🚜" },
		{ name: "Piscicultura", path: "piscicultura", icon: "🐟" },
		{ name: "Granja", path: "granja", icon: "🐔" },
		{ name: "Horticultura", path: "horticultura", icon: "🥬" },
	];

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h1>Gestão da Fazenda</h1>
				<p>Selecione um módulo para gerenciamento isolado</p>
			</header>

			<section className={styles.grid}>
				{modules.map((m) => (
					<div
						key={m.path}
						className={styles.card}
						onClick={() => navigate(`/fazenda/${m.path}`)}
						style={{ cursor: "pointer" }}
					>
						<div className={styles.icon}>{m.icon}</div>
						<h3>{m.name}</h3>
						<button className={styles.accessBtn}>Acessar</button>
					</div>
				))}
			</section>

			<section className={styles.grid} style={{ marginTop: "2rem" }}>
				<div
					className={styles.card}
					onClick={() => navigate("/fazenda/produtos")}
					style={{ cursor: "pointer" }}
				>
					<h3>📦 Produtos & Vendas</h3>
					<p className={styles.bigNumber}>{products?.length ?? 0}</p>
				</div>
			</section>
		</div>
	);
}

export function FarmProducts() {
	const { useProducts, useCreateProduct, useSellProduct } = useFarm();
	const { data: products } = useProducts();
	const createMutation = useCreateProduct();
	const sellMutation = useSellProduct();

	const [newName, setNewName] = useState("");
	const [price, setPrice] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await createMutation.mutateAsync({
				name: newName,
				salePrice: Number(price || 0),
				farmId: "default-farm",
			});
			setNewName("");
			setPrice("");
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h1>Produtos da Fazenda</h1>
				<p>Gerencie estoque e vendas de produtos rurais</p>
			</header>

			<form className={styles.form} onSubmit={handleSubmit}>
				<input
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					placeholder="Nome do produto"
					required
				/>
				<input
					value={price}
					onChange={(e) => setPrice(e.target.value)}
					placeholder="Preço"
					type="number"
					step="0.01"
					required
				/>
				<button type="submit" disabled={createMutation.isPending}>
					{createMutation.isPending ? "Criando..." : "Criar Produto"}
				</button>
			</form>

			<div className={styles.list}>
				{products?.map((p: any) => (
					<div key={p.id} className={styles.listItem}>
						<div>
							<strong>{p.name}</strong>
							<div className={styles.meta}>
								<span>R$ {p.salePrice.toFixed(2)}</span>
								<span>Estoque: {p.quantityInStock}</span>
							</div>
						</div>
						<div className={styles.actions}>
							<button
								onClick={() =>
									sellMutation.mutate({
										id: p.id,
										quantity: 1,
										unitPrice: p.salePrice,
									})
								}
								disabled={sellMutation.isPending}
							>
								Vender 1
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
