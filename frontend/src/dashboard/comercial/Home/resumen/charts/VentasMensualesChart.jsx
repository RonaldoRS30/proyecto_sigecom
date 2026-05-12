import React, { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

/* =========================
    TOOLTIP PERSONALIZADO
========================= */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataCotizado = payload.find(p => p.dataKey === "cotizado");
    const dataVendido = payload.find(p => p.dataKey === "ventas");

    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-xl">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-2 border-b border-slate-100 pb-1">
          {label}
        </p>
        <div className="space-y-1.5">
          {/* Fila de Ventas (OC) - Usando #06A99C */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#06A99C]" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">Vendido (OC)</p>
            </div>
            <p className="text-xs font-black text-[#06A99C]">
              $ {Number(dataVendido?.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          {/* Fila de Cotizaciones - Usando #94A3B8 */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
              <p className="text-[10px] font-bold text-slate-500 uppercase">Cotizado</p>
            </div>
            <p className="text-xs font-bold text-slate-400">
              $ {Number(dataCotizado?.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function VentasMensualesChart({ data = [] }) {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const dataFormateada = useMemo(() => {
    return data.map(d => ({
      ...d,
      mes_label: meses[parseInt(d.mes) - 1],
      ventas: Number(d.oc || 0),
      cotizado: Number(d.total || 0)
    }));
  }, [data]);

  if (!data || data.length === 0) return (
    <div className="h-[300px] flex items-center justify-center text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200">
      Cargando comparativa mensual...
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm h-full flex flex-col"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-[#06A99C]/10 rounded-lg text-[#06A99C]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-[13px] font-[900] text-slate-800 tracking-tight">Efectividad de Ventas</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-8">Vendido vs Cotizado</p>
        </div>

        {/* LEYENDA SINCRONIZADA */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Ventas (OC)</span>
            <div className="w-6 h-1 rounded-full bg-[#06A99C]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Cotizado</span>
            <div className="w-6 h-[2px] rounded-full bg-[#94A3B8] opacity-50" />
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dataFormateada} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              {/* GRADIENTE PARA VENTA REAL (#06A99C) */}
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06A99C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06A99C" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            
            <XAxis 
              dataKey="mes_label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 9, fontWeight: 800 }} 
              dy={10} 
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 9, fontWeight: 800 }} 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#06A99C', strokeWidth: 1, strokeDasharray: '3 3' }} />
            
            {/* LÍNEA DE COTIZADO: Slate Medio, 2px, Punteada */}
            <Area
              type="monotone"
              dataKey="cotizado"
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="transparent"
              dot={false}
              activeDot={false}
            />

            {/* LÍNEA DE VENTAS: Cian VC Puro, 3px, Gradiente y Nodos */}
            <Area
              type="monotone"
              dataKey="ventas"
              stroke="#06A99C"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorVentas)"
              // Puntos de nodo: Blancos con borde cian
              dot={{ 
                r: 4, 
                fill: '#fff', 
                strokeWidth: 2, 
                stroke: '#06A99C',
                fillOpacity: 1
              }}
              activeDot={{ 
                r: 6, 
                strokeWidth: 0,
                fill: '#06A99C' 
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}