import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function RendimientoDashboard() {
  const [tab, setTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Visión general" },
    { id: "matriz", label: "Matriz de rendimiento" },
    { id: "desviaciones", label: "Desviaciones" },
    { id: "simulador", label: "Simulador" },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Rendimiento estratégico
          </h1>
          <p className="text-sm text-slate-500">
            Control de metas, desviaciones y proyección del negocio.
          </p>
        </div>

        {/* Placeholder filtros */}
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-white border text-sm shadow-sm">
            Este mes
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-white border text-sm shadow-sm">
            Área
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-white border text-sm shadow-sm">
            Usuario
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              tab === t.id
                ? "bg-white shadow text-cyan-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div className="min-h-[400px] bg-white rounded-2xl shadow p-6">
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-slate-500">
                Aquí irá la visión general del rendimiento.
              </p>
            </motion.div>
          )}

          {tab === "matriz" && (
            <motion.div
              key="matriz"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-slate-500">
                Aquí irá la matriz dinámica de rendimiento.
              </p>
            </motion.div>
          )}

          {tab === "desviaciones" && (
            <motion.div
              key="desviaciones"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-slate-500">
                Aquí veremos las causas de desviación.
              </p>
            </motion.div>
          )}

          {tab === "simulador" && (
            <motion.div
              key="simulador"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <p className="text-slate-500">
                Simulación estratégica y proyección.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}