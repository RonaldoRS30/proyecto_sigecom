import api from "@/services/api"; // o tu ruta real

export const obtenerResumenDashboard = async (params) => {
  const { data } = await api.get("/dashboard/resumen/", { params });
  return data;
};