import React from "react";

export default function KpiWidget({ title, value, subtitle }) {
  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        <p className="text-xs uppercase text-gray-500 tracking-wide">
          {title || "KPI"}
        </p>

        <p className="text-2xl font-bold mt-1">
          {value ?? "--"}
        </p>
      </div>

      {subtitle && (
        <p className="text-xs text-gray-400 mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}
