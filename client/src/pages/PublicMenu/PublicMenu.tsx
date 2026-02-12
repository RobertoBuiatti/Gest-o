import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "./PublicMenu.module.css";

interface Category {
	id: string;
	name: string;
}

interface Product {
	id: string;
	name: string;
	description?: string;
	salePrice: number;
	imageUrl?: string;
	category: { id: string; name: string };
}

interface MenuData {
	products: Product[];
	categories: Category[];
}

interface CartItem {
	product: Product;
	quantity: number;
}

const categoryIcons: Record<string, string> = {
	Entradas: "🥗",
	"Pratos Principais": "🍽️",
	Sobremesas: "🍰",
	Bebidas: "🥤",
	Combos: "🍔",
};

// Componente de QR Code
function QRCodeSVG({ value, size = 200 }: { value: string; size?: number }) {
	const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
	return (
		<img
			src={qrUrl}
			alt="QR Code"
			width={size}
			height={size}
			style={{ borderRadius: 8 }}
		/>
	);
}

export function PublicMenu() {
	const [selectedCategory, setSelectedCategory] = useState<string | null>(
		null,
	);
	const [menuUrl, setMenuUrl] = useState("");
	const [cart, setCart] = useState<CartItem[]>([]);
	const [showCart, setShowCart] = useState(false);
	const [customerName, setCustomerName] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [notes, setNotes] = useState("");
	const [orderType, setOrderType] = useState<"DELIVERY" | "TAKEOUT">(
		"DELIVERY",
	);
	const [submitting, setSubmitting] = useState(false);
	const [orderSuccess, setOrderSuccess] = useState(false);

useEffect(() => {
const system = localStorage.getItem("activeSystem") || "restaurante";
setMenuUrl(
  window.location.origin + (system === "salao" ? "/salao" : "/cardapio"),
);
}, []);

	const { data, isLoading } = useQuery<MenuData>({
		queryKey: ["public-menu"],
		queryFn: async () => {
			const response = await fetch("/api/public/menu");
			if (!response.ok) throw new Error("Erro ao carregar cardápio");
			return response.json();
		},
	});

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const getCategoryIcon = (name: string) => categoryIcons[name] || "🍴";

	const filteredProducts = selectedCategory
		? data?.products.filter((p) => p.category.id === selectedCategory)
		: data?.products;

	// Funções do carrinho
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

	const cartTotal = cart.reduce(
		(sum, item) => sum + Number(item.product.salePrice) * item.quantity,
		0,
	);

	const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

	const handleSubmitOrder = async () => {
		if (cart.length === 0) return;
		if (!customerName.trim()) {
			alert("Por favor, informe seu nome");
			return;
		}

		setSubmitting(true);
		try {
			const response = await fetch("/api/public/orders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					type: orderType,
					customerName,
					customerPhone,
					notes,
					items: cart.map((item) => ({
						productId: item.product.id,
						quantity: item.quantity,
						unitPrice: Number(item.product.salePrice),
					})),
					subtotal: cartTotal,
					total: cartTotal,
				}),
			});

			if (response.ok) {
				setOrderSuccess(true);
				setCart([]);
				setShowCart(false);
			} else {
				const error = await response.json();
				alert(error.error || "Erro ao enviar pedido");
			}
		} catch (error) {
			alert("Erro ao enviar pedido. Tente novamente.");
		} finally {
			setSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className={styles.container}>
				<div className={styles.loading}>Carregando cardápio...</div>
			</div>
		);
	}

	if (orderSuccess) {
		return (
			<div className={styles.container}>
				<div className={styles.successMessage}>
					<div className={styles.successIcon}>✅</div>
					<h2>Pedido Enviado!</h2>
					<p>Seu pedido foi recebido com sucesso.</p>
					<p>Em breve entraremos em contato.</p>
					<button
						className={styles.backButton}
						onClick={() => setOrderSuccess(false)}
					>
						Fazer Novo Pedido
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<div className={styles.logo}>🍽️ Nosso Cardápio</div>
				<div className={styles.tagline}>
					Escolha seus pratos favoritos
				</div>
			</header>

			<main className={styles.content}>
				{/* Filtros de categoria */}
				{data?.categories && data.categories.length > 0 && (
					<div className={styles.categories}>
						<button
							className={`${styles.categoryButton} ${!selectedCategory ? styles.categoryActive : ""}`}
							onClick={() => setSelectedCategory(null)}
						>
							🍴 Todos
						</button>
						{data.categories.map((cat) => (
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
				)}

				{/* Lista de produtos */}
				{filteredProducts && filteredProducts.length > 0 ? (
					<div className={styles.productsList}>
						{filteredProducts.map((product) => (
							<div
								key={product.id}
								className={styles.productCard}
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
								</div>
								<div className={styles.productInfo}>
									<h3 className={styles.productName}>
										{product.name}
									</h3>
									{product.description && (
										<p
											className={
												styles.productDescription
											}
										>
											{product.description}
										</p>
									)}
									<div className={styles.productFooter}>
										<span className={styles.productPrice}>
											{formatCurrency(
												Number(product.salePrice),
											)}
										</span>
										<button
											className={styles.addButton}
											onClick={() => addToCart(product)}
										>
											+ Adicionar
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className={styles.emptyState}>
						Nenhum produto disponível
					</div>
				)}

				{/* QR Code Section */}
				<div className={styles.qrSection}>
					<h3 className={styles.qrTitle}>📱 Compartilhe</h3>
					<div className={styles.qrCode}>
						<QRCodeSVG value={menuUrl} size={120} />
					</div>
				</div>
			</main>

			{/* Botão flutuante do carrinho */}
			{cart.length > 0 && (
				<button
					className={styles.cartFloatButton}
					onClick={() => setShowCart(true)}
				>
					🛒 <span className={styles.cartBadge}>{cartCount}</span>
					<span className={styles.cartTotal}>
						{formatCurrency(cartTotal)}
					</span>
				</button>
			)}

			{/* Modal do Carrinho */}
			{showCart && (
				<div
					className={styles.cartModal}
					onClick={() => setShowCart(false)}
				>
					<div
						className={styles.cartContent}
						onClick={(e) => e.stopPropagation()}
					>
						<div className={styles.cartHeader}>
							<h2>🛒 Seu Pedido</h2>
							<button
								className={styles.closeButton}
								onClick={() => setShowCart(false)}
							>
								×
							</button>
						</div>

						<div className={styles.cartBody}>
							{cart.map((item) => (
								<div
									key={item.product.id}
									className={styles.cartItem}
								>
									<div className={styles.cartItemInfo}>
										<span className={styles.cartItemName}>
											{item.product.name}
										</span>
										<span className={styles.cartItemPrice}>
											{formatCurrency(
												Number(item.product.salePrice) *
													item.quantity,
											)}
										</span>
									</div>
									<div className={styles.cartItemQty}>
										<button
											onClick={() =>
												updateQuantity(
													item.product.id,
													-1,
												)
											}
										>
											−
										</button>
										<span>{item.quantity}</span>
										<button
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
								</div>
							))}

							<div className={styles.cartDivider} />

							<div className={styles.cartForm}>
								<div className={styles.formGroup}>
									<label>Tipo de Pedido</label>
									<div className={styles.orderTypeButtons}>
										<button
											className={`${styles.orderTypeBtn} ${orderType === "DELIVERY" ? styles.active : ""}`}
											onClick={() =>
												setOrderType("DELIVERY")
											}
										>
											🛵 Delivery
										</button>
										<button
											className={`${styles.orderTypeBtn} ${orderType === "TAKEOUT" ? styles.active : ""}`}
											onClick={() =>
												setOrderType("TAKEOUT")
											}
										>
											🥡 Retirada
										</button>
									</div>
								</div>

								<div className={styles.formGroup}>
									<label>Seu Nome *</label>
									<input
										type="text"
										value={customerName}
										onChange={(e) =>
											setCustomerName(e.target.value)
										}
										placeholder="Digite seu nome"
										required
									/>
								</div>

								<div className={styles.formGroup}>
									<label>WhatsApp</label>
									<input
										type="tel"
										value={customerPhone}
										onChange={(e) =>
											setCustomerPhone(e.target.value)
										}
										placeholder="(00) 00000-0000"
									/>
								</div>

								<div className={styles.formGroup}>
									<label>Observações</label>
									<textarea
										value={notes}
										onChange={(e) =>
											setNotes(e.target.value)
										}
										placeholder="Alguma observação especial?"
									/>
								</div>
							</div>
						</div>

						<div className={styles.cartFooter}>
							<div className={styles.cartTotalRow}>
								<span>Total</span>
								<span className={styles.cartTotalValue}>
									{formatCurrency(cartTotal)}
								</span>
							</div>
							<button
								className={styles.checkoutButton}
								onClick={handleSubmitOrder}
								disabled={submitting || cart.length === 0}
							>
								{submitting
									? "Enviando..."
									: "📲 Enviar Pedido"}
							</button>
						</div>
					</div>
				</div>
			)}

			<footer className={styles.footer}>
				Cardápio Digital | Gestão ERP
			</footer>
		</div>
	);
}
