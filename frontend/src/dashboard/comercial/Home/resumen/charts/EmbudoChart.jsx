import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList
} from "recharts";
import { motion } from "framer-motion";
import { Filter } from "lucide-react";

/* =========================
   TOOLTIP PERSONALIZADO
========================= */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-xl">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">
          {data.etapa}
        </p>
        <p className="text-sm font-black text-slate-800">
          {data.valor.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">Oportunidades</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function EmbudoChart({ data = [] }) {
  // Colores dinámicos: del azul al verde esmeralda
  const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#10b981"];

  const dataConConversion = useMemo(() => {
    return data.map((item, index) => {
      const conversion = index === 0 
        ? 100 
        : ((item.valor / data[index - 1].valor) * 100).toFixed(1);
      return { ...item, conversion: `${conversion}%` };
    });
  }, [data]);

  if (!data || data.length === 0) return (
    <div className="h-[250px] flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200">
      Sin datos de embudo
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-all duration-300 h-full relative"
    >
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-violet-50 rounded-lg">
              <Filter className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="text-[13px] font-[800] text-slate-800 tracking-tight">Embudo Comercial</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-medium pl-8">Conversión por etapa</p>
        </div>
      </div>

      {/* GRÁFICO */}
      <div className="h-[220px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={dataConConversion} 
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <XAxis 
              dataKey="etapa" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800 }} 
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 12 }} />
            
            <Bar 
              dataKey="valor" 
              radius={[12, 12, 12, 12]} 
              barSize={45}
              animationDuration={1200}
            >
              {dataConConversion.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  fillOpacity={0.85} 
                />
              ))}
              <LabelList 
                dataKey="conversion" 
                position="top" 
                style={{ fill: '#64748b', fontSize: '10px', fontWeight: '900' }} 
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* FOOTER INSIGHTS */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-50">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-400 uppercase">Eficiencia Total</span>
          <span className="text-xs font-black text-emerald-600">
            {((data[data.length-1]?.valor / data[0]?.valor) * 100).toFixed(1)}% de cierre
          </span>
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="text-[8px] font-black text-slate-400 uppercase">Estado</span>
          <span className="text-xs font-black text-blue-600 uppercase">Saludable</span>
        </div>
      </div>
    </motion.div>
  );
}