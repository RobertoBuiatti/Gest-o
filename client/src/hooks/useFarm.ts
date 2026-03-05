import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

export function useFarm() {
	const queryClient = useQueryClient();

	// LIVESTOCK (PECUÁRIA)
	const useLivestock = (farmId: string) => {
		return useQuery({
			queryKey: ["farm-livestock", farmId],
			queryFn: async () => {
				const { data } = await api.get("/farm/livestock", {
					params: { farmId },
				});
				return data;
			},
			enabled: !!farmId,
		});
	};

	const useCreateAnimal = () => {
		return useMutation({
			mutationFn: async (animalData: any) => {
				const { data } = await api.post("/farm/livestock", animalData);
				return data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["farm-livestock"] });
			},
		});
	};

	// AGRICULTURE (AGRICULTURA)
	const useAgriculture = (farmId: string) => {
		return useQuery({
			queryKey: ["farm-agriculture", farmId],
			queryFn: async () => {
				const { data } = await api.get("/farm/agriculture", {
					params: { farmId },
				});
				return data;
			},
			enabled: !!farmId,
		});
	};

	const useCreateAgricultureCrop = () => {
		return useMutation({
			mutationFn: async (cropData: any) => {
				const { data } = await api.post("/farm/agriculture", cropData);
				return data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["farm-agriculture"],
				});
			},
		});
	};

	// HORTICULTURE (HORTICULTURA)
	const useHorticulture = (farmId: string) => {
		return useQuery({
			queryKey: ["farm-horticulture", farmId],
			queryFn: async () => {
				const { data } = await api.get("/farm/horticulture", {
					params: { farmId },
				});
				return data;
			},
			enabled: !!farmId,
		});
	};

	const useCreateHorticultureCrop = () => {
		return useMutation({
			mutationFn: async (cropData: any) => {
				const { data } = await api.post("/farm/horticulture", cropData);
				return data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["farm-horticulture"],
				});
			},
		});
	};

	// POULTRY (GRANJA)
	const usePoultry = (farmId: string) => {
		return useQuery({
			queryKey: ["farm-poultry", farmId],
			queryFn: async () => {
				const { data } = await api.get("/farm/poultry", {
					params: { farmId },
				});
				return data;
			},
			enabled: !!farmId,
		});
	};

	const useCreatePoultry = () => {
		return useMutation({
			mutationFn: async (poultryData: any) => {
				const { data } = await api.post("/farm/poultry", poultryData);
				return data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["farm-poultry"] });
			},
		});
	};

	// FISH FARMING (PISCICULTURA)
	const useFishTanks = (farmId: string) => {
		return useQuery({
			queryKey: ["farm-fish-tanks", farmId],
			queryFn: async () => {
				const { data } = await api.get("/farm/fish-farming/tanks", {
					params: { farmId },
				});
				return data;
			},
			enabled: !!farmId,
		});
	};

	const useCreateFishTank = () => {
		return useMutation({
			mutationFn: async (tankData: any) => {
				const { data } = await api.post(
					"/farm/fish-farming/tanks",
					tankData,
				);
				return data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: ["farm-fish-tanks"],
				});
			},
		});
	};

	// PRODUCTS
	const useProducts = (farmId?: string) => {
		return useQuery({
			queryKey: ["farm-products", farmId],
			queryFn: async () => {
				const { data } = await api.get("/farm/products", {
					params: { farmId },
				});
				return data;
			},
		});
	};

	const useCreateProduct = () => {
		return useMutation({
			mutationFn: async (productData: any) => {
				const { data } = await api.post("/farm/products", productData);
				return data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["farm-products"] });
			},
		});
	};

	const useSellProduct = () => {
		return useMutation({
			mutationFn: async ({ id, quantity, unitPrice }: any) => {
				const { data } = await api.post(`/farm/products/${id}/sell`, {
					quantity,
					unitPrice,
				});
				return data;
			},
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["farm-products"] });
			},
		});
	};

	return {
		useLivestock,
		useCreateAnimal,
		useAgriculture,
		useCreateAgricultureCrop,
		useHorticulture,
		useCreateHorticultureCrop,
		usePoultry,
		useCreatePoultry,
		useFishTanks,
		useCreateFishTank,
		useProducts,
		useCreateProduct,
		useSellProduct,
	};
}
