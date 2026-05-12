import React, { useState } from "react";
import { FilePlus, Eye, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import Table from "@/components/ui/table";
import FilterCard from "@/components/ui/FilterCard";
import { getEstadoColor, getEstadoNombre } from "@/components/ui/colors";
import NuevaLogisticaModal from "@/modal/logistica/NuevaLogisticaModal";

export default function EntradaView({ data: movimientos = [], isFetching, onRefresh, onFilterChange }) {
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [logisticaSeleccionada, setLogisticaSeleccionada] = useState(null);
  const [openNueva, setOpenNueva] = useState(false);
  const currentYear = new Date().getFullYear().toString();

  const handleReport = (filters) => {
    const params = {
      anno: filters.anio || currentYear,
      mes: filters.mes || "%",
      cliente: filters.cliente || "%",
      estado: filters.estado || "%",
      referencia: filters.movimiento || "%",
      almacen: filters.area || "%",
      operacion: "E",
    };
    const API_URL = import.meta.env.VITE_API_URL;
    const query = new URLSearchParams(params).toString();
    window.open(`${API_URL}/cotizaciones/reportes/reporte_almacen_dashboard_html/?${query}`, "_blank");
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div className="w-full mb-4">
        <FilterCard
          dashboard="logistica"
          compact
          onProcess={async (filters) => {
            onFilterChange({
              anno: filters.anio || currentYear,
              mes: filters.mes || "%",
              cliente: filters.cliente || "%",
              estado: filters.estado || "%",
              referencia: filters.movimiento || "%",
              almacen: filters.area || "%",
            });
          }}
          onReport={handleReport}
        />
      </div>

      <div className="flex-1 overflow-auto relative rounded-xl border border-slate-200 bg-white shadow-sm min-h-[400px]">
        {isFetching && (
          <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        )}

        <Table
          headers={["Registro", "Fecha", "OCompra", "Código", "Nombre", "Factura", "Guía", "Soles", "Dólares", "", ""].map(h => (
            <span key={h} className="text-[10px] font-black uppercase tracking-wider text-slate-800 text-center block">
              {h}
            </span>
          ))}
          data={movimientos}
          onRowClick={(c) => {
            setLogisticaSeleccionada(c);
            setDetalleOpen(true);
          }}
          renderRow={(c) => [
            <span className="text-xs font-semibold text-slate-800 tabular-nums">{c.num_reg}</span>,
            <span className="text-xs font-semibold text-slate-800">{c.fec}</span>,
            <span className="text-xs font-semibold text-slate-800">{c.oco}</span>,
            <span className="text-xs font-semibold text-slate-800">{c.codigo}</span>,
            <span className="text-xs font-semibold text-slate-800 uppercase bg-slate-50 px-2 py-[2px] rounded-md border border-slate-100">{c.dor}</span>,
            <span className="text-xs font-semibold text-slate-800">{c.nfa}</span>,
            <span className="text-xs font-bold text-slate-800 tabular-nums">{c.ngu}</span>,
            <span className="text-xs font-bold text-slate-800 tabular-nums">{c.sol}</span>,
            <span className="text-xs font-bold text-slate-800 tabular-nums">{c.dol}</span>,
            <div className="flex justify-start">
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setLogisticaSeleccionada(c); setDetalleOpen(true); }} className="h-7 w-7 p-0 rounded-full hover:bg-teal-50 text-slate-400 hover:text-teal-600">
                <Eye className="w-4 h-4" />
              </Button>
            </div>,
            <div className="flex items-center justify-start">
              <div className="w-3 h-3 rounded-full border border-white ring-1 ring-slate-200" style={{ backgroundColor: getEstadoColor(c.est) }} title={getEstadoNombre(c.est)} />
            </div>,
          ]}
        />
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-xs text-slate-500 font-medium">
          Total: <span className="font-bold text-slate-800">{movimientos.length}</span> registros
        </span>
        <Button onClick={() => setOpenNueva(true)} className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-widest px-6 h-9 rounded-xl transition-all flex gap-2 shadow-lg shadow-teal-100">
          <FilePlus size={16} /> Nueva Entrada
        </Button>
      </div>

      <NuevaLogisticaModal open={openNueva} onClose={() => { setOpenNueva(false); onRefresh(); }} operacion="E" />
      {logisticaSeleccionada && (
        <NuevaLogisticaModal
          key={logisticaSeleccionada.num_reg}
          open={detalleOpen}
          onClose={() => setDetalleOpen(false)}
          logistica={logisticaSeleccionada}
          operacion="E"
          modo="V"
        />
      )}
    </div>
  );
}
