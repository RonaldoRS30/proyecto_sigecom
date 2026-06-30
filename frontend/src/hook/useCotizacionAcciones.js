import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "../utils/toast";
import api from "@/services/api";

export const useCotizacionAcciones = (numReg, onActionSuccess) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Obtiene el prefijo de ruta plural correspondiente según el path actual
  const getPluralPrefix = () => {
    if (location.pathname.includes("/oportunidades")) {
      return "/sigecom/comercial/oportunidades";
    }
    if (location.pathname.includes("/aperturas")) {
      return "/sigecom/comercial/aperturas";
    }
    return "/sigecom/comercial/cotizaciones";
  };

  // 1. Nueva Versión (Navega al nuevo registro creado)
  const crearNuevaVersion = useMutation({
    mutationFn: () => api.post(`cotizaciones/nueva-version/${numReg}/`),
    onSuccess: (res) => {
      const { id_registro_nuevo, codigo_nuevo } = res.data.data;
      toast.success(`Versión ${codigo_nuevo} creada`);

      // Refresca las listas de cotizaciones, oportunidades y aperturas
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["oportunidades"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["aperturas"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"], refetchType: "none" });

      if (onActionSuccess) onActionSuccess("nueva-version", id_registro_nuevo);

      // Navega al detalle del nuevo registro generado con la ruta plural correcta
      navigate(`${getPluralPrefix()}/${id_registro_nuevo}`);
    },
    onError: () => toast.error("Error al crear nueva versión"),
  });

  // 2. Copiar Cotización
  const copiarCotizacion = useMutation({
    mutationFn: (payload) => api.post(`cotizaciones/${numReg}/generar-copia/`, payload),
    onSuccess: (res) => {
      const { id_registro_nuevo } = res.data.data;
      toast.success("Copia creada correctamente");

      // Refresca las listas de cotizaciones, oportunidades y aperturas
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["oportunidades"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["aperturas"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"], refetchType: "none" });

      if (onActionSuccess) onActionSuccess("copiar", id_registro_nuevo);

      // Navega a la copia recién creada con la ruta plural correcta
      navigate(`${getPluralPrefix()}/${id_registro_nuevo}`);
    },
    onError: () => toast.error("Error al crear la copia"),
  });

  // 3. Eliminar Cotización
  const eliminarCotizacion = useMutation({
    mutationFn: () => api.delete(`cotizaciones/eliminar/${numReg}/`),
    onSuccess: () => {
      toast.success("Cotización eliminada correctamente");
      // Refresca las listas de cotizaciones, oportunidades y aperturas
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["oportunidades"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["aperturas"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"], refetchType: "none" });

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
      // Refresca el detalle actual y las listas globales para reflejar los cambios
      queryClient.invalidateQueries({ queryKey: ["cotizacion-detalle", numReg] });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["oportunidades"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["aperturas"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"], refetchType: "none" });
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
      queryClient.invalidateQueries({ queryKey: ["cotizacion", numReg] });
      queryClient.invalidateQueries({ queryKey: ["cotizacion-detalle", numReg] });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["oportunidades"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["aperturas"], refetchType: "none" });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"], refetchType: "none" });
      
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