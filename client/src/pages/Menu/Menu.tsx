import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import styles from "./Menu.module.css";
import {
	Unit,
	getCompatibleUnits,
	convertToStockUnit,
	UNITS,
} from "../../utils/units";

interface Category {
	id: string;
	name: string;
	type: string;
}

interface Ingredient {
	id: string;
	name: string;
	unit: string;
	costPrice: number;
	category: { id: string; name: string };
}

interface RecipeItem {
	ingredientId: string;
	quantity: number;
	unit?: string;
	ingredient: Ingredient;
}

interface Product {
	id: string;
	name: string;
	description?: string;
	salePrice: number;
	imageUrl?: string;
	isActive: boolean;
	category: { id: string; name: string };
	sector?: { id: string; name: string };
	recipes?: RecipeItem[];
}

interface Sector {
	id: string;
	name: string;
}

const categoryIcons: Record<string, string> = {
	Entradas: "🥗",
	"Pratos Principais": "🍽️",
	Sobremesas: "🍰",
	Bebidas: "🥤",
	Combos: "🍔",
};

export function Menu() {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(
		null,
	);
	const [showProductModal, setShowProductModal] = useState(false);
	const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);
	const queryClient = useQueryClient();

	// Queries
	const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
		queryKey: ["products"],
		queryFn: async () => {
			const response = await api.get("/products");
			return response.data;
		},
	});

	const { data: productCategories } = useQuery<Category[]>({
		queryKey: ["product-categories"],
		queryFn: async () => {
			const response = await api.get("/categories?type=PRODUCT");
			return response.data;
		},
	});

	const { data: sectors } = useQuery<Sector[]>({
		queryKey: ["sectors"],
		queryFn: async () => {
			const response = await api.get("/stock/sectors");
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

	// Mutations
	const createProductMutation = useMutation({
		mutationFn: async (data: {
			name: string;
			description?: string;
			salePrice: number;
			categoryId: string;
			sectorId: string;
			imageUrl?: string;
		}) => {
			const response = await api.post("/products", data);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			setShowProductModal(false);
		},
	});

	const updateProductMutation = useMutation({
		mutationFn: async ({
			id,
			...data
		}: {
			id: string;
			isActive?: boolean;
		}) => {
			const response = await api.put(`/products/${id}`, data);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
	});

	const deleteProductMutation = useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/products/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
		},
	});

	// Extrair categorias únicas
	const categories = products
		? Array.from(
				new Map(
					products.map((p) => [p.category.id, p.category]),
				).values(),
			)
		: [];

	const filteredProducts = selectedCategory
		? products?.filter((p) => p.category.id === selectedCategory)
		: products;

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const getCategoryIcon = (categoryName: string) => {
		return categoryIcons[categoryName] || "🍴";
	};

	const toggleProductStatus = (product: Product) => {
		updateProductMutation.mutate({
			id: product.id,
			isActive: !product.isActive,
		});
	};

	const handleDeleteProduct = (product: Product) => {
		if (confirm(`Deseja realmente excluir "${product.name}"?`)) {
			deleteProductMutation.mutate(product.id);
		}
	};

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h1 className={styles.title}>Gestão de Produtos</h1>
				<p className={styles.subtitle}>
					Gerencie os produtos e suas fichas técnicas
				</p>
			</div>

			<div className={styles.actions}>
				<button
					className={styles.addButton}
					onClick={() => setShowProductModal(true)}
				>
					+ Novo Produto
				</button>
			</div>

			{categories.length > 0 && (
				<div className={styles.categories}>
					<button
						className={`${styles.categoryButton} ${!selectedCategory ? styles.categoryActive : ""}`}
						onClick={() => setSelectedCategory(null)}
					>
						Todos
					</button>
					{categories.map((category) => (
						<button
							key={category.id}
							className={`${styles.categoryButton} ${
								selectedCategory === category.id
									? styles.categoryActive
									: ""
							}`}
							onClick={() => setSelectedCategory(category.id)}
						>
							{getCategoryIcon(category.name)} {category.name}
						</button>
					))}
				</div>
			)}

			{loadingProducts ? (
				<div className={styles.loading}>Carregando produtos...</div>
			) : filteredProducts && filteredProducts.length > 0 ? (
				<div className={styles.productsGrid}>
					{filteredProducts.map((product) => (
						<div
							key={product.id}
							className={`${styles.productCard} ${!product.isActive ? styles.unavailable : ""}`}
						>
							<div className={styles.productImage}>
								{product.imageUrl ? (
									<img
										src={product.imageUrl}
										alt={product.name}
										className={styles.productImg}
									/>
								) : (
									getCategoryIcon(product.category.name)
								)}
								<span className={styles.categoryBadge}>
									{product.category.name}
								</span>
								{!product.isActive && (
									<span className={styles.unavailableBadge}>
										Inativo
									</span>
								)}
							</div>
							<div className={styles.productContent}>
								<h3 className={styles.productName}>
									{product.name}
								</h3>
								<p className={styles.productDescription}>
									{product.description || "Sem descrição"}
								</p>
								<div className={styles.recipeInfo}>
									📋 {product.recipes?.length || 0} insumos
								</div>
								<div className={styles.productFooter}>
									<span className={styles.productPrice}>
										{formatCurrency(
											Number(product.salePrice),
										)}
									</span>
									<div className={styles.productActions}>
										<button
											className={`${styles.actionBtn} ${styles.btnRecipe}`}
											onClick={() =>
												setRecipeProduct(product)
											}
											title="Editar Ficha Técnica"
										>
											📋
										</button>
										<button
											className={`${styles.actionBtn} ${
												product.isActive
													? styles.btnWarning
													: styles.btnSuccess
											}`}
											onClick={() =>
												toggleProductStatus(product)
											}
											title={
												product.isActive
													? "Desativar"
													: "Ativar"
											}
										>
											{product.isActive ? "⏸️" : "▶️"}
										</button>
										<button
											className={`${styles.actionBtn} ${styles.btnDanger}`}
											onClick={() =>
												handleDeleteProduct(product)
											}
											title="Excluir"
										>
											🗑️
										</button>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className={styles.emptyState}>
					<div className={styles.emptyIcon}>🍽️</div>
					<div className={styles.emptyTitle}>
						Nenhum produto cadastrado
					</div>
					<div className={styles.emptyText}>
						Clique em "+ Novo Produto" para adicionar
					</div>
				</div>
			)}

			{/* Modal: Novo Produto */}
			{showProductModal && (
				<ProductModal
					categories={productCategories || []}
					sectors={sectors || []}
					ingredients={ingredients || []}
					onClose={() => setShowProductModal(false)}
					onSubmit={(data) => createProductMutation.mutate(data)}
					isLoading={createProductMutation.isPending}
				/>
			)}

			{/* Modal: Ficha Técnica */}
			{recipeProduct && (
				<RecipeModal
					product={recipeProduct}
					onClose={() => {
						setRecipeProduct(null);
						queryClient.invalidateQueries({
							queryKey: ["products"],
						});
					}}
				/>
			)}
		</div>
	);
}

// Modal de Produto
function ProductModal({
	categories,
	sectors,
	ingredients,
	onClose,
	onSubmit,
	isLoading,
}: {
	categories: Category[];
	sectors: Sector[];
	ingredients: Ingredient[];
	onClose: () => void;
	onSubmit: (data: {
		name: string;
		description?: string;
		salePrice: number;
		categoryId: string;
		sectorId: string;
		imageUrl?: string;

		recipes?: Array<{
			ingredientId: string;
			quantity: number;
			unit?: string;
		}>;
	}) => void;
	isLoading: boolean;
}) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [salePrice, setSalePrice] = useState("");
	const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
	const [sectorId, setSectorId] = useState(sectors[0]?.id || "");
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [imageBase64, setImageBase64] = useState<string | null>(null);
	const [uploading, setUploading] = useState(false);
	const [recipeItems, setRecipeItems] = useState<
		Array<{ ingredientId: string; quantity: number; unit?: string }>
	>([]);
	const [selectedIngredient, setSelectedIngredient] = useState("");
	const [recipeQuantity, setRecipeQuantity] = useState("");
	const [selectedUnit, setSelectedUnit] = useState<Unit | "">("");

	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			alert("Selecione uma imagem válida");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			alert("Imagem muito grande. Máximo 5MB");
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const base64 = e.target?.result as string;
			setImagePreview(base64);
			setImageBase64(base64);
		};
		reader.readAsDataURL(file);
	};

	const handleIngredientChange = (id: string) => {
		setSelectedIngredient(id);
		const ing = ingredients.find((i) => i.id === id);
		if (ing) {
			setSelectedUnit(ing.unit as Unit);
		} else {
			setSelectedUnit("");
		}
	};

	const handleAddRecipeItem = () => {
		if (!selectedIngredient || !recipeQuantity) return;

		const exists = recipeItems.find(
			(item) => item.ingredientId === selectedIngredient,
		);
		if (exists) {
			alert("Insumo já adicionado à receita");
			return;
		}

		setRecipeItems([
			...recipeItems,
			{
				ingredientId: selectedIngredient,
				quantity: parseFloat(recipeQuantity),
				unit: selectedUnit as string,
			},
		]);

		setSelectedIngredient("");
		setRecipeQuantity("");
	};

	const handleRemoveRecipeItem = (id: string) => {
		setRecipeItems(recipeItems.filter((item) => item.ingredientId !== id));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !salePrice || !categoryId || !sectorId) return;

		let imageUrl: string | undefined;

		if (imageBase64) {
			try {
				setUploading(true);
				const response = await api.post("/upload/image", {
					base64: imageBase64,
					filename: `${name.replace(/\s+/g, "-").toLowerCase()}.jpg`,
				});
				imageUrl = response.data.url;
			} catch (error) {
				console.error("Erro ao fazer upload:", error);
				alert("Erro ao fazer upload da imagem");
				return;
			} finally {
				setUploading(false);
			}
		}

		onSubmit({
			name,
			description: description || undefined,
			salePrice: parseFloat(salePrice),
			categoryId,
			sectorId,
			imageUrl,
			recipes: recipeItems.length > 0 ? recipeItems : undefined,
		});
	};

	const productCategories = categories.filter((c) => c.type === "PRODUCT");
	const availableIngredients = ingredients.filter(
		(ing) => !recipeItems.some((r) => r.ingredientId === ing.id),
	);

	return (
		<div className={styles.modal} onClick={onClose}>
			<div
				className={styles.modalContent}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modalHeader}>
					<h2 className={styles.modalTitle}>Novo Produto</h2>
					<button className={styles.closeButton} onClick={onClose}>
						×
					</button>
				</div>
				<form className={styles.form} onSubmit={handleSubmit}>
					{/* ... (Image and basic fields remain same) ... */}
					<div className={styles.formGroup}>
						<label className={styles.label}>
							Imagem do Produto
						</label>
						<div className={styles.imageUpload}>
							{imagePreview ? (
								<div className={styles.imagePreviewContainer}>
									<img
										src={imagePreview}
										alt="Preview"
										className={styles.imagePreviewImg}
									/>
									<button
										type="button"
										className={styles.removeImageBtn}
										onClick={() => {
											setImagePreview(null);
											setImageBase64(null);
											if (fileInputRef.current)
												fileInputRef.current.value = "";
										}}
									>
										✕
									</button>
								</div>
							) : (
								<div
									className={styles.uploadPlaceholder}
									onClick={() =>
										fileInputRef.current?.click()
									}
								>
									<span className={styles.uploadIcon}>
										📷
									</span>
									<span>Clique para adicionar imagem</span>
								</div>
							)}
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleImageSelect}
								style={{ display: "none" }}
							/>
						</div>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.label}>Nome do Produto</label>
						<input
							type="text"
							className={styles.input}
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Ex: Prato Executivo"
							required
						/>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.label}>Descrição</label>
						<textarea
							className={styles.textarea}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descrição do produto..."
						/>
					</div>

					<div className={styles.formRow}>
						<div className={styles.formGroup}>
							<label className={styles.label}>
								Preço de Venda (R$)
							</label>
							<input
								type="number"
								className={styles.input}
								value={salePrice}
								onChange={(e) => setSalePrice(e.target.value)}
								placeholder="0.00"
								step="0.01"
								required
							/>
						</div>
						<div className={styles.formGroup}>
							<label className={styles.label}>
								Setor de Baixa
							</label>
							<select
								className={styles.select}
								value={sectorId}
								onChange={(e) => setSectorId(e.target.value)}
								required
							>
								{sectors.length === 0 ? (
									<option value="">Nenhum setor</option>
								) : (
									sectors.map((sector) => (
										<option
											key={sector.id}
											value={sector.id}
										>
											{sector.name}
										</option>
									))
								)}
							</select>
						</div>
					</div>

					<div className={styles.formGroup}>
						<label className={styles.label}>Categoria</label>
						<select
							className={styles.select}
							value={categoryId}
							onChange={(e) => setCategoryId(e.target.value)}
							required
						>
							{productCategories.length === 0 ? (
								<option value="">
									Crie uma categoria primeiro
								</option>
							) : (
								productCategories.map((cat) => (
									<option key={cat.id} value={cat.id}>
										{cat.name}
									</option>
								))
							)}
						</select>
					</div>

					{/* Section: Ficha Técnica */}
					<div className={styles.recipeSection}>
						<label className={styles.label}>
							Ficha Técnica (Insumos)
						</label>
						<div className={styles.recipeInputRow}>
							<select
								className={styles.select}
								value={selectedIngredient}
								onChange={(e) =>
									handleIngredientChange(e.target.value)
								}
							>
								<option value="">Selecione insumo...</option>
								{availableIngredients.map((ing) => (
									<option key={ing.id} value={ing.id}>
										{ing.name} ({ing.unit})
									</option>
								))}
							</select>
							<input
								type="number"
								className={styles.input}
								style={{ width: "80px" }}
								value={recipeQuantity}
								onChange={(e) =>
									setRecipeQuantity(e.target.value)
								}
								placeholder="Qtd"
								step="0.001"
							/>
							{selectedIngredient && (
								<select
									className={styles.select}
									style={{ width: "100px" }}
									value={selectedUnit}
									onChange={(e) =>
										setSelectedUnit(e.target.value as Unit)
									}
								>
									{getCompatibleUnits(
										ingredients.find(
											(i) => i.id === selectedIngredient,
										)?.unit || "",
									).map((u) => (
										<option key={u} value={u}>
											{UNITS[u]?.label || u}
										</option>
									))}
								</select>
							)}
							<button
								type="button"
								className={styles.addButton}
								onClick={handleAddRecipeItem}
								disabled={
									!selectedIngredient ||
									!recipeQuantity ||
									!selectedUnit
								}
							>
								+
							</button>
						</div>

						{recipeItems.length > 0 && (
							<div className={styles.miniRecipeList}>
								{recipeItems.map((item) => {
									const ing = ingredients.find(
										(i) => i.id === item.ingredientId,
									);
									return (
										<div
											key={item.ingredientId}
											className={styles.miniRecipeItem}
										>
											<span>{ing?.name}</span>
											<span>
												{item.quantity}{" "}
												{item.unit || ing?.unit}
											</span>
											<button
												type="button"
												className={
													styles.removeMiniItemBtn
												}
												onClick={() =>
													handleRemoveRecipeItem(
														item.ingredientId,
													)
												}
											>
												×
											</button>
										</div>
									);
								})}
							</div>
						)}
					</div>

					<button
						type="submit"
						className={styles.submitButton}
						disabled={
							isLoading ||
							uploading ||
							!name.trim() ||
							!salePrice ||
							!categoryId ||
							!sectorId
						}
					>
						{uploading
							? "Enviando imagem..."
							: isLoading
								? "Salvando..."
								: "Criar Produto"}
					</button>
				</form>
			</div>
		</div>
	);
}

