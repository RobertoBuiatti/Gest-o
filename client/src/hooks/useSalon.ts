import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

export function useSalon() {
	const queryClient = useQueryClient();

	// CLIENTS
	const useClients = () => {
		return useQuery({
			queryKey: ["salon-clients"],
			queryFn: async () => {
				const { data } = await api.get("/salon/clients");
				return data;
			},
		});
	};

	const useCreateClient = () => {
		return useMutation({
			mutationFn: async (clientData: any) => {
				const { data } = await api.post("/salon/clients", clientData);
				return data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["salon-clients"] });
			},
		});
	};

	// SERVICES
	const useServices = () => {
		return useQuery({
			queryKey: ["salon-services"],
			queryFn: async () => {
				const { data } = await api.get("/salon/services");
				return data;
			},
		});
	};

	const useCreateService = () => {
		return useMutation({
			mutationFn: async (serviceData: any) => {
				const { data } = await api.post("/salon/services", serviceData);
				return data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["salon-services"] });
			},
		});
	};

	const useUpdateService = () => {
		return useMutation({
			mutationFn: async ({ id, ...serviceData }: any) => {
				const { data } = await api.put(
					`/salon/services/${id}`,
					serviceData,
				);
				return data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["salon-services"] });
			},
		});
	};

	// APPOINTMENTS
	const useAppointments = (start?: string, end?: string) => {
		return useQuery({
			queryKey: ["salon-appointments", start, end],
			queryFn: async () => {
				const { data } = await api.get("/salon/appointments", {
					params: { start, end },
				});
				return data;
			},
		});
	};

	const useCreateAppointment = () => {
		return useMutation({
			mutationFn: async (appointmentData: any) => {
				const { data } = await api.post(
					"/salon/appointments",
					appointmentData,
				);
				return data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["salon-appointments"],
				});
			},
		});
	};

	const useUpdateAppointmentStatus = () => {
		return useMutation({
			mutationFn: async ({ id, status }: any) => {
				const { data } = await api.patch(
					`/salon/appointments/${id}/status`,
					{ status },
				);
				return data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["salon-appointments"],
				});
			},
		});
	};

	const useProfessionals = () => {
		return useQuery({
			queryKey: ["salon-professionals"],
			queryFn: async () => {
				const { data } = await api.get("/salon/professionals");
				return data;
			},
		});
	};

	return {
		useClients,
		useCreateClient,
		useServices,
		useCreateService,
		useUpdateService,
		useAppointments,
		useCreateAppointment,
		useUpdateAppointmentStatus,
		useProfessionals,
	};
}
