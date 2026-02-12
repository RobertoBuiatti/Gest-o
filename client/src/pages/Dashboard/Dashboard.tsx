import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../services/api";
import styles from "./Dashboard.module.css";
import { useSalon } from "../../hooks/useSalon";

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
	const activeSystem = localStorage.getItem("activeSystem") || "restaurante";
	const isSalon = activeSystem === "salao";
	const { useAppointments } = useSalon();

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

	// Infinite Query for Recent Orders (Restaurant)
	const { data: ordersData, isLoading: ordersLoading } = useInfiniteQuery({
		queryKey: ["recent-orders-dashboard"],
		enabled: !isSalon,
		queryFn: async ({ pageParam = 1 }) => {
			const response = await api.get(
				`/orders?page=${pageParam}&limit=10`,
			);
			return response.data;
		},
		getNextPageParam: (lastPage: any) => {
			if (lastPage.meta?.page < lastPage.meta?.lastPage) {
				return lastPage.meta.page + 1;
			}
			return undefined;
		},
		initialPageParam: 1,
	});

	// Appointments Query (Salon)
	const { data: appointments, isLoading: appointmentsLoading } =
		useAppointments(
			new Date().toISOString().split("T")[0], // Today
		);

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
				{isSalon ? (
					<>
						<Link
							to="/salao/agenda"
							className={styles.quickActionCard}
						>
							<span className={styles.quickActionIcon}>📅</span>
							<span className={styles.quickActionLabel}>
								Agenda
							</span>
						</Link>
						<Link
							to="/salao/clientes"
							className={styles.quickActionCard}
						>
							<span className={styles.quickActionIcon}>👥</span>
							<span className={styles.quickActionLabel}>
								Clientes
							</span>
						</Link>
						<Link
							to="/salao/servicos"
							className={styles.quickActionCard}
						>
							<span className={styles.quickActionIcon}>✂️</span>
							<span className={styles.quickActionLabel}>
								Serviços
							</span>
						</Link>
						<Link to="/estoque" className={styles.quickActionCard}>
							<span className={styles.quickActionIcon}>📦</span>
							<span className={styles.quickActionLabel}>
								Estoque
							</span>
						</Link>
					</>
				) : (
					<>
						<Link to="/pdv" className={styles.quickActionCard}>
							<span className={styles.quickActionIcon}>💰</span>
							<span className={styles.quickActionLabel}>
								Novo Pedido
							</span>
						</Link>
						<Link to="/estoque" className={styles.quickActionCard}>
							<span className={styles.quickActionIcon}>📦</span>
							<span className={styles.quickActionLabel}>
								Estoque
							</span>
						</Link>
						<a
							href="/cardapio"
							target="_blank"
							rel="noopener noreferrer"
							className={styles.quickActionCard}
						>
							<span className={styles.quickActionIcon}>📱</span>
							<span className={styles.quickActionLabel}>
								Cardápio QR
							</span>
						</a>
						<Link to="/produtos" className={styles.quickActionCard}>
							<span className={styles.quickActionIcon}>🍽️</span>
							<span className={styles.quickActionLabel}>
								Produtos
							</span>
						</Link>
					</>
				)}
			</div>

			{/* Metrics Grid */}
			<div className={styles.metricsGrid}>
				<div className={styles.metricCard}>
					<div className={styles.metricHeader}>
						<div
							className={`${styles.metricIcon} ${styles.iconBlue}`}
						>
							{isSalon ? "📅" : "📋"}
						</div>
					</div>
					<div className={styles.metricLabel}>
						{isSalon ? "Agendamentos" : "Total de Pedidos"}
					</div>
					<div className={styles.metricValue}>
						{isSalon
							? appointmentsLoading
								? "..."
								: appointments?.length || 0
							: metricsLoading
								? "..."
								: metrics?.totalOrders || 0}
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
				{/* Recent Activity Section */}
				<div className={styles.section}>
					{isSalon ? (
						<>
							<div className={styles.sectionHeader}>
								<h2 className={styles.sectionTitle}>
									📅 Agenda de Hoje
								</h2>
								<Link
									to="/salao/agenda"
									className={styles.sectionLink}
								>
									Ver Agenda →
								</Link>
							</div>
							<div className={styles.ordersList}>
								{appointmentsLoading ? (
									<div className={styles.loading}>
										Carregando...
									</div>
								) : appointments && appointments.length > 0 ? (
									appointments.map((app: any) => (
										<div
											key={app.id}
											className={styles.orderItem}
										>
											<div className={styles.orderInfo}>
												<span
													className={
														styles.orderNumber
													}
												>
													{app.client?.name ||
														"Cliente N/A"}
												</span>
												<span
													className={styles.orderType}
												>
													{app.service?.name ||
														"Serviço N/A"}
												</span>
											</div>
											<div className={styles.orderMeta}>
												<span
													className={`${styles.orderStatus} ${app.status === "COMPLETED" ? styles.success : styles.info}`}
												>
													{app.date
														? new Date(
																app.date,
															).toLocaleTimeString(
																[],
																{
																	hour: "2-digit",
																	minute: "2-digit",
																},
															)
														: "--:--"}
												</span>
												<span
													className={
														styles.orderTotal
													}
												>
													R${" "}
													{(
														app.service?.price || 0
													).toFixed(2)}
												</span>
											</div>
										</div>
									))
								) : (
									<div className={styles.emptyState}>
										Sem agendamentos hoje
									</div>
								)}
							</div>
						</>
					) : (
						<>
							<div className={styles.sectionHeader}>
								<h2 className={styles.sectionTitle}>
									🕐 Pedidos Recentes
								</h2>
								<Link
									to="/pedidos"
									className={styles.sectionLink}
								>
									Ver todos →
								</Link>
							</div>

							<div
								className={styles.ordersList}
								id="recent-orders-list"
							>
								{ordersLoading ? (
									<div className={styles.loading}>
										Carregando...
									</div>
								) : recentOrders && recentOrders.length > 0 ? (
									<>
										{recentOrders.map((order) => (
											<div
												key={order.id}
												className={styles.orderItem}
											>
												<div
													className={styles.orderInfo}
												>
													<span
														className={
															styles.orderNumber
														}
													>
														#
														{order.orderNumber ||
															order.id.slice(
																0,
																6,
															)}
													</span>
													<span
														className={
															styles.orderType
														}
													>
														{order.type === "SALAO"
															? `Mesa ${order.tableNumber}`
															: "🛵 Delivery"}
													</span>
												</div>
												<div
													className={styles.orderMeta}
												>
													<span
														className={`${styles.orderStatus} ${styles[statusColors[order.status]]}`}
													>
														{statusLabels[
															order.status
														] || order.status}
													</span>
													<span
														className={
															styles.orderTotal
														}
													>
														{formatCurrency(
															Number(order.total),
														)}
													</span>
												</div>
											</div>
										))}
									</>
								) : (
									<div className={styles.emptyState}>
										Nenhum pedido ainda
									</div>
								)}
							</div>
						</>
					)}
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
