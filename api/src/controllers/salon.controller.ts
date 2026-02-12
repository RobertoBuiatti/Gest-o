import { Request, Response } from "express";
import { salonService } from "../services/salon.service";

export class SalonController {
	// CLIENTS
	async listClients(req: Request, res: Response) {
		try {
			const clients = await salonService.getClients();
			res.json(clients);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	async storeClient(req: Request, res: Response) {
		try {
			const client = await salonService.createClient(req.body);
			res.status(201).json(client);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	// SERVICES
	async listServices(req: Request, res: Response) {
		try {
			const services = await salonService.getServices();
			res.json(services);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	async storeService(req: Request, res: Response) {
		try {
			const service = await salonService.createService(req.body);
			res.status(201).json(service);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	async updateService(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const service = await salonService.updateService(id, req.body);
			res.json(service);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	// APPOINTMENTS
	async listAppointments(req: Request, res: Response) {
		try {
			const { start, end } = req.query;
			const appointments = await salonService.getAppointments(
				start ? new Date(start as string) : undefined,
				end ? new Date(end as string) : undefined,
			);
			res.json(appointments);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	async storeAppointment(req: any, res: Response) {
		try {
			const data = {
				...req.body,
				userId: req.body.userId || req.user?.id,
			};

			if (!data.userId) {
				throw new Error("ID do Profissional é obrigatório");
			}

			const appointment = await salonService.createAppointment(data);
			res.status(201).json(appointment);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}

	async listProfessionals(req: Request, res: Response) {
		try {
			const professionals = await salonService.getProfessionals();
			res.json(professionals);
		} catch (error: any) {
			res.status(500).json({ error: error.message });
		}
	}

	async updateStatus(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const { status } = req.body;
			const appointment = await salonService.updateAppointmentStatus(
				id,
				status,
			);
			res.json(appointment);
		} catch (error: any) {
			res.status(400).json({ error: error.message });
		}
	}
}
