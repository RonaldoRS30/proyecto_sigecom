import React, { useState } from "react";
import { Package, Cpu, Factory, Zap, HardDrive, CpuIcon, Plus, Search } from "lucide-react";
import { ERPTable, ERPButton, ERPInput } from "@/components/ui/ERPComponents";

export default function CatalogoMarcas() {
  const [tabActiva, setTabActiva] = useState("rockwell");
  const [searchQuery, setSearchQuery] = useState("");

  const TABS = [
    { id: "rockwell", label: "Rockwell", icon: <Cpu size={14} /> },
    { id: "hoffman", label: "Hoffman", icon: <Factory size={14} /> },
    { id: "rittal", label: "Rittal", icon: <HardDrive size={14} /> },
    { id: "abb", label: "ABB", icon: <Zap size={14} /> },
    { id: "phoenix", label: "Phoenix Contact", icon: <CpuIcon size={14} /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Catálogo de Marcas</h1>
          <p className="text-sm text-gray-500 font-medium">Gestión técnica de inventario por fabricante</p>
        </div>
        <ERPButton icon={<Plus className="h-4 w-4" />}>
          Agregar Producto
        </ERPButton>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
        <ERPInput 
          placeholder="Buscar en el catálogo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="w-full lg:flex-1"
        />
        
        <div className="flex items-center space-x-1 overflow-x-auto w-full lg:w-auto no-scrollbar pb-1 lg:pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`whitespace-nowrap px-4 py-2 text-[10px] font-black rounded-lg transition-all flex items-center gap-2 uppercase tracking-widest ${
                tabActiva === tab.id 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ERPTable 
        headers={["P/N", "Descripción", "Unidad", "Precio Base", "Stock", "Estado"]}
      >
        <tr>
          <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
            <div className="flex flex-col items-center justify-center space-y-2">
              <Package className="h-10 w-10 text-gray-200" />
              <span className="text-sm font-medium">Cargando base de datos de {TABS.find(t => t.id === tabActiva)?.label}...</span>
            </div>
          </td>
        </tr>
      </ERPTable>
    </div>
  );
}