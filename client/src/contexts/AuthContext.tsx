import {
	createContext,
	useState,
	useEffect,
	useCallback,
	ReactNode,
} from "react";
import api from "../services/api";

interface User {
	id: string;
	name: string;
	email: string;
	role: string;
}

interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

interface AuthContextData extends AuthState {
	login: (
		email: string,
		password: string,
	) => Promise<{ success: boolean; error?: string }>;
	logout: () => void;
}

export const AuthContext = createContext<AuthContextData>(
	{} as AuthContextData,
);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [data, setData] = useState<AuthState>(() => {
		const token = localStorage.getItem("token");
		const userStr = localStorage.getItem("user");

		if (token && userStr) {
			try {
				return {
					token,
					user: JSON.parse(userStr),
					isAuthenticated: true,
					isLoading: false,
				};
			} catch {
				return {
					token: null,
					user: null,
					isAuthenticated: false,
					isLoading: false,
				};
			}
		}

		return {
			token: null,
			user: null,
			isAuthenticated: false,
			isLoading: true, // Inicializa como true para verificar token no useEffect se necessário
		};
	});

	// Efeito adicional para limpar loading se não tiver dados iniciais
	useEffect(() => {
		if (data.isLoading) {
			const token = localStorage.getItem("token");
			const userStr = localStorage.getItem("user");

			if (!token || !userStr) {
				setData((prev) => ({ ...prev, isLoading: false }));
			}
		}
	}, []);

	const login = useCallback(async (email: string, password: string) => {
		try {
			const response = await api.post("/auth/login", { email, password });
			const { token, user } = response.data;

			localStorage.setItem("token", token);
			localStorage.setItem("user", JSON.stringify(user));

			setData({
				user,
				token,
				isAuthenticated: true,
				isLoading: false,
			});

			// Configurar header padrão para o axios se necessário (embora interceptor já o faça)
			// api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

			return { success: true };
		} catch (error: any) {
			return {
				success: false,
				error: error.response?.data?.error || "Erro ao fazer login",
			};
		}
	}, []);

	const logout = useCallback(() => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		setData({
			user: null,
			token: null,
			isAuthenticated: false,
			isLoading: false,
		});
	}, []);

	return (
		<AuthContext.Provider value={{ ...data, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
}
