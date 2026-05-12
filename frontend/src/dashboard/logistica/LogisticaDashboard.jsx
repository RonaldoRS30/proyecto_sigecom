import React, { useState, useMemo, useEffect } from "react";
import { Package, ArrowDownCircle, ArrowUpCircle, ClipboardList, LayoutDashboard, Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { ERPTable, ERPButton, ERPInput } from "@/components/ui/ERPComponents";

// Sub-componentes (assuming they will be updated later or kept as is)
import KardexView from "./components/KardexView";
import EntradaView from "./components/EntradaView";
import SalidaView from "./components/SalidaView";
import KpisLogistica from "@/components/KpisLogistica";

const fetchLogisticaDashboard = async ({ queryKey }) => {
  const [_key, params] = queryKey;
  const token = localStorage.getItem("access_token");
  const { data } = await api.get("logistica/dashboard/", {
    headers: { Authorization: `Bearer ${token}` },
    params: { ...params },
  });
  return {
    movimientos: Array.isArray(data?.tabla) ? data.tabla : [],
    stats: data.dashboard || {},
  };
};

export default function LogisticaDashboard() {
  const { authUser: user } = useAuth();
  const [tabActiva, setTabActiva] = useState("resumen");
  const [globalSearch, setGlobalSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["logistica_dashboard", { anno: new Date().getFullYear(), mes: "%" }],
    queryFn: fetchLogisticaDashboard,
  });

  const stats = data?.stats || {};
  const movimientos = data?.movimientos || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Módulo de Logística</h1>
          <p className="text-sm text-gray-500 font-medium">Gestión de almacén e inventarios</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {[
            { id: "resumen", label: "Resumen", icon: <LayoutDashboard size={14} /> },
            { id: "entrada", label: "Entrada", icon: <ArrowDownCircle size={14} /> },
            { id: "salida", label: "Salida", icon: <ArrowUpCircle size={14} /> },
            { id: "kardex", label: "Kardex", icon: <ClipboardList size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                tabActiva === tab.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
        {tabActiva === "resumen" && (
          <div className="p-6">
            <KpisLogistica stats={stats} isFetching={isLoading} />
          </div>
        )}
        
        {tabActiva === "entrada" && (
          <div className="p-0">
             <EntradaView 
               data={movimientos.filter(m => m.ope === "E")} 
               isFetching={isLoading} 
             />
          </div>
        )}
        
        {tabActiva === "salida" && (
          <div className="p-0">
             <SalidaView 
               data={movimientos.filter(m => m.ope === "S")} 
               isFetching={isLoading} 
             />
          </div>
        )}
        
        {tabActiva === "kardex" && (
          <div className="p-6">
             <KardexView />
          </div>
        )}
      </div>
    </div>
  );
}
