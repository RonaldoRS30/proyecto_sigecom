import React from "react";

export default function FiltrosGlobales() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">

      <div className="flex flex-wrap items-center gap-3">

        <select className="border rounded-md px-3 h-9 text-sm">
          <option>Últimos 12 meses</option>
          <option>Este año</option>
          <option>Personalizado</option>
        </select>

        <select className="border rounded-md px-3 h-9 text-sm">
          <option>Todos los vendedores</option>
          <option>Carlos</option>
          <option>Lucía</option>
        </select>

        <select className="border rounded-md px-3 h-9 text-sm">
          <option>Todos los sectores</option>
          <option>Minería</option>
          <option>Industrial</option>
        </select>

        <div className="ml-auto flex gap-2">
          <button className="px-4 h-9 text-xs font-medium border rounded-md hover:bg-slate-50">
            Exportar
          </button>

          <button className="px-4 h-9 text-xs font-medium bg-cyan-600 text-white rounded-md hover:bg-cyan-700">
            Guardar reporte
          </button>
        </div>

      </div>
    </div>
  );
}