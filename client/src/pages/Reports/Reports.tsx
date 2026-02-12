import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import styles from "./Reports.module.css";

interface MonthSummary {
	period: string;
	totalOrders: number;
	totalRevenue: number;
	totalCMV: number;
	cmvPercentage: string;
	grossProfit: number;
	totalFixedCosts: number;
	netProfit: number;
	profitMargin: string;
}

interface TopProduct {
	productId: string;
	productName: string;
	quantity: number;
	revenue: number;
}

interface OrderMarginDetail {
	id: string;
	orderNumber: number;
	total: number;
	cmv: number;
	margin: number;
}

interface DailyReport {
	date: string;
	totalOrders: number;
	totalRevenue: number;
	totalCMV: number;
	profit: number;
	averageTicket: number;
	orders: OrderMarginDetail[];
}

export function Reports() {
	const now = new Date();
	const [year, setYear] = useState(now.getFullYear());
	const [month, setMonth] = useState(now.getMonth() + 1);
	const queryClient = useQueryClient();

	const handleExport = async () => {
		try {
			const startDate = new Date(year, month - 1, 1).toISOString();
			const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

			const response = await api.get(
				`/reports/export?startDate=${startDate}&endDate=${endDate}`,
				{
					responseType: "blob",
				},
			);

			const url = window.URL.createObjectURL(new Blob([response.data]));
			const link = document.createElement("a");
			link.href = url;
			link.setAttribute(
				"download",
				`relatorio_${year}_${String(month).padStart(2, "0")}.xlsx`,
			);
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch (error) {
			console.error("Erro ao exportar Excel:", error);
			alert("Erro ao gerar arquivo Excel");
		}
	};

	const clearOrdersMutation = useMutation({
		mutationFn: async () => {
			await api.delete("/orders");
		},
		onSuccess: () => {
			alert("✅ Todos os pedidos foram removidos com sucesso!");
			queryClient.invalidateQueries();
		},
		onError: (error: any) => {
			alert(
				"Erro ao remover pedidos: " +
					(error.response?.data?.error || error.message),
			);
		},
	});

	const handleClearData = () => {
		if (
			confirm(
				"⚠️ ATENÇÃO: Esta ação removerá TODOS os pedidos e registros financeiros do sistema permanentemente!\n\nTem certeza que deseja continuar?",
			)
		) {
			if (
				confirm(
					"CONFIRMAÇÃO FINAL: Deseja realmente apagar todos os dados?",
				)
			) {
				clearOrdersMutation.mutate();
			}
		}
	};

	const { data: summary, isLoading: loadingSummary } = useQuery<MonthSummary>(
		{
			queryKey: ["month-summary", year, month],
			queryFn: async () => {
				const response = await api.get(
					`/reports/month-summary?year=${year}&month=${month}`,
				);
				return response.data;
			},
		},
	);

	const { data: topProducts, isLoading: loadingTop } = useQuery<TopProduct[]>(
		{
			queryKey: ["top-products", year, month],
			queryFn: async () => {
				const startDate = new Date(year, month - 1, 1).toISOString();
				const endDate = new Date(year, month, 0).toISOString();
				const response = await api.get(
					`/reports/top-products?startDate=${startDate}&endDate=${endDate}`,
				);
				return response.data;
			},
		},
	);

	const { data: dailyData, isLoading: loadingDaily } = useQuery<
		DailyReport[]
	>({
		queryKey: ["daily-report", year, month],
		queryFn: async () => {
			const startDate = new Date(year, month - 1, 1).toISOString();
			const endDate = new Date(year, month, 0).toISOString();
			const response = await api.get(
				`/reports/daily?startDate=${startDate}&endDate=${endDate}`,
			);
			return response.data;
		},
	});

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString("pt-BR");
	};

	const months = [
		"Janeiro",
		"Fevereiro",
		"Março",
		"Abril",
		"Maio",
		"Junho",
		"Julho",
		"Agosto",
		"Setembro",
		"Outubro",
		"Novembro",
		"Dezembro",
	];

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h1 className={styles.title}>📊 Relatórios Financeiros</h1>
				<div className={styles.filters}>
					<select
						className={styles.dateInput}
						value={month}
						onChange={(e) => setMonth(parseInt(e.target.value))}
					>
						{months.map((m, i) => (
							<option key={i} value={i + 1}>
								{m}
							</option>
						))}
					</select>
					<select
						className={styles.dateInput}
						value={year}
						onChange={(e) => setYear(parseInt(e.target.value))}
					>
						{Array.from(
							{ length: 5 },
							(_, i) => now.getFullYear() - 2 + i,
						).map((y) => (
							<option key={y} value={y}>
								{y}
							</option>
						))}
					</select>
				</div>

				<div className={styles.actions}>
					<button
						className={styles.exportButton}
						onClick={handleExport}
					>
						📥 Exportar Excel
					</button>
					<button
						className={styles.clearButton}
						onClick={handleClearData}
						disabled={clearOrdersMutation.isPending}
					>
						{clearOrdersMutation.isPending
							? "Limpando..."
							: "🗑️ Limpar Pedidos"}
					</button>
				</div>
			</div>

			{/* Summary Cards */}
			{loadingSummary ? (
				<div className={styles.loading}>Carregando...</div>
			) : (
				<div className={styles.summaryGrid}>
					<div className={styles.summaryCard}>
						<div className={styles.summaryLabel}>Faturamento</div>
						<div
							className={`${styles.summaryValue} ${styles.summaryValueBlue}`}
						>
							{formatCurrency(summary?.totalRevenue || 0)}
						</div>
						<div className={styles.summaryPercent}>
							{summary?.totalOrders || 0} pedidos
						</div>
					</div>

					<div className={styles.summaryCard}>
						<div className={styles.summaryLabel}>CMV (Custo)</div>
						<div
							className={`${styles.summaryValue} ${styles.summaryValueRed}`}
						>
							{formatCurrency(summary?.totalCMV || 0)}
						</div>
						<div className={styles.summaryPercent}>
							{summary?.cmvPercentage || 0}% do faturamento
						</div>
					</div>

					<div className={styles.summaryCard}>
						<div className={styles.summaryLabel}>Lucro Bruto</div>
						<div
							className={`${styles.summaryValue} ${styles.summaryValueGreen}`}
						>
							{formatCurrency(summary?.grossProfit || 0)}
						</div>
						<div className={styles.summaryPercent}>Após CMV</div>
					</div>

					<div className={styles.summaryCard}>
						<div className={styles.summaryLabel}>Lucro Líquido</div>
						<div
							className={`${styles.summaryValue} ${(summary?.netProfit || 0) >= 0 ? styles.summaryValueGreen : styles.summaryValueRed}`}
						>
							{formatCurrency(summary?.netProfit || 0)}
						</div>
						<div className={styles.summaryPercent}>
							Margem: {summary?.profitMargin || 0}%
						</div>
					</div>
				</div>
			)}

			<div className={styles.sectionsGrid}>
				{/* Top Products */}
				<div className={styles.section}>
					<h2 className={styles.sectionTitle}>
						🏆 Produtos Mais Vendidos
					</h2>
					{loadingTop ? (
						<div className={styles.loading}>Carregando...</div>
					) : topProducts && topProducts.length > 0 ? (
						<div className={styles.productsList}>
							{topProducts.map((product, index) => (
								<div
									key={product.productId}
									className={styles.productItem}
								>
									<div className={styles.productRank}>
										{index + 1}
									</div>
									<div className={styles.productInfo}>
										<div className={styles.productName}>
											{product.productName}
										</div>
										<div className={styles.productQuantity}>
											{product.quantity} unidades
										</div>
									</div>
									<div className={styles.productRevenue}>
										{formatCurrency(product.revenue)}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className={styles.emptyState}>
							Nenhuma venda no período
						</div>
					)}
				</div>

				{/* Daily Report */}
				<div className={styles.section}>
					<h2 className={styles.sectionTitle}>📅 Vendas por Dia</h2>
					{loadingDaily ? (
						<div className={styles.loading}>Carregando...</div>
					) : dailyData && dailyData.length > 0 ? (
						<div className={styles.dailyList}>
							<div
								className={`${styles.dailyItem} ${styles.dailyHeader}`}
							>
								<span>Data</span>
								<span>Pedidos</span>
								<span>Faturamento</span>
								<span>Lucro (Total)</span>
							</div>
							{dailyData.map((day) => (
								<div key={day.date} className={styles.dayGroup}>
									<div
										className={`${styles.dailyItem} ${styles.dailySummaryRow}`}
									>
										<span className={styles.dayDate}>
											{formatDate(day.date)}
										</span>
										<span>{day.totalOrders}</span>
										<span>
											{formatCurrency(day.totalRevenue)}
										</span>
										<span
											className={
												day.profit >= 0
													? styles.profitPositive
													: styles.profitNegative
											}
										>
											{formatCurrency(day.profit)}
										</span>
									</div>

									<div className={styles.orderBreakdown}>
										<div className={styles.breakdownHeader}>
											<span>Pedido</span>
											<span>Total</span>
											<span>Custo (CMV)</span>
											<span>Lucro</span>
										</div>
										{day.orders.map((order) => (
											<div
												key={order.id}
												className={styles.orderRow}
											>
												<span>
													Pedido #{order.orderNumber}
												</span>
												<span>
													{formatCurrency(
														order.total,
													)}
												</span>
												<span>
													{formatCurrency(order.cmv)}
												</span>
												<span
													className={
														order.margin >= 0
															? styles.profitPositive
															: styles.profitNegative
													}
												>
													{formatCurrency(
														order.margin,
													)}
												</span>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className={styles.emptyState}>
							Nenhuma venda no período
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
