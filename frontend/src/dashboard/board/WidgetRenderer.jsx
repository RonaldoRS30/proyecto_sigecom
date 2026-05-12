// src/dashboard/board/WidgetRenderer.jsx
import React from "react";

// Widgets visuales
import BarWidget from "./widgets/BarWidget";
import PieWidget from "./widgets/PieWidget";
import LineWidget from "./widgets/LineWidget";
import KpiWidget from "./widgets/KpiWidget";

export default function WidgetRenderer({ widget }) {
  if (!widget) return null;

  const { type, config } = widget;

  switch (type) {
    case "bar":
      return <BarWidget config={config} />;

    case "pie":
      return <PieWidget config={config} />;

    case "line":
      return <LineWidget config={config} />;

    case "kpi":
      return <KpiWidget config={config} />;

    default:
      return (
        <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
          Tipo de widget no soportado
        </div>
      );
  }
}
