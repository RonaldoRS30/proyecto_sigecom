// ButtonAction.jsx
import React from "react";

// Map de colores con hover y aplicado
const colorMap = {
  sky: "border-sky-400 text-sky-400 hover:bg-sky-50",
  emerald: "border-emerald-400 text-emerald-400 hover:bg-emerald-50",
  violet: "border-violet-500 text-violet-500 hover:bg-violet-50",
  orange: "border-orange-500 text-orange-500 hover:bg-orange-50",
  indigo: "border-indigo-500 text-indigo-500 hover:bg-indigo-50",
  rose: "border-rose-500 text-rose-500 hover:bg-rose-50",
  cyan: "border-cyan-500 text-cyan-500 hover:bg-cyan-50",
  lime: "border-lime-500 text-lime-500 hover:bg-lime-50",
  purple: "border-purple-400 text-purple-400 hover:bg-purple-50",
  amber: "border-amber-500 text-amber-500 hover:bg-amber-50",
  teal: "border-teal-500 text-teal-500 hover:bg-teal-50",
  red: "border-red-500 text-red-500 hover:bg-red-50",
  gray: "border-gray-400 text-gray-400 hover:bg-gray-50",
  pink: "border-pink-400 text-pink-400 hover:bg-pink-50",
  limeDark: "border-lime-600 text-lime-600 hover:bg-lime-100",
  cyanDark: "border-cyan-600 text-cyan-600 hover:bg-cyan-100",
};

export default function ButtonAction({ onClick, icon, text, color = "sky", applied = false }) {
  // Colores aplicados en estado "aplicado"
  const appliedClass = applied
    ? color.startsWith("lime") || color.startsWith("cyan")
      ? `border-${color} text-${color} bg-${color}-100`
      : `border-${color}-600 text-${color}-600 bg-${color}-50`
    : "";

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        className={`p-1.5 rounded-full border transition flex items-center justify-center ${colorMap[color] || colorMap.sky} ${appliedClass}`}
      >
        {React.cloneElement(icon, { className: "w-4 h-4" })}
      </button>
      <span className="text-sm font-medium flex items-center">
        {text}
        {applied && <span className="ml-1 text-[0.65rem] font-semibold text-orange-600">aplicado</span>}
      </span>
    </div>
  );
}
