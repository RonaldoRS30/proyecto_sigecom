import React from "react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import Tippy from "@tippyjs/react";
import { Info } from "lucide-react";
import "tippy.js/dist/tippy.css";

/* ==========================================================
   📊 KpiCard — Tarjeta ERP Moderna (PMInsight)
   ========================================================== */

const KpiCard = ({
  label,
  value,
  fromColor = "#2563eb",
  toColor = "#3b82f6",
  hoverFrom,
  hoverTo,
  icon: Icon,
  tooltip,
  decimals = 0,
  compact = false,
  align = "center", // center | left
}) => {
  // Tamaños responsivos y compact
  const padding = compact ? "p-3" : "p-4 md:p-5";
  const minHeight = compact ? "min-h-[70px]" : "min-h-[100px]";
  const iconSize = compact ? 5 : 6; // Tailwind units (rem)
  const labelClass = compact ? "text-xs font-semibold" : "text-sm font-semibold";
  const valueClass = compact ? "text-sm font-bold" : "text-lg font-bold";

  // Hover dinámico para gradiente
  const cardGradient = {
    background: `linear-gradient(135deg, ${fromColor}, ${toColor})`,
    transition: "all 0.3s ease-in-out",
  };

  const hoverGradient =
    hoverFrom && hoverTo
      ? { background: `linear-gradient(135deg, ${hoverFrom}, ${hoverTo})` }
      : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`relative w-full rounded-2xl cursor-pointer select-none overflow-hidden flex flex-col ${
        align === "center" ? "items-center text-center" : "sm:flex-row items-start text-left"
      } justify-center text-white shadow-md hover:shadow-lg ${padding} ${minHeight} transition-all duration-300 ease-out`}
      style={cardGradient}
    >
      {/* Efecto hover brillo (solo visual) */}
      <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-20 transition-opacity duration-300 rounded-2xl pointer-events-none" />

      {/* Tooltip info */}
      {tooltip && (
        <div className="absolute top-2 right-2">
          <Tippy content={tooltip} delay={100}>
            <button
              aria-label="Información"
              className="text-white opacity-90 hover:opacity-100 transition-opacity"
            >
              <Info size={compact ? 13 : 15} />
            </button>
          </Tippy>
        </div>
      )}

      {/* Contenido principal */}
      <div className={`flex ${align === "center" ? "flex-col items-center gap-2" : "flex-row items-center gap-2"}`}>
        {/* Icono */}
        {Icon && <Icon className="text-white drop-shadow-sm" style={{ width: `${iconSize}rem`, height: `${iconSize}rem` }} />}

        {/* Texto */}
        <div className={align === "left" ? "flex flex-col" : ""}>
          <p className={`truncate opacity-90 ${labelClass}`}>{label}</p>
          <p className={`drop-shadow-sm ${valueClass}`}>
            <CountUp
              end={Math.max(0, Number(value))}
              duration={1.1}
              separator=","
              decimals={decimals}
            />
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default KpiCard;
