import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Scale,
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  Users,
  Search,
  ListFilter,
  X,
  Loader
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart as RePieChart,
  Pie,
  Sector
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JiraPopover } from "@/components/ui/popover";

const KpiGroup = React.memo(({ stats = {}, isFetching = false }) => {
  const safeValue = (val) => Number(val ?? 0);

  const cards = [
    { label: "Movimientos Totales", value: safeValue(stats.total), icon: Package, category: "Actividad", unit: "Regs", bg: "bg-teal-50/50", text: "text-teal-700", border: "border-teal-100/60", iconBg: "bg-teal-100/50" },
    { label: "Monto Total S/.", value: safeValue(stats.montoTotalSoles), icon: Scale, category: "Valorizado PEN", unit: "Soles", bg: "bg-emerald-50/50", text: "text-emerald-700", border: "border-emerald-100/60", iconBg: "bg-emerald-100/50" },
    { label: "Monto Total $", value: safeValue(stats.montoTotalDolares), icon: Coins, category: "Valorizado USD", unit: "Dólares", bg: "bg-blue-50/50", text: "text-blue-700", border: "border-blue-100/60", iconBg: "bg-blue-100/50" },
    { label: "Este Mes", value: safeValue(stats.esteMes), icon: BarChart3, category: "Periodo", unit: "Regs", bg: "bg-violet-50/50", text: "text-violet-700", border: "border-violet-100/60", iconBg: "bg-violet-100/50" },
    { label: "Promedio S/.", value: safeValue(stats.promedioSoles), icon: TrendingUp, category: "Ratio", unit: "Soles", bg: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-100/60", iconBg: "bg-amber-100/50" },
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

export default function KpisLogistica({
  stats = {},
  isFetching = false,
  filterComponent,
  activeFiltersCount = 0,
  onClearFilters
}) {
  const [activePieIndex, setActivePieIndex] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const mesesLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const chartData = useMemo(() => {
    return (stats.porMes || []).map((val, i) => ({
      name: mesesLabels[i],
      movimientos: val
    }));
  }, [stats.porMes]);

  const topProveedores = useMemo(() => {
    return (stats.proveedores || [])
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);
  }, [stats.proveedores]);

  return (
    <div className="relative w-full pb-10">
      {/* TOOLBAR */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 bg-white/50 p-1.5 rounded-2xl border border-slate-100 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar en resumen..." 
              className="pl-10 bg-white border-slate-200 focus:ring-2 focus:ring-teal-500/20 transition-all h-10 text-sm rounded-xl shadow-sm"
            />
          </div>

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
                  <ListFilter className="w-4 h-4" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-teal-500 text-white rounded-full font-black">
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
      </motion.div>
      
      <KpiGroup stats={stats} isFetching={isFetching} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GRÁFICO DE MOVIMIENTOS POR MES */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm flex flex-col transition-all duration-300 hover:shadow-md"
        >
          <div className="mb-4">
            <h4 className="text-[13px] font-[800] text-slate-800 tracking-tight">Movimientos por Mes</h4>
            <p className="text-[10px] text-slate-400 font-medium">Volumen de operaciones anual.</p>
          </div>
          <div className="flex-1 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px' }}
                />
                <Bar dataKey="movimientos" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === new Date().getMonth() ? '#0d9488' : '#ccfbf1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* TOP PROVEEDORES */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-slate-100 rounded-[1.5rem] p-4 shadow-sm flex flex-col transition-all duration-300 hover:shadow-md"
        >
          <div className="mb-4">
            <h4 className="text-[13px] font-[800] text-slate-800 tracking-tight">Principales Proveedores/Clientes</h4>
            <p className="text-[10px] text-slate-400 font-medium">Por volumen de transacciones.</p>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <div className="space-y-2">
              {topProveedores.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all group">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 text-[10px] font-black group-hover:bg-teal-600 group-hover:text-white transition-all">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-700 truncate uppercase">{item.nombre}</p>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.porcentaje}%` }}
                        className="h-full bg-teal-500 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-slate-800">{item.cantidad}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{item.porcentaje}%</p>
                  </div>
                </div>
              ))}
              {topProveedores.length === 0 && (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs italic py-10">
                  No hay datos de proveedores
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
