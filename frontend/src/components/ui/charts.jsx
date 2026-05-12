import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function EstadosDonutChart({ data = [] }) {
  const COLORS = ["#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#6366f1"];

  if (!data.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Sin datos disponibles
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="cantidad"
          nameKey="estado"
          innerRadius={65}
          outerRadius={90}
          paddingAngle={3}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>

        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
