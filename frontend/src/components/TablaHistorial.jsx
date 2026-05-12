import React from "react";
import { motion } from "framer-motion";
import { Loader } from "lucide-react";

export default function TablaHistorial({
  data = [],
  isFetching = false,
  onRowClick = () => {},
}) {
  return (
    <div className="w-full flex-1 overflow-auto relative rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* LOADING */}
      {isFetching && (
        <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur flex items-center justify-center">
          <Loader className="animate-spin text-cyan-600" />
        </div>
      )}

      {/* TABLA */}
      <table className="w-full text-xs">

        {/* HEADER */}
        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
          <tr>
            {[
              "Fecha",
              "Cotización",
              "Cliente",
              "Estado",
              "Usuario",
              "Cambio",
            ].map(h => (
              <th
                key={h}
                className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {data.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="text-center py-10 text-slate-400"
              >
                No hay historial disponible
              </td>
            </tr>
          )}

          {data.map((h, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => onRowClick(h)}
              className="cursor-pointer hover:bg-slate-50 transition border-b border-slate-100"
            >
              <td className="px-3 py-2 font-medium text-slate-700">
                {h.fecha}
              </td>

              <td className="px-3 py-2 font-semibold text-slate-800">
                {h.numero}
              </td>

              <td className="px-3 py-2">
                {h.cliente}
              </td>

              <td className="px-3 py-2 uppercase font-semibold">
                {h.estado}
              </td>

              <td className="px-3 py-2">
                {h.usuario}
              </td>

              <td className="px-3 py-2 text-slate-600">
                {h.descripcion}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
