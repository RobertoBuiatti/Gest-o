import { useState } from "react";
import {
	useMutation,
	useQueryClient,
	useInfiniteQuery,
} from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../services/api";
import styles from "./Orders.module.css";

interface OrderItem {
	id: string;
	quantity: number;
	product: { id: string; name: string };
	unitPrice: number;
}

interface Order {
	id: string;
	orderNumber: number;
	status: string;
	type: string;
	tableNumber?: number;
	customerName?: string;
	customerPhone?: string;
	notes?: string;
	subtotal: number;
	discount: number;
	total: number;
	items: OrderItem[];
	createdAt: string;
}

const statusLabels: Record<string, { label: string; icon: string }> = {
	PENDING: { label: "Pendente", icon: "⏳" },
	CONFIRMED: { label: "Confirmado", icon: "✅" },
	PREPARING: { label: "Preparando", icon: "👨‍🍳" },
	READY: { label: "Pronto", icon: "🔔" },
	WAITING_PAYMENT: { label: "Aguardando Pagamento", icon: "💸" },
	DELIVERED: { label: "Entregue", icon: "📦" },
	PAID: { label: "Pago", icon: "💰" },
	CANCELLED: { label: "Cancelado", icon: "❌" },
};

// Fluxo simplificado de status (compatível com backend)
const statusFlow = ["PENDING", "PREPARING", "READY", "WAITING_PAYMENT", "PAID"];

const typeLabels: Record<string, string> = {
	SALAO: "🍽️ Salão",
	DINE_IN: "🍽️ Mesa",
	TAKEOUT: "🥡 Balcão",
	DELIVERY: "🛵 Entrega",
	IFOOD: "📱 iFood",
};

