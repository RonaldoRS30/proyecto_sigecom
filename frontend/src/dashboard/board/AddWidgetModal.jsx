// src/dashboard/board/AddWidgetModal.jsx
import React, { useState } from "react";
import { X } from "lucide-react";

export default function AddWidgetModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState({
    title: "",
    type: "bar",
    metric: "total",
    groupBy: "cliente",
    yearsRange: 3,
  });

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    onAdd({
      id: crypto.randomUUID(),
      ...form,
      createdAt: new Date(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">

        {/* Header */}
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-lg font-semibold">Nuevo gráfico</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500 hover:text-gray-800" />
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 gap-4">

          {/* Titulo */}
          <div>
            <label className="text-sm font-medium">Título</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ej: Ventas por Área"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="text-sm font-medium">Tipo de gráfico</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="bar">Barras</option>
              <option value="line">Línea</option>
              <option value="pie">Circular</option>
              <option value="kpi">KPI</option>
            </select>
          </div>

          {/* Métrica */}
          <div>
            <label className="text-sm font-medium">Métrica</label>
            <select
              name="metric"
              value={form.metric}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="total">Importe total</option>
              <option value="cantidad">Cantidad</option>
              <option value="margen">Margen</option>
              <option value="descuento">Descuentos</option>
            </select>
          </div>

          {/* Agrupación */}
          <div>
            <label className="text-sm font-medium">Agrupar por</label>
            <select
              name="groupBy"
              value={form.groupBy}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="cliente">Cliente</option>
              <option value="area">Área</option>
              <option value="tipo">Tipo</option>
              <option value="mes">Mes</option>
              <option value="anio">Año</option>
            </select>
          </div>

          {/* Años */}
          <div>
            <label className="text-sm font-medium">
              Rango de años
            </label>
            <select
              name="yearsRange"
              value={form.yearsRange}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value={1}>1 año</option>
              <option value={3}>3 años</option>
              <option value={5}>5 años</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700"
          >
            Crear gráfico
          </button>
        </div>
      </div>
    </div>
  );
}
