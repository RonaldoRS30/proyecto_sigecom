import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from "recharts";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 border border-slate-200 p-3 rounded-xl shadow-xl backdrop-blur-sm">
        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
          {data.nombre}
        </p>
        <div className="space-y-1">
          <p className="text-sm font-black text-indigo-600">
            {data.cotizaciones} Cotizaciones
          </p>
          <div className="flex justify-between gap-4 text-[10px] border-t border-slate-100 pt-1">
            <span className="text-slate-500 font-medium">Cotizado:</span>
            <span className="font-bold text-slate-700">
              $ {data.monto_cotizado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between gap-4 text-[10px]">
            <span className="text-emerald-600 font-bold">Venta Real:</span>
            <span className="font-bold text-emerald-700">
              $ {data.monto_real.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-right text-indigo-500 font-black pt-1">
             {data.conversion}% Eficiencia
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function ClientesChart({ data = [] }) {
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    return data.map(item => ({
      ...item,
      nombre: item.nombre || "Desconocido", 
      codigo: item.codigo,
      cotizaciones: Number(item.cotizaciones || 0),
      monto_cotizado: Number(item.monto_cotizado || 0),
      monto_real: Number(item.monto_real || 0)
    }));
  }, [data]);

  if (!data || data.length === 0) return (
    <div className="h-[300px] flex items-center justify-center text-slate-400 text-xs font-bold bg-slate-50/50 rounded-[1.5rem] border border-dashed border-slate-200">
      Sin datos de clientes
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm h-full"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-indigo-50 rounded-lg">
          <Users className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-[13px] font-[800] text-slate-800 tracking-tight">Clientes con Mayor Venta Real</h3>
          <p className="text-[10px] text-slate-400 font-medium">Top 10 por facturación adjudicada</p>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 5, left: 5 }}
            barSize={14}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide /> 
            <YAxis 
              dataKey="nombre" 
              type="category" 
              tick={({ x, y, payload }) => (
                <text 
                  x={x - 1} // Un pequeño margen extra desde la barra
                  y={y} 
                  dy={4}
                  fill="#64748b" 
                  fontSize={8} // Bajamos a 8 para ganar espacio horizontal
                  fontWeight={700} 
                  textAnchor="end"
                >
                  {/* Aumentamos de 12 a 22 caracteres el límite */}
                  {payload.value.length > 25 
                    ? `${payload.value.substring(0, 22)}...` 
                    : payload.value}
                </text>
              )}
              axisLine={false}
              tickLine={false}
              width={130} // Aumentamos de 100 a 130
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
            <Bar dataKey="monto_real" radius={[0, 10, 10, 0]}> {/* CAMBIADO: La barra ahora representa dinero real */}
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cliente-${entry.codigo}`} 
                  fill={entry.conversion > 15 ? '#10b981' : '#6366f1'} 
                  fillOpacity={1 - (index * 0.05)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
        <div className="flex flex-col overflow-hidden">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">LÍDER COMERCIAL</span>
          <span className="text-[10px] font-extrabold text-slate-700 truncate max-w-[140px]">
            {chartData[0]?.nombre}
          </span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[8px] font-bold text-slate-400 uppercase">VENTA REAL</span>
          <span className="text-[11px] font-black text-emerald-600 italic">
            $ {chartData[0]?.monto_real.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}