export function Orders() {
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [typeFilter, setTypeFilter] = useState<string>("");
	const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
	const queryClient = useQueryClient();

	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");

	// Hook para buscar pedidos paginados por status
	const useColumnOrders = (status: string) => {
		return useInfiniteQuery({
			queryKey: ["orders", status, typeFilter, startDate, endDate],
			queryFn: async ({ pageParam = 1 }) => {
				const params = new URLSearchParams({
					status,
					page: String(pageParam),
					limit: "10",
				});

				if (typeFilter) params.append("type", typeFilter);
				if (startDate) params.append("startDate", startDate);
				if (endDate) params.append("endDate", endDate);

				const response = await api.get(`/orders?${params.toString()}`);
				return response.data;
			},
			getNextPageParam: (lastPage) => {
				if (lastPage.meta.page < lastPage.meta.lastPage) {
					return lastPage.meta.page + 1;
				}
				return undefined;
			},
			initialPageParam: 1,
			refetchInterval: 10000,
		});
	};

	// Queries separadas por coluna
	const pendingQuery = useColumnOrders("PENDING");
	const preparingQuery = useColumnOrders("PREPARING");
	const readyQuery = useColumnOrders("READY");
	const waitingPaymentQuery = useColumnOrders("WAITING_PAYMENT");
	const paidQuery = useColumnOrders("PAID");

	// Função helper para extrair dados das queries infinitas
	const getOrdersFromQuery = (query: any): Order[] => {
		return query.data?.pages.flatMap((page: any) => page.data) || [];
	};

	const ordersByStatus = {
		PENDING: getOrdersFromQuery(pendingQuery),
		PREPARING: getOrdersFromQuery(preparingQuery),
		READY: getOrdersFromQuery(readyQuery),
		WAITING_PAYMENT: getOrdersFromQuery(waitingPaymentQuery),
		PAID: getOrdersFromQuery(paidQuery),
	};

	const updateStatusMutation = useMutation({
		mutationFn: async ({ id, status }: { id: string; status: string }) => {
			const response = await api.patch(`/orders/${id}/status`, {
				status,
			});
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["orders"] });
			queryClient.invalidateQueries({ queryKey: ["recent-orders"] });
		},
	});

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const formatDateTime = (dateStr: string) => {
		return new Date(dateStr).toLocaleString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusClass = (status: string) => {
		const classes: Record<string, string> = {
			PENDING: styles.statusPending,
			CONFIRMED: styles.statusConfirmed,
			PREPARING: styles.statusPreparing,
			READY: styles.statusReady,
			WAITING_PAYMENT: styles.statusWaitingPayment,
			DELIVERED: styles.statusDelivered,
			PAID: styles.statusPaid,
			CANCELLED: styles.statusCancelled,
		};
		return classes[status] || "";
	};

	const getNextStatus = (currentStatus: string) => {
		const idx = statusFlow.indexOf(currentStatus);
		return idx >= 0 && idx < statusFlow.length - 1
			? statusFlow[idx + 1]
			: null;
	};

	const handleAdvanceStatus = (order: Order) => {
		const nextStatus = getNextStatus(order.status);
		if (nextStatus) {
			updateStatusMutation.mutate({ id: order.id, status: nextStatus });
		}
	};

	const handleCancelOrder = (order: Order) => {
		if (confirm(`Deseja cancelar o pedido #${order.orderNumber}?`)) {
			updateStatusMutation.mutate({ id: order.id, status: "CANCELLED" });
		}
	};

	// Função para renderizar o rodapé da coluna (loading/load more)
	const renderColumnFooter = (query: any) => {
		if (query.isFetchingNextPage) {
			return <div className={styles.loadingMore}>Carregando mais...</div>;
		}
		if (query.hasNextPage) {
			return (
				<button
					className={styles.loadMoreButton}
					onClick={() => query.fetchNextPage()}
				>
					Carregar mais
				</button>
			);
		}
		return null;
	};

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.filters}>
					<select
						className={styles.select}
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
					>
						<option value="">Todos os status</option>
						<option value="PENDING">⏳ Pendente</option>
						<option value="PREPARING">👨‍🍳 Preparando</option>
						<option value="READY">🔔 Pronto</option>
						<option value="WAITING_PAYMENT">
							💸 Aguardando Pagamento
						</option>
						<option value="PAID">💰 Pago</option>
						<option value="CANCELLED">❌ Cancelado</option>
					</select>
					<select
						className={styles.select}
						value={typeFilter}
						onChange={(e) => setTypeFilter(e.target.value)}
					>
						<option value="">Todos os tipos</option>
						<option value="SALAO">🍽️ Salão</option>
						<option value="DELIVERY">🛵 Delivery</option>
						<option value="TAKEOUT">🥡 Balcão</option>
					</select>
					<div className={styles.dateFilter}>
						<input
							type="date"
							className={styles.dateInput}
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							placeholder="Data Início"
						/>
						<span className={styles.dateSeparator}>até</span>
						<input
							type="date"
							className={styles.dateInput}
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							placeholder="Data Fim"
						/>
					</div>
				</div>
				<Link to="/pdv" className={styles.newButton}>
					+ Novo Pedido
				</Link>
			</div>

			{/* Visão Kanban */}
			<div className={styles.kanbanBoard}>
				{/* Coluna Pendentes */}
				<div className={styles.kanbanColumn}>
					<div
						className={`${styles.kanbanHeader} ${styles.headerPending}`}
					>
						<span>⏳ Pendentes</span>
						<span className={styles.kanbanCount}>
							{ordersByStatus.PENDING.length}
						</span>
					</div>
					<div className={styles.kanbanCards}>
						{ordersByStatus.PENDING.map((order) => (
							<OrderCard
								key={order.id}
								order={order}
								onAdvance={handleAdvanceStatus}
								onCancel={handleCancelOrder}
								onSelect={setSelectedOrder}
								formatCurrency={formatCurrency}
								formatDateTime={formatDateTime}
								isUpdating={updateStatusMutation.isPending}
							/>
						))}
					</div>
				</div>

				{/* Coluna Preparando */}
				<div className={styles.kanbanColumn}>
					<div
						className={`${styles.kanbanHeader} ${styles.headerPreparing}`}
					>
						<span>👨‍🍳 Preparando</span>
						<span className={styles.kanbanCount}>
							{ordersByStatus.PREPARING.length}
						</span>
					</div>
					<div className={styles.kanbanCards}>
						{ordersByStatus.PREPARING.map((order) => (
							<OrderCard
								key={order.id}
								order={order}
								onAdvance={handleAdvanceStatus}
								onCancel={handleCancelOrder}
								onSelect={setSelectedOrder}
								formatCurrency={formatCurrency}
								formatDateTime={formatDateTime}
								isUpdating={updateStatusMutation.isPending}
							/>
						))}
					</div>
				</div>

				{/* Coluna Pronto */}
				<div className={styles.kanbanColumn}>
					<div
						className={`${styles.kanbanHeader} ${styles.headerReady}`}
					>
						<span>🔔 Pronto</span>
						<span className={styles.kanbanCount}>
							{ordersByStatus.READY.length}
						</span>
					</div>
					<div className={styles.kanbanCards}>
						{ordersByStatus.READY.map((order) => (
							<OrderCard
								key={order.id}
								order={order}
								onAdvance={handleAdvanceStatus}
								onCancel={handleCancelOrder}
								onSelect={setSelectedOrder}
								formatCurrency={formatCurrency}
								formatDateTime={formatDateTime}
								isUpdating={updateStatusMutation.isPending}
							/>
						))}
					</div>
				</div>

				{/* Coluna Aguardando Pagamento */}
				<div className={styles.kanbanColumn}>
					<div
						className={`${styles.kanbanHeader} ${styles.headerWaitingPayment}`}
					>
						<span>💸 Pagamento</span>
						<span className={styles.kanbanCount}>
							{ordersByStatus.WAITING_PAYMENT.length}
						</span>
					</div>
					<div className={styles.kanbanCards}>
						{ordersByStatus.WAITING_PAYMENT.map((order) => (
							<OrderCard
								key={order.id}
								order={order}
								onAdvance={handleAdvanceStatus}
								onCancel={handleCancelOrder}
								onSelect={setSelectedOrder}
								formatCurrency={formatCurrency}
								formatDateTime={formatDateTime}
								isUpdating={updateStatusMutation.isPending}
							/>
						))}
					</div>
				</div>

				{/* Coluna Finalizados */}
				<div className={styles.kanbanColumn}>
					<div
						className={`${styles.kanbanHeader} ${styles.headerPaid}`}
					>
						<span>💰 Finalizados</span>
						<span className={styles.kanbanCount}>
							{ordersByStatus.PAID.length}
						</span>
					</div>
					<div className={styles.kanbanCards}>
						{ordersByStatus.PAID.map((order) => (
							<OrderCard
								key={order.id}
								order={order}
								onAdvance={handleAdvanceStatus}
								onCancel={handleCancelOrder}
								onSelect={setSelectedOrder}
								formatCurrency={formatCurrency}
								formatDateTime={formatDateTime}
								isUpdating={updateStatusMutation.isPending}
								showActions={false}
							/>
						))}
						{renderColumnFooter(paidQuery)}
					</div>
				</div>
			</div>

			{/* Modal de Detalhes */}
			{selectedOrder && (
				<OrderDetailsModal
					order={selectedOrder}
					onClose={() => setSelectedOrder(null)}
					onAdvance={handleAdvanceStatus}
					onCancel={handleCancelOrder}
					formatCurrency={formatCurrency}
					formatDateTime={formatDateTime}
					getStatusClass={getStatusClass}
					statusLabels={statusLabels}
					getNextStatus={getNextStatus}
				/>
			)}
		</div>
	);
}

