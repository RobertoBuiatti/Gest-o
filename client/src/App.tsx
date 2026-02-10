import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Login } from "./pages/Auth/Login";
import { Orders } from "./pages/Orders/Orders";
import { Stock } from "./pages/Stock/Stock";
import { Menu } from "./pages/Menu/Menu";
import { PDV } from "./pages/PDV/PDV";
import { PublicMenu } from "./pages/PublicMenu/PublicMenu";
import { Reports } from "./pages/Reports/Reports";
import { useAuth } from "./hooks/useAuth";

function App() {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return <div>Carregando...</div>;
	}

	return (
		<Routes>
			{/* Rota pública - Cardápio Digital */}
			<Route path="/cardapio" element={<PublicMenu />} />

			{/* Login */}
			<Route
				path="/login"
				element={
					isAuthenticated ? <Navigate to="/" replace /> : <Login />
				}
			/>

			{/* Rotas protegidas */}
			<Route
				path="/"
				element={
					isAuthenticated ? (
						<Layout />
					) : (
						<Navigate to="/login" replace />
					)
				}
			>
				<Route index element={<Dashboard />} />
				<Route path="pdv" element={<PDV />} />
				<Route path="pedidos" element={<Orders />} />
				<Route path="estoque" element={<Stock />} />
				<Route path="produtos" element={<Menu />} />
				<Route path="relatorios" element={<Reports />} />
			</Route>
		</Routes>
	);
}

export default App;
