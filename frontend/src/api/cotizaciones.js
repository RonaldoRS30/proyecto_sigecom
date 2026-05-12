import axios from "axios";

export const crearCotizacion = async (payload) => {
  const token = localStorage.getItem("access_token");

  try {
    const { data } = await axios.post(
      `${import.meta.env.VITE_API_URL}/cotizaciones/guardar/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data; // ✅ éxito
  } catch (err) {
    // Esto captura errores 400/500 y muestra el mensaje del backend
    if (err.response) {
      console.error("❌ Error al guardar cotización:", err.response.status);
      console.error("💬 Mensaje del backend:", err.response.data);
      throw err.response.data; // o throw new Error(JSON.stringify(err.response.data));
    } else {
      console.error("❌ Error desconocido:", err);
      throw err;
    }
  }
};