// Componente de Card de Pedido
function OrderCard({
	order,
	onAdvance,
	onCancel,
	onSelect,
	formatCurrency,
	formatDateTime,
	isUpdating,
	showActions = true,
}: {
	order: Order;
	onAdvance: (order: Order) => void;
	onCancel: (order: Order) => void;
	onSelect: (order: Order) => void;
	formatCurrency: (v: number) => string;
	formatDateTime: (d: string) => string;
	isUpdating: boolean;
	showActions?: boolean;
}) {
	return (
		<div className={styles.orderCard} onClick={() => onSelect(order)}>
			<div className={styles.orderHeader}>
				<div className={styles.orderNumber}>#{order.orderNumber}</div>
				<div className={styles.orderTime}>
					{formatDateTime(order.createdAt)}
				</div>
			</div>

			<div className={styles.orderType}>
				{typeLabels[order.type] || order.type}
				{order.tableNumber && ` • Mesa ${order.tableNumber}`}
			</div>

			<div className={styles.orderItems}>
				{order.items.slice(0, 2).map((item, idx) => (
					<div key={idx} className={styles.orderItem}>
						{item.quantity}x {item.product.name}
					</div>
				))}
				{order.items.length > 2 && (
					<div className={styles.orderItemMore}>
						+{order.items.length - 2} itens
					</div>
				)}
			</div>

			<div className={styles.orderFooter}>
				<span className={styles.orderTotal}>
					{formatCurrency(Number(order.total))}
				</span>
				{showActions &&
					order.status !== "CANCELLED" &&
					order.status !== "PAID" && (
						<div
							className={styles.orderActions}
							onClick={(e) => e.stopPropagation()}
						>
							<button
								className={styles.advanceBtn}
								onClick={() => onAdvance(order)}
								disabled={isUpdating}
							>
								▶️
							</button>
							<button
								className={styles.cancelBtn}
								onClick={() => onCancel(order)}
								disabled={isUpdating}
							>
								✕
							</button>
						</div>
					)}
			</div>
		</div>
	);
}

