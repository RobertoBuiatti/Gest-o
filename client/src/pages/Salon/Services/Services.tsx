import { useState } from "react";
import { useSalon } from "../../../hooks/useSalon";
import { useQuery } from "@tanstack/react-query";
import api from "../../../services/api";
import styles from "./Services.module.css";

interface Category {
	id: string;
	name: string;
	type: string;
}

interface Ingredient {
	id: string;
	name: string;
	unit: string;
}

interface ServiceRequirement {
	ingredientId: string;
	quantity: number;
	unit?: string;
	ingredient: Ingredient;
}

export function Services() {
	const { useServices, useCreateService, useUpdateService } = useSalon();
	const { data: services, isLoading, error } = useServices();
	const createServiceMutation = useCreateService();
	const updateServiceMutation = useUpdateService();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingServiceId, setEditingServiceId] = useState<string | null>(
		null,
	);
	const [formData, setFormData] = useState({
		name: "",
		price: 0,
		duration: 30,
		description: "",
		categoryId: "",
	});

	const [requirements, setRequirements] = useState<
		Array<{
			ingredientId: string;
			quantity: number;
			unit?: string;
		}>
	>([]);

	// Queries para Categorias e Insumos
	const { data: categories } = useQuery<Category[]>({
		queryKey: ["product-categories"],
		queryFn: async () => {
			const response = await api.get("/categories");
			return response.data;
		},
	});

	const { data: ingredients } = useQuery<Ingredient[]>({
		queryKey: ["ingredients"],
		queryFn: async () => {
			const response = await api.get("/stock/ingredients");
			return response.data;
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const validRequirements = requirements.filter(
				(req) => req.ingredientId && req.quantity > 0,
			);

			const payload = {
				...formData,
				price: Number(formData.price),
				duration: Number(formData.duration),
				requirements:
					validRequirements.length > 0
						? validRequirements
						: undefined,
			};

			if (editingServiceId) {
				await updateServiceMutation.mutateAsync({
					id: editingServiceId,
					...payload,
				});
			} else {
				await createServiceMutation.mutateAsync(payload);
			}

			setIsModalOpen(false);
			resetForm();
		} catch (err) {
			console.error(err);
		}
	};

	const handleEdit = (service: any) => {
		setEditingServiceId(service.id);
		setFormData({
			name: service.name,
			price: service.price,
			duration: service.duration,
			description: service.description || "",
			categoryId: service.categoryId || "",
		});
		setRequirements(
			service.requirements?.map((req: any) => ({
				ingredientId: req.ingredientId,
				quantity: req.quantity,
				unit: req.unit,
			})) || [],
		);
		setIsModalOpen(true);
	};

	const resetForm = () => {
		setFormData({
			name: "",
			price: 0,
			duration: 30,
			description: "",
			categoryId: "",
		});
		setRequirements([]);
		setEditingServiceId(null);
	};

	const addRequirement = () => {
		setRequirements([...requirements, { ingredientId: "", quantity: 0 }]);
	};

	const updateRequirement = (index: number, field: string, value: any) => {
		const newReqs = [...requirements];
		newReqs[index] = { ...newReqs[index], [field]: value };

		if (field === "ingredientId") {
			const ing = ingredients?.find((i) => i.id === value);
			if (ing) {
				newReqs[index].unit = ing.unit;
			}
		}

		setRequirements(newReqs);
	};

	const removeRequirement = (index: number) => {
		setRequirements(requirements.filter((_, i) => i !== index));
	};

	if (isLoading)
		return <div className={styles.loading}>Carregando serviços...</div>;
	if (error)
		return <div className={styles.error}>Erro ao carregar serviços</div>;

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<h2>✂️ Catálogo de Serviços</h2>
				<button
					className={styles.btnPrimary}
					onClick={() => {
						resetForm();
						setIsModalOpen(true);
					}}
				>
					+ Novo Serviço
				</button>
			</header>

			<div className={styles.grid}>
				{services?.map((service: any) => (
					<div key={service.id} className={styles.card}>
						<div className={styles.cardTop}>
							<div>
								{service.category && (
									<span className={styles.categoryBadge}>
										{service.category.name}
									</span>
								)}
								<p className={styles.name}>{service.name}</p>
								<p className={styles.details}>
									R$ {service.price.toFixed(2)} | 🕒{" "}
									{service.duration} min
								</p>
							</div>
						</div>

						{service.requirements?.length > 0 && (
							<div className={styles.requirementsList}>
								<p className={styles.requirementsTitle}>
									Insumos Necessários:
								</p>
								{service.requirements.map(
									(req: ServiceRequirement) => (
										<div
											key={req.ingredientId}
											className={styles.requirementItem}
										>
											<span>{req.ingredient.name}</span>
											<span>
												{req.quantity} {req.unit}
											</span>
										</div>
									),
								)}
							</div>
						)}

						<button
							className={styles.btnEdit}
							onClick={() => handleEdit(service)}
						>
							Configurar
						</button>
					</div>
				))}
				{services?.length === 0 && (
					<p className={styles.empty}>Nenhum serviço cadastrado.</p>
				)}
			</div>

			{isModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modal}>
						<h3>
							{editingServiceId
								? "Editar Serviço"
								: "Novo Serviço"}
						</h3>
						<form onSubmit={handleSubmit} className={styles.form}>
							<div className={styles.inputGroup}>
								<label>Nome do Serviço *</label>
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
								<label>Categoria</label>
								<select
									value={formData.categoryId}
									onChange={(e) =>
										setFormData({
											...formData,
											categoryId: e.target.value,
										})
									}
								>
									<option value="">
										Selecione uma categoria...
									</option>
									{categories?.map((cat) => (
										<option key={cat.id} value={cat.id}>
											{cat.name}
										</option>
									))}
								</select>
							</div>

							<div className={styles.row}>
								<div className={styles.inputGroup}>
									<label>Preço (R$) *</label>
									<input
										type="number"
										step="0.01"
										required
										value={formData.price}
										onChange={(e) =>
											setFormData({
												...formData,
												price: Number(e.target.value),
											})
										}
									/>
								</div>
								<div className={styles.inputGroup}>
									<label>Duração (min) *</label>
									<input
										type="number"
										required
										value={formData.duration}
										onChange={(e) =>
											setFormData({
												...formData,
												duration: Number(
													e.target.value,
												),
											})
										}
									/>
								</div>
							</div>

							<div className={styles.requirementsSection}>
								<p className={styles.requirementsTitle}>
									Insumos p/ o Procedimento
								</p>
								{requirements.map((req, index) => (
									<div
										key={index}
										className={styles.requirementField}
									>
										<select
											value={req.ingredientId}
											onChange={(e) =>
												updateRequirement(
													index,
													"ingredientId",
													e.target.value,
												)
											}
											style={{ flex: 2 }}
										>
											<option value="">
												Selecione insumo...
											</option>
											{ingredients?.map((ing) => (
												<option
													key={ing.id}
													value={ing.id}
												>
													{ing.name} ({ing.unit})
												</option>
											))}
										</select>
										<input
											type="number"
											placeholder="Qtd"
											value={req.quantity}
											onChange={(e) =>
												updateRequirement(
													index,
													"quantity",
													Number(e.target.value),
												)
											}
											style={{ flex: 1 }}
										/>
										<button
											type="button"
											onClick={() =>
												removeRequirement(index)
											}
										>
											🗑️
										</button>
									</div>
								))}
								<button
									type="button"
									className={styles.btnAddRequirement}
									onClick={addRequirement}
								>
									+ Adicionar Insumo
								</button>
							</div>

							<div className={styles.actions}>
								<button
									type="button"
									className={styles.btnCancel}
									onClick={() => {
										setIsModalOpen(false);
										resetForm();
									}}
								>
									Cancelar
								</button>
								<button
									type="submit"
									className={styles.btnSubmit}
									disabled={
										createServiceMutation.isPending ||
										updateServiceMutation.isPending
									}
								>
									{createServiceMutation.isPending ||
									updateServiceMutation.isPending
										? "Salvando..."
										: "Salvar Serviço"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
