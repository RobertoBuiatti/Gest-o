import { prisma } from "../config/database";
import { getSystemContext } from "../config/context";

class SalonService {
	// CLIENTS
	async getClients() {
		return prisma.client.findMany({
			where: {
				system: getSystemContext(),
			},
			orderBy: { name: "asc" },
		});
	}

	async createClient(data: {
		name: string;
		email?: string;
		phone?: string;
		notes?: string;
	}) {
		return prisma.client.create({
			data: { ...data, system: getSystemContext() },
		});
	}

	// SERVICES
	async getServices() {
		return prisma.salonService.findMany({
			where: {
				system: getSystemContext(),
				isActive: true,
			},
			include: {
				category: true,
				requirements: {
					include: { ingredient: true },
				},
			},
			orderBy: { name: "asc" },
		});
	}

	async createService(data: {
		name: string;
		price: number;
		duration: number;
		description?: string;
		categoryId?: string;
		requirements?: Array<{
			ingredientId: string;
			quantity: number;
			unit?: string;
		}>;
	}) {
		const { requirements, ...serviceData } = data;

		return prisma.salonService.create({
			data: {
				...serviceData,
				system: getSystemContext(),
				requirements: requirements
					? {
							create: requirements,
						}
					: undefined,
			},
			include: {
				category: true,
				requirements: {
					include: { ingredient: true },
				},
			},
		});
	}

	async updateService(
		id: string,
		data: {
			name?: string;
			price?: number;
			duration?: number;
			description?: string;
			categoryId?: string;
			requirements?: Array<{
				ingredientId: string;
				quantity: number;
				unit?: string;
			}>;
		},
	) {
		const { requirements, ...serviceData } = data;

		return prisma.$transaction(async (tx) => {
			// Se houver novos requisitos, removemos os antigos e criamos os novos
			if (requirements) {
				await tx.salonServiceRequirement.deleteMany({
					where: { salonServiceId: id },
				});
			}

			return tx.salonService.update({
				where: { id },
				data: {
					...serviceData,
					requirements: requirements
						? {
								create: requirements,
							}
						: undefined,
				},
				include: {
					category: true,
					requirements: {
						include: { ingredient: true },
					},
				},
			});
		});
	}

	// APPOINTMENTS
	async getAppointments(startDate?: Date, endDate?: Date) {
		const where: any = {
			system: getSystemContext(),
		};

		if (startDate || endDate) {
			where.date = {
				...(startDate && { gte: startDate }),
				...(endDate && { lte: endDate }),
			};
		}

		return prisma.appointment.findMany({
			where,
			include: {
				client: true,
				service: {
					include: {
						category: true,
					},
				},
				user: {
					select: { id: true, name: true },
				},
			},
			orderBy: { date: "asc" },
		});
	}

	async createAppointment(data: {
		date: Date;
		notes?: string;
		clientId: string;
		serviceId: string;
		userId: string;
	}) {
		const system = getSystemContext();

		return prisma.$transaction(async (tx) => {
			// Validação de Cliente
			const client = await tx.client.findFirst({
				where: { id: data.clientId, system },
			});
			if (!client) {
				throw new Error("Cliente não encontrado");
			}

			// Validação de Serviço
			const service = await tx.salonService.findFirst({
				where: { id: data.serviceId, system, isActive: true },
			});
			if (!service) {
				throw new Error("Serviço não encontrado");
			}

			// Validação de Profissional (User)
			const user = await tx.user.findFirst({
				where: { id: data.userId, isActive: true },
			});
			if (!user) {
				throw new Error("Profissional não encontrado");
			}

			return tx.appointment.create({
				data: { ...data, system },
				include: {
					client: true,
					service: true,
					user: {
						select: { id: true, name: true },
					},
				},
			});
		});
	}

	async updateAppointmentStatus(id: string, status: string) {
		return prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.update({
        where: { id },
        data: { status },
        include: {
          client: true,
          service: {
            include: {
              requirements: {
                include: { ingredient: true },
              },
            },
          },
          user: {
            select: { id: true, name: true },
          },
        },
      });

			// Se o status for COMPLETED, realiza a baixa de estoque e registra transação financeira
			if (status === "COMPLETED") {
				// 1. Registra Transação Financeira
				await tx.transaction.create({
					data: {
						type: "INCOME",
						amount: appointment.service.price,
						fee: 0,
						netAmount: appointment.service.price,
						description: `Serviço: ${appointment.service.name} (Cli: ${appointment.client.name})`,
						system: "salao",
					},
				});

				// 2. Baixa de estoque
				if (appointment.service.requirements.length > 0) {
					for (const req of appointment.service.requirements) {
						// Busca saldo disponível (Almoxarifado ou o que tiver)
						const balance = await tx.stockBalance.findFirst({
							where: {
								ingredientId: req.ingredientId,
								quantity: { gte: req.quantity },
							},
						});

						if (balance) {
							// Atualiza saldo
							await tx.stockBalance.update({
								where: { id: balance.id },
								data: { quantity: { decrement: req.quantity } },
							});

							// Registra movimentação
							await tx.stockMovement.create({
								data: {
									ingredientId: req.ingredientId,
									fromSectorId: balance.sectorId,
									quantity: req.quantity,
									type: "EXIT",
									system: "salao",
									reason: `Serviço Realizado: ${appointment.service.name} (Cli: ${appointment.client?.name})`,
								},
							});
						}
					}
				}
			}

			return {
				...appointment,
				professional: appointment.user, // Mantém compatibilidade se o frontend esperar 'professional'
			};
		});
	}

	async getProfessionals() {
		return prisma.user.findMany({
			where: { isActive: true },
			select: { id: true, name: true, role: true },
			orderBy: { name: "asc" },
		});
	}
}

export const salonService = new SalonService();
