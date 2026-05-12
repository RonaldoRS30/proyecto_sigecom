import React, { useState } from "react";
import TablaDinamica from "./TablaDinamica";
import GraficoDinamico from "./GraficoDinamico";

export default function BuilderPanel() {
  const [dimension, setDimension] = useState("mes");
  const [metrica, setMetrica] = useState("ventas");

  return (
    <div className="grid grid-cols-12 gap-6">

      {/* PANEL CAMPOS */}
      <div className="col-span-12 lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">

        <h3 className="text-sm font-semibold mb-3">Dimensiones</h3>

        <div className="space-y-2">
          <button
            onClick={() => setDimension("mes")}
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100"
          >
            Mes
          </button>

          <button
            onClick={() => setDimension("vendedor")}
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100"
          >
            Vendedor
          </button>

          <button
            onClick={() => setDimension("cliente")}
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100"
          >
            Cliente
          </button>
        </div>

        <h3 className="text-sm font-semibold mt-6 mb-3">Métricas</h3>

        <div className="space-y-2">
          <button
            onClick={() => setMetrica("ventas")}
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100"
          >
            Ventas
          </button>

          <button
            onClick={() => setMetrica("margen")}
            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100"
          >
            Margen
          </button>
        </div>

      </div>

      {/* CONTENIDO */}
      <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">

        <TablaDinamica dimension={dimension} metrica={metrica} />

        <GraficoDinamico dimension={dimension} metrica={metrica} />

      </div>

    </div>
  );
}