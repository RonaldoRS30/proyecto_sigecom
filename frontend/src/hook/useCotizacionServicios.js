import { useState, useCallback, useEffect, useMemo } from 'react';
import api from '@/services/api';
import { toast } from 'react-toastify';
import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export const useCotizacionServicios = (numReg) => {
  const [gruposServicios, setGruposServicios] = useState({});
  const [originalGruposServicios, setOriginalGruposServicios] = useState({});
  const [deletedServicioIds, setDeletedServicioIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const isServiciosDirty = useMemo(() => {
    return JSON.stringify(gruposServicios) !== JSON.stringify(originalGruposServicios) || deletedServicioIds.length > 0;
  }, [gruposServicios, originalGruposServicios, deletedServicioIds]);

  // Mapeamos el formato jerárquico retornado por el backend
  const mapServiciosBackendToState = useCallback((rows = []) => {
    const estructura = {};
    if (!Array.isArray(rows)) return estructura;

    rows.forEach((srv) => {
      estructura[srv.id_servicio] = {
        id_servicio: srv.id_servicio,
        tituloGeneral: srv.tituloGeneral || "",
        cantidad: Number(srv.cantidad || 1),
        detalle: srv.detalle || "",
        orden: srv.orden || 0,
        subgrupos: (srv.subgrupos || []).map(sg => ({
          id_servicio: sg.id,
          titulo: sg.titulo || "",
          tipoCodigo: sg.tipoCodigo || "",
          tipoNombre: sg.tipoNombre || "",
          codigo_servicio: sg.codigo_servicio || "",
          items: (sg.items || []).map(it => ({
            id_servicio: it.id_servicio,
            id_registro: it.id_registro,
            id_tipo_gasto: it.id_tipo_gasto,
            id_area: it.id_area,
            area_nombre: it.area_nombre || "",
            gasto_nombre: it.gasto_nombre || "",
            codigo_servicio: it.codigo_servicio || "",
            nombre_servicio: it.nombre_servicio || "",
            nivel: it.nivel,
            codigo_item: it.codigo_item || "",
            descripcion_item: it.descripcion_item || "",
            horas: Number(it.horas || 0),
            cantidad_hombres: Number(it.cantidad_hombres || 0),
            costo_hombre_dia: Number(it.costo_hombre_dia || 0),
            cantidad_dias: Number(it.cantidad_dias || 0),
            costo_total: Number(it.costo_total || 0),
            porcentaje: Number(it.porcentaje || 0),
            utilidad: Number(it.utilidad || 0),
            cotizado_hombre_dia: Number(it.cotizado_hombre_dia || 0),
            cotizado_total: Number(it.cotizado_total || 0),
            descripcion_servicio: it.descripcion_servicio || "",
            orden: it.orden || 0
          }))
        }))
      };
    });

    return estructura;
  }, []);

  const fetchServicios = useCallback(async () => {
    if (!numReg) return;
    setLoading(true);
    try {
      const res = await api.get(`cotizaciones/lista_servicios/${numReg}/`);
      const mapped = mapServiciosBackendToState(res.data);
      setGruposServicios(mapped);
      setOriginalGruposServicios(JSON.parse(JSON.stringify(mapped)));
      setDeletedServicioIds([]);
    } catch (error) {
      console.error("Error cargando servicios:", error);
      toast.error("Error al sincronizar servicios");
    } finally {
      setLoading(false);
    }
  }, [numReg, mapServiciosBackendToState]);

  useEffect(() => {
    fetchServicios();
  }, [fetchServicios]);

  // Agregar / Editar Grupo de Servicios (Nivel 0)
  const handleAgregarGrupoServicio = async (form) => {
    try {
      const isEdit = Boolean(form._key && gruposServicios[form._key]);
      
      setGruposServicios(prev => {
        const next = { ...prev };
        if (isEdit) {
          const idReal = form._key;
          const srvExistente = next[idReal];
          if (srvExistente) {
            next[idReal] = {
              ...srvExistente,
              tituloGeneral: form.nombre.toUpperCase(),
              cantidad: Number(form.cantidad || 1),
              detalle: form.detalle || "",
            };
          }
        } else {
          const existentes = Object.values(prev)
            .map(g => {
              const code = g.codigo_servicio;
              if (code && !isNaN(code)) {
                return parseInt(code, 10);
              }
              const firstSg = g.subgrupos?.[0];
              const sgCode = firstSg?.codigo_servicio;
              if (sgCode && sgCode.length >= 2) {
                return parseInt(sgCode.slice(0, 2), 10);
              }
              return null;
            })
            .filter(n => n !== null && !isNaN(n));
          const maxCode = existentes.length > 0 ? Math.max(...existentes) : 0;
          const nuevoCodigo = String(maxCode + 1).padStart(2, '0');

          const tempGroupId = `temp_srv_group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const tempSub1Id = `temp_srv_sub_${Date.now()}_1_${Math.random().toString(36).substr(2, 9)}`;
          const tempSub2Id = `temp_srv_sub_${Date.now()}_2_${Math.random().toString(36).substr(2, 9)}`;
          const tempSub3Id = `temp_srv_sub_${Date.now()}_3_${Math.random().toString(36).substr(2, 9)}`;

          const sub1Items = [];
          const sub2Items = [];
          const sub3Items = [];

          if (Array.isArray(form.items)) {
            form.items.forEach((item, index) => {
              const cantidad = Number(item.cantidad_hombres || 0);
              const dias = item.categoria === "06" ? 1 : Number(item.cantidad_dias || 0);
              const horas = Number(item.horas || 8);
              const costoDia = Number(item.costo_hombre_dia || 0);
              
              const costoTotal = cantidad * costoDia * dias;
              const porcentajeUtilidad = Number(item.porcentaje || 0);
              const utilidad = costoTotal * (porcentajeUtilidad / 100);
              const cotizadoTotal = Number(item.cotizado_total || 0);
              const cotizadoDia = Number(item.cotizado_hombre_dia || 0);

              const payload = {
                id_servicio: `temp_srv_item_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                id_registro: numReg,
                nivel: 2,
                codigo_item: (item.codigo_item || "S/C").toUpperCase(),
                descripcion_item: (item.descripcion_item || "SERVICIO").toUpperCase(),
                horas: horas,
                cantidad_hombres: cantidad,
                costo_hombre_dia: costoDia,
                cantidad_dias: dias,
                costo_total: costoTotal,
                porcentaje: porcentajeUtilidad,
                utilidad: utilidad,
                cotizado_hombre_dia: cotizadoDia,
                cotizado_total: cotizadoTotal,
                id_area: 1, // Default area
                orden: index + 1
              };

              if (item.categoria === "04") {
                payload.codigo_servicio = `${nuevoCodigo}042`;
                payload.id_tipo_gasto = 3;
                sub1Items.push(payload);
              } else if (item.categoria === "05") {
                payload.codigo_servicio = `${nuevoCodigo}052`;
                payload.id_tipo_gasto = 4;
                sub2Items.push(payload);
              } else if (item.categoria === "06") {
                payload.codigo_servicio = `${nuevoCodigo}062`;
                payload.id_tipo_gasto = 5;
                sub3Items.push(payload);
              }
            });
          }

          const sub1Title = (form.categoryTitles?.["04"] || "MANO DE OBRA").toUpperCase();
          const sub2Title = (form.categoryTitles?.["05"] || "GASTOS SERVICIO").toUpperCase();
          const sub3Title = (form.categoryTitles?.["06"] || "OTROS").toUpperCase();

          next[tempGroupId] = {
            id_servicio: tempGroupId,
            tituloGeneral: form.nombre.toUpperCase(),
            cantidad: Number(form.cantidad || 1),
            detalle: form.detalle || "",
            orden: Math.max(...Object.values(prev).map(g => g.orden || 0), 0) + 1,
            subgrupos: [
              { id_servicio: tempSub1Id, titulo: sub1Title, tipoCodigo: "04", tipoNombre: "MANO DE OBRA", codigo_servicio: `${nuevoCodigo}041`, items: sub1Items },
              { id_servicio: tempSub2Id, titulo: sub2Title, tipoCodigo: "05", tipoNombre: "GASTOS SERVICIO", codigo_servicio: `${nuevoCodigo}051`, items: sub2Items },
              { id_servicio: tempSub3Id, titulo: sub3Title, tipoCodigo: "06", tipoNombre: "OTROS", codigo_servicio: `${nuevoCodigo}061`, items: sub3Items }
            ]
          };
        }
        return next;
      });

      toast.success(isEdit ? "Grupo de servicios actualizado localmente" : "Grupo de servicios y subgrupos creados localmente");
      return true;
    } catch (error) {
      console.error("Error al guardar grupo de servicios:", error);
      toast.error("Error al procesar grupo de servicios");
      return false;
    }
  };

  // Agregar / Editar Item (Nivel 2) dentro de un subgrupo
  const handleAgregarItemServicio = async (form, parentServicioId, parentSubgrupoId, activeAreaId) => {
    try {
      const isEdit = Boolean(form.id_servicio);
      const servicio = gruposServicios[parentServicioId];
      if (!servicio) return false;

      const subgrupo = servicio.subgrupos?.find(sg => sg.id_servicio === parentSubgrupoId);
      if (!subgrupo) return false;

      setGruposServicios(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const srv = next[parentServicioId];
        if (!srv) return prev;

        const subg = srv.subgrupos?.find(sg => sg.id_servicio === parentSubgrupoId);
        if (!subg) return prev;

        // Calcular montos y utilidades
        const cantidad = Number(form.cantidad_hombres || 0);
        const dias = Number(form.cantidad_dias || 0);
        const costoDia = Number(form.costo_hombre_dia || 0);
        const horas = Number(form.horas || 0);
        
        const costoTotal = cantidad * costoDia * dias;
        const porcentajeUtilidad = Number(form.porcentaje || 0);
        const utilidad = costoTotal * (porcentajeUtilidad / 100);
        const cotizadoTotal = costoTotal + utilidad;
        const cotizadoDia = cantidad > 0 && dias > 0 ? (cotizadoTotal / (cantidad * dias)) : 0;

        const payload = {
          id_registro: numReg,
          nivel: 2,
          codigo_item: (form.codigo_item || "S/C").toUpperCase(),
          descripcion_item: (form.descripcion_item || "SERVICIO").toUpperCase(),
          horas: horas,
          cantidad_hombres: cantidad,
          costo_hombre_dia: costoDia,
          cantidad_dias: dias,
          costo_total: costoTotal,
          porcentaje: porcentajeUtilidad,
          utilidad: utilidad,
          cotizado_hombre_dia: cotizadoDia,
          cotizado_total: cotizadoTotal,
          id_tipo_gasto: subg.tipoCodigo?.endsWith("04") ? 3 : subg.tipoCodigo?.endsWith("05") ? 4 : 5,
          id_area: activeAreaId || 1
        };

        if (isEdit) {
          const itemExistente = subg.items?.find(it => it.id_servicio === form.id_servicio);
          payload.id_servicio = form.id_servicio;
          payload.codigo_servicio = itemExistente?.codigo_servicio;
          payload.orden = itemExistente?.orden || 0;

          subg.items = (subg.items || []).map(it => it.id_servicio === form.id_servicio ? payload : it);
        } else {
          let parentCode = subg.codigo_servicio;
          if (!parentCode || parentCode.length < 5) {
            let groupCode = srv.codigo_servicio;
            if (!groupCode || groupCode.length > 2) {
              groupCode = srv.subgrupos?.[0]?.codigo_servicio?.slice(0, 2) || "01";
            }
            parentCode = `${groupCode}${subg.tipoCodigo || "04"}1`;
          }

          const itemCode = parentCode.length >= 4 ? parentCode.slice(0, 4) + "2" : parentCode + "2";

          payload.id_servicio = `temp_srv_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          payload.codigo_servicio = itemCode;
          payload.orden = (subg.items || []).length + 1;

          subg.items = [...(subg.items || []), payload];
        }

        return next;
      });

      toast.success(isEdit ? "Ítem de servicio actualizado localmente" : "Ítem de servicio añadido localmente");
      return true;
    } catch (error) {
      console.error("Error al guardar ítem de servicio:", error);
      toast.error("Error al guardar ítem de servicio");
      return false;
    }
  };

  // Eliminar Grupo de Servicios (Nivel 0 y cascada)
  const handleEliminarGrupoServicio = async (idServicio, nombreGrupo) => {
    if (!confirm(`¿Está seguro de eliminar el grupo de servicios "${nombreGrupo}" y todos sus subgrupos e ítems asociados?`)) {
      return false;
    }

    const grupo = gruposServicios[idServicio];
    if (!grupo) return false;

    const toDelete = [];
    if (typeof idServicio !== 'string' || !idServicio.startsWith('temp_')) {
      toDelete.push(idServicio);
    }
    (grupo.subgrupos || []).forEach(sg => {
      if (typeof sg.id_servicio !== 'string' || !sg.id_servicio.startsWith('temp_')) {
        toDelete.push(sg.id_servicio);
      }
      (sg.items || []).forEach(it => {
        if (typeof it.id_servicio !== 'string' || !it.id_servicio.startsWith('temp_')) {
          toDelete.push(it.id_servicio);
        }
      });
    });

    if (toDelete.length > 0) {
      setDeletedServicioIds(prev => [...prev, ...toDelete]);
    }

    setGruposServicios(prev => {
      const next = { ...prev };
      delete next[idServicio];
      return next;
    });

    toast.success(`Grupo "${nombreGrupo}" eliminado localmente`);
    return true;
  };

  // Eliminar Ítem de Servicio (Nivel 2)
  const handleEliminarItemServicio = async (idItem) => {
    if (!confirm("¿Está seguro de eliminar este ítem de servicio?")) {
      return false;
    }

    if (typeof idItem !== 'string' || !idItem.startsWith('temp_')) {
      setDeletedServicioIds(prev => [...prev, idItem]);
    }

    setGruposServicios(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      Object.values(next).forEach(grupo => {
        if (grupo.subgrupos) {
          grupo.subgrupos.forEach(subgrupo => {
            subgrupo.items = (subgrupo.items || []).filter(it => it.id_servicio !== idItem);
          });
        }
      });
      return next;
    });

    toast.success("Ítem de servicio eliminado localmente");
    return true;
  };

  // Duplicar Grupo de Servicios (Nivel 0 y cascada)
  const handleDuplicarServicio = async (idServicioOriginal) => {
    const grupo = gruposServicios[idServicioOriginal];
    if (!grupo) return false;

    setGruposServicios(prev => {
      const next = { ...prev };
      const existentes = Object.values(prev)
        .map(g => {
          const firstSg = g.subgrupos?.[0];
          const code = firstSg ? firstSg.tipoCodigo?.slice(0, 2) : null;
          return code ? parseInt(code, 10) : null;
        })
        .filter(n => n !== null && !isNaN(n));
      const maxCode = existentes.length > 0 ? Math.max(...existentes) : 0;
      const nuevoCodigo = String(maxCode + 1).padStart(2, '0');

      const tempGroupId = `temp_srv_group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newSubgroups = (grupo.subgrupos || []).map((sg, sgIdx) => {
        const tempSubId = `temp_srv_sub_${Date.now()}_${sgIdx}_${Math.random().toString(36).substr(2, 9)}`;
        const subCode = `${nuevoCodigo}${sg.tipoCodigo?.slice(2, 4) || '04'}`;

        const newItems = (sg.items || []).map((item, itIdx) => {
          const tempItemId = `temp_srv_item_${Date.now()}_${sgIdx}_${itIdx}_${Math.random().toString(36).substr(2, 9)}`;
          const itemCode = `${subCode}${String(itIdx + 1).padStart(2, '0')}`;
          return {
            ...item,
            id_servicio: tempItemId,
            id_registro: numReg,
            codigo_servicio: itemCode
          };
        });

        return {
          id_servicio: tempSubId,
          titulo: sg.titulo,
          tipoCodigo: subCode,
          tipoNombre: sg.tipoNombre,
          items: newItems
        };
      });

      next[tempGroupId] = {
        id_servicio: tempGroupId,
        tituloGeneral: `${grupo.tituloGeneral} - COPIA`,
        cantidad: grupo.cantidad,
        detalle: grupo.detalle,
        orden: Math.max(...Object.values(prev).map(g => g.orden || 0), 0) + 1,
        subgrupos: newSubgroups
      };
      return next;
    });

    toast.success("Grupo de servicios duplicado localmente");
    return true;
  };

  const handleGuardarOrden = (nuevoEstadoGrupos) => {
    setGruposServicios(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let counter = 1;
      const sorted = Object.values(nuevoEstadoGrupos).sort((a, b) => (a.orden || 0) - (b.orden || 0));

      sorted.forEach((grupo) => {
        if (next[grupo.id_servicio]) {
          next[grupo.id_servicio].orden = counter++;
          if (next[grupo.id_servicio].subgrupos) {
            next[grupo.id_servicio].subgrupos.forEach((subgrupo) => {
              subgrupo.orden = counter++;
              if (subgrupo.items) {
                subgrupo.items.forEach((item) => {
                  item.orden = counter++;
                });
              }
            });
          }
        }
      });
      return next;
    });
  };

  const saveServicios = async () => {
    if (deletedServicioIds.length > 0) {
      const deletePromises = deletedServicioIds.map(id =>
        api.delete(`cotizaciones/lista_servicios/${numReg}/`, { params: { id_servicio: id } })
      );
      await Promise.all(deletePromises);
    }

    const toDec = (val) => {
      if (val === undefined || val === null || val === "" || isNaN(val) || val === "null" || val === "undefined") {
        return null;
      }
      return Number(val).toFixed(2);
    };

    const tempIdToRealIdMap = new Map();

    for (const gp of Object.values(gruposServicios)) {
      const isGroupTemp = typeof gp.id_servicio === 'string' && gp.id_servicio.startsWith('temp_');
      let realGroupId = gp.id_servicio;

      if (isGroupTemp) {
        const existentes = Object.values(gruposServicios)
          .map(g => {
            const code = g.codigo_servicio;
            if (code && !isNaN(code)) {
              return parseInt(code, 10);
            }
            const firstSg = g.subgrupos?.[0];
            const sgCode = firstSg?.codigo_servicio;
            if (sgCode && sgCode.length >= 2) {
              return parseInt(sgCode.slice(0, 2), 10);
            }
            return null;
          })
          .filter(n => n !== null && !isNaN(n));
        const maxCode = existentes.length > 0 ? Math.max(...existentes) : 0;
        const nuevoCodigo = String(maxCode + 1).padStart(2, '0');

        const payloadGroup = {
          id_registro: numReg,
          nivel: 0,
          nombre_servicio: gp.tituloGeneral,
          cantidad_hombres: gp.cantidad,
          descripcion_servicio: gp.detalle,
          codigo_servicio: `${nuevoCodigo}000`
        };

        const resGroup = await api.post(`cotizaciones/lista_servicios/${numReg}/`, payloadGroup);
        realGroupId = resGroup.data.id_servicio;
        tempIdToRealIdMap.set(gp.id_servicio, realGroupId);

        const sub1 = gp.subgrupos?.find(sg => sg.tipoCodigo === "04");
        const sub2 = gp.subgrupos?.find(sg => sg.tipoCodigo === "05");
        const sub3 = gp.subgrupos?.find(sg => sg.tipoCodigo === "06");

        const subgruposPayloads = [
          { nivel: 1, codigo_servicio: `${nuevoCodigo}041`, nombre_servicio: (sub1?.titulo || "MANO DE OBRA").toUpperCase(), id_tipo_gasto: 3, id_registro: numReg },
          { nivel: 1, codigo_servicio: `${nuevoCodigo}051`, nombre_servicio: (sub2?.titulo || "GASTOS SERVICIO").toUpperCase(), id_tipo_gasto: 4, id_registro: numReg },
          { nivel: 1, codigo_servicio: `${nuevoCodigo}061`, nombre_servicio: (sub3?.titulo || "OTROS").toUpperCase(), id_tipo_gasto: 5, id_registro: numReg }
        ];

        for (const subPayload of subgruposPayloads) {
          const resSub = await api.post(`cotizaciones/lista_servicios/${numReg}/`, subPayload);
          const realSubId = resSub.data.id_servicio;
          const tempSub = gp.subgrupos?.find(sg => sg.tipoCodigo === subPayload.codigo_servicio.slice(2, 4));
          if (tempSub) {
            tempIdToRealIdMap.set(tempSub.id_servicio, realSubId);
            for (const item of (tempSub.items || [])) {
              const payloadItem = {
                id_registro: numReg,
                nivel: 2,
                codigo_item: item.codigo_item,
                descripcion_item: item.descripcion_item,
                horas: item.horas,
                cantidad_hombres: item.cantidad_hombres,
                costo_hombre_dia: item.costo_hombre_dia,
                cantidad_dias: item.cantidad_dias,
                costo_total: toDec(item.costo_total),
                porcentaje: toDec(item.porcentaje),
                utilidad: toDec(item.utilidad),
                cotizado_hombre_dia: toDec(item.cotizado_hombre_dia),
                cotizado_total: toDec(item.cotizado_total),
                id_tipo_gasto: item.id_tipo_gasto,
                id_area: item.id_area,
                codigo_servicio: `${nuevoCodigo}${subPayload.codigo_servicio.slice(2, 4)}2`
              };
              const resItem = await api.post(`cotizaciones/lista_servicios/${numReg}/`, payloadItem);
              tempIdToRealIdMap.set(item.id_servicio, resItem.data.id_servicio);
            }
          }
        }
      } else {
        const srvExistente = gp;
        let groupCode = srvExistente.codigo_servicio;
        if (groupCode && groupCode.length >= 2) {
          groupCode = groupCode.slice(0, 2);
        } else {
          groupCode = srvExistente.subgrupos?.[0]?.codigo_servicio?.slice(0, 2) || "01";
        }

        const payloadGroup = {
          id_servicio: gp.id_servicio,
          id_registro: numReg,
          nivel: 0,
          nombre_servicio: gp.tituloGeneral,
          cantidad_hombres: gp.cantidad,
          descripcion_servicio: gp.detalle,
          codigo_servicio: `${groupCode}000`
        };
        await api.put(`cotizaciones/lista_servicios/${numReg}/`, payloadGroup);

        for (const sg of (gp.subgrupos || [])) {
          const subCode = `${groupCode}${sg.tipoCodigo || "04"}1`;

          if (typeof sg.id_servicio !== 'string' || !sg.id_servicio.startsWith('temp_')) {
            const payloadSub = {
              id_servicio: sg.id_servicio,
              id_registro: numReg,
              nivel: 1,
              nombre_servicio: sg.titulo,
              codigo_servicio: subCode
            };
            await api.put(`cotizaciones/lista_servicios/${numReg}/`, payloadSub);
          }

          for (const item of (sg.items || [])) {
            const isItemTemp = typeof item.id_servicio === 'string' && item.id_servicio.startsWith('temp_');
            const itemCode = `${groupCode}${sg.tipoCodigo || "04"}2`;

            if (isItemTemp) {
              const payloadItem = {
                id_registro: numReg,
                nivel: 2,
                codigo_item: item.codigo_item,
                descripcion_item: item.descripcion_item,
                horas: item.horas,
                cantidad_hombres: item.cantidad_hombres,
                costo_hombre_dia: item.costo_hombre_dia,
                cantidad_dias: item.cantidad_dias,
                costo_total: toDec(item.costo_total),
                porcentaje: toDec(item.porcentaje),
                utilidad: toDec(item.utilidad),
                cotizado_hombre_dia: toDec(item.cotizado_hombre_dia),
                cotizado_total: toDec(item.cotizado_total),
                id_tipo_gasto: item.id_tipo_gasto,
                id_area: item.id_area,
                codigo_servicio: itemCode
              };
              const resItem = await api.post(`cotizaciones/lista_servicios/${numReg}/`, payloadItem);
              tempIdToRealIdMap.set(item.id_servicio, resItem.data.id_servicio);
            } else {
              const payloadItem = {
                id_servicio: item.id_servicio,
                id_registro: numReg,
                nivel: 2,
                codigo_item: item.codigo_item,
                descripcion_item: item.descripcion_item,
                horas: item.horas,
                cantidad_hombres: item.cantidad_hombres,
                costo_hombre_dia: item.costo_hombre_dia,
                cantidad_dias: item.cantidad_dias,
                costo_total: toDec(item.costo_total),
                porcentaje: toDec(item.porcentaje),
                utilidad: toDec(item.utilidad),
                cotizado_hombre_dia: toDec(item.cotizado_hombre_dia),
                cotizado_total: toDec(item.cotizado_total),
                id_tipo_gasto: item.id_tipo_gasto,
                id_area: item.id_area,
                codigo_servicio: itemCode
              };
              await api.put(`cotizaciones/lista_servicios/${numReg}/`, payloadItem);
            }
          }
        }
      }
    }

    const reorderItems = [];
    let counter = 1;
    const sorted = Object.values(gruposServicios).sort((a, b) => (a.orden || 0) - (b.orden || 0));

    sorted.forEach((grupo) => {
      const realGroupId = tempIdToRealIdMap.get(grupo.id_servicio) || grupo.id_servicio;
      if (realGroupId) {
        reorderItems.push({
          id_servicio: realGroupId,
          orden: counter++
        });
      }

      if (grupo.subgrupos && Array.isArray(grupo.subgrupos)) {
        grupo.subgrupos.forEach((subgrupo) => {
          const realSubId = tempIdToRealIdMap.get(subgrupo.id_servicio) || subgrupo.id_servicio;
          if (realSubId) {
            reorderItems.push({
              id_servicio: realSubId,
              orden: counter++
            });
          }

          if (subgrupo.items && Array.isArray(subgrupo.items)) {
            subgrupo.items.forEach((item) => {
              const realItemId = tempIdToRealIdMap.get(item.id_servicio) || item.id_servicio;
              if (realItemId) {
                reorderItems.push({
                  id_servicio: realItemId,
                  orden: counter++
                });
              }
            });
          }
        });
      }
    });

    if (reorderItems.length > 0) {
      await api.put(`cotizaciones/lista_servicios/${numReg}/`, {
        reorder_items: reorderItems
      });
    }

    setDeletedServicioIds([]);
    await fetchServicios();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        predicate: (event) => {
          return !!event.target.closest('[data-drag-handle]');
        }
      },
    })
  );

  const handleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;

    const activeIdStr = active.id.toString();
    const overIdStr = over.id.toString();

    // 1. Reordenar Grupos (Nivel 0)
    if (activeIdStr.startsWith("grupo-") && overIdStr.startsWith("grupo-")) {
      const activeId = parseInt(activeIdStr.replace("grupo-", ""), 10);
      const overId = parseInt(overIdStr.replace("grupo-", ""), 10);

      const sorted = Object.values(gruposServicios).sort((a, b) => (a.orden || 0) - (b.orden || 0));
      const oldIndex = sorted.findIndex(g => g.id_servicio === activeId);
      const newIndex = sorted.findIndex(g => g.id_servicio === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(sorted, oldIndex, newIndex);
        const nuevoEstado = { ...gruposServicios };
        
        reordered.forEach((grupo, idx) => {
          nuevoEstado[grupo.id_servicio].orden = idx + 1;
        });
        
        setGruposServicios(nuevoEstado);
        handleGuardarOrden(nuevoEstado);
      }
      return;
    }

    // 2. Reordenar Items (Nivel 2) dentro de su subgrupo
    if (activeIdStr.startsWith("item-")) {
      const activeItemId = parseInt(activeIdStr.replace("item-", ""), 10);

      let foundGroupKey = null;
      let foundSubgrupoIdx = -1;
      let foundItemIdx = -1;

      Object.entries(gruposServicios).forEach(([grupoKey, grupo]) => {
        if (grupo.subgrupos && Array.isArray(grupo.subgrupos)) {
          grupo.subgrupos.forEach((subgrupo, sgIdx) => {
            const idx = subgrupo.items.findIndex(it => it.id_servicio === activeItemId);
            if (idx !== -1) {
              foundGroupKey = grupoKey;
              foundSubgrupoIdx = sgIdx;
              foundItemIdx = idx;
            }
          });
        }
      });

      if (!foundGroupKey || foundSubgrupoIdx === -1 || foundItemIdx === -1) return;

      let targetItemIdx = -1;

      if (overIdStr.startsWith("item-")) {
        const overItemId = parseInt(overIdStr.replace("item-", ""), 10);
        const subgrupo = gruposServicios[foundGroupKey].subgrupos[foundSubgrupoIdx];
        targetItemIdx = subgrupo.items.findIndex(it => it.id_servicio === overItemId);
      }

      if (targetItemIdx === -1 || foundItemIdx === targetItemIdx) return;

      const nuevoEstado = JSON.parse(JSON.stringify(gruposServicios));
      const subgrupoItems = nuevoEstado[foundGroupKey].subgrupos[foundSubgrupoIdx].items;
      const reorderedItems = arrayMove(subgrupoItems, foundItemIdx, targetItemIdx);
      nuevoEstado[foundGroupKey].subgrupos[foundSubgrupoIdx].items = reorderedItems;

      setGruposServicios(nuevoEstado);
      handleGuardarOrden(nuevoEstado);
    }
  }, [gruposServicios, handleGuardarOrden]);

  const handleReporteServicios = useCallback(() => {
    if (!numReg) return;
  }, [numReg]);

  return {
    gruposServicios,
    setGruposServicios,
    fetchServicios,
    loading,
    handleAgregarGrupoServicio,
    handleAgregarItemServicio,
    handleEliminarGrupoServicio,
    handleEliminarItemServicio,
    handleDuplicarServicio,
    sensors,
    handleDragEnd,
    handleReporteServicios,
    isServiciosDirty,
    saveServicios,
  };
};
