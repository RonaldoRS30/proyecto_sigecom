import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  UserSquare, 
  Building2, 
  Contact2, 
  Wallet, 
  Plus, 
  Search,
  Database,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TablaAreas from "./Tabla/TablaAreas";
import TablaCargos from "./Tabla/TablaCargos";
import TablaClientes from "./Tabla/TablaClientes";
import TablaRepresentantes from "./Tabla/TablaRepresentantes";

export default function EstructuraComercial() {
  const [tabActiva, setTabActiva] = useState("areas");

  const TABS = [
    { id: "areas", label: "Áreas", icon: <Briefcase size={16} />, desc: "Departamentos internos" },
    { id: "cargos", label: "Cargos", icon: <UserSquare size={16} />, desc: "Roles del personal" },
    { id: "proveedores", label: "Empresas Clientes", icon: <Building2 size={16} />, desc: "Base de datos de empresas" },
    { id: "representantes", label: "Representantes", icon: <Contact2 size={16} />, desc: "Contactos directos" },
    { id: "centros", label: "Centros de Costo", icon: <Wallet size={16} />, desc: "Seguimiento financiero" },
  ];

  // Renderizado condicional del contenido
  const renderContent = () => {
    switch (tabActiva) {
      case "areas":
        return <TablaAreas />;
      case "cargos":
        return <TablaCargos />;
      case "proveedores":
        return <TablaClientes />;
      case "representantes":
        return <TablaRepresentantes />;
      default:
        return (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-slate-400">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
              {TABS.find(t => t.id === tabActiva)?.icon}
            </div>
            <p className="text-sm font-medium">Contenedor para {tabActiva}</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full flex flex-col bg-white font-sans"
    >
      {/* HEADER TIPO JIRA */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 pt-4 flex flex-col gap-1">
        
        {/* BREADCRUMB & TÍTULO */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <nav className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              <span>Configuración</span>
              <span>/</span>
              <span>Tablas Maestras</span>
            </nav>

            <div className="flex items-center gap-2">
              <div className="bg-amber-500/10 text-amber-600 w-7 h-7 rounded-md flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-semibold text-slate-800 tracking-tight">
                Estructura y Comercial
              </h1>
            </div>
          </div>

          {/* ACCIÓN GLOBAL */}
          <div className="flex items-center gap-2">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium px-4 h-8 rounded-md flex items-center gap-2 shadow-sm transition">
              <Plus size={14} />
              Crear Nuevo
            </Button>
          </div>
        </div>

        {/* DESCRIPCIÓN DE LA SECCIÓN */}
        <div className="mt-2 flex items-center gap-2 text-slate-500 text-xs pb-1">
          <Info size={14} className="text-amber-500" />
          <p>Estas tablas definen la estructura organizacional y los actores comerciales principales.</p>
        </div>

        {/* SUBNAV (TABS) */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`group relative flex items-center gap-2 px-3 pb-3 text-sm font-medium transition-all outline-none ${
                  isActive ? "text-cyan-600" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`${isActive ? "text-cyan-600" : "text-slate-400 group-hover:text-slate-600"}`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeTabMaestra"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-cyan-600 rounded-t-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO DINÁMICO */}
      <div className="flex-1 min-h-0 overflow-hidden bg-slate-50/30 p-6">
        <div className="h-full bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          {renderContent()}
        </div>
      </div>
    </motion.div>
  );
}