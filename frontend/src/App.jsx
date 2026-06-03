// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "@/styles/Home.css";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import 'react-confirm-alert/src/react-confirm-alert.css';

import { AuthProvider } from "@/context/AuthContext.jsx";
import ProtectedRoute from "@/components/layout/ProtectedRoute.jsx";

// AUTH
import LoginPage from "@/auth/login/LoginPage.jsx";
import RegisterPage from "@/auth/register/RegisterPage.jsx";

// LAYOUT PRINCIPAL
import DashboardLayout from "@/dashboard/layout/DashboardLayout.jsx";
import GlobalNavbar from "@/dashboard/layout/GlobalNavbar.jsx";

// DASHBOARDS DE PRUEBA PARA COTIZACIONES
import CotizacionesHome from "./dashboard/comercial/Home/CotizacionesHome";
import AprobacionCotizacion from "./dashboard/comercial/AprobacionCotizacion";
import CotizacionDetallePage from "./dashboard/comercial/CotizacionDetallePage";
import LogisticaDashboard from "./dashboard/logistica/LogisticaDashboard";

// TABLAS
import EstructuraComercial from "./dashboard/Tablas/EstructuraComercial/EstructuraComercial";
import ParametrosVentas from "./dashboard/Tablas/ParametrosVentas/ParametrosVentas";
import CatalogoMarcas from "./dashboard/Tablas/CatalogoMarcas/CatalogoMarcas";
import GastosAnalisis from "./dashboard/Tablas/Gastos_Analisis/GastosAnalisis";

// MODAL NUEVA COTIZACIÓN
import CotizacionNuevaModal from "./modal/CotizacionNuevaModal";

import { KeyboardProvider } from "@/context/KeyboardContext.jsx";
import MockModulePage from "@/dashboard/layout/MockModulePage";
import * as Icons from "lucide-react";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <KeyboardProvider>

          <ToastContainer position="top-right" autoClose={3000} />

          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Base Protected Path */}
            <Route
              path="/sigecom/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Inicio */}
              <Route path="home" element={<CotizacionesHome />} />

              {/* Módulo Comercial (Agrupado) */}
              <Route path="comercial">
                {/* Listado principal: /sigecom/comercial */}
                <Route index element={<AprobacionCotizacion />} /> 
                
                {/* Detalle: /sigecom/comercial/2026000246 */}
                <Route path=":numReg" element={<CotizacionDetallePage />} />
                
                {/* Nueva: /sigecom/comercial/nueva */}
                <Route path="nueva" element={<CotizacionNuevaModal />} />
                
                {/* Oportunidad: /sigecom/comercial/oportunidad/:numReg */}
                <Route path="oportunidad/:numReg" element={<CotizacionDetallePage esOportunidad />} />
              </Route>

              {/* Módulo Maestro / Tablas */}
              <Route path="maestro">
                <Route path="catalogo" element={<CatalogoMarcas />} />
                <Route path="estructura" element={<EstructuraComercial />} />
                <Route path="parametros" element={<ParametrosVentas />} />
                <Route path="gastos" element={<GastosAnalisis />} />
              </Route>

              {/* Otros Módulos */}
              <Route path="proyectos" element={<MockModulePage title="Proyectos" />} />
              <Route path="compras" element={<MockModulePage title="Compras" />} />
              <Route path="almacen" element={<MockModulePage title="Almacén" />} />
              <Route path="finanzas" element={<MockModulePage title="Finanzas" />} />
              <Route path="audit" element={<MockModulePage title="Auditoría" />} />
            </Route>

            {/* Redirects actualizados */}
            <Route path="/" element={<Navigate to="/sigecom/comercial" replace />} />
            <Route path="*" element={<Navigate to="/sigecom/comercial" replace />} />
          </Routes>

        </KeyboardProvider>
      </AuthProvider>
    </Router>
  );
}
