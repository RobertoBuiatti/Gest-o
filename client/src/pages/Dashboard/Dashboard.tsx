import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../services/api";
import styles from "./Dashboard.module.css";

interface Metrics {
	totalOrders: number;
	totalRevenue: number;
	averageTicket: number;
	cmv: string;
	margin: string;
}

interface CriticalItem {
	ingredient: { id: string; name: string; unit: string; minStock: number };
	sector: { id: string; name: string };
	currentStock: number;
	deficit: number;
}

interface Order {
	id: string;
	orderNumber?: number;
	status: string;
	type: string;
	total: number;
	tableNumber?: number;
	createdAt: string;
}

const statusLabels: Record<string, string> = {
	PENDING: "⏳ Pendente",
	PREPARING: "👨‍🍳 Preparando",
	READY: "✅ Pronto",
	DELIVERED: "📦 Entregue",
	PAID: "💰 Pago",
	CANCELLED: "❌ Cancelado",
};

const statusColors: Record<string, string> = {
	PENDING: "warning",
	PREPARING: "info",
	READY: "success",
	DELIVERED: "success",
	PAID: "success",
	CANCELLED: "danger",
};

import { SystemStatus } from "../../components/SystemStatus/SystemStatus";

export function Dashboard() {
	const { data: metrics, isLoading: metricsLoading } = useQuery<Metrics>({
		queryKey: ["metrics"],
		queryFn: async () => {
			const response = await api.get("/orders/metrics");
			return response.data;
		},
	});

	const { data: criticalStock, isLoading: criticalLoading } = useQuery<
		CriticalItem[]
	>({
		queryKey: ["critical-stock"],
		queryFn: async () => {
			const response = await api.get("/stock/critical");
			return response.data;
		},
	});

	// Infinite Query for Recent Orders
	const {
		data: ordersData,
		isLoading: ordersLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ["recent-orders-dashboard"],
		queryFn: async ({ pageParam = 1 }) => {
			const response = await api.get(
				`/orders?page=${pageParam}&limit=10`,
			); // Increased limit for better scroll feel
			return response.data;
		},
		getNextPageParam: (lastPage: any) => {
			if (lastPage.meta.page < lastPage.meta.lastPage) {
				return lastPage.meta.page + 1;
			}
			return undefined;
		},
		initialPageParam: 1,
	});

	const recentOrders =
		ordersData?.pages.flatMap((page: any) => page.data) || [];

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	return (
		<div className={styles.dashboard}>
			<SystemStatus />
			{/* Quick Actions */}
			<div className={styles.quickActions}>
				<Link to="/pdv" className={styles.quickActionCard}>
					<span className={styles.quickActionIcon}>💰</span>
					<span className={styles.quickActionLabel}>Novo Pedido</span>
				</Link>
				<Link to="/estoque" className={styles.quickActionCard}>
					<span className={styles.quickActionIcon}>📦</span>
					<span className={styles.quickActionLabel}>Estoque</span>
				</Link>
				<a
					href="/cardapio"
					target="_blank"
					rel="noopener noreferrer"
					className={styles.quickActionCard}
				>
					<span className={styles.quickActionIcon}>📱</span>
					<span className={styles.quickActionLabel}>Cardápio QR</span>
				</a>
				<Link to="/produtos" className={styles.quickActionCard}>
					<span className={styles.quickActionIcon}>🍽️</span>
					<span className={styles.quickActionLabel}>Produtos</span>
				</Link>
			</div>

			{/* Metrics Grid */}
			<div className={styles.metricsGrid}>
				<div className={styles.metricCard}>
					<div className={styles.metricHeader}>
						<div
							className={`${styles.metricIcon} ${styles.iconBlue}`}
						>
							📋
						</div>
					</div>
					<div className={styles.metricLabel}>Total de Pedidos</div>
					<div className={styles.metricValue}>
						{metricsLoading ? "..." : metrics?.totalOrders || 0}
					</div>
					<div className={styles.metricSubtext}>Hoje</div>
				</div>

				<div className={styles.metricCard}>
					<div className={styles.metricHeader}>
						<div
							className={`${styles.metricIcon} ${styles.iconGreen}`}
						>
							💰
						</div>
					</div>
					<div className={styles.metricLabel}>Faturamento</div>
					<div className={styles.metricValue}>
						{metricsLoading
							? "..."
							: formatCurrency(metrics?.totalRevenue || 0)}
					</div>
					<div className={styles.metricSubtext}>Hoje</div>
				</div>

				<div className={styles.metricCard}>
					<div className={styles.metricHeader}>
						<div
							className={`${styles.metricIcon} ${styles.iconOrange}`}
						>
							🎫
						</div>
					</div>
					<div className={styles.metricLabel}>Ticket Médio</div>
					<div className={styles.metricValue}>
						{metricsLoading
							? "..."
							: formatCurrency(metrics?.averageTicket || 0)}
					</div>
					<div className={styles.metricSubtext}>Por pedido</div>
				</div>

				<div className={styles.metricCard}>
					<div className={styles.metricHeader}>
						<div
							className={`${styles.metricIcon} ${styles.iconRed}`}
						>
							📊
						</div>
					</div>
					<div className={styles.metricLabel}>CMV</div>
					<div className={styles.metricValue}>
						{metricsLoading ? "..." : `${metrics?.cmv || 0}%`}
					</div>
					<div className={styles.metricSubtext}>
						Margem: {metrics?.margin || 0}%
					</div>
				</div>
			</div>

			<div className={styles.sectionsGrid}>
				{/* Recent Orders - Infinite Scroll */}
				<div className={styles.section}>
					<div className={styles.sectionHeader}>
						<h2 className={styles.sectionTitle}>
							🕐 Pedidos Recentes
						</h2>
						<Link to="/pedidos" className={styles.sectionLink}>
							Ver todos →
						</Link>
					</div>

					<div className={styles.ordersList} id="recent-orders-list">
						{ordersLoading ? (
							<div className={styles.loading}>Carregando...</div>
						) : recentOrders && recentOrders.length > 0 ? (
							<>
								{recentOrders.map((order) => (
									<div
										key={order.id}
										className={styles.orderItem}
									>
										<div className={styles.orderInfo}>
											<span
												className={styles.orderNumber}
											>
												#
												{order.orderNumber ||
													order.id.slice(0, 6)}
											</span>
											<span className={styles.orderType}>
												{order.type === "SALAO"
													? `Mesa ${order.tableNumber}`
													: "🛵 Delivery"}
											</span>
										</div>
										<div className={styles.orderMeta}>
											<span
												className={`${styles.orderStatus} ${styles[statusColors[order.status]]}`}
											>
												{statusLabels[order.status] ||
													order.status}
											</span>
											<span className={styles.orderTotal}>
												{formatCurrency(
													Number(order.total),
												)}
											</span>
										</div>
									</div>
								))}
								{hasNextPage && (
									<button
										className={styles.loadMoreButton}
										onClick={() => fetchNextPage()}
										disabled={isFetchingNextPage}
									>
										{isFetchingNextPage
											? "Carregando..."
											: "Carregar mais"}
									</button>
								)}
							</>
						) : (
							<div className={styles.emptyState}>
								Nenhum pedido ainda
							</div>
						)}
					</div>
				</div>

				{/* Critical Stock */}
				<div className={styles.section}>
					<div className={styles.sectionHeader}>
						<h2 className={styles.sectionTitle}>
							⚠️ Estoque Crítico
						</h2>
						<Link to="/estoque" className={styles.sectionLink}>
							Gerenciar →
						</Link>
					</div>

					{criticalLoading ? (
						<div className={styles.loading}>Carregando...</div>
					) : criticalStock && criticalStock.length > 0 ? (
						<div className={styles.criticalList}>
							{criticalStock.map((item) => (
								<div
									key={`${item.ingredient.id}-${item.sector.id}`}
									className={styles.criticalItem}
								>
									<div className={styles.criticalItemInfo}>
										<span
											className={styles.criticalItemName}
										>
											{item.ingredient.name}
										</span>
										<span
											className={
												styles.criticalItemSector
											}
										>
											{item.sector.name}
										</span>
									</div>
									<div className={styles.criticalItemStock}>
										<div
											className={
												styles.criticalItemQuantity
											}
										>
											{item.currentStock.toFixed(2)}{" "}
											{item.ingredient.unit}
										</div>
										<div className={styles.criticalItemMin}>
											Mín: {item.ingredient.minStock}{" "}
											{item.ingredient.unit}
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className={styles.emptyState}>
							✅ Todos os itens estão com estoque adequado
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
