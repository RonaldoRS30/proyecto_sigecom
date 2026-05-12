import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, Cell
} from "recharts";
import { motion } from "framer-motion";
import { Award, Users, TrendingUp } from "lucide-react";

/* =========================
    TOOLTIP PERSONALIZADO (Sincronizado)
========================= */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const vendido = payload.find(p => p.dataKey === "monto")?.value || 0;
    const cotizado = payload.find(p => p.dataKey === "cotizado")?.value || 0;
    const ratio = cotizado > 0 ? ((vendido / cotizado) * 100).toFixed(1) : 0;

    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-xl">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-2 border-b border-slate-100 pb-1">
          {label}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">Vendido</p>
            </div>
            <p className="text-xs font-black text-slate-800">$ {Number(vendido).toLocaleString()}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">Cotizado</p>
            </div>
            <p className="text-xs font-bold text-slate-500">$ {Number(cotizado).toLocaleString()}</p>
          </div>
          <div className="pt-1 mt-1 border-t border-slate-100 flex justify-between items-center">
            <p className="text-[9px] font-black text-[#10B981] uppercase">Efectividad</p>
            <p className="text-[10px] font-black text-[#10B981]">{ratio}%</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function ComercialChart({ data = [] }) {
  const formatName = (name) => {
    const words = name.split(" ");
    if (words.length <= 1) return name;
    return `${words[0]} ${words[1][0]}.`;
  };

  const chartData = data.map(item => ({
    ...item,
    vendedorFull: item.vendedor,
    vendedorLabel: formatName(item.vendedor),
    efectividad: item.cotizado > 0 ? ((item.monto / item.cotizado) * 100).toFixed(1) : 0
  }));

  // Encontrar al líder para aplicar lógica de color
  const lider = [...chartData].sort((a, b) => b.monto - a.monto)[0];
  const ventaTotal = chartData.reduce((acc, curr) => acc + curr.monto, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm h-full flex flex-col"
    >
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-[#CCFBF1] rounded-lg text-[#134E4A]">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-[13px] font-[900] text-slate-800 tracking-tight">Performance Comercial</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-8">Ranking de Conversión</p>
        </div>
        
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <Users className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* GRÁFICO */}
      <div className="h-[250px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData}  
            barCategoryGap="25%"
            barGap={8} 
            margin={{ top: 20, right: 40, left: 40 }} 
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            <XAxis 
              dataKey="vendedorLabel" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }} 
              dy={10}
            />
            
            <YAxis hide domain={[0, 'dataMax + 150000']} />
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: '#f8fafc', radius: 15 }} 
            />
            
            {/* Barra Cotizado (Slate Medio para no competir con lo vendido) */}
            <Bar 
              dataKey="cotizado" 
              fill="#CBD5E1" 
              radius={[6, 6, 0, 0]} 
              barSize={35}
            >
              <LabelList 
                dataKey="cotizado" 
                position="top" 
                formatter={(val) => `$${(val/1000).toFixed(0)}k`}
                style={{ fill: '#94A3B8', fontSize: '10px', fontWeight: '900' }} 
                dy={-6}
              />
            </Bar>

            {/* Barra Vendido (Lógica de Podio) */}
            <Bar 
              dataKey="monto" 
              radius={[6, 6, 0, 0]} 
              barSize={35}
            >
              <LabelList 
                dataKey="monto" 
                position="top" 
                formatter={(val) => `$${(val/1000).toFixed(0)}k`}
                style={{ fontSize: '11px', fontWeight: '900' }} 
                dy={-6}
              />
              {chartData.map((entry, index) => {
                const isLider = entry.vendedorFull === lider.vendedorFull;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={isLider ? "#10B981" : "#6366F1"} 
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* FOOTER - RESUMEN PROFESIONAL CON BADGE SOLICITADO */}
      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Top Producer</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                {lider?.vendedorFull}
              </span>
              {/* Badge de Eficiencia solicitado */}
              <div className="px-1.5 py-0.5 bg-[#CCFBF1] rounded-md border border-[#10B981]/20">
                <span className="text-[9px] font-black text-[#134E4A]">{lider?.efectividad}% Efic.</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Venta Total Equipo</span>
            <div className="flex items-center justify-end gap-1 text-[#10B981]">
              <TrendingUp size={12} strokeWidth={3} />
              <span className="text-xs font-black tracking-tighter">$ {(ventaTotal / 1000).toFixed(1)}k</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}