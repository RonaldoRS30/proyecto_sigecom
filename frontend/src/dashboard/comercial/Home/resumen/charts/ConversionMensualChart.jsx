import React from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Dot
} from "recharts";
import { motion } from "framer-motion";
import { Target } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-xl">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <p className="text-sm font-black text-slate-800">
            {payload[0].value}% <span className="text-[10px] text-slate-400 font-bold text-xs">Ratio</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function ConversionMensualChart({ data = [] }) {
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const dataFormateada = data.map(d => ({
    ...d,
    mes_label: meses[parseInt(d.mes) - 1],
    conversion: Number(d.conversion || 0)
  }));

  if (!data || data.length === 0) return (
    <div className="h-[200px] flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200">
      Cargando métricas...
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-all duration-300 h-full"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Target className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-[13px] font-[800] text-slate-800 tracking-tight">Tasa de Conversión</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-medium pl-8">Efectividad de cierre mensual</p>
        </div>
        
        <div className="bg-amber-50/50 px-3 py-1 rounded-full border border-amber-100">
           <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Target: 20%</span>
        </div>
      </div>

      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataFormateada} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
            
            <XAxis 
              dataKey="mes_label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            
            <YAxis 
              domain={[0, 100]}
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Line 
              type="stepAfter" // Estilo moderno para tasas que cambian por periodos
              dataKey="conversion" 
              stroke="#f59e0b" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={2000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}