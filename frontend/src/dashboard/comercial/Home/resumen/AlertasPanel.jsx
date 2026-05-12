import React from "react";
import { AlertTriangle } from "lucide-react";

const Alert = ({ text, type }) => {
  const styles = {
    warning: "bg-yellow-50 border-yellow-300 text-yellow-700",
    danger: "bg-red-50 border-red-300 text-red-700",
  };

  return (
    <div className={`border p-3 rounded-xl ${styles[type]}`}>
      {text}
    </div>
  );
};

export default function AlertasPanel() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">

      <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <AlertTriangle size={16} /> Alertas Inteligentes
      </h2>

      <Alert text="Área Comercial bajo 40%" type="danger" />
      <Alert text="Disminución del 20% en aprobaciones" type="warning" />
    </div>
  );
}