import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import styles from "./Layout.module.css";

const navItems = [
	{ path: "/", label: "Dashboard", icon: "⚡" },
	{ path: "/pdv", label: "PDV", icon: "💳" },
	{ path: "/pedidos", label: "Pedidos", icon: "📝" },
	{ path: "/estoque", label: "Estoque", icon: "🏭" },
	{ path: "/produtos", label: "Produtos", icon: "🍱" },
	{ path: "/relatorios", label: "Relatórios", icon: "💹" },
];

const pageTitles: Record<string, string> = {
	"/": "Dashboard",
	"/pdv": "Ponto de Venda",
	"/pedidos": "Gestão de Pedidos",
	"/estoque": "Controle de Stock",
	"/produtos": "Produtos & Cardápio",
	"/relatorios": "Relatórios Financeiros",
};

export function Layout() {
	const { user, logout } = useAuth();
	const location = useLocation();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [activeSystem, setActiveSystem] = useState(() => {
		return localStorage.getItem("activeSystem") || "restaurante";
	});

	// Salva a preferência do sistema no localStorage
	useEffect(() => {
		localStorage.setItem("activeSystem", activeSystem);
	}, [activeSystem]);

	// Fecha o sidebar ao navegar em mobile
	useEffect(() => {
		setIsSidebarOpen(false);
	}, [location.pathname]);

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<div className={styles.layout}>
			{/* Overlay Mobile */}
			<div
				className={`${styles.overlay} ${isSidebarOpen ? styles.overlayOpen : ""}`}
				onClick={() => setIsSidebarOpen(false)}
			/>

			<aside
				className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}
			>
				<div className={styles.logo}>
					<div className={styles.logoText}>Gestão ERP</div>
					<div className={styles.logoSubtextWrapper}>
						<select
							className={styles.systemSelect}
							value={activeSystem}
							onChange={(e) => setActiveSystem(e.target.value)}
						>
							<option value="restaurante">Restaurante</option>
							<option value="salao">Salão de Beleza</option>
							<option value="fazenda">Gestão de Fazendas</option>
						</select>
					</div>
				</div>

				<nav className={styles.nav}>
					{navItems.map((item) => (
						<NavLink
							key={item.path}
							to={item.path}
							className={({ isActive }) =>
								`${styles.navItem} ${isActive ? styles.navItemActive : ""}`
							}
							end={item.path === "/"}
						>
							<span>{item.icon}</span>
							<span>{item.label}</span>
						</NavLink>
					))}
				</nav>

				{/* Link do Cardápio Público */}
				<div className={styles.qrLink}>
					<a
						href="/cardapio"
						target="_blank"
						rel="noopener noreferrer"
						className={styles.qrButton}
					>
						📱 Cardápio QR
					</a>
				</div>

				<div className={styles.userSection}>
					<div className={styles.userInfo}>
						<div className={styles.userAvatar}>
							{user?.name ? getInitials(user.name) : "U"}
						</div>
						<div>
							<div className={styles.userName}>{user?.name}</div>
							<div className={styles.userRole}>{user?.role}</div>
						</div>
					</div>
					<button className={styles.logoutBtn} onClick={logout}>
						Sair
					</button>
				</div>
			</aside>

			<div className={styles.main}>
				<header className={styles.header}>
					<div className={styles.headerTitleWrapper}>
						<button
							className={styles.menuButton}
							onClick={() => setIsSidebarOpen(!isSidebarOpen)}
							aria-label="Abrir Menu"
						>
							☰
						</button>
						<h1 className={styles.headerTitle}>
							{pageTitles[location.pathname] || "Gestão"}
						</h1>
					</div>
				</header>

				<main className={styles.content}>
					<Outlet />
				</main>
			</div>
		</div>
	);
}
