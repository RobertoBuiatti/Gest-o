import { useState } from "react";
import { useSalon } from "../../../hooks/useSalon";
import { useAuth } from "../../../hooks/useAuth";
import styles from "./Agenda.module.css";

export function Agenda() {
	const { user } = useAuth();
	const {
		useAppointments,
		useCreateAppointment,
		useClients,
		useServices,
		useUpdateAppointmentStatus,
		useProfessionals,
	} = useSalon();

	const [selectedDate, setSelectedDate] = useState<string>(
		new Date().toISOString().split("T")[0],
	);
	const { data: clients } = useClients();
	const { data: services } = useServices();
	const { data: professionals } = useProfessionals();
	const { data: appointments, isLoading } = useAppointments();
	const createAppointmentMutation = useCreateAppointment();
	const updateStatusMutation = useUpdateAppointmentStatus();

	const [isModalOpen, setIsModalOpen] = useState(false);

	const [formData, setFormData] = useState({
		date: selectedDate,
		time: "08:00",
		clientId: "",
		serviceId: "",
		userId: user?.id || "",
		notes: "",
	});

	const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const appointmentDate = new Date(
				`${formData.date}T${formData.time}`,
			);

			await createAppointmentMutation.mutateAsync({
				date: appointmentDate,
				clientId: formData.clientId,
				serviceId: formData.serviceId,
				userId: formData.userId,
				notes: formData.notes,
			});

			setIsModalOpen(false);
			setFormData({
				...formData,
				clientId: "",
				serviceId: "",
				notes: "",
			});
			alert("✅ Agendamento realizado com sucesso!");
		} catch (err: any) {
			console.error(err);
			alert(
				"Erro ao agendar: " +
					(err.response?.data?.error || err.message),
			);
		}
	};

	const handleUpdateStatus = async (id: string, status: string) => {
		if (status === "COMPLETED") {
			if (
				!confirm(
					"Confirmar a realização do serviço? Isso dará baixa automática nos insumos vinculados.",
				)
			)
				return;
		}
		try {
			await updateStatusMutation.mutateAsync({ id, status });
		} catch (err) {
			console.error(err);
		}
	};

	// Filtrar agendamentos do dia selecionado
	const sortedAppointments =
		appointments
			?.filter((app: any) => app.date?.split("T")[0] === selectedDate)
			.sort((a: any, b: any) =>
				(a.date || "").localeCompare(b.date || ""),
			) || [];

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<div className={styles.titleGroup}>
					<h2>📅 Agenda de Atendimentos</h2>
					<p className={styles.subtitle}>Gestão de Horários</p>
				</div>
				<div className={styles.actions}>
					<button
						className={styles.btnPrimary}
						onClick={() => setIsModalOpen(true)}
					>
						+ Novo Agendamento
					</button>
				</div>
			</header>

			<div className={styles.layout}>
				{/* LADO ESQUERDO: CALENDÁRIO DINÂMICO */}
				<div className={styles.calendarSection}>
					<div className={styles.calendarWrapper}>
						<div className={styles.monthSelector}>
							<button
								onClick={() => {
									const d = new Date(
										selectedDate + "T00:00:00",
									);
									d.setMonth(d.getMonth() - 1);
									setSelectedDate(
										d.toISOString().split("T")[0],
									);
								}}
							>
								◀
							</button>
							<h4>
								{new Date(
									selectedDate + "T00:00:00",
								).toLocaleDateString("pt-BR", {
									month: "long",
									year: "numeric",
								})}
							</h4>
							<button
								onClick={() => {
									const d = new Date(
										selectedDate + "T00:00:00",
									);
									d.setMonth(d.getMonth() + 1);
									setSelectedDate(
										d.toISOString().split("T")[0],
									);
								}}
							>
								▶
							</button>
						</div>
						<div className={styles.weekHeader}>
							{weekDays.map((day) => (
								<div key={day} className={styles.weekDay}>
									{day}
								</div>
							))}
						</div>
						<div className={styles.calendarGrid}>
							{(() => {
								const d = new Date(selectedDate + "T00:00:00");
								const firstDay = new Date(
									d.getFullYear(),
									d.getMonth(),
									1,
								);
								const lastDay = new Date(
									d.getFullYear(),
									d.getMonth() + 1,
									0,
								);
								const daysInMonth = lastDay.getDate();
								const startPad = firstDay.getDay();

								const cells = [];
								// Empty cells for padding
								for (let i = 0; i < startPad; i++) {
									cells.push(
										<div
											key={`pad-${i}`}
											className={styles.dayCellEmpty}
										></div>,
									);
								}
								// Day cells
								for (let day = 1; day <= daysInMonth; day++) {
									const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
									const isSelected = dateStr === selectedDate;
									const hasApps = appointments?.some(
										(app: any) =>
											app.date?.split("T")[0] === dateStr,
									);

									cells.push(
										<div
											key={day}
											className={`${styles.dayCell} ${isSelected ? styles.selectedDay : ""}`}
											onClick={() =>
												setSelectedDate(dateStr)
											}
										>
											<span className={styles.dayNumber}>
												{day}
											</span>
											{hasApps && (
												<div
													className={
														styles.dotIndicator
													}
												></div>
											)}
										</div>,
									);
								}
								return cells;
							})()}
						</div>
					</div>
				</div>

				{/* LADO DIREITO: LISTA DE AGENDAMENTOS (TIPO PEDIDOS) */}
				<div className={styles.listSection}>
					<div className={styles.listHeader}>
						<h3>
							Atendimentos:{" "}
							{new Date(
								selectedDate + "T00:00:00",
							).toLocaleDateString("pt-BR", {
								day: "2-digit",
								month: "long",
							})}
						</h3>
					</div>

					{isLoading ? (
						<div className={styles.loading}>Carregando...</div>
					) : (
						<div className={styles.appointmentList}>
							{sortedAppointments.length > 0 ? (
								sortedAppointments.map((app: any) => (
									<div
										key={app.id}
										className={`${styles.appCard} ${styles[`status${app.status}`]}`}
									>
										<div className={styles.appCardHeader}>
											<span className={styles.appTime}>
												{new Date(
													app.date,
												).toLocaleTimeString("pt-BR", {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
											<span
												className={`${styles.statusBadge} ${styles[app.status.toLowerCase()]}`}
											>
												{app.status === "SCHEDULED"
													? "Agendado"
													: app.status === "COMPLETED"
														? "Concluído"
														: "Cancelado"}
											</span>
										</div>

										<div className={styles.appCardBody}>
											<div className={styles.clientInfo}>
												<strong>
													{app.client.name}
												</strong>
												<span>{app.service.name}</span>
											</div>
											<div className={styles.priceInfo}>
												R${" "}
												{app.service.price.toFixed(2)}
											</div>
										</div>

										<div className={styles.appCardFooter}>
											<div className={styles.profInfo}>
												👤 {app.user.name}
											</div>
											{app.status === "SCHEDULED" && (
												<div
													className={
														styles.appActions
													}
												>
													<button
														className={
															styles.btnCancelApp
														}
														onClick={() =>
															handleUpdateStatus(
																app.id,
																"CANCELLED",
															)
														}
													>
														Cancelar
													</button>
													<button
														className={
															styles.btnCompleteApp
														}
														onClick={() =>
															handleUpdateStatus(
																app.id,
																"COMPLETED",
															)
														}
													>
														Concluir
													</button>
												</div>
											)}
										</div>
									</div>
								))
							) : (
								<p className={styles.emptyList}>
									Nenhum horário marcado para este dia.
								</p>
							)}
						</div>
					)}
				</div>
			</div>

			{isModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modal}>
						<h3>Novo Agendamento</h3>
						<form onSubmit={handleSubmit} className={styles.form}>
							<div className={styles.row}>
								<div className={styles.inputGroup}>
									<label>Data *</label>
									<input
										type="date"
										required
										value={formData.date}
										onChange={(e) =>
											setFormData({
												...formData,
												date: e.target.value,
											})
										}
									/>
								</div>
								<div className={styles.inputGroup}>
									<label>Hora *</label>
									<input
										type="time"
										required
										value={formData.time}
										onChange={(e) =>
											setFormData({
												...formData,
												time: e.target.value,
											})
										}
									/>
								</div>
							</div>

							<div className={styles.inputGroup}>
								<label>Cliente *</label>
								<select
									required
									value={formData.clientId}
									onChange={(e) =>
										setFormData({
											...formData,
											clientId: e.target.value,
										})
									}
									className={styles.select}
								>
									<option value="">
										Selecione o cliente
									</option>
									{clients?.map((cl: any) => (
										<option key={cl.id} value={cl.id}>
											{cl.name}
										</option>
									))}
								</select>
							</div>

							<div className={styles.inputGroup}>
								<label>Serviço *</label>
								<select
									required
									value={formData.serviceId}
									onChange={(e) =>
										setFormData({
											...formData,
											serviceId: e.target.value,
										})
									}
									className={styles.select}
								>
									<option value="">
										Selecione o serviço
									</option>
									{services?.map((sv: any) => (
										<option key={sv.id} value={sv.id}>
											{sv.name}
										</option>
									))}
								</select>
							</div>

							<div className={styles.inputGroup}>
								<label>Profissional *</label>
								<select
									required
									value={formData.userId}
									onChange={(e) =>
										setFormData({
											...formData,
											userId: e.target.value,
										})
									}
									className={styles.select}
								>
									<option value="">
										Selecione o profissional
									</option>
									{professionals?.map((pr: any) => (
										<option key={pr.id} value={pr.id}>
											{pr.name} ({pr.role})
										</option>
									))}
								</select>
							</div>

							<div className={styles.actions}>
								<button
									type="button"
									className={styles.btnCancel}
									onClick={() => setIsModalOpen(false)}
								>
									Cancelar
								</button>
								<button
									type="submit"
									className={styles.btnSubmit}
									disabled={
										createAppointmentMutation.isPending
									}
								>
									{createAppointmentMutation.isPending
										? "Agendando..."
										: "Confirmar"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
