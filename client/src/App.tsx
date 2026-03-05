import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Login } from "./pages/Auth/Login";
import { Orders } from "./pages/Orders/Orders";
import { Stock } from "./pages/Stock/Stock";
import { Menu } from "./pages/Menu/Menu";
import { PDV } from "./pages/PDV/PDV";
import { PublicMenu } from "./pages/PublicMenu/PublicMenu";
import SalonMenu from "./pages/PublicMenu/SalonMenu";
import { Reports } from "./pages/Reports/Reports";
import { Agenda } from "./pages/Salon/Agenda/Agenda";
import { Clients } from "./pages/Salon/Clients/Clients";
import { Services } from "./pages/Salon/Services/Services";
import { FarmDashboard, FarmProducts, FarmCrops, FarmAnimals } from "./pages/Farm";
import { Plantio, Colheita, Pecuaria, Piscicultura, Granja } from "./pages/Farm/AdditionalPages";
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
        <Route path="fazenda/plantio" element={<Plantio />} />
        <Route path="fazenda/colheita" element={<Colheita />} />
        <Route path="fazenda/pecuaria" element={<Pecuaria />} />
        <Route path="fazenda/piscicultura" element={<Piscicultura />} />
        <Route path="fazenda/granja" element={<Granja />} />
        <Route path="fazenda/animais" element={<FarmAnimals />} />
      </Route>
    </Routes>
  );
}

export default App;