// Modal de Detalhes do Pedido
function OrderDetailsModal({
	order,
	onClose,
	onAdvance,
	onCancel,
	formatCurrency,
	formatDateTime,
	getStatusClass,
	statusLabels,
	getNextStatus,
}: {
	order: Order;
	onClose: () => void;
	onAdvance: (order: Order) => void;
	onCancel: (order: Order) => void;
	formatCurrency: (v: number) => string;
	formatDateTime: (d: string) => string;
	getStatusClass: (s: string) => string;
	statusLabels: Record<string, { label: string; icon: string }>;
	getNextStatus: (s: string) => string | null;
}) {
	const nextStatus = getNextStatus(order.status);

	return (
		<div className={styles.modal} onClick={onClose}>
			<div
				className={styles.modalContent}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={styles.modalHeader}>
					<div>
						<h2 className={styles.modalTitle}>
							Pedido #{order.orderNumber}
						</h2>
						<span
							className={`${styles.modalStatus} ${getStatusClass(order.status)}`}
						>
							{statusLabels[order.status]?.icon}{" "}
							{statusLabels[order.status]?.label}
						</span>
					</div>
					<button className={styles.closeButton} onClick={onClose}>
						×
					</button>
				</div>

				<div className={styles.modalBody}>
					<div className={styles.detailRow}>
						<span className={styles.detailLabel}>Tipo</span>
						<span>{typeLabels[order.type] || order.type}</span>
					</div>
					{order.tableNumber && (
						<div className={styles.detailRow}>
							<span className={styles.detailLabel}>Mesa</span>
							<span>{order.tableNumber}</span>
						</div>
					)}
					{order.customerName && (
						<div className={styles.detailRow}>
							<span className={styles.detailLabel}>Cliente</span>
							<span>{order.customerName}</span>
						</div>
					)}
					<div className={styles.detailRow}>
						<span className={styles.detailLabel}>Data/Hora</span>
						<span>{formatDateTime(order.createdAt)}</span>
					</div>

					<div className={styles.itemsSection}>
						<h3 className={styles.sectionTitle}>Itens do Pedido</h3>
						{order.items.map((item, idx) => (
							<div key={idx} className={styles.itemRow}>
								<span>
									{item.quantity}x {item.product.name}
								</span>
								<span>
									{formatCurrency(
										Number(item.unitPrice) * item.quantity,
									)}
								</span>
							</div>
						))}
					</div>

					<div className={styles.totalsSection}>
						<div className={styles.totalRow}>
							<span>Subtotal</span>
							<span>
								{formatCurrency(Number(order.subtotal))}
							</span>
						</div>
						{order.discount > 0 && (
							<div className={styles.totalRow}>
								<span>Desconto</span>
								<span className={styles.discount}>
									-{formatCurrency(Number(order.discount))}
								</span>
							</div>
						)}
						<div
							className={`${styles.totalRow} ${styles.grandTotal}`}
						>
							<span>Total</span>
							<span>{formatCurrency(Number(order.total))}</span>
						</div>
					</div>

					{order.notes && (
						<div className={styles.notesSection}>
							<h3 className={styles.sectionTitle}>Observações</h3>
							<p>{order.notes}</p>
						</div>
					)}
				</div>

				<div className={styles.modalActions}>
					{order.status !== "CANCELLED" &&
						order.status !== "PAID" && (
							<>
								{nextStatus && (
									<button
										className={styles.advanceButton}
										onClick={() => onAdvance(order)}
									>
										▶️ Avançar para{" "}
										{statusLabels[nextStatus]?.label}
									</button>
								)}
								<button
									className={styles.cancelButton}
									onClick={() => onCancel(order)}
								>
									❌ Cancelar Pedido
								</button>
							</>
						)}
				</div>
			</div>
		</div>
	);
}
