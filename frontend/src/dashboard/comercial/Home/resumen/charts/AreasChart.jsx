import React, { useState, useMemo } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Sector 
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, ArrowUpRight, Target } from "lucide-react";

export default function AreasChart({ data = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const COLORS = ["#4f46e5", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"];

  const { processedData, totalVendido } = useMemo(() => {
    // 1. Calculamos el total de ventas reales (monto)
    const total = data.reduce((sum, item) => sum + Number(item.monto), 0);

    const sorted = [...data]
      .sort((a, b) => (Number(b.monto) || 0) - (Number(a.monto) || 0)) // Ordenar por venta real
      .map((item, index) => {
        const vendido = Number(item.monto) || 0;
        const cotizado = Number(item.cotizado) || 0;

        // Calculamos la eficacia: (Vendido / Cotizado) * 100
        // Si cotizado es 0 o vendido es 0, la eficacia es 0 para evitar errores
        const eficaciaCalculada = cotizado > 0 && vendido > 0 
          ? ((vendido / cotizado) * 100).toFixed(1) 
          : "0.0";

        return {
          ...item,
          monto: vendido,
          color: COLORS[index % COLORS.length],
          // Si el total global es 0, el porcentaje de la tajada es 0
          porcentaje: total > 0 ? ((vendido / total) * 100).toFixed(1) : "0.0",
          efectividad: eficaciaCalculada
        };
      });

    return { processedData: sorted, totalVendido: total };
  }, [data]);

  if (!data || data.length === 0) return (
    <div className="h-[250px] flex items-center justify-center text-slate-400 text-[10px] font-black uppercase bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
      Sin datos de áreas
    </div>
  );

  // Renderizador del sector activo (el efecto de la foto)
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2} // Se expande un poco hacia adentro
          outerRadius={outerRadius + 6} // Se expande hacia afuera como en tu imagen
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          cornerRadius={10} // Bordes muy redondeados para el sector activo
        />
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm h-full flex flex-col transition-all duration-300 hover:shadow-lg hover:border-slate-300"
    >
      {/* HEADER */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h4 className="text-[14px] font-[1000] text-slate-800 tracking-tighter uppercase flex items-center gap-2">
            <span className="w-2 h-5 bg-indigo-600 rounded-full inline-block" />
            Distribución por Área
          </h4>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-4">Ventas Reales y Eficacia</p>
        </div>
        <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
          <LayoutGrid size={16} />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* GRÁFICO DONUT CON EFECTO ACTIVO */}
        <div className="lg:col-span-7 relative flex justify-center items-center">
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={processedData}
                  dataKey="monto"
                  nameKey="area"
                  outerRadius={100}
                  innerRadius={75}
                  paddingAngle={4}
                  stroke="none"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {processedData.map((entry, i) => (
                    <Cell 
                      key={i} 
                      fill={entry.color} 
                      opacity={activeIndex === null || activeIndex === i ? 1 : 0.2}
                      className="transition-all duration-500 outline-none cursor-pointer"
                      style={{ filter: activeIndex === i ? `drop-shadow(0px 4px 12px ${entry.color}40)` : 'none' }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* TEXTO CENTRAL DINÁMICO */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              {activeIndex !== null ? (
                <motion.div 
                  key="active"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <span className="text-[10px] font-black text-indigo-600 uppercase block mb-1">
                    {processedData[activeIndex].area}
                  </span>
                  <span className="text-2xl font-[1000] text-slate-800 tracking-tighter">
                    {processedData[activeIndex].porcentaje}%
                  </span>
                </motion.div>
              ) : (
                <motion.div key="total" className="text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Global</span>
                  <span className="text-3xl font-[1000] text-slate-800 tracking-tighter">100%</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* LEYENDA LATERAL MEJORADA */}
        <div className="lg:col-span-5 flex flex-col gap-2 pl-4 border-l border-slate-50">
          {processedData.map((item, index) => (
            <div 
              key={item.area} 
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`group flex items-center justify-between transition-all duration-300 cursor-pointer p-2.5 rounded-2xl ${
                activeIndex === index ? 'bg-indigo-50/80 shadow-sm translate-x-1' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3.5 h-3.5 rounded-full shadow-inner transition-transform duration-300 group-hover:scale-110" 
                  style={{ backgroundColor: item.color, border: `2px solid white` }} 
                />
                <div className="flex flex-col">
                  <span className={`text-[11px] uppercase tracking-tight ${
                    activeIndex === index ? 'font-black text-indigo-700' : 'font-bold text-slate-500'
                  }`}>
                    {item.area}
                  </span>
                  <div className="flex items-center gap-1">
                    <Target size={10} className="text-slate-300" />
                    {/* Mostramos la eficacia calculada: (Vendido / Cotizado) */}
                    <span className="text-[8px] font-black text-slate-400 uppercase">
                      {item.efectividad}% Eficacia
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                {/* MONTO VENDIDO REAL: Ahora coincide con el Donut */}
                <span className={`text-xs font-black block ${
                    activeIndex === index ? 'text-indigo-600' : 'text-slate-700'
                }`}>
                  $ {item.monto > 0 ? (item.monto / 1000).toFixed(1) : "0"}k
                </span>
                <div className="flex items-center justify-end gap-1">
                  <span className="text-[7px] text-slate-400 font-bold italic">Real</span>
                  <ArrowUpRight size={10} className={`transition-all ${activeIndex === index ? 'opacity-100 text-indigo-400 translate-y-0' : 'opacity-0 translate-y-1'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER TOTAL */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Venta Total Realizada</span>
          <span className="text-base font-[1000] text-indigo-600 tracking-tight">
             S/. {totalVendido.toLocaleString('es-PE')}
          </span>
        </div>
        <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
          Live Data
        </div>
      </div>
    </motion.div>
  );
}