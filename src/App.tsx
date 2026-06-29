import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import VentaPage from '@/pages/VentaPage';
import CatalogoPage from '@/pages/CatalogoPage';
import DeudasPage from '@/pages/DeudasPage';
import ReportesPage from '@/pages/ReportesPage';
import BusquedaPage from '@/pages/BusquedaPage';
import ConfiguracionPage from '@/pages/ConfiguracionPage';
import TiendaPage from '@/pages/TiendaPage';

export default function App() {
  return (
    <Routes>
      {/* Public storefront - no login required */}
      <Route path="/tienda" element={<TiendaPage />} />

      {/* Auth page - standalone (no layout wrapper) */}
      <Route path="/" element={<AuthPage />} />

      {/* All other pages - wrapped in Layout */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/venta" element={<VentaPage />} />
        <Route path="/catalogo" element={<CatalogoPage />} />
        <Route path="/deudas" element={<DeudasPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/busqueda" element={<BusquedaPage />} />
        <Route path="/configuracion" element={<ConfiguracionPage />} />
        <Route path="/mas" element={<ConfiguracionPage />} />
      </Route>
    </Routes>
  );
}
