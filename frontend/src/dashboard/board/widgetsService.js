// src/dashboard/board/widgetsService.js
import axios from "@/services/axios"; // usa tu axios centralizado

/**
 * Obtiene data para un widget dinámico
 */
export async function fetchWidgetData(widgetConfig) {
  const {
    type,
    metric,
    groupBy,
    currency,
    yearsRange,
    dateFrom,
    dateTo,
  } = widgetConfig;

  const params = {
    metric,
    group_by: groupBy,
    currency,
    years: yearsRange,
    date_from: dateFrom,
    date_to: dateTo,
  };

  const { data } = await axios.get("/dashboard/widgets/data", {
    params,
  });

  return normalizeWidgetData(type, data);
}

/**
 * Normaliza la data según el tipo de gráfico
 */
function normalizeWidgetData(type, raw) {
  if (!raw) return [];

  switch (type) {
    case "pie":
      return raw.map((r) => ({
        name: r.label,
        value: Number(r.value),
      }));

    case "bar":
    case "line":
      return raw.map((r) => ({
        label: r.label,
        value: Number(r.value),
      }));

    case "kpi":
      return {
        value: Number(raw.value || 0),
        target: Number(raw.target || 0),
        progress:
          raw.target > 0
            ? Math.round((raw.value / raw.target) * 100)
            : 0,
      };

    default:
      return raw;
  }
}

/**
 * Guarda layout del usuario
 */
export async function saveBoardLayout(layout) {
  return axios.post("/dashboard/board/save", {
    layout,
  });
}

/**
 * Obtiene layout guardado
 */
export async function fetchBoardLayout() {
  const { data } = await axios.get("/dashboard/board");
  return data;
}
