import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import styles from "./PDV.module.css";

interface Product {
	id: string;
	name: string;
	description?: string;
	salePrice: number;
	category: { id: string; name: string };
}

interface CartItem {
	product: Product;
	quantity: number;
}

type OrderType = "SALAO" | "DELIVERY" | "TAKEOUT";

const categoryIcons: Record<string, string> = {
	Entradas: "🥗",
	"Pratos Principais": "🍽️",
	Sobremesas: "🍰",
	Bebidas: "🥤",
	Combos: "🍔",
};

export function PDV() {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(
		null,
	);
	const [searchTerm, setSearchTerm] = useState("");
	const [cart, setCart] = useState<CartItem[]>([]);
	const [orderType, setOrderType] = useState<OrderType>("SALAO");
	const [tableNumber, setTableNumber] = useState("");

	const queryClient = useQueryClient();

	const { data: products, isLoading } = useQuery<Product[]>({
		queryKey: ["products"],
		queryFn: async () => {
			const response = await api.get("/products");
			return response.data;
		},
	});

	const createOrderMutation = useMutation({
		mutationFn: async (orderData: {
			type: string;
			tableNumber?: number;
			items: Array<{
				productId: string;
				quantity: number;
				unitPrice: number;
			}>;
			subtotal: number;
			total: number;
		}) => {
			const response = await api.post("/orders", orderData);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			clearCart();
			alert("✅ Pedido criado com sucesso!");
		},
		onError: (error: any) => {
			alert(
				"Erro ao criar pedido: " +
					(error.response?.data?.error || error.message),
			);
		},
	});

	const categories = products
		? Array.from(
				new Map(
					products.map((p) => [p.category.id, p.category]),
				).values(),
			)
		: [];

	const filteredProducts = products?.filter((product) => {
		const matchesCategory =
			!selectedCategory || product.category.id === selectedCategory;
		const matchesSearch =
			!searchTerm ||
			product.name.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesCategory && matchesSearch;
	});

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const getCategoryIcon = (name: string) => categoryIcons[name] || "🍴";

	// Cart functions
	const addToCart = (product: Product) => {
		setCart((prev) => {
			const existing = prev.find(
				(item) => item.product.id === product.id,
			);
			if (existing) {
				return prev.map((item) =>
					item.product.id === product.id
						? { ...item, quantity: item.quantity + 1 }
						: item,
				);
			}
			return [...prev, { product, quantity: 1 }];
		});
	};

	const updateQuantity = (productId: string, delta: number) => {
		setCart((prev) =>
			prev
				.map((item) =>
					item.product.id === productId
						? {
								...item,
								quantity: Math.max(0, item.quantity + delta),
							}
						: item,
				)
				.filter((item) => item.quantity > 0),
		);
	};

	const clearCart = () => {
		setCart([]);
		setTableNumber("");
	};

	const subtotal = cart.reduce(
		(sum, item) => sum + Number(item.product.salePrice) * item.quantity,
		0,
	);

	const total = subtotal; // Pode adicionar taxas/descontos depois

	const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

	const handleFinishOrder = () => {
		if (cart.length === 0) return;
		if (orderType === "SALAO" && !tableNumber) {
			alert("Informe o número da mesa");
			return;
		}

		createOrderMutation.mutate({
			type: orderType,
			tableNumber:
				orderType === "SALAO" ? parseInt(tableNumber) : undefined,
			items: cart.map((item) => ({
				productId: item.product.id,
				quantity: item.quantity,
				unitPrice: Number(item.product.salePrice),
			})),
			subtotal,
			total,
		});
	};

	return (
		<div className={styles.container}>
			{/* Products Section */}
			<div className={styles.productsSection}>
				<div className={styles.header}>
					<h1 className={styles.title}>PDV - Novo Pedido</h1>
					<div className={styles.searchBox}>
						<input
							type="text"
							className={styles.searchInput}
							placeholder="🔍 Buscar produto..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</div>

				<div className={styles.categories}>
					<button
						className={`${styles.categoryButton} ${!selectedCategory ? styles.categoryActive : ""}`}
						onClick={() => setSelectedCategory(null)}
					>
						Todos
					</button>
					{categories.map((cat) => (
						<button
							key={cat.id}
							className={`${styles.categoryButton} ${
								selectedCategory === cat.id
									? styles.categoryActive
									: ""
							}`}
							onClick={() => setSelectedCategory(cat.id)}
						>
							{getCategoryIcon(cat.name)} {cat.name}
						</button>
					))}
				</div>

				{isLoading ? (
					<div className={styles.loading}>Carregando produtos...</div>
				) : (
					<div className={styles.productsGrid}>
						{filteredProducts?.map((product) => (
							<div
								key={product.id}
								className={styles.productCard}
								onClick={() => addToCart(product)}
							>
								<div className={styles.productIcon}>
									{getCategoryIcon(product.category.name)}
								</div>
								<div className={styles.productName}>
									{product.name}
								</div>
								<div className={styles.productPrice}>
									{formatCurrency(Number(product.salePrice))}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Cart Section */}
			<div className={styles.cartSection}>
				<div className={styles.cartHeader}>
					<span className={styles.cartTitle}>
						🛒 Pedido
						{totalItems > 0 && (
							<span className={styles.cartBadge}>
								{totalItems}
							</span>
						)}
					</span>
					{cart.length > 0 && (
						<button
							className={styles.clearButton}
							onClick={clearCart}
						>
							Limpar
						</button>
					)}
				</div>

				{cart.length > 0 ? (
					<>
						<div className={styles.cartItems}>
							{cart.map((item) => (
								<div
									key={item.product.id}
									className={styles.cartItem}
								>
									<div className={styles.cartItemInfo}>
										<div className={styles.cartItemName}>
											{item.product.name}
										</div>
										<div className={styles.cartItemPrice}>
											{formatCurrency(
												Number(item.product.salePrice),
											)}{" "}
											cada
										</div>
									</div>
									<div className={styles.cartItemControls}>
										<button
											className={styles.qtyButton}
											onClick={() =>
												updateQuantity(
													item.product.id,
													-1,
												)
											}
										>
											−
										</button>
										<span className={styles.qtyValue}>
											{item.quantity}
										</span>
										<button
											className={styles.qtyButton}
											onClick={() =>
												updateQuantity(
													item.product.id,
													1,
												)
											}
										>
											+
										</button>
									</div>
									<div className={styles.cartItemTotal}>
										{formatCurrency(
											Number(item.product.salePrice) *
												item.quantity,
										)}
									</div>
								</div>
							))}
						</div>

						<div className={styles.cartTotals}>
							<div className={styles.totalRow}>
								<span className={styles.totalLabel}>
									Subtotal
								</span>
								<span className={styles.totalValue}>
									{formatCurrency(subtotal)}
								</span>
							</div>
							<div className={styles.grandTotal}>
								<span className={styles.grandTotalLabel}>
									Total
								</span>
								<span className={styles.grandTotalValue}>
									{formatCurrency(total)}
								</span>
							</div>
						</div>

						<div className={styles.cartActions}>
							<div className={styles.orderTypeButtons}>
								<button
									className={`${styles.orderTypeButton} ${orderType === "SALAO" ? styles.orderTypeActive : ""}`}
									onClick={() => setOrderType("SALAO")}
								>
									🍽️ Salão
								</button>
								<button
									className={`${styles.orderTypeButton} ${orderType === "TAKEOUT" ? styles.orderTypeActive : ""}`}
									onClick={() => setOrderType("TAKEOUT")}
								>
									🥡 Balcão
								</button>
								<button
									className={`${styles.orderTypeButton} ${orderType === "DELIVERY" ? styles.orderTypeActive : ""}`}
									onClick={() => setOrderType("DELIVERY")}
								>
									🛵 Delivery
								</button>
							</div>

							{orderType === "SALAO" && (
								<input
									type="number"
									className={styles.tableInput}
									placeholder="Nº da Mesa"
									value={tableNumber}
									onChange={(e) =>
										setTableNumber(e.target.value)
									}
								/>
							)}

							<button
								className={styles.payButton}
								onClick={handleFinishOrder}
								disabled={
									cart.length === 0 ||
									createOrderMutation.isPending
								}
							>
								{createOrderMutation.isPending ? (
									"Processando..."
								) : (
									<>
										💳 Finalizar Pedido -{" "}
										{formatCurrency(total)}
									</>
								)}
							</button>
						</div>
					</>
				) : (
					<div className={styles.cartEmpty}>
						<div className={styles.cartEmptyIcon}>🛒</div>
						<div>Carrinho vazio</div>
						<div
							style={{
								fontSize: "var(--font-size-sm)",
								marginTop: 8,
							}}
						>
							Clique nos produtos para adicionar
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
