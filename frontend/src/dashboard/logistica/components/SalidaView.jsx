import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FilePlus, Eye, Loader, Search, RefreshCw, FileDown } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Table from "@/components/ui/table";
import { getEstadoColor, getEstadoNombre } from "@/components/ui/colors";
import NuevaLogisticaModal from "@/modal/logistica/NuevaLogisticaModal";
import api from "@/services/api";

const CURRENT_YEAR = new Date().getFullYear().toString();
const MESES = [
  { value: "%", label: "Todos" },
  { value: "01", label: "Enero" },   { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },   { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },    { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },   { value: "08", label: "Agosto" },
  { value: "09", label: "Sep" },     { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },     { value: "12", label: "Dic" },
];

const monedaTabla = (tmo) => ({ S: "Soles", D: "Dólares" }[tmo] || tmo || ".");

export default function SalidaView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [anno, setAnno] = useState(CURRENT_YEAR);
  const [mes, setMes] = useState("%");
  const [almacen, setAlmacen] = useState("%");
  const [estado, setEstado] = useState("%");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [openNueva, setOpenNueva] = useState(false);

  const goToDetalle = (numReg) => navigate(`/sigecom/logistica/salidas/${numReg}`);

  const { data: almacenes = [] } = useQuery({
    queryKey: ["almacenes_new"],
    queryFn: () => api.get("logistica/dashboard/almacenes/").then(r => Array.isArray(r.data) ? r.data : []),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isFetching } = useQuery({
    queryKey: ["logistica_salidas", { anno, mes, almacen, estado, search }],
    queryFn: () =>
      api.get("logistica/dashboard/", {
        params: { operacion: "S", anno: anno || "%", mes: mes || "%", almacen: almacen || "%", estado: estado || "%", general: search || "" },
      }).then(r => r.data),
    staleTime: 30 * 1000,
  });

  const movimientos = (data?.tabla || []).filter(m => m.ope === "S");

  const onRefresh = () => queryClient.invalidateQueries({ queryKey: ["logistica_salidas"] });

  const handleReport = () => {
    const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    const params = new URLSearchParams({ anno: anno || "%", mes: mes || "%", almacen: almacen || "%", operacion: "S" });
    window.open(`${base}/api/cotizaciones/reportes/reporte_almacen_salidas_dashboard_html/?${params}`, "_blank");
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Filtros */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Anno</label>
          <input type="number" value={anno} onChange={e => setAnno(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Mes</label>
          <select value={mes} onChange={e => setMes(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
            {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Almacen</label>
          <select value={almacen} onChange={e => setAlmacen(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
            <option value="%">Todos</option>
            {almacenes.map(a => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Estado</label>
          <select value={estado} onChange={e => setEstado(e.target.value)}
            className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
            <option value="%">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="ANULADO">Anulado</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase">Busqueda</label>
          <div className="flex gap-1">
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && setSearch(searchInput)}
              placeholder="N, destinatario..." className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white" />
            <button onClick={() => setSearch(searchInput)} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Search size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-auto relative rounded-xl border border-slate-200 bg-white shadow-sm min-h-[400px]">
        {isFetching && (
          <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        )}
        <Table
          headers={["N° Registro", "Fecha", "O/Compra", "Nombre", "Factura", "Guia", "Almacen", "Mon.", "Soles", "Dolares", "", ""].map(h => (
            <span key={h} className="text-[10px] font-black uppercase tracking-wider text-slate-800 text-center block">{h}</span>
          ))}
          data={movimientos}
          onRowClick={c => goToDetalle(c.num_reg)}
          renderRow={c => [
            <span className="text-xs font-bold text-rose-700 tabular-nums">{c.num_reg}</span>,
            <span className="text-xs text-slate-700">{c.fec}</span>,
            <span className="text-xs text-slate-600">{c.oco || "."}</span>,
            <span className="text-xs font-semibold text-slate-800 uppercase">{c.dor || "."}</span>,
            <span className="text-xs text-slate-600">{c.nfa || "."}</span>,
            <span className="text-xs text-slate-600">{c.ngu || "."}</span>,
            <span className="text-xs text-slate-600">{c.nom_alm || "."}</span>,
            <span className="text-[10px] font-bold text-slate-400">{monedaTabla(c.tmo)}</span>,
            <span className="text-xs font-bold text-slate-800 tabular-nums">
              {c.sol != null ? Number(c.sol).toLocaleString("es-PE", { minimumFractionDigits: 2 }) : "."}</span>,
            <span className="text-xs font-bold text-slate-800 tabular-nums">
              {c.dol != null ? Number(c.dol).toLocaleString("es-PE", { minimumFractionDigits: 2 }) : "."}</span>,
            <div className="flex justify-center">
              <Button size="sm" variant="ghost"
                onClick={e => { e.stopPropagation(); goToDetalle(c.num_reg); }}
                className="h-7 w-7 p-0 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600">
                <Eye className="w-4 h-4" />
              </Button>
            </div>,
            <div className="flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border border-white ring-1 ring-slate-200"
                style={{ backgroundColor: getEstadoColor(c.est) }} title={getEstadoNombre(c.est)} />
            </div>,
          ]}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Total: <span className="font-bold text-slate-800">{movimientos.length}</span> registros
          </span>
          <button onClick={onRefresh} title="Actualizar" className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400">
            <RefreshCw size={13} />
          </button>
          <button onClick={handleReport} title="Reporte HTML" className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400">
            <FileDown size={13} />
          </button>
        </div>
        <Button onClick={() => setOpenNueva(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-widest px-6 h-9 rounded-xl transition-all flex gap-2 shadow-lg shadow-rose-100">
          <FilePlus size={16} /> Nueva Salida
        </Button>
      </div>

      {openNueva && (
        <NuevaLogisticaModal
          open={openNueva}
          onClose={() => { setOpenNueva(false); onRefresh(); }}
          operacion="S"
          modo="N"
        />
      )}
    </div>
  );
}
