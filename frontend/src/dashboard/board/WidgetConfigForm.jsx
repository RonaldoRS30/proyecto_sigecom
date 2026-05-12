// src/dashboard/board/WidgetConfigForm.jsx
import React, { useState, useEffect } from "react";

export default function WidgetConfigForm({ widget, onSave, onCancel }) {
  const [form, setForm] = useState(widget);

  useEffect(() => {
    setForm(widget);
  }, [widget]);

  if (!form) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-4">

      <h3 className="font-semibold text-sm border-b pb-2">
        Configurar gráfico
      </h3>

      {/* Título */}
      <div>
        <label className="text-xs font-medium">Título</label>
        <input
          name="title"
          value={form.title || ""}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-1.5 text-sm"
        />
      </div>

      {/* Tipo */}
      <div>
        <label className="text-xs font-medium">Tipo</label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="bar">Barras</option>
          <option value="line">Línea</option>
          <option value="pie">Circular</option>
          <option value="kpi">KPI</option>
        </select>
      </div>

      {/* Métrica */}
      <div>
        <label className="text-xs font-medium">Métrica</label>
        <select
          name="metric"
          value={form.metric}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="total">Importe</option>
          <option value="cantidad">Cantidad</option>
          <option value="margen">Margen</option>
          <option value="descuento">Descuento</option>
        </select>
      </div>

      {/* Agrupación */}
      <div>
        <label className="text-xs font-medium">Agrupar por</label>
        <select
          name="groupBy"
          value={form.groupBy}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="cliente">Cliente</option>
          <option value="area">Área</option>
          <option value="tipo">Tipo</option>
          <option value="mes">Mes</option>
          <option value="anio">Año</option>
        </select>
      </div>

      {/* Moneda */}
      <div>
        <label className="text-xs font-medium">Moneda</label>
        <select
          name="currency"
          value={form.currency || "ALL"}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="ALL">Todas</option>
          <option value="S">Soles</option>
          <option value="D">Dólares</option>
        </select>
      </div>

      {/* Objetivo KPI */}
      {form.type === "kpi" && (
        <div>
          <label className="text-xs font-medium">
            Objetivo
          </label>
          <input
            type="number"
            name="target"
            value={form.target || ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
      )}

      {/* Rango años */}
      <div>
        <label className="text-xs font-medium">
          Rango de años
        </label>
        <select
          name="yearsRange"
          value={form.yearsRange || 3}
          onChange={handleChange}
          className="w-full border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value={1}>1 año</option>
          <option value={3}>3 años</option>
          <option value={5}>5 años</option>
        </select>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs bg-gray-100 hover:bg-gray-200"
        >
          Cancelar
        </button>

        <button
          onClick={handleSave}
          className="px-3 py-1.5 rounded-lg text-xs bg-blue-600 text-white hover:bg-blue-700"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
