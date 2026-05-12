// src/dashboard/analisis/GraficoDinamico.jsx

import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#a855f7"];

const detectarTipoGrafico = (dimension, tipoDato) => {
  if (dimension === "fecha") return "line";
  if (tipoDato === "proporcion") return "pie";
  return "bar";
};

const GraficoDinamico = ({
  data = [],
  dimension,
  metrica,
  tipoDato = "comparacion", // comparacion | proporcion | tendencia
  titulo = "Análisis dinámico"
}) => {

  const tipoGrafico = detectarTipoGrafico(dimension, tipoDato);

  if (!data.length) {
    return <div className="text-center p-8 text-gray-400">Sin datos disponibles</div>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold mb-4">{titulo}</h3>

      <ResponsiveContainer width="100%" height={350}>
        {tipoGrafico === "bar" && (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dimension} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={metrica} fill="#2563eb" />
          </BarChart>
        )}

        {tipoGrafico === "line" && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dimension} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={metrica} stroke="#10b981" />
          </LineChart>
        )}

        {tipoGrafico === "pie" && (
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie
              data={data}
              dataKey={metrica}
              nameKey={dimension}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default GraficoDinamico;