// Modal de Ficha Técnica
function RecipeModal({
	product,
	onClose,
}: {
	product: Product;
	onClose: () => void;
}) {
	const [selectedIngredient, setSelectedIngredient] = useState("");
	const [quantity, setQuantity] = useState("");
	const [selectedUnit, setSelectedUnit] = useState<Unit | "">("");
	const queryClient = useQueryClient();

	// Buscar receita atual
	const { data: recipe, isLoading: loadingRecipe } = useQuery<RecipeItem[]>({
		queryKey: ["recipe", product.id],
		queryFn: async () => {
			const response = await api.get(`/products/${product.id}/recipe`);
			return response.data;
		},
	});

	// Buscar insumos disponíveis
	const { data: ingredients } = useQuery<Ingredient[]>({
		queryKey: ["ingredients"],
		queryFn: async () => {
			const response = await api.get("/stock/ingredients");
			return response.data;
		},
	});

	// Mutations
	const addItemMutation = useMutation({
		mutationFn: async (data: {
			ingredientId: string;
			quantity: number;
			unit?: string;
		}) => {
			const response = await api.post(
				`/products/${product.id}/recipe`,
				data,
			);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["recipe", product.id] });
			setSelectedIngredient("");
			setQuantity("");
			setSelectedUnit("");
		},
		onError: (error: any) => {
			alert(error.response?.data?.error || "Erro ao adicionar insumo");
		},
	});

	const removeItemMutation = useMutation({
		mutationFn: async (ingredientId: string) => {
			await api.delete(`/products/${product.id}/recipe/${ingredientId}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["recipe", product.id] });
		},
	});

	const handleIngredientChange = (id: string) => {
		setSelectedIngredient(id);
		const ing = ingredients?.find((i) => i.id === id);
		if (ing) {
			setSelectedUnit(ing.unit as Unit);
		} else {
			setSelectedUnit("");
		}
	};

	const handleAddItem = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedIngredient || !quantity || !selectedUnit) return;

		const ing = ingredients?.find((i) => i.id === selectedIngredient);
		if (!ing) return;

		const stockQty = convertToStockUnit(
			parseFloat(quantity),
			selectedUnit as Unit,
			ing.unit as Unit,
		);

		addItemMutation.mutate({
			ingredientId: selectedIngredient,
			quantity: stockQty,
		});
	};

	// Filtrar insumos que já não estão na receita
	const availableIngredients = ingredients?.filter(
		(ing) => !recipe?.some((r) => r.ingredientId === ing.id),
	);

	// Calcular custo total
	const totalCost =
		recipe?.reduce((sum, item) => {
			return (
				sum + Number(item.quantity) * Number(item.ingredient.costPrice)
			);
		}, 0) || 0;

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	return (
		<div className={styles.modal} onClick={onClose}>
			<div
				className={styles.recipeModalContent}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modalHeader}>
					<div>
						<h2 className={styles.modalTitle}>📋 Ficha Técnica</h2>
						<p className={styles.modalSubtitle}>{product.name}</p>
					</div>
					<button className={styles.closeButton} onClick={onClose}>
						×
					</button>
				</div>

				<div className={styles.recipeBody}>
					{/* Lista de Insumos */}
					<div className={styles.recipeList}>
						<h3 className={styles.recipeListTitle}>
							Insumos do Produto
						</h3>
						{loadingRecipe ? (
							<div className={styles.loading}>Carregando...</div>
						) : recipe && recipe.length > 0 ? (
							<>
								{recipe.map((item) => (
									<div
										key={item.ingredientId}
										className={styles.recipeItem}
									>
										<div className={styles.recipeItemInfo}>
											<span
												className={
													styles.recipeItemName
												}
											>
												{item.ingredient.name}
											</span>
											<span
												className={styles.recipeItemQty}
											>
												{item.quantity}{" "}
												{item.ingredient.unit}
											</span>
										</div>
										<div className={styles.recipeItemCost}>
											{formatCurrency(
												Number(item.quantity) *
													Number(
														item.ingredient
															.costPrice,
													),
											)}
										</div>
										<button
											className={styles.removeItemBtn}
											onClick={() =>
												removeItemMutation.mutate(
													item.ingredientId,
												)
											}
											disabled={
												removeItemMutation.isPending
											}
										>
											🗑️
										</button>
									</div>
								))}
								<div className={styles.recipeTotalRow}>
									<span>CMV Total:</span>
									<span className={styles.recipeTotalValue}>
										{formatCurrency(totalCost)}
									</span>
								</div>
								<div className={styles.recipeMarginRow}>
									<span>Margem:</span>
									<span className={styles.recipeMarginValue}>
										{formatCurrency(
											Number(product.salePrice) -
												totalCost,
										)}{" "}
										(
										{(
											((Number(product.salePrice) -
												totalCost) /
												Number(product.salePrice)) *
											100
										).toFixed(1)}
										%)
									</span>
								</div>
							</>
						) : (
							<div className={styles.emptyRecipe}>
								Nenhum insumo cadastrado ainda
							</div>
						)}
					</div>

					{/* Adicionar Insumo */}
					<form
						className={styles.addRecipeForm}
						onSubmit={handleAddItem}
					>
						<h3 className={styles.addRecipeTitle}>
							Adicionar Insumo
						</h3>
						<div className={styles.formGroup}>
							<label className={styles.label}>Insumo</label>
							<div style={{ display: "flex", gap: "10px" }}>
								<select
									className={styles.select}
									value={selectedIngredient}
									onChange={(e) =>
										handleIngredientChange(e.target.value)
									}
									required
									style={{ flex: 2 }}
								>
									<option value="">
										Selecione um insumo
									</option>
									{availableIngredients?.map((ing) => (
										<option key={ing.id} value={ing.id}>
											{ing.name} ({ing.unit})
										</option>
									))}
								</select>
								<input
									type="number"
									className={styles.input}
									value={quantity}
									onChange={(e) =>
										setQuantity(e.target.value)
									}
									placeholder="Qtd"
									step="0.001"
									required
									style={{ flex: 1 }}
								/>
								{selectedIngredient && (
									<select
										className={styles.select}
										value={selectedUnit}
										onChange={(e) =>
											setSelectedUnit(
												e.target.value as Unit,
											)
										}
										required
										style={{ flex: 1 }}
									>
										{getCompatibleUnits(
											ingredients?.find(
												(i) =>
													i.id === selectedIngredient,
											)?.unit || "",
										).map((u) => (
											<option key={u} value={u}>
												{UNITS[u]?.label || u}
											</option>
										))}
									</select>
								)}
							</div>
						</div>
						<button
							type="submit"
							className={styles.submitButton}
							disabled={
								addItemMutation.isPending ||
								!selectedIngredient ||
								!quantity ||
								!selectedUnit
							}
						>
							{addItemMutation.isPending
								? "Adicionando..."
								: "Adicionar Insumo"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
