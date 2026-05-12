import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "@/services/api";

export const useCotizacionAcciones = (numReg, onActionSuccess) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1. Nueva Versión (Navega al nuevo registro creado)
  const crearNuevaVersion = useMutation({
    mutationFn: () => api.post(`cotizaciones/${numReg}/nueva-version/`),
    onSuccess: (res) => {
      const { num_reg, cotin } = res.data;
      toast.success(`Versión ${cotin} creada`);
      
      // Refresca la lista de aprobación para que aparezca la nueva versión
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });
      
      if (onActionSuccess) onActionSuccess("nueva-version", num_reg);

      // Navega al detalle del nuevo registro generado
      navigate(`/dashboard/cotizacion-detalle/${num_reg}`);
    },
    onError: () => toast.error("Error al crear nueva versión"),
  });

  // 2. Copiar Cotización
  const copiarCotizacion = useMutation({
    mutationFn: () => api.post(`cotizaciones/${numReg}/generar-copia/`),
    onSuccess: (res) => {
      const { num_reg } = res.data; 
      toast.success("Copia creada correctamente");
      
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });
      
      if (onActionSuccess) onActionSuccess("copiar");

      // Navega a la copia recién creada
      navigate(`/dashboard/cotizacion-detalle/${num_reg}`);
    },
    onError: () => toast.error("Error al crear la copia"),
  });

  // 3. Eliminar Cotización
  const eliminarCotizacion = useMutation({
    mutationFn: () => api.delete(`cotizaciones/${numReg}/`),
    onSuccess: () => {
      toast.success("Cotización eliminada correctamente");
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });
      
      if (onActionSuccess) onActionSuccess("eliminar");

      // Regresa a la tabla principal
      navigate("/dashboard/aprobacion-cotizacion");
    },
    onError: () => toast.error("Error eliminando la cotización"),
  });

  // 4. Lógica de Guardado
  const guardarCotizacion = useMutation({
    mutationFn: (payload) => api.post(`/cotizaciones/guardar/`, payload),
    onSuccess: () => {
      toast.success("Cotización guardada");
      // Refresca solo el detalle actual
      queryClient.invalidateQueries({ queryKey: ["cotizacion-detalle", numReg] });
      if (onActionSuccess) onActionSuccess("guardar");
    },
    onError: () => toast.error("Error al guardar cambios"),
  });

  return {
    crearNuevaVersion,
    copiarCotizacion,
    eliminarCotizacion,
    guardarCotizacion,
    isPending: crearNuevaVersion.isPending || copiarCotizacion.isPending || eliminarCotizacion.isPending || guardarCotizacion.isPending
  };
};