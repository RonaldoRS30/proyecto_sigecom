import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader, Eye, Search, ListFilter, SlidersHorizontal, MoreHorizontal, ChartSpline, X, ChevronDown  } from "lucide-react";
import { JiraPopover } from "@/components/ui/popover";
import Table from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ENVIO_STATE_COLORS } from "@/components/ui/colors";

export default function TablaCoti({
  data = [],
  clientesMap = {},
  isFetching = false,
  onRowClick,
  getEnvioColor,
  getEnvioNombre,
  // PROPS PARA FILTROS
  filterComponent, 
  activeFiltersCount = 0,
  onClearFilters
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <>
      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-4 px-1">
        <div className="flex items-center gap-3">
          {/* BUSCADOR */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar en el backlog..." 
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all h-9 text-sm rounded-md shadow-sm"
            />
          </div>

          {/* FILTRO (USANDO TU COMPONENTE PERSONALIZADO) */}
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
                  Filtro
                  {activeFiltersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-teal-600 text-white rounded-full leading-none shadow-sm font-bold">
                      {activeFiltersCount}
                  </span>
                  )}
              </Button>
              }
          >
              <div className="w-full">
              {filterComponent}
              </div>
          </JiraPopover>

          {/* BOTÓN LIMPIAR FUERA */}
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

        {/* ICONOS DERECHA */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 transition-colors">
            <ChartSpline className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-slate-100 transition-colors">
            <MoreHorizontal className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block w-full flex-1 overflow-auto relative rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">

        {/* LOADING ENTERPRISE */}
        {isFetching && (
          <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-[2px] flex items-center justify-center transition-all">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Loader className="w-10 h-10 animate-spin text-teal-600" />
                <div className="absolute inset-0 rounded-full border-4 border-teal-100 opacity-20"></div>
              </div>
              <span className="text-[10px] font-[900] text-slate-500 uppercase tracking-[0.25em] animate-pulse">
                Sincronizando Datos
              </span>
            </div>
          </div>
        )}

        <Table
          /* CABECERAS */
          headers={[
            "Fecha",
            "Cotización",
            "Referencia",
            "Cliente / Representante",
            "Área",
            "Estado",
            "Importe",
            "",
          ].map((h) => (
            <span className="text-sm font-[950] py-1.5 uppercase tracking-[0.2em] text-slate-800 text-center block">
              {h}
            </span>
          ))}

          data={data}
          onRowClick={onRowClick}

          renderRow={(c) => [
            /* FECHA */
            <span className="text-xs font-semibold text-slate-800 tabular-nums text-center leading-none block w-full">
              {c.fecha}
            </span>,

            /* NUMERO */
            <span className="text-xs font-semibold text-slate-800 text-left tracking-tight uppercase leading-none block w-full">
              {c.numero}
            </span>,

            /* REFERENCIA */
            <span
              className="text-xs text-slate-800 font-semibold text-left truncate max-w-[400px] block leading-none w-full"
              title={c.referencia}
            >
              {c.referencia || "—"}
            </span>,

            /* CLIENTE */
            <div className="flex flex-col py-1 max-w-[300px] text-left leading-tight w-full">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-tight">
                {clientesMap[c.cliente_codigo] ?? "No Identificado"}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-teal-400" />
                <span className="text-[9px] font-bold text-teal-600/80 uppercase tracking-wide">
                  {c.cliente_nombre || "Sin asignar"}
                </span>
              </div>
            </div>,

            /* AREA */
            <div className="flex w-full">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-tight text-left bg-slate-50 px-2 py-[2px] rounded-md border border-slate-100">
                {c.area_nombre}
              </span>
            </div>,

            /* ESTADO */
            <span className="text-xs font-semibold uppercase tracking-wide text-left text-slate-800 leading-none block w-full">
              {c.estado_nombre}
            </span>,

            /* IMPORTE */
            <div className="text-center py-1 w-full">
              <span className="text-xs font-bold text-slate-800 tabular-nums">
                {c.tot_c}
              </span>
            </div>,

            /* ENVIO */
            <div className="flex items-center justify-start w-full">
              <div
                className="w-3.5 h-3.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] border border-white ring-1 ring-slate-200"
                style={{ backgroundColor: getEnvioColor?.(c.envio) }}
                title={getEnvioNombre?.(c.envio)}
              />
            </div>,
          ]}
        />
      </div>

      {/* MOBILE */}
      <div className="flex flex-col gap-3 md:hidden">
        {data.map((c) => (
          <motion.div
            key={c.numero}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onRowClick?.(c)}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md cursor-pointer transition"
          >
            <div className="font-semibold text-sm">{c.numero}</div>

            <div className="mt-2 flex flex-col gap-1 text-gray-600 text-xs">
              <div className="flex justify-between">
                <span>Fecha</span>
                <span>{c.fecha}</span>
              </div>

              <div className="flex justify-between">
                <span>Cliente</span>
                <span>{c.cliente_nombre}</span>
              </div>

              <div className="flex justify-between">
                <span>Estado</span>
                <span>{c.estado_nombre}</span>
              </div>

              <div className="flex justify-between font-semibold text-slate-800">
                <span>Importe</span>
                <span>{c.tot_c}</span>
              </div>
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
            //{ label: "Pendiente de Envio para Revision", color: ENVIO_STATE_COLORS["0"] },
            //{ label: "Pendiente de Envio para Aprobacion", color: ENVIO_STATE_COLORS["1"] },
            { label: "Pendiente de Envio para Cliente", color: ENVIO_STATE_COLORS["2"] },
            { label: "Enviado al Cliente", color: ENVIO_STATE_COLORS["3"] },
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
