import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  Wallet2,
  Landmark,
  Scale,
  Coins,
  BarChart3,
  PieChart,
  TrendingUp,
  Loader,
  Search,
  ListFilter,
  SlidersHorizontal,
  MoreHorizontal,
  ChartSpline,
  X,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";

import { JiraPopover } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* =========================
   KPI GROUP
========================= */
const KpiGroup = React.memo(({ stats = {}, isFetching = false }) => {
  const safeValue = (val) => Number(val ?? 0);

  const cards = [
    { label: "Total Cotizaciones", value: safeValue(stats.total), icon: FileSpreadsheet, category: "Cantidad", unit: "Docs", bg: "bg-blue-50/50", text: "text-blue-700", border: "border-blue-100/60", iconBg: "bg-blue-100/50" },
    { label: "Monto Total S/.", value: safeValue(stats.montoTotalSoles), icon: Wallet2, category: "Ingresos PEN", unit: "Soles", bg: "bg-emerald-50/50", text: "text-emerald-700", border: "border-emerald-100/60", iconBg: "bg-emerald-100/50" },
    { label: "Monto Total $", value: safeValue(stats.montoTotalDolares), icon: Landmark, category: "Ingresos USD", unit: "Dólares", bg: "bg-violet-50/50", text: "text-violet-700", border: "border-violet-100/60", iconBg: "bg-violet-100/50" },
    { label: "Promedio S/.", value: safeValue(stats.promedioSoles), icon: Scale, category: "Ratio PEN", unit: "Soles", bg: "bg-rose-50/50", text: "text-rose-700", border: "border-rose-100/60", iconBg: "bg-rose-100/50" },
    { label: "Promedio $", value: safeValue(stats.promedioDolares), icon: Coins, category: "Ratio USD", unit: "Dólares", bg: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-100/60", iconBg: "bg-amber-100/50" },
  ];

  return (
    <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6 w-full">
      {isFetching && (
        <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[1px] rounded-[1.5rem] flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      )}
      {cards.map((kpi, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: idx * 0.03 }}
          className={`relative overflow-hidden p-4 rounded-[1.5rem] border shadow-sm flex flex-col justify-between min-h-[130px] ${kpi.bg} ${kpi.border}`}
        >
          <div className="flex justify-between items-start relative z-10">
            <div className={`p-2 rounded-xl ${kpi.iconBg}`}><kpi.icon className={`w-4 h-4 ${kpi.text}`} /></div>
            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-white/60 border ${kpi.border} ${kpi.text}`}>{kpi.category}</span>
          </div>
          <div className="mt-2 relative z-10">
            <p className={`text-[10px] font-bold uppercase tracking-tight opacity-70 ${kpi.text}`}>{kpi.label}</p>
            <div className="flex items-baseline gap-1.5">
              <h3 className={`text-2xl font-[1000] tracking-tighter leading-none ${kpi.text}`}>
                {kpi.value.toLocaleString("es-PE", { minimumFractionDigits: kpi.label.includes("Promedio") ? 2 : 0 })}
              </h3>
              <span className={`text-[9px] font-bold opacity-50 ${kpi.text}`}>{kpi.unit}</span>
            </div>
          </div>
          <kpi.icon className={`absolute -right-1 -bottom-1 w-16 h-16 opacity-[0.05] rotate-12 ${kpi.text}`} />
        </motion.div>
      ))}
    </div>
  );
});

/* =========================
   COMPONENTE PRINCIPAL
========================= */
export default function DashboardResumen({
  stats = {},
  estados = [],
  porArea = [],
  porProbabilidad = [],
  proximosVencimientos = [],
  isFetching = false,

  filterComponent, 
  activeFiltersCount = 0,
  onClearFilters
}) {
  const totalEstados = estados.reduce((sum, e) => sum + e.cantidad, 0);
  const [showFilters, setShowFilters] = useState(false);

  // Estados para interactividad
  const [activePieIndex, setActivePieIndex] = useState(null);
  const [activeBarIndex, setActiveBarIndex] = useState(null);
  const [activeArea, setActiveArea] = useState(null);
  const [activeProb, setActiveProb] = useState(null);
  const AREA_COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#6366f1",
    "#14b8a6",
    "#f97316",
    "#8b5cf6",
  ];

  const totalAreas = useMemo(() => {
    return porArea.reduce((acc, curr) => acc + curr.cantidad, 0);
  }, [porArea]);

  const totalProb = useMemo(() => {
    return porProbabilidad.reduce((acc, curr) => acc + curr.cantidad, 0);
  }, [porProbabilidad]);

  return (
    <div className="relative w-full pb-10">
      {/* TOOLBAR */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 bg-white/50 p-1.5 rounded-2xl border border-slate-100 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* BUSCADOR ESTILO JIRA */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Filtrar resumen..." 
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 transition-all h-10 text-sm rounded-xl shadow-sm"
            />
          </div>

          {/* FILTROS AVANZADOS */}
          <div className="flex items-center gap-2">
            <JiraPopover
              isOpen={showFilters}
              setIsOpen={setShowFilters}
              trigger={
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`font-bold flex gap-2 h-10 px-4 rounded-xl transition-all ${
                    showFilters || activeFiltersCount > 0
                      ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800' 
                      : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ListFilter className={`w-4 h-4 ${activeFiltersCount > 0 ? 'animate-pulse' : ''}`} />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-500 text-white rounded-full font-black">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              }
            >
              <div className="w-full p-2">
                {filterComponent}
              </div>
            </JiraPopover>

            {/* LIMPIAR FILTROS */}
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearFilters}
                className="h-10 px-3 text-rose-500 hover:bg-rose-50 rounded-xl font-bold text-xs transition-colors"
              >
                <X className="w-4 h-4 mr-1" />
                LIMPIAR
              </Button>
            )}
          </div>
        </div>

        {/* ACCIONES DE VISTA DERECHA */}
        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm transition-all">
            <ChartSpline className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm transition-all">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
          <div className="w-[1px] h-4 bg-slate-200 mx-1" />
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm transition-all">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
      
      <KpiGroup stats={stats} />

      {isFetching && (
        <div className="absolute inset-0 z-20 bg-white/40 backdrop-blur-[2px] flex items-center justify-center rounded-3xl">
          <Loader className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* --- GRÁFICO DE ESTADOS (DONUT) COMPACTO --- */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm h-full flex flex-col transition-all duration-300 hover:shadow-md"
        >
          {/* Cabecera más apretada */}
          <div className="mb-3 flex justify-between items-center">
            <div>
              <h4 className="text-[13px] font-[800] text-slate-800 tracking-tight">Resumen de estado</h4>
              <p className="text-[10px] text-slate-400 font-medium">Por tipo de envío.</p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Contenedor del Gráfico: Reducido de 220px a 160px */}
            <div className="lg:col-span-6 relative flex justify-center items-center">
              <div style={{ width: '100%', height: '160px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      activeIndex={activePieIndex}
                      data={estados}
                      dataKey="cantidad"
                      nameKey="estado"
                      outerRadius={70}  /* Reducido de 95 */
                      innerRadius={55}  /* Reducido de 78 */
                      paddingAngle={2}
                      stroke="none"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                      activeShape={(props) => (
                        <Sector {...props} outerRadius={props.outerRadius + 4} cornerRadius={3} />
                      )}
                    >
                      {estados.map((item, i) => (
                        <Cell 
                          key={i} 
                          fill={item.color} 
                          opacity={activePieIndex === null || activePieIndex === i ? 1 : 0.3}
                          className="transition-all duration-300 outline-none cursor-pointer"
                        />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              {/* Texto central más pequeño */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-[1000] text-slate-800 leading-none tracking-tighter">{totalEstados}</span>
                <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">Total</span>
              </div>
            </div>

            {/* Leyenda lateral más compacta */}
            <div className="lg:col-span-6 flex flex-col gap-1.5 pr-1">
              {estados.map((item, index) => (
                <div 
                  key={item.codigo} 
                  onMouseEnter={() => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(null)}
                  className={`flex items-center transition-all duration-200 cursor-pointer p-1 rounded-lg ${activePieIndex === index ? 'bg-slate-50 translate-x-1' : ''}`}
                >
                  <div className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ backgroundColor: item.color }} />
                  <span className={`text-[10px] truncate mr-2 ${activePieIndex === index ? 'font-bold text-slate-900' : 'font-medium text-slate-500'}`}>
                    {item.estado}
                  </span>
                  <span className="ml-auto text-[10px] font-[800] text-slate-700">{item.cantidad}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* --- GRÁFICO DE ÁREAS COMPACTO --- */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm h-full flex flex-col transition-all duration-300 hover:shadow-md"
        >
          {/* HEADER REDUCIDO */}
          <div className="mb-3 flex justify-between items-start">
            <div>
              <h4 className="text-[13px] font-[800] text-slate-800 tracking-tight">
                Cotizaciones por Área
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">
                Distribución por actividad.
              </p>
            </div>
          </div>

          {/* LISTA COMPACTA */}
          <div className="flex-1 flex flex-col gap-1 mt-1 pr-1 overflow-y-auto custom-scrollbar">
            {porArea.map((item, index) => {
              const porcentaje = totalAreas > 0 ? (item.cantidad / totalAreas) * 100 : 0;
              const color = AREA_COLORS[index % AREA_COLORS.length];
              const isActive = activeArea === index || activeArea === null;

              return (
                <div
                  key={index}
                  onMouseEnter={() => setActiveArea(index)}
                  onMouseLeave={() => setActiveArea(null)}
                  className={`cursor-pointer transition-all duration-200 rounded-lg p-1.5 ${
                    activeArea === index ? "bg-slate-50 translate-x-1" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* DOT MÁS PEQUEÑO */}
                    <div
                      className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                      style={{
                        backgroundColor: color,
                        opacity: isActive ? 1 : 0.25,
                      }}
                    />

                    {/* ÁREA CON TEXTO COMPACTO */}
                    <div className="flex flex-col min-w-[90px]">
                      <span className={`text-[10px] truncate ${
                        activeArea === index ? "font-bold text-slate-900" : "font-medium text-slate-500"
                      }`}>
                        {item.area}
                      </span>
                    </div>

                    {/* BARRA MÁS DELGADA (h-4 en lugar de h-6) */}
                    <div className="relative flex-1">
                      <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${porcentaje}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                            opacity: isActive ? 1 : 0.25,
                          }}
                        />
                      </div>
                    </div>

                    {/* VALORES ALINEADOS */}
                    <div className="text-right min-w-[45px]">
                      <span className="text-[10px] font-[800] text-slate-700 block leading-none">
                        {item.cantidad}
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold">
                        {Math.round(porcentaje)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* --- GRÁFICO DE PROBABILIDAD (VERTICAL SCORING) COMPACTO --- */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm h-full flex flex-col transition-all duration-300 hover:shadow-md"
        >
          {/* HEADER REDUCIDO */}
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h4 className="text-[13px] font-[800] text-slate-800 tracking-tight">
                Probabilidad de Cierre
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">
                Análisis de éxito según scoring.
              </p>
            </div>
          </div>

          {/* CONTENEDOR VERTICAL APRETADO */}
          <div className="flex-1 flex items-end justify-around gap-2 pb-1">
            {porProbabilidad.map((item, index) => {
              const porcentaje = totalProb > 0 ? (item.cantidad / totalProb) * 100 : 0;
              const isActive = activeProb === index || activeProb === null;

              return (
                <div
                  key={index}
                  onMouseEnter={() => setActiveProb(index)}
                  onMouseLeave={() => setActiveProb(null)}
                  className="flex flex-col items-center flex-1 h-full group max-w-[60px]"
                >
                  {/* VALOR SOBRE LA BARRA MÁS PEQUEÑO */}
                  <motion.span 
                    className={`text-[11px] font-[900] mb-1.5 transition-colors duration-300 ${
                      activeProb === index ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {item.cantidad}
                  </motion.span>

                  {/* COLUMNA VERTICAL MÁS ESTILIZADA */}
                  <div className="relative w-full flex-1 min-h-[100px] bg-slate-50 rounded-xl overflow-hidden border border-slate-100/50">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${porcentaje}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className="absolute bottom-0 w-full rounded-t-lg"
                      style={{
                        background: `linear-gradient(180deg, ${item.color}, ${item.color}dd)`,
                        opacity: isActive ? 1 : 0.4,
                      }}
                    >
                      {/* PORCENTAJE INTERNO MINI */}
                      {porcentaje > 20 && (
                        <div className="text-[8px] text-white font-bold text-center mt-1 opacity-90">
                          {Math.round(porcentaje)}%
                        </div>
                      )}
                    </motion.div>

                    {/* EFECTO GLOW */}
                    {activeProb === index && (
                      <motion.div
                        layoutId="verticalGlow"
                        className="absolute inset-0 ring-2 ring-inset z-10 rounded-xl"
                        style={{ ringColor: item.color }}
                      />
                    )}
                  </div>

                  {/* ETIQUETA INFERIOR COMPACTA */}
                  <div className="mt-2 flex flex-col items-center text-center">
                    <span className={`text-[9px] uppercase tracking-tighter leading-none font-[800] break-words w-full ${
                      activeProb === index ? "text-slate-800" : "text-slate-500"
                    }`}>
                      {item.label.split(' ')[0]} {/* Solo la primera palabra */}
                    </span>
                    <span className="text-[8px] font-bold text-slate-300 mt-0.5">
                      {item.label.match(/\((.*?)\)/)?.[0] || ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* --- COMPONENTE DE ALERTAS DE VENCIMIENTO COMPACTO --- */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-[1.5rem] p-4 shadow-sm h-full flex flex-col transition-all duration-300 hover:shadow-md"
        >
          {/* HEADER COMPACTO */}
          <div className="mb-4 flex justify-between items-center shrink-0">
            <div>
              <h4 className="text-[13px] font-[800] text-slate-800 tracking-tight">Vencimientos Próximos</h4>
              <p className="text-[10px] text-slate-400 font-medium">Prioridades de la semana</p>
            </div>
            <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-100">
              {proximosVencimientos.length} ALERTAS
            </span>
          </div>

          {/* CONTENEDOR CON SCROLL OPTIMIZADO */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-1 space-y-3 custom-scrollbar" style={{ maxHeight: '380px' }}>
            {proximosVencimientos.length > 0 ? (
              proximosVencimientos.map((item, index) => (
                <div key={index} className="relative pl-4 border-l border-slate-100 pb-1">
                  {/* DOT INDICATOR MÁS DISCRETO */}
                  <div className={`absolute -left-[4.5px] top-0.5 w-2 h-2 rounded-full shadow-sm ${
                    item.diasRestantes <= 3 ? 'bg-red-500' : 'bg-amber-400'
                  }`} />

                  <div className="group">
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 hover:border-slate-200 hover:bg-white transition-all duration-300 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[11px] text-slate-800 font-bold italic">
                          #{item.cod_cot}
                        </span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                          item.prioridad === 'URGENTE' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {item.prioridad}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-600 leading-tight mb-2">
                        Vence en <span className="font-extrabold text-slate-900">{item.diasRestantes} días</span>
                      </p>
                      
                      <div className="flex items-center text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                        <span className="truncate">{item.area_nombre}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
                <span className="text-2xl mb-1">✨</span>
                <p className="text-[11px] text-slate-500 font-bold">Todo al día</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* =========================
   EMPTY CHART
========================= */
function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[260px] text-slate-400 text-sm">
      Sin datos disponibles
    </div>
  );
}
