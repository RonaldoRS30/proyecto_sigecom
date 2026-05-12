import React from "react";
import FiltrosGlobales from "./FiltrosGlobales";
import BuilderPanel from "./BuilderPanel";

export default function AnalisisDashboard() {
  return (
    <div className="flex flex-col gap-6">

      {/* FILTROS SUPERIORES */}
      <FiltrosGlobales />

      {/* BUILDER PRINCIPAL */}
      <BuilderPanel />

    </div>
  );
}