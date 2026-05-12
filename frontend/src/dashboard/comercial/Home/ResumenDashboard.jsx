import React, { useState } from "react";
import SemaforoCumplimiento from "./resumen/SemaforoCumplimiento";
import KpisResumen from "../Home/resumen/KpisResumen";
import AlertasPanel from "../Home/resumen/AlertasPanel"; // 
import TendenciasCharts from "../Home/resumen/TendenciasCharts"; // [cite: 61]

export default function ResumenDashboard() {
  const [filtros, setFiltros] = useState({ anio: 2025 });

  return (
    <div className="flex flex-col gap-8 p-1"> 
      
      <section className="w-full">
        <SemaforoCumplimiento anno={filtros.anio} />
      </section>

      <section className="w-full">
        <KpisResumen filtros={filtros} />
      </section>

      <section className="w-full">
        <TendenciasCharts filtros={filtros} setFiltros={setFiltros} />
      </section>

    </div>
  );
}