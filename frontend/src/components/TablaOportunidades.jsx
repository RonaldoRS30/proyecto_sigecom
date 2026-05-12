import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader, Eye, Search, ListFilter, SlidersHorizontal, MoreHorizontal, Target, X, EllipsisVertical, RefreshCw } from "lucide-react";
import ActionMenu from "./ui/ActionMenu";
import { JiraPopover } from "@/components/ui/popover";
import Table from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OPORTUNDAD_STATE_COLORS } from "./ui/colors";

export default function TablaOportunidades({
  data = [],
  isFetching = false,
  onRowClick,
  // PROPS PARA FILTROS
  filterComponent, 
  activeFiltersCount = 0,
  onClearFilters
}) {
  const [showFilters, setShowFilters] = useState(false);

  // Helper para colores de probabilidad (Estilo semáforo)
  const getProbabilidadStyle = (prob) => {
    const p = prob?.toLowerCase();
    if (p === "alta") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (p === "media") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <>
      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar oportunidad..." 
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all h-9 text-sm rounded-md shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <JiraPopover
              isOpen={showFilters}
              setIsOpen={setShowFilters}
              trigger={
                <Button 
                  variant={showFilters ? "secondary" : "ghost"} 
                  size="sm" 
                  className={`font-semibold flex gap-2 h-9 transition-all duration-200 border ${
                    showFilters 
                      ? 'bg-slate-200 border-slate-300 text-slate-900 shadow-inner' 
                      : 'text-slate-600 border-transparent hover:bg-slate-100'
                  }`}
                >
                  <ListFilter className={`w-4 h-4 ${activeFiltersCount > 0 ? 'text-teal-600 fill-teal-600' : ''}`} />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-teal-600 text-white rounded-full leading-none shadow-sm font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              }
            >
              <div className="w-full">{filterComponent}</div>
            </JiraPopover>

            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearFilters}
                className="h-9 px-2 text-slate-400 hover:text-rose-500 transition-colors"
                title="Limpiar filtros"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 transition-colors" title="Ver Metas">
            <Target className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 transition-colors">
            <MoreHorizontal className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* TABLA DESKTOP */}
      <div className="hidden md:block w-full flex-1 overflow-auto relative rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
        
        {isFetching && (
          <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-10 h-10 animate-spin text-teal-600" />
              <span className="text-[10px] font-[900] text-slate-500 uppercase tracking-[0.25em] animate-pulse">Cargando Oportunidades</span>
            </div>
          </div>
        )}

        <Table
          headers={[
            "Código",
            "Recepción",
            "Cliente / Contacto",
            "Descripción de Oportunidad",
            "Área",
            "Responsable",
            "Comentarios",
            ""
          ].map((h) => (
            <span key={h} className="text-[10px] font-[950] py-2 uppercase tracking-[0.15em] text-slate-500 text-center block">
              {h}
            </span>
          ))}
          
          data={data}
          onRowClick={onRowClick}
          
          renderRow={(o) => [
            /* CÓDIGO - Identificador principal */
            <div className="flex justify-center">
              <span className={`text-[11px] font-bold px-2 py-1 rounded-md border tabular-nums ${
                o.numero 
                  ? 'text-teal-700 bg-teal-50 border-teal-100' 
                  : 'text-slate-400 bg-slate-50 border-slate-200 italic'
              }`}>
                {o.numero || "SIN CÓDIGO"}
              </span>
            </div>,

            /* RECEPCIÓN (f_recp) */
            <span className="text-xs font-semibold text-slate-600 text-center block tabular-nums">
              {o.f_recp || "---"}
            </span>,

            /* CLIENTE / CONTACTO (nombr / contac) */
            <div className="flex flex-col py-1 text-left leading-tight min-w-[200px]">
              <span className="text-xs font-bold text-slate-800 uppercase truncate">
                {o.nombr || "Cliente no registrado"}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-400" />
                <span className="text-[10px] font-medium text-slate-500 italic truncate">
                  {o.contac || "Sin contacto"}
                </span>
              </div>
            </div>,

            /* DESCRIPCIÓN (referencia) */
            <span 
              className="text-xs text-slate-600 font-medium text-left line-clamp-2 max-w-[300px] leading-snug block" 
              title={o.referencia}
            >
              {o.referencia || "Sin descripción"}
            </span>,

            /* ÁREA (area_nombre - propiedad calculada) */
            <div className="flex justify-center">
              <span className="text-[10px] font-extrabold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                {o.area_nombre}
              </span>
            </div>,

            /* RESPONSABLE (nombc) */
            <span className="text-[11px] font-semibold text-slate-700 text-center block">
              {o.nombc || "No asignado"}
            </span>,

            /* COMENTARIOS (comen) */
            <span className="text-[10px] text-slate-400 italic text-left truncate max-w-[150px] block">
              {o.coment || ""}
            </span>,

            /* ACCIÓN - Implementada con el nuevo componente ActionMenu */
            <div className="flex justify-center">
              <ActionMenu 
                title="Gestión de Oportunidad"
                options={[
                  { 
                    label: "Cambiar Estado", 
                    icon: RefreshCw, // Asegúrate de importar RefreshCw de lucide-react
                    onClick: () => handleCambiarEstado(o.num_reg_op) 
                  },
                  // Aquí es donde en el futuro solo agregas una línea más y listo:
                  // { label: "Ver PDF", icon: FileText, onClick: () => generarPDF(o.num_reg_op) },
                ]}
              />
            </div>
          ]}
        />
      </div>

      {/* MOBILE (Card Style) */}
      <div className="flex flex-col gap-3 md:hidden">
        {data.map((o) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => onRowClick?.(o)}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">#{o.id_oportunidad}</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getProbabilidadStyle(o.probabilidad)}`}>
                {o.probabilidad}
              </span>
            </div>
            <div className="font-bold text-sm text-slate-800 uppercase mb-1">{o.cliente_nombre}</div>
            <div className="text-xs text-slate-500 mb-3 line-clamp-1">{o.referencia}</div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
               <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{o.area_codigo}</span>
               <span className="font-bold text-slate-900">{o.moneda === 'D' ? '$' : 'S/'} {o.monto}</span>
            </div>
          </motion.div>
        ))}
      </div>

        {/* LEYENDA DE ESTADOS */}
        <div className="
          flex flex-wrap 
          justify-center md:justify-start 
          items-center 
          gap-3 md:gap-4 
          p-3 
          mt-4 
          rounded-xl 
          border border-gray-200 
          bg-white 
          shadow-sm 
          w-full
        ">
          {[
            { label: "Pendiente", color: OPORTUNDAD_STATE_COLORS["0"] },
            { label: "No Cotizado", color: OPORTUNDAD_STATE_COLORS["1"] },
            { label: "Rechazado", color: OPORTUNDAD_STATE_COLORS["2"] },
            { label: "Enviado", color: OPORTUNDAD_STATE_COLORS["3"] },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 min-w-[120px] md:min-w-[140px]">
              <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: color }}></span>
              <span className="text-gray-600 truncate text-xs md:text-[clamp(0.65rem, 1vw, 1rem)]">{label}</span>
            </div>
          ))}
        </div>
    </>
  );
}