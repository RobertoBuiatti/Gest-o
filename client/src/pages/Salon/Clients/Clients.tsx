import { useState } from "react";
import { useSalon } from "../../../hooks/useSalon";
import styles from "./Clients.module.css";

export function Clients() {
	const { useClients, useCreateClient } = useSalon();
	const { data: clients, isLoading, error } = useClients();
	const createClientMutation = useCreateClient();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		phone: "",
		email: "",
		notes: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await createClientMutation.mutateAsync(formData);
			setIsModalOpen(false);
			setFormData({ name: "", phone: "", email: "", notes: "" });
		} catch (err) {
			console.error(err);
		}
	};

	if (isLoading)
		return <div className={styles.loading}>Carregando clientes...</div>;
	if (error)
		return <div className={styles.error}>Erro ao carregar clientes</div>;

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h2>👥 Gestão de Clientes</h2>
				<button
					className={styles.btnPrimary}
					onClick={() => setIsModalOpen(true)}
				>
					+ Novo Cliente
				</button>
			</header>

			<div className={styles.grid}>
				{clients?.map((client: any) => (
					<div key={client.id} className={styles.card}>
						<div className={styles.avatar}>
							{client.name.substring(0, 1).toUpperCase()}
						</div>
						<div className={styles.info}>
							<p className={styles.name}>{client.name}</p>
							<p className={styles.phone}>
								{client.phone || "Sem telefone"}
							</p>
						</div>
						<button className={styles.btnEdit}>Editar</button>
					</div>
				))}
				{clients?.length === 0 && (
					<p className={styles.empty}>Nenhum cliente cadastrado.</p>
				)}
			</div>

			{isModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modal}>
						<h3>Novo Cliente</h3>
						<form onSubmit={handleSubmit} className={styles.form}>
							<div className={styles.inputGroup}>
								<label>Nome *</label>
								<input
									type="text"
									required
									value={formData.name}
									onChange={(e) =>
										setFormData({
											...formData,
											name: e.target.value,
										})
									}
								/>
							</div>
							<div className={styles.inputGroup}>
								<label>Telefone</label>
								<input
									type="text"
									value={formData.phone}
									onChange={(e) =>
										setFormData({
											...formData,
											phone: e.target.value,
										})
									}
								/>
							</div>
							<div className={styles.inputGroup}>
								<label>E-mail</label>
								<input
									type="email"
									value={formData.email}
									onChange={(e) =>
										setFormData({
											...formData,
											email: e.target.value,
										})
									}
								/>
							</div>
							<div className={styles.actions}>
								<button
									type="button"
									className={styles.btnCancel}
									onClick={() => setIsModalOpen(false)}
								>
									Cancelar
								</button>
								<button
									type="submit"
									className={styles.btnSubmit}
									disabled={createClientMutation.isPending}
								>
									{createClientMutation.isPending
										? "Salvando..."
										: "Salvar"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
