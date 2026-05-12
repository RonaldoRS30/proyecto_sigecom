import React from "react";

export default function PieWidget({ title }) {
  return (
    <div className="h-full flex flex-col">
      <p className="font-semibold mb-2 text-sm">
        {title || "Pie Chart"}
      </p>

      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        🥧 Gráfico circular (placeholder)
      </div>
    </div>
  );
}
