import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Login } from "./pages/Auth/Login";
import { Register } from "./pages/Auth/Register";
import { Orders } from "./pages/Orders/Orders";
import { Stock } from "./pages/Stock/Stock";
import { Menu } from "./pages/Menu/Menu";
import { PDV } from "./modules/PDV/PDV";
import { PublicMenu } from "./pages/PublicMenu/PublicMenu";
import SalonMenu from "./pages/PublicMenu/SalonMenu";
import { Reports } from "./modules/Reports/Reports";
import { Agenda } from "./pages/Salon/Agenda/Agenda";
import { Clients } from "./pages/Salon/Clients/Clients";
import { Services } from "./pages/Salon/Services/Services";
import { FarmDashboard, FarmProducts } from "./pages/Farm";
import { Agricultura } from "./pages/Farm/Agricultura/Agricultura";
import { Horticultura } from "./pages/Farm/Horticultura/Horticultura";
import { Pecuaria } from "./pages/Farm/Pecuaria/Pecuaria";
import { Piscicultura } from "./pages/Farm/Piscicultura/Piscicultura";
import { Granja } from "./pages/Farm/Granja/Granja";
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
			<Route path="/salao" element={<SalonMenu />} />

			{/* Login */}
			<Route
				path="/login"
				element={
					isAuthenticated ? <Navigate to="/" replace /> : <Login />
				}
			/>

			<Route
				path="/cadastro"
				element={
					isAuthenticated ? <Navigate to="/" replace /> : <Register />
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
				{/* Rotas Comuns / Restaurante */}
				<Route path="pdv" element={<PDV />} />
				<Route path="pedidos" element={<Orders />} />
				<Route path="estoque" element={<Stock />} />
				<Route path="produtos" element={<Menu />} />
				<Route path="relatorios" element={<Reports />} />

				{/* Rotas Salão */}
				<Route path="agenda" element={<Agenda />} />
				<Route path="clientes" element={<Clients />} />
				<Route path="servicos" element={<Services />} />

				{/* Rotas Fazenda */}
				<Route path="fazenda" element={<FarmDashboard />} />
				<Route path="fazenda/produtos" element={<FarmProducts />} />
				<Route path="fazenda/agricultura" element={<Agricultura />} />
				<Route path="fazenda/horticultura" element={<Horticultura />} />
				<Route path="fazenda/pecuaria" element={<Pecuaria />} />
				<Route path="fazenda/piscicultura" element={<Piscicultura />} />
				<Route path="fazenda/granja" element={<Granja />} />
			</Route>
		</Routes>
	);
}

export default App;
