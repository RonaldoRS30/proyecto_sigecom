import React from "react";

export default function LineWidget({ title }) {
  return (
    <div className="h-full flex flex-col">
      <p className="font-semibold mb-2 text-sm">
        {title || "Line Chart"}
      </p>

      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        📈 Gráfico de líneas (placeholder)
      </div>
    </div>
  );
}
