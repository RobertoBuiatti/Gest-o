import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import styles from "./Stock.module.css";

type TabType = "setores" | "categorias" | "insumos";

interface Category {
	id: string;
	name: string;
	type: "INGREDIENT" | "PRODUCT";
	description?: string;
	_count: { ingredients: number; products: number };
}

interface StockBalance {
	quantity: number;
	ingredient: {
		id: string;
		name: string;
		unit: string;
		minStock: number;
		category: { name: string };
	};
}

interface Sector {
	id: string;
	name: string;
	description?: string;
	stockBalance: StockBalance[];
}

interface Ingredient {
	id: string;
	name: string;
	unit: string;
	costPrice: number;
	minStock: number;
	category: { id: string; name: string };
	stockBalance: Array<{ quantity: number; sector: { name: string } }>;
}

const sectorIcons: Record<string, string> = {
	Almoxarifado: "📦",
	Cozinha: "👨‍🍳",
	Bar: "🍸",
};

export function Stock() {
	const [activeTab, setActiveTab] = useState<TabType>("setores");
	const [showCategoryModal, setShowCategoryModal] = useState(false);
	const [showIngredientModal, setShowIngredientModal] = useState(false);

	// Sector Management State
	const [showSectorModal, setShowSectorModal] = useState(false);
	const [editingSector, setEditingSector] = useState<Sector | null>(null);
	// Ingredient Edit State
	const [editingIngredient, setEditingIngredient] =
		useState<Ingredient | null>(null);

	const queryClient = useQueryClient();

	// Queries
	const { data: sectors, isLoading: loadingSectors } = useQuery<Sector[]>({
		queryKey: ["stock-sectors"],
		queryFn: async () => {
			const response = await api.get("/stock/sectors");
			return response.data;
		},
	});

	// ... (Category & Ingredient Queries remain same)

	const { data: categories, isLoading: loadingCategories } = useQuery<
		Category[]
	>({
		queryKey: ["categories"],
		queryFn: async () => {
			const response = await api.get("/categories");
			return response.data;
		},
	});

	const { data: ingredients, isLoading: loadingIngredients } = useQuery<
		Ingredient[]
	>({
		queryKey: ["ingredients"],
		queryFn: async () => {
			const response = await api.get("/stock/ingredients");
			return response.data;
		},
	});

	// Mutations
	const createCategoryMutation = useMutation({
		mutationFn: async (data: {
			name: string;
			type: string;
			description?: string;
		}) => {
			const response = await api.post("/categories", data);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			setShowCategoryModal(false);
		},
	});

	const createIngredientMutation = useMutation({
		mutationFn: async (data: {
			name: string;
			unit: string;
			costPrice: number;
			minStock: number;
			categoryId: string;
			initialStock?: number;
			initialSectorId?: string;
		}) => {
			const response = await api.post("/ingredients", data);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["ingredients"] });
			queryClient.invalidateQueries({ queryKey: ["stock-sectors"] });
			setShowIngredientModal(false);
		},
	});

	const updateIngredientMutation = useMutation({
		mutationFn: async (data: {
			id: string;
			name: string;
			unit: string;
			costPrice: number;
			minStock: number;
			categoryId: string;
		}) => {
			const response = await api.put(
				`/stock/ingredients/${data.id}`,
				data,
			);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["ingredients"] });
			queryClient.invalidateQueries({ queryKey: ["stock-sectors"] });
			setShowIngredientModal(false);
			setEditingIngredient(null);
		},
	});

	// Sector Mutations
	const createSectorMutation = useMutation({
		mutationFn: async (data: { name: string; description?: string }) => {
			await api.post("/stock/sectors", data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stock-sectors"] });
			setShowSectorModal(false);
		},
	});

	const updateSectorMutation = useMutation({
		mutationFn: async (data: {
			id: string;
			name: string;
			description?: string;
		}) => {
			await api.put(`/stock/sectors/${data.id}`, {
				name: data.name,
				description: data.description,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stock-sectors"] });
			setShowSectorModal(false);
			setEditingSector(null);
		},
	});

	const deleteSectorMutation = useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/stock/sectors/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stock-sectors"] });
		},
		onError: (error: any) => {
			alert(error.response?.data?.error || "Erro ao excluir setor");
		},
	});

	const deleteCategoryMutation = useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/categories/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});

	const getQuantityClass = (qty: number, minStock: number) => {
		if (qty < minStock) return styles.quantityLow;
		if (qty < minStock * 1.5) return styles.quantityWarning;
		return styles.quantityNormal;
	};

	const ingredientCategories = categories || [];

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.tabs}>
					<button
						className={`${styles.tab} ${activeTab === "setores" ? styles.tabActive : ""}`}
						onClick={() => setActiveTab("setores")}
					>
						📦 Por Setor
					</button>
					<button
						className={`${styles.tab} ${activeTab === "categorias" ? styles.tabActive : ""}`}
						onClick={() => setActiveTab("categorias")}
					>
						🏷️ Categorias
					</button>
					<button
						className={`${styles.tab} ${activeTab === "insumos" ? styles.tabActive : ""}`}
						onClick={() => setActiveTab("insumos")}
					>
						🥗 Insumos
					</button>
				</div>

				<div className={styles.actions}>
					{activeTab === "categorias" && (
						<button
							className={styles.addButton}
							onClick={() => setShowCategoryModal(true)}
						>
							+ Nova Categoria
						</button>
					)}
					{activeTab === "insumos" && (
						<button
							className={styles.addButton}
							onClick={() => setShowIngredientModal(true)}
						>
							+ Novo Insumo
						</button>
					)}
					{activeTab === "setores" && (
						<button
							className={styles.addButton}
							onClick={() => {
								setEditingSector(null);
								setShowSectorModal(true);
							}}
						>
							+ Novo Setor
						</button>
					)}
				</div>
			</div>

			{/* Tab: Por Setor */}
			{activeTab === "setores" && (
				<>
					{loadingSectors ? (
						<div className={styles.loading}>
							Carregando setores...
						</div>
					) : (
						<div className={styles.sectorsGrid}>
							{sectors?.map((sector) => (
								<div
									key={sector.id}
									className={styles.sectorCard}
								>
									<div className={styles.sectorHeader}>
										<div className={styles.sectorTitle}>
											<span className={styles.sectorIcon}>
												{sectorIcons[sector.name] ||
													"📍"}
											</span>
											<span className={styles.sectorName}>
												{sector.name}
											</span>
										</div>
										<div className={styles.sectorActions}>
											<button
												className={styles.iconButton}
												title="Editar"
												onClick={() => {
													setEditingSector(sector);
													setShowSectorModal(true);
												}}
											>
												✏️
											</button>
											{sector.name !== "Almoxarifado" && (
												<button
													className={`${styles.iconButton} ${styles.deleteButton}`}
													title="Excluir"
													onClick={() => {
														if (
															confirm(
																"Tem certeza que deseja excluir este setor?\n\nOBS: Todos os itens e produtos deste setor serão movidos automaticamente para o Almoxarifado.",
															)
														) {
															deleteSectorMutation.mutate(
																sector.id,
															);
														}
													}}
												>
													🗑️
												</button>
											)}
										</div>
									</div>
									<div className={styles.sectorReview}>
										<small>{sector.description}</small>
										<span className={styles.sectorCount}>
											{sector.stockBalance.length} itens
										</span>
									</div>

									{sector.stockBalance.length > 0 ? (
										<div className={styles.ingredientsList}>
											{sector.stockBalance.map(
												(balance) => {
													const qty = Number(
														balance.quantity,
													);
													const minStock = Number(
														balance.ingredient
															.minStock,
													);
													return (
														<div
															key={
																balance
																	.ingredient
																	.id
															}
															className={
																styles.ingredientItem
															}
														>
															<div
																className={
																	styles.ingredientInfo
																}
															>
																<span
																	className={
																		styles.ingredientName
																	}
																>
																	{
																		balance
																			.ingredient
																			.name
																	}
																</span>
																<span
																	className={
																		styles.ingredientCategory
																	}
																>
																	{
																		balance
																			.ingredient
																			.category
																			.name
																	}
																</span>
															</div>
															<div
																className={
																	styles.ingredientStock
																}
															>
																<div
																	className={`${styles.ingredientQuantity} ${getQuantityClass(qty, minStock)}`}
																>
																	{qty.toFixed(
																		2,
																	)}{" "}
																	{
																		balance
																			.ingredient
																			.unit
																	}
																</div>
																<div
																	className={
																		styles.ingredientMin
																	}
																>
																	Mín:{" "}
																	{minStock}{" "}
																	{
																		balance
																			.ingredient
																			.unit
																	}
																</div>
															</div>
															<button
																className={
																	styles.iconButton
																}
																style={{
																	marginLeft:
																		"10px",
																	fontSize:
																		"1rem",
																}}
																title="Editar Insumo"
																onClick={() => {
																	// We need to map the balance.ingredient to the Ingredient type
																	// Or fetch it. Since we have basic info:
																	const ing: any =
																		{
																			...balance.ingredient,
																			stockBalance:
																				[], // Stub or fetch properly if needed
																		};
																	setEditingIngredient(
																		ing,
																	);
																	setShowIngredientModal(
																		true,
																	);
																}}
															>
																✏️
															</button>
														</div>
													);
												},
											)}
										</div>
									) : (
										<div className={styles.emptyState}>
											Nenhum item neste setor
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</>
			)}

			{/* Tab: Categorias */}
			{activeTab === "categorias" && (
				<>
					{loadingCategories ? (
						<div className={styles.loading}>
							Carregando categorias...
						</div>
					) : categories && categories.length > 0 ? (
						<div className={styles.categoriesGrid}>
							{categories.map((category) => (
								<div
									key={category.id}
									className={styles.categoryCard}
								>
									<div className={styles.categoryInfo}>
										<span className={styles.categoryName}>
											{category.name}
										</span>
										<span
											className={`${styles.categoryType} ${
												category.type === "INGREDIENT"
													? styles.typeIngredient
													: styles.typeProduct
											}`}
										>
											{category.type === "INGREDIENT"
												? "Insumo"
												: "Produto"}
										</span>
										<span className={styles.categoryCount}>
											{category._count.ingredients +
												category._count.products}{" "}
											itens
										</span>
									</div>
									<div className={styles.categoryActions}>
										<button
											className={`${styles.iconButton} ${styles.deleteButton}`}
											onClick={() => {
												if (
													confirm(
														"Deseja excluir esta categoria?",
													)
												) {
													deleteCategoryMutation.mutate(
														category.id,
													);
												}
											}}
										>
											🗑️
										</button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className={styles.emptyState}>
							Nenhuma categoria cadastrada. Clique em "+ Nova
							Categoria" para começar.
						</div>
					)}
				</>
			)}

			{/* Tab: Insumos */}
			{activeTab === "insumos" && (
				<>
					{loadingIngredients ? (
						<div className={styles.loading}>
							Carregando insumos...
						</div>
					) : ingredients && ingredients.length > 0 ? (
						<div className={styles.categoriesGrid}>
							{ingredients.map((ingredient) => {
								const totalStock =
									ingredient.stockBalance.reduce(
										(sum, b) => sum + Number(b.quantity),
										0,
									);
								return (
									<div
										key={ingredient.id}
										className={styles.categoryCard}
									>
										<div className={styles.categoryInfo}>
											<span
												className={styles.categoryName}
											>
												{ingredient.name}
											</span>
											<span
												className={`${styles.categoryType} ${styles.typeIngredient}`}
											>
												{ingredient.category.name}
											</span>
											<span
												className={styles.categoryCount}
											>
												Estoque: {totalStock.toFixed(2)}{" "}
												{ingredient.unit} | Custo: R${" "}
												{Number(
													ingredient.costPrice,
												).toFixed(2)}
											</span>
										</div>
										<div className={styles.categoryActions}>
											<button
												className={styles.iconButton}
												title="Editar"
												onClick={() => {
													setEditingIngredient(
														ingredient,
													);
													setShowIngredientModal(
														true,
													);
												}}
											>
												✏️
											</button>
											<button
												className={`${styles.iconButton} ${styles.deleteButton}`}
												onClick={() => {
													if (
														confirm(
															"Deseja excluir este insumo?",
														)
													) {
														// Fazer call direta para a API
														api.delete(
															`/stock/ingredients/${ingredient.id}`,
														).then(() => {
															queryClient.invalidateQueries(
																{
																	queryKey: [
																		"ingredients",
																	],
																},
															);
														});
													}
												}}
											>
												🗑️
											</button>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className={styles.emptyState}>
							Nenhum insumo cadastrado. Clique em "+ Novo Insumo"
							para começar.
						</div>
					)}
				</>
			)}

			{/* Modal: Nova Categoria */}
			{showCategoryModal && (
				<CategoryModal
					onClose={() => setShowCategoryModal(false)}
					onSubmit={(data) => createCategoryMutation.mutate(data)}
					isLoading={createCategoryMutation.isPending}
				/>
			)}

			{/* Modal: Novo/Editar Insumo */}
			{showIngredientModal && (
				<IngredientModal
					ingredient={editingIngredient}
					categories={ingredientCategories}
					sectors={sectors || []}
					onClose={() => {
						setShowIngredientModal(false);
						setEditingIngredient(null);
					}}
					onSubmit={(data) => {
						if (editingIngredient) {
							updateIngredientMutation.mutate({
								...data,
								id: editingIngredient.id,
							});
						} else {
							createIngredientMutation.mutate(data);
						}
					}}
					isLoading={
						createIngredientMutation.isPending ||
						updateIngredientMutation.isPending
					}
				/>
			)}

			{/* Modal: Setor */}
			{showSectorModal && (
				<SectorModal
					sector={editingSector}
					onClose={() => setShowSectorModal(false)}
					onSave={(data) => {
						if (editingSector) {
							updateSectorMutation.mutate({
								...data,
								id: editingSector.id,
							});
						} else {
							createSectorMutation.mutate(data);
						}
					}}
					isLoading={
						createSectorMutation.isPending ||
						updateSectorMutation.isPending
					}
				/>
			)}
		</div>
	);
}

// Modal de Categoria
function CategoryModal({
	onClose,
	onSubmit,
	isLoading,
}: {
	onClose: () => void;
	onSubmit: (data: {
		name: string;
		type: string;
		description?: string;
	}) => void;
	isLoading: boolean;
}) {
	const [name, setName] = useState("");
	const [type, setType] = useState<"INGREDIENT" | "PRODUCT">("INGREDIENT");
	const [description, setDescription] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		onSubmit({ name, type, description: description || undefined });
	};

	return (
		<div className={styles.modal} onClick={onClose}>
			<div
				className={styles.modalContent}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modalHeader}>
					<h2 className={styles.modalTitle}>Nova Categoria</h2>
					<button className={styles.closeButton} onClick={onClose}>
						×
					</button>
				</div>
				<form className={styles.form} onSubmit={handleSubmit}>
					<div className={styles.formGroup}>
						<label className={styles.label}>Nome</label>
						<input
							type="text"
							className={styles.input}
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Proteínas, Bebidas..."
							required
						/>
					</div>
					<div className={styles.formGroup}>
						<label className={styles.label}>Tipo</label>
						<select
							className={styles.select}
							value={type}
							onChange={(e) =>
								setType(
									e.target.value as "INGREDIENT" | "PRODUCT",
								)
							}
						>
							<option value="INGREDIENT">Insumo</option>
							<option value="PRODUCT">Produto Final</option>
						</select>
					</div>
					<div className={styles.formGroup}>
						<label className={styles.label}>
							Descrição (opcional)
						</label>
						<input
							type="text"
							className={styles.input}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descrição da categoria"
						/>
					</div>
					<button
						type="submit"
						className={styles.submitButton}
						disabled={isLoading || !name.trim()}
					>
						{isLoading ? "Salvando..." : "Criar Categoria"}
					</button>
				</form>
			</div>
		</div>
	);
}

// Modal de Insumo
function IngredientModal({
	ingredient,
	categories,
	sectors,
	onClose,
	onSubmit,
	isLoading,
}: {
	ingredient?: Ingredient | null;
	categories: Category[];
	sectors: Sector[];
	onClose: () => void;
	onSubmit: (data: {
		name: string;
		unit: string;
		costPrice: number;
		minStock: number;
		categoryId: string;
		initialStock?: number;
		initialSectorId?: string;
	}) => void;
	isLoading: boolean;
}) {
	const [name, setName] = useState(ingredient?.name || "");
	const [unit, setUnit] = useState(ingredient?.unit || "kg");
	const [costPrice, setCostPrice] = useState(
		ingredient?.costPrice.toString() || "",
	);
	const [minStock, setMinStock] = useState(
		ingredient?.minStock.toString() || "",
	);
	const [initialStock, setInitialStock] = useState("");
	const [initialSectorId, setInitialSectorId] = useState("");
	const [categoryId, setCategoryId] = useState(
		ingredient?.category.id || categories[0]?.id || "",
	);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !categoryId) return;
		onSubmit({
			name,
			unit,
			costPrice: parseFloat(costPrice) || 0,
			minStock: parseFloat(minStock) || 0,
			categoryId,
			initialStock: parseFloat(initialStock) || 0,
			initialSectorId,
		});
	};

	return (
		<div className={styles.modal} onClick={onClose}>
			<div
				className={styles.modalContent}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modalHeader}>
					<h2 className={styles.modalTitle}>
						{ingredient ? "Editar Insumo" : "Novo Insumo"}
					</h2>
					<button className={styles.closeButton} onClick={onClose}>
						×
					</button>
				</div>
				<form className={styles.form} onSubmit={handleSubmit}>
					<div className={styles.formGroup}>
						<label className={styles.label}>Nome</label>
						<input
							type="text"
							className={styles.input}
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Filé de Frango"
							required
						/>
					</div>
					<div className={styles.formGroup}>
						<label className={styles.label}>Categoria</label>
						<select
							className={styles.select}
							value={categoryId}
							onChange={(e) => setCategoryId(e.target.value)}
							required
						>
							{categories.length === 0 ? (
								<option value="">
									Crie uma categoria primeiro
								</option>
							) : (
								categories.map((cat) => (
									<option key={cat.id} value={cat.id}>
										{cat.name} (
										{cat.type === "INGREDIENT"
											? "Insumo"
											: "Produto"}
										)
									</option>
								))
							)}
						</select>
					</div>
					<div className={styles.formRow}>
						<div className={styles.formGroup}>
							<label className={styles.label}>Unidade</label>
							<select
								className={styles.select}
								value={unit}
								onChange={(e) => setUnit(e.target.value)}
							>
								<option value="kg">Quilograma (kg)</option>
								<option value="g">Grama (g)</option>
								<option value="L">Litro (L)</option>
								<option value="ml">Mililitro (ml)</option>
								<option value="un">Unidade (un)</option>
							</select>
						</div>
						<div className={styles.formGroup}>
							<label className={styles.label}>
								Estoque Mínimo
							</label>
							<input
								type="number"
								className={styles.input}
								value={minStock}
								onChange={(e) => setMinStock(e.target.value)}
								placeholder="0"
								step="0.01"
							/>
						</div>
					</div>
					{!ingredient && (
						<div className={styles.formRow}>
							<div className={styles.formGroup}>
								<label className={styles.label}>
									Estoque Inicial
								</label>
								<input
									type="number"
									className={styles.input}
									value={initialStock}
									onChange={(e) =>
										setInitialStock(e.target.value)
									}
									placeholder="0"
									step="0.01"
								/>
							</div>
							<div className={styles.formGroup}>
								<label className={styles.label}>
									Setor (Opcional)
								</label>
								<select
									className={styles.select}
									value={initialSectorId}
									onChange={(e) =>
										setInitialSectorId(e.target.value)
									}
								>
									<option value="">
										Selecione um setor...
									</option>
									{sectors.map((sector) => (
										<option
											key={sector.id}
											value={sector.id}
										>
											{sector.name}
										</option>
									))}
								</select>
							</div>
						</div>
					)}
					<div className={styles.formRow}>
						<div className={styles.formGroup} style={{ flex: 1 }}>
							<label className={styles.label}>
								Custo Unitário (R$)
							</label>
							<input
								type="number"
								className={styles.input}
								value={costPrice}
								onChange={(e) => setCostPrice(e.target.value)}
								placeholder="0.00"
								step="0.01"
							/>
						</div>
					</div>
					<button
						type="submit"
						className={styles.submitButton}
						disabled={isLoading || !name.trim() || !categoryId}
					>
						{isLoading
							? "Salvando..."
							: ingredient
								? "Salvar"
								: "Criar Insumo"}
					</button>
				</form>
			</div>
		</div>
	);
}

// Modal de Setor
function SectorModal({
	sector,
	onClose,
	onSave,
	isLoading,
}: {
	sector?: { id: string; name: string; description?: string } | null;
	onClose: () => void;
	onSave: (data: { name: string; description?: string }) => void;
	isLoading: boolean;
}) {
	const [name, setName] = useState(sector?.name || "");
	const [description, setDescription] = useState(sector?.description || "");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;
		onSave({ name, description });
	};

	return (
		<div className={styles.modal} onClick={onClose}>
			<div
				className={styles.modalContent}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modalHeader}>
					<h2 className={styles.modalTitle}>
						{sector ? "Editar Setor" : "Novo Setor"}
					</h2>
					<button className={styles.closeButton} onClick={onClose}>
						×
					</button>
				</div>
				<form className={styles.form} onSubmit={handleSubmit}>
					<div className={styles.formGroup}>
						<label className={styles.label}>Nome</label>
						<input
							type="text"
							className={styles.input}
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Cozinha, Bar..."
							required
						/>
					</div>
					<div className={styles.formGroup}>
						<label className={styles.label}>Descrição</label>
						<input
							type="text"
							className={styles.input}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descrição do setor"
						/>
					</div>
					<button
						type="submit"
						className={styles.submitButton}
						disabled={isLoading || !name.trim()}
					>
						{isLoading ? "Salvando..." : "Salvar"}
					</button>
				</form>
			</div>
		</div>
	);
}
