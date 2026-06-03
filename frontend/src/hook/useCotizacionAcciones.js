import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "@/services/api";

export const useCotizacionAcciones = (numReg, onActionSuccess) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1. Nueva Versión (Navega al nuevo registro creado)
  const crearNuevaVersion = useMutation({
    mutationFn: () => api.post(`cotizaciones/nueva-version/${numReg}/`),
    onSuccess: (res) => {
      const { id_registro_nuevo, codigo_nuevo } = res.data.data;
      toast.success(`Versión ${codigo_nuevo} creada`);

      // Refresca la lista de aprobación para que aparezca la nueva versión
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });

      if (onActionSuccess) onActionSuccess("nueva-version", id_registro_nuevo);

      // Navega al detalle del nuevo registro generado
      navigate(`/sigecom/comercial/${id_registro_nuevo}`);
    },
    onError: () => toast.error("Error al crear nueva versión"),
  });

  // 2. Copiar Cotización
  const copiarCotizacion = useMutation({
    mutationFn: (payload) => api.post(`cotizaciones/${numReg}/generar-copia/`, payload),
    onSuccess: (res) => {
      const { id_registro_nuevo } = res.data.data;
      toast.success("Copia creada correctamente");

      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });

      if (onActionSuccess) onActionSuccess("copiar", id_registro_nuevo);

      // Navega a la copia recién creada
      navigate(`/sigecom/comercial/${id_registro_nuevo}`);
    },
    onError: () => toast.error("Error al crear la copia"),
  });

  // 3. Eliminar Cotización
  const eliminarCotizacion = useMutation({
    mutationFn: () => api.delete(`cotizaciones/eliminar/${numReg}/`),
    onSuccess: () => {
      toast.success("Cotización eliminada correctamente");
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });

      if (onActionSuccess) onActionSuccess("eliminar");

      // Regresa a la tabla principal
      navigate("/sigecom/comercial");
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

  // 5. Enviar Cotización Aprobación
  const enviarCotizacionAprobacion = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("access_token");
      const { data } = await api.patch(
        `cotizaciones/enviar-aprobacion/${id}/`, 
        {}, 
        { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      );
      return data;
    },
    onSuccess: (responseData) => {
      toast.success(responseData.message || "Cotización enviada al cliente exitosamente");
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });
      queryClient.invalidateQueries({ queryKey: ["cotizacion", numReg] });
      queryClient.invalidateQueries({ queryKey: ["cotizacion-detalle", numReg] });
      
      if (onActionSuccess) onActionSuccess("enviar-aprobacion", responseData);
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || "Hubo un error al procesar el envío";
      toast.error(errorMsg);
    }
  });

  const handleReporteDetallado = useCallback((setReporteDetalladoOpen) => {
    if (!numReg) return;
    setReporteDetalladoOpen(true);
  }, [numReg]);

  const handleReporteResumen = useCallback((setReporteResumenOpen) => {
    if (!numReg) return;
    setReporteResumenOpen(true);
  }, [numReg]);

  return {
    crearNuevaVersion,
    copiarCotizacion,
    eliminarCotizacion,
    guardarCotizacion,
    enviarCotizacionAprobacion,
    isPending: crearNuevaVersion.isPending || copiarCotizacion.isPending || eliminarCotizacion.isPending || guardarCotizacion.isPending || enviarCotizacionAprobacion.isPending,
    handleReporteDetallado,
    handleReporteResumen
  };
};