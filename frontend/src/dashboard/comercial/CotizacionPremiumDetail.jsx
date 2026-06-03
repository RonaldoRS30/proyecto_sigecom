import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useParams, useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import api from '@/services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import SelectField from '../../components/ui/SelectField';
import { CompactField } from '../../components/ui/CompactField';
import { CompactTiempoUnidad } from '../../components/ui/CompactTiempoUnidad';
import { cn } from "@/lib/utils";
import TrackingInput from '@/components/ui/TrackingInput';
import ActionMenu from '@/components/ui/ActionMenu';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from 'date-fns/locale/es';

registerLocale('es', es);

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Import sub-components from SIGECOM_5 (using existing ones where possible)
import AgregarGrupoSuministroModal from '../Suministros/AgregarGrupoSuministroModal';
import RegistroItemModal from '../Suministros/RegistroItemModal';
import RegistroItemBuscadorModal from '../Suministros/RegistroItemBuscadorModal';
import { useCotizacionAcciones } from '@/hook/useCotizacionAcciones';
import { useCotizacionSuministros } from '@/hook/useCotizacionSuministros';
import { useCotizacionServicios } from '@/hook/useCotizacionServicios';
import { ClienteAutocomplete, RepresentanteAutocomplete, ProductoAutocomplete } from '@/components/comercial/CotizacionAutocompletes';
import { calcularItemSegunProveedor, resolverEndpointPorProveedor } from '@/dashboard/Suministros/tables/tablaUtils';

const Icon = ({ name, className }) => {
  const iconName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  const LucideIcon = LucideIcons[iconName] || LucideIcons.HelpCircle;
  return <LucideIcon className={className} />;
};

const QuickAddGroupRow = ({ tipo, onAdd }) => {
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const colorClass = tipo === 'equipos' ? 'indigo' : 'amber';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && nombre.trim()) {
      onAdd({ nombre, cantidad });
      setNombre('');
      setCantidad(1);
    }
  };

  return (
    <div className={`mt-2 group flex items-center gap-3 px-4 py-2 bg-white border-2 border-dashed border-${colorClass}-100 rounded-xl hover:border-${colorClass}-300 transition-all focus-within:border-${colorClass}-400 focus-within:bg-${colorClass}-50/30 shadow-sm`}>
      <div className={`p-1.5 rounded-lg bg-${colorClass}-100 text-${colorClass}-600 group-hover:rotate-90 transition-transform`}>
        <Icon name="plus" className="h-3.5 w-3.5" />
      </div>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Añadir nueva partida de ${tipo}...`}
        className="flex-1 bg-transparent border-none outline-none font-black text-[11px] uppercase placeholder:text-gray-300 text-gray-700"
      />
      <div className="flex items-center gap-2 px-3 border-l border-gray-100">
        <span className="text-[9px] font-black text-gray-400 uppercase">Cant:</span>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="w-10 bg-transparent font-bold text-[10px] text-center outline-none text-gray-600"
        />
      </div>
      <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest hidden md:block">Presiona Enter</span>
    </div>
  );
};

// ==========================================
// SUB-COMPONENTE: REPROGRAMAR ALERTA (MENU)
// ==========================================
const ReprogramMenu = ({ note, onReprogram }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const handleConfirm = () => {
    const formatted = tempDate.toLocaleString('sv-SE').replace('T', ' ');
    onReprogram(note, 'reprogram', formatted);
    setIsMenuOpen(false);
  };

  return (
    <ActionMenu
      title="Reprogramar Alerta"
      align="end"
      open={isMenuOpen}
      onOpenChange={setIsMenuOpen}
      closeOnSelect={false}
      contentClassName="min-w-[440px]"
      customTrigger={
        <button
          className="p-1 rounded hover:bg-amber-50 text-amber-600 transition-all"
          title="Reprogramar"
        >
          <Icon name="refresh-cw" className="h-3.5 w-3.5" />
        </button>
      }
    >
      <div
        className="p-3 bg-white"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirm();
          }
        }}
      >
        <div className="flex gap-4 items-stretch">
          <div className="border-r border-slate-100 pr-4" onClick={(e) => e.stopPropagation()}>
            <DatePicker
              selected={tempDate}
              onChange={(date) => {
                const newDate = date || new Date();
                newDate.setHours(tempDate.getHours());
                newDate.setMinutes(tempDate.getMinutes());
                setTempDate(newDate);
              }}
              locale="es"
              inline
              minDate={new Date()}
            />
          </div>

          <div className="flex-1 flex flex-col justify-center py-1 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hora de Alerta</span>
              <input
                type="time"
                value={tempDate.toTimeString().slice(0, 5)}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':');
                  const newDate = new Date(tempDate);
                  newDate.setHours(parseInt(h), parseInt(m));
                  setTempDate(newDate);
                }}
                className="text-xl font-black text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full text-center focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
              />
            </div>

            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
              <span className="text-[9px] font-black text-indigo-400 uppercase block mb-2">Programado para:</span>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-700 uppercase">
                  {tempDate.toLocaleString('es-PE', { day: '2-digit', month: 'long' })}
                </span>
                <span className="text-lg font-black text-indigo-600">
                  {tempDate.toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              <Icon name="check" className="h-3.5 w-3.5" />
              Confirmar Fecha (Enter)
            </button>
          </div>
        </div>
      </div>
    </ActionMenu>
  );
};

const QuickInput = ({ placeholder, onSave, icon: Icon, className }) => {
  const [val, setVal] = useState("");
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-gray-100 focus-within:border-indigo-300 focus-within:bg-white transition-all", className)}>
      {Icon && <Icon size={16} className="text-gray-400" />}
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && val.trim()) {
            onSave(val);
            setVal("");
          }
        }}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-[11px] font-bold uppercase placeholder:text-gray-300 text-slate-700"
      />
    </div>
  );
};

const EditableGroupRow = ({ tipo, onSave, formatMoneySymbol }) => {
  const [tempData, setTempData] = useState({ titulo: '', cantidad: 1 });
  const [tempItems, setTempItems] = useState([]);
  const [newItem, setNewItem] = useState({ codigo_item: '', descripcion: '', cantidad: 1, precio_venta: 0 });

  const formatMoneySymbolSafe = formatMoneySymbol || ((val) => `$ ${Number(val || 0).toFixed(2)}`);

  const handleAddItem = () => {
    if (!newItem.descripcion.trim()) {
      toast.warn("Por favor ingrese la descripción del producto.");
      return;
    }
    setTempItems([
      ...tempItems,
      {
        id_temp: Date.now() + Math.random(),
        codigo_item: (newItem.codigo_item || "S/C").toUpperCase(),
        descripcion: newItem.descripcion.toUpperCase(),
        cantidad: Number(newItem.cantidad || 1),
        precio_venta: Number(newItem.precio_venta || 0)
      }
    ]);
    setNewItem({ codigo_item: '', descripcion: '', cantidad: 1, precio_venta: 0 });
  };

  const handleRemoveItem = (idTemp) => {
    setTempItems(tempItems.filter(item => item.id_temp !== idTemp));
  };

  const handleSaveGroup = () => {
    if (!tempData.titulo.trim()) return;
    onSave({
      nombre: tempData.titulo.toUpperCase(),
      cantidad: tempData.cantidad,
      tipo: tipo,
      items: tempItems
    });
    setTempData({ titulo: '', cantidad: 1 }); // Reset group
    setTempItems([]); // Reset items
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && tempData.titulo.trim()) {
      handleSaveGroup();
    }
  };

  const canExpand = tipo !== "SERVICIOS";
  const isExpanded = canExpand && tempData.titulo.trim().length > 0;
  const totalItemsVenta = tempItems.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0);
  const totalGrupoCalculado = totalItemsVenta * tempData.cantidad;

  return (
    <div className={cn(
      "bg-white border rounded-xl overflow-hidden transition-all duration-300 shadow-sm mb-6",
      isExpanded ? "border-indigo-400 ring-4 ring-indigo-50" : "border-gray-200"
    )}>
      {/* Cabecera del Grupo editable */}
      <div className="px-5 py-3.5 flex justify-between items-center bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center gap-3 flex-1">
          <div className={cn("transition-transform duration-300", isExpanded ? "rotate-90 text-indigo-600" : "rotate-0 text-gray-400")}>
            <Icon name="plus" className="h-4 w-4" />
          </div>

          <div className="flex flex-col flex-1 max-w-[300px]">
            <input
              type="text"
              placeholder="NOMBRE DE LA NUEVA PARTIDA DE SUMINISTROS..."
              className="bg-transparent border-none outline-none font-black text-gray-800 text-[12px] uppercase tracking-wide w-full placeholder:text-gray-400 focus:ring-0 px-0"
              value={tempData.titulo}
              onChange={(e) => setTempData({ ...tempData, titulo: e.target.value })}
              onKeyDown={handleKeyDown}
            />
          </div>

          {canExpand && (
            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
              {tempItems.length} Ítems a crear
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 ml-2 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg focus-within:border-indigo-400 transition-colors">
            <span className="text-[9px] font-black text-indigo-600 uppercase">Cant:</span>
            <input
              type="number"
              min="1"
              className="w-10 bg-transparent border-none outline-none text-[11.5px] font-black text-indigo-800 text-center focus:ring-0 p-0"
              value={tempData.cantidad}
              onChange={(e) => setTempData({ ...tempData, cantidad: parseInt(e.target.value) || 1 })}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="text-right min-w-[120px] flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                Total Grupo:
              </span>
              <span className="text-[11.5px] font-black text-indigo-600 uppercase tracking-tight">
                {formatMoneySymbolSafe(totalGrupoCalculado)}
              </span>
            </div>
          </div>

          <div className="text-right flex justify-end ml-2">
            <button
              onClick={handleSaveGroup}
              disabled={!tempData.titulo.trim()}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 border shadow-sm",
                tempData.titulo.trim()
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 hover:shadow-md"
                  : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
              )}
            >
              {tempItems.length > 0 ? "Crear Partida + Ítems" : "Crear Partida"}
            </button>
          </div>
        </div>
      </div>

      {/* Items Section (Only visible if isExpanded is true) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-4 bg-gray-50/20">
              <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Icon name="package-2" className="h-3.5 w-3.5" />
                Agregar suministros a la nueva partida
              </h4>

              <div className="overflow-x-auto border border-gray-100 rounded-lg bg-white shadow-inner">
                <table className="min-w-full table-fixed divide-y divide-gray-100">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="w-[15%] px-4 py-2 text-left text-[9px] font-bold text-gray-400 uppercase">P/N</th>
                      <th className="w-[45%] px-4 py-2 text-left text-[9px] font-bold text-gray-400 uppercase">Descripción *</th>
                      <th className="w-[10%] px-4 py-2 text-center text-[9px] font-bold text-gray-400 uppercase">Cant</th>
                      <th className="w-[13%] px-4 py-2 text-right text-[9px] font-bold text-gray-400 uppercase">Costo U.</th>
                      <th className="w-[12%] px-4 py-2 text-right text-[9px] font-bold text-gray-400 uppercase">Total</th>
                      <th className="w-[5%] px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tempItems.map((item) => (
                      <tr key={item.id_temp} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-1.5 text-[11px] font-bold text-gray-900 uppercase">{item.codigo_item}</td>
                        <td className="px-4 py-1.5 text-[11px] text-gray-700 uppercase font-medium">{item.descripcion}</td>
                        <td className="px-4 py-1.5 text-[11px] text-center font-bold text-gray-900">{item.cantidad}</td>
                        <td className="px-4 py-1.5 text-[11px] text-right text-gray-600 font-medium">{formatMoneySymbolSafe(item.precio_venta)}</td>
                        <td className="px-4 py-1.5 text-[11px] font-black text-right text-gray-900">{formatMoneySymbolSafe(item.cantidad * item.precio_venta)}</td>
                        <td className="px-4 py-1.5 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.id_temp)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                            title="Quitar"
                          >
                            <Icon name="trash-2" className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Fila de agregado rápido */}
                    <tr className="bg-indigo-50/10">
                      <td className="px-4 py-1.5">
                        <input
                          type="text"
                          placeholder="P/N..."
                          className="w-full bg-transparent border border-gray-200 rounded px-2 py-1 text-[11px] font-bold uppercase text-indigo-700 placeholder:text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                          value={newItem.codigo_item}
                          onChange={(e) => setNewItem({ ...newItem, codigo_item: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddItem();
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-1.5">
                        <input
                          type="text"
                          placeholder="DESCRIPCIÓN DEL ARTÍCULO..."
                          className="w-full bg-transparent border border-gray-200 rounded px-2 py-1 text-[11px] font-bold uppercase text-indigo-700 placeholder:text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                          value={newItem.descripcion}
                          onChange={(e) => setNewItem({ ...newItem, descripcion: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddItem();
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-1.5 text-center">
                        <input
                          type="number"
                          min="1"
                          placeholder="Cant"
                          className="w-16 bg-transparent border border-gray-200 rounded px-2 py-1 text-[11px] font-bold text-center text-indigo-700 placeholder:text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                          value={newItem.cantidad || ""}
                          onChange={(e) => setNewItem({ ...newItem, cantidad: parseInt(e.target.value) || 1 })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddItem();
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-1.5 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-24 bg-transparent border border-gray-200 rounded px-2 py-1 text-[11px] font-bold text-right text-indigo-700 placeholder:text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                          value={newItem.precio_venta || ""}
                          onChange={(e) => setNewItem({ ...newItem, precio_venta: parseFloat(e.target.value) || 0 })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddItem();
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-1.5 text-right text-[11px] font-black text-indigo-600 align-middle">
                        {formatMoneySymbolSafe((newItem.cantidad || 1) * (newItem.precio_venta || 0))}
                      </td>
                      <td className="px-4 py-1.5 text-center align-middle">
                        <button
                          onClick={handleAddItem}
                          className="p-1 bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                          title="Añadir"
                        >
                          <Icon name="check" className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CotizacionPremiumDetail = ({ esOportunidad = false }) => {
  const { numReg } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    crearNuevaVersion,
    copiarCotizacion, // Extraer la función de copia
    eliminarCotizacion,
    enviarCotizacionAprobacion,
    isPending,
    handleReporteDetallado,
    handleReporteResumen
  } = useCotizacionAcciones(numReg, (action, payload) => {
    if (action === "enviar-aprobacion") {
      // Sincronizar estado local inmediatamente para evitar F5
      setData(prev => prev ? { ...prev, estado_envio: 2 } : prev);
      setOriginalData(prev => prev ? { ...prev, estado_envio: 2 } : prev);
    }
  });
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isReadOnly = Number(data?.estado_envio ?? 0) === 2;
  const isVenta = data?.id_tipo === "V";
  const canEdit = !isReadOnly;
  const quillRef = useRef(null);

  const xlsInputRef = useRef(null);
  const [xlsImportGrupoActivo, setXlsImportGrupoActivo] = useState(null);
  const [quickAddForm, setQuickAddForm] = useState({});

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsType, setSuggestionsType] = useState(null); // 'add' or 'edit'
  const [suggestionsKey, setSuggestionsKey] = useState(null); // groupCode or itemId
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const suggestionsTimeoutRef = useRef(null);

  const [reporteSuministrosOpen, setReporteSuministrosOpen] = useState(false);
  const [reporteServiciosOpen, setReporteServiciosOpen] = useState(false);

  // Control del menú desplegable del header
  const [reporteMenuOpen, setReporteMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Control de los modales de visualización para Cliente
  const [reporteResumenOpen, setReporteResumenOpen] = useState(false);
  const [reporteDetalladoOpen, setReporteDetalladoOpen] = useState(false);

  // Control de altura responsiva para iframes de reportes
  const [reporteHeight, setReporteHeight] = useState(null);
  const [reporteLoading, setReporteLoading] = useState(true);

  // Resetear estados al abrir/cerrar modales
  useEffect(() => {
    if (!reporteSuministrosOpen && !reporteServiciosOpen && !reporteDetalladoOpen && !reporteResumenOpen) {
      setReporteHeight(null);
      setReporteLoading(true);
    } else {
      setReporteLoading(true);
      setReporteHeight(null);
    }
  }, [reporteSuministrosOpen, reporteServiciosOpen, reporteDetalladoOpen, reporteResumenOpen]);

  // Escuchar mensaje de altura de los reportes
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'set-iframe-height') {
        const h = Number(e.data.height);
        if (h > 0) {
          setReporteHeight(h);
          setReporteLoading(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fallback de carga por seguridad (1.5 segundos)
  useEffect(() => {
    if (reporteSuministrosOpen || reporteServiciosOpen || reporteDetalladoOpen || reporteResumenOpen) {
      const timer = setTimeout(() => {
        setReporteLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [reporteSuministrosOpen, reporteServiciosOpen, reporteDetalladoOpen, reporteResumenOpen]);

  // Efecto para cerrar el menú si se hace clic fuera de él (Cierre Orgánico)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setReporteMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizarProductoDB = (prod, tipoMoneda, tcamb, cantidad) => {
    const isSoles = tipoMoneda === 'S' || tipoMoneda === 'PEN';
    const pSoles = Number(prod.precio_soles) || 0;
    const pDolares = Number(prod.precio_dolares) || 0;
    const tc = Number(tcamb) || 1;

    let costoPrecio = 0;
    if (isSoles) {
      costoPrecio = pSoles > 0 ? pSoles : pDolares * tc;
    } else {
      costoPrecio = pDolares > 0 ? pDolares : (tc > 0 ? pSoles / tc : 0);
    }

    const proveedor = String(prod.id_marca || "").padStart(2, '0');

    return {
      codigo: prod.codigo || "",
      descripcion: prod.nombre || "",
      unidad: prod.medida_nombre || "UNI",
      costoPrecio: Number(costoPrecio.toFixed(2)),
      proveedor: proveedor,
      marca: prod.marca_nombre || "Otros"
    };
  };

  const fetchSuggestions = async (codigo, proveedorCode) => {
    const key = String(codigo).trim().toUpperCase();
    if (!key || key.length < 3 || ["S/C", "."].includes(key)) {
      return [];
    }

    if (!proveedorCode) {
      return [{ isWarning: true, message: "⚠️ Selecciona una marca primero" }];
    }

    const brandId = parseInt(proveedorCode, 10);
    const tcamb = data?.tipo_cambio || 1;

    try {
      const res = await api.get("/core/productos/", {
        params: {
          search: key,
          id_marca: brandId
        }
      });
      const rows = res.data && res.data.ok && Array.isArray(res.data.data) ? res.data.data : [];
      return rows.map(prod => {
        const normalizado = normalizarProductoDB(prod, data?.tipo_moneda, tcamb, 1);
        return {
          ...normalizado,
          itemOriginal: prod
        };
      });
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      return [];
    }
  };

  const triggerSuggestionsSearch = (value, proveedorCode, type, key) => {
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    const trimmed = String(value).trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setSuggestionsType(null);
      setSuggestionsKey(null);
      setFocusedSuggestionIndex(-1);
      return;
    }

    suggestionsTimeoutRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(trimmed, proveedorCode);
      if (results.length > 0) {
        setSuggestions(results);
        setSuggestionsType(type);
        setSuggestionsKey(key);
        setFocusedSuggestionIndex(-1);
      } else {
        setSuggestions([]);
        setSuggestionsType(null);
        setSuggestionsKey(null);
        setFocusedSuggestionIndex(-1);
      }
    }, 250);
  };

  const handleSelectSuggestion = (sug, type, key) => {
    if (sug.isWarning) return;
    const brandId = parseInt(sug.proveedor, 10) || null;
    if (type === "add") {
      setQuickAddForm(prev => {
        const current = prev[key] || { cantidad: 1 };
        const updated = {
          ...current,
          proveedor: sug.proveedor,
          id_marca: brandId,
          codigo_item: sug.codigo,
          descripcion: sug.descripcion,
          tipo_unidad: sug.unidad,
          costo_precio: sug.costoPrecio,
          porcentaje_utilidad: current.porcentaje_utilidad || 20
        };
        const recalculated = recalculateRowValues(updated, 'porcentaje_utilidad');
        return {
          ...prev,
          [key]: recalculated
        };
      });
      toast.success(`Ítem ${sug.codigo} seleccionado (${sug.marca || 'Catálogo'})`);
    } else if (type === "edit") {
      setEditForm(prev => {
        const updated = {
          ...prev,
          proveedor: sug.proveedor,
          id_marca: brandId,
          codigo_item: sug.codigo,
          descripcion: sug.descripcion,
          tipo_unidad: sug.unidad,
          costo_precio: sug.costoPrecio,
          porcentaje_utilidad: prev.porcentaje_utilidad || 20
        };
        return recalculateRowValues(updated, 'porcentaje_utilidad');
      });
      toast.success(`Ítem ${sug.codigo} seleccionado (${sug.marca || 'Catálogo'})`);
    }
    setSuggestions([]);
    setSuggestionsType(null);
    setSuggestionsKey(null);
    setFocusedSuggestionIndex(-1);
  };

  const handlePNKeyDown = (e, type, key, currentCode, currentProveedor) => {
    if (suggestions.length > 0 && suggestionsType === type && suggestionsKey === key) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedSuggestionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter") {
        if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < suggestions.length) {
          e.preventDefault();
          if (suggestions[focusedSuggestionIndex]?.isWarning) {
            return;
          }
          handleSelectSuggestion(suggestions[focusedSuggestionIndex], type, key);
        } else {
          e.preventDefault();
          if (type === "add") {
            handleQuickAddLookup(currentCode, currentProveedor, key);
          } else {
            handleEditRowLookup(currentCode, currentProveedor);
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSuggestions([]);
        setSuggestionsType(null);
        setSuggestionsKey(null);
        setFocusedSuggestionIndex(-1);
      }
    } else {
      if (e.key === "Enter") {
        e.preventDefault();
        if (type === "add") {
          handleQuickAddLookup(currentCode, currentProveedor, key);
        } else {
          handleEditRowLookup(currentCode, currentProveedor);
        }
      }
    }
  };

  const handlePNBlur = () => {
    setTimeout(() => {
      setSuggestions([]);
      setSuggestionsType(null);
      setSuggestionsKey(null);
      setFocusedSuggestionIndex(-1);
    }, 200);
  };

  const recalculateRowValues = (row, fieldModificado) => {
    const next = { ...row };
    const cantidad = Number(next.cantidad || 0);
    const costoPrecio = Number(next.costo_precio || 0);
    const costoEnvio = Number(next.costo_envio || 0);

    const costoConEnvio = costoPrecio + costoEnvio;
    next.costo_envio = costoEnvio;
    next.costo_con_envio = Number(costoConEnvio.toFixed(2));
    next.porcentaje_envio = costoPrecio > 0 ? Number(((costoEnvio / costoPrecio) * 100).toFixed(2)) : 0;

    let porcentajeUtil = Number(next.porcentaje_utilidad || 0);
    let utilidadUnit = (costoConEnvio * porcentajeUtil) / 100;

    if (fieldModificado === 'utilidad') {
      utilidadUnit = Number(next.utilidad || 0);
      porcentajeUtil = costoConEnvio > 0 ? (utilidadUnit / costoConEnvio) * 100 : 0;
      next.porcentaje_utilidad = Number(porcentajeUtil.toFixed(2));
    } else if (fieldModificado === 'porcentaje_utilidad') {
      next.utilidad = Number(utilidadUnit.toFixed(2));
    } else {
      next.utilidad = Number(utilidadUnit.toFixed(2));
    }

    const ventaPrecio = costoConEnvio + next.utilidad;
    next.precio_venta = Number(ventaPrecio.toFixed(2));
    next.venta_total = Number((ventaPrecio * cantidad).toFixed(2));
    next.costo_total = Number((costoPrecio * cantidad).toFixed(2));

    return next;
  };

  const handleRowChange = (field, value, mode, groupCode = null) => {
    if (mode === 'edit') {
      setEditForm(prev => {
        const updated = { ...prev, [field]: value };
        return recalculateRowValues(updated, field);
      });
    } else {
      setQuickAddForm(prev => {
        const current = prev[groupCode] || {
          cantidad: 1,
          costo_precio: 0,
          porcentaje_utilidad: 20,
          proveedor: "",
          id_marca: null,
          codigo_item: "",
          descripcion: "",
          observacion: "",
          utilidad: 0,
          precio_venta: 0,
          venta_total: 0
        };
        const updated = { ...current, [field]: value };
        const recalculated = recalculateRowValues(updated, field);
        return {
          ...prev,
          [groupCode]: recalculated
        };
      });
    }
  };

  const handleQuickAddLookup = async (codigo, proveedorCode, groupCode) => {
    const key = String(codigo).trim().toUpperCase();
    if (!key) {
      toast.info("Ingrese un P/N para buscar en el catálogo");
      return;
    }

    let targetProveedor = proveedorCode;

    if (!targetProveedor) {
      toast.warn("Debe seleccionar una marca primero");
      return;
    }

    const brandId = parseInt(targetProveedor, 10);
    const tcamb = data?.tipo_cambio || 1;

    try {
      const res = await api.get("/core/productos/", {
        params: {
          search: key,
          id_marca: brandId
        }
      });

      const rows = res.data && res.data.ok && Array.isArray(res.data.data) ? res.data.data : [];
      const encontrado = rows.find(i => String(i.codigo).toUpperCase() === key || String(i.ocodigo).toUpperCase() === key || String(i.codigo2).toUpperCase() === key);

      if (!encontrado) {
        setQuickAddForm(prev => {
          const current = prev[groupCode] || {};
          return {
            ...prev,
            [groupCode]: {
              ...current,
              proveedor: targetProveedor,
              id_marca: brandId,
              codigo_item: key
            }
          };
        });
        toast.info("Código no encontrado en el catálogo. Ingrese descripción y costo manualmente.");
        return;
      }

      const normalizado = normalizarProductoDB(encontrado, data?.tipo_moneda, tcamb, Number(quickAddForm[groupCode]?.cantidad || 1));

      setQuickAddForm(prev => {
        const updated = {
          ...prev[groupCode],
          proveedor: targetProveedor,
          id_marca: brandId,
          codigo_item: normalizado.codigo,
          descripcion: normalizado.descripcion,
          tipo_unidad: normalizado.unidad,
          costo_precio: normalizado.costoPrecio,
          porcentaje_utilidad: prev[groupCode]?.porcentaje_utilidad || 20
        };
        const recalculated = recalculateRowValues(updated, 'porcentaje_utilidad');
        return {
          ...prev,
          [groupCode]: recalculated
        };
      });
      toast.success("Datos de catálogo cargados");
    } catch (err) {
      console.error("Error looking up item:", err);
      toast.error("Error buscando en catálogo");
    }
  };

  const handleEditRowLookup = async (codigo, proveedorCode) => {
    const key = String(codigo).trim().toUpperCase();
    if (!key) {
      toast.info("Ingrese un P/N para buscar en el catálogo");
      return;
    }

    let targetProveedor = proveedorCode;

    if (!targetProveedor) {
      toast.warn("Debe seleccionar una marca primero");
      return;
    }

    const brandId = parseInt(targetProveedor, 10);
    const tcamb = data?.tipo_cambio || 1;

    try {
      const res = await api.get("/core/productos/", {
        params: {
          search: key,
          id_marca: brandId
        }
      });

      const rows = res.data && res.data.ok && Array.isArray(res.data.data) ? res.data.data : [];
      const encontrado = rows.find(i => String(i.codigo).toUpperCase() === key || String(i.ocodigo).toUpperCase() === key || String(i.codigo2).toUpperCase() === key);

      if (!encontrado) {
        setEditForm(prev => ({
          ...prev,
          proveedor: targetProveedor,
          id_marca: brandId,
          codigo_item: key
        }));
        toast.info("Código no encontrado en el catálogo. Ingrese descripción y costo manualmente.");
        return;
      }

      const normalizado = normalizarProductoDB(encontrado, data?.tipo_moneda, tcamb, Number(editForm.cantidad || 1));

      setEditForm(prev => {
        const updated = {
          ...prev,
          proveedor: targetProveedor,
          id_marca: brandId,
          codigo_item: normalizado.codigo,
          descripcion: normalizado.descripcion,
          tipo_unidad: normalizado.unidad,
          costo_precio: normalizado.costoPrecio,
          porcentaje_utilidad: prev.porcentaje_utilidad || 20
        };
        return recalculateRowValues(updated, 'porcentaje_utilidad');
      });
      toast.success("Datos de catálogo cargados");
    } catch (err) {
      console.error("Error looking up item:", err);
      toast.error("Error buscando en catálogo");
    }
  };

  const handleQuickAddSubmit = async (groupCode) => {
    const form = quickAddForm[groupCode];
    if (!form || !form.descripcion?.trim() || !form.cantidad) {
      toast.warning("La descripción y la cantidad son obligatorias");
      return;
    }

    const success = await handleAgregarItem({
      ...form,
      cog_override: groupCode
    });

    if (success) {
      setQuickAddForm(prev => ({
        ...prev,
        [groupCode]: {
          proveedor: "",
          id_marca: null,
          codigo_item: "",
          descripcion: "",
          observacion: "",
          cantidad: 1,
          costo_precio: 0,
          porcentaje_utilidad: 20,
          utilidad: 0,
          precio_venta: 0,
          venta_total: 0,
          costo_envio: 0,
          porcentaje_envio: 0,
          costo_con_envio: 0,
          tiempo_entrega: "",
          id_unidad_tiempo_entrega: 1,
          tipo_unidad: "UNI"
        }
      }));
    }
  };

  // State from Drawer logic
  const {
    gruposSuministros,
    setGruposSuministros,
    fetchSuministros,
    proveedores,
    handleCalcularTotalGrupo,
    handleAgregarGrupoSuministro: hookAgregarGrupoSuministro,
    handleAgregarItem: hookAgregarItem,
    saveEditItem: hookSaveEditItem,
    handleDuplicarGrupo,
    handleEliminarGrupo,
    handleEliminarItem,
    handleExportarGrupoXLS,
    handleExportarGeneralXLS,
    handleImportarDesdeXLS,
    handleGuardarOrden,
    sensors,
    handleDragEnd,
    handleReporteSuministros,
    handleReporteServicios,
  } = useCotizacionSuministros(numReg);

  const sortedGrupos = useMemo(() => {
    return Object.values(gruposSuministros || {}).sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }, [gruposSuministros]);

  const {
    gruposServicios,
    setGruposServicios,
    fetchServicios,
    handleAgregarGrupoServicio,
    handleAgregarItemServicio,
    handleEliminarGrupoServicio,
    handleEliminarItemServicio,
    handleDuplicarServicio,
    sensors: sensorsServicios,
    handleDragEnd: handleDragEndServicios
  } = useCotizacionServicios(numReg);

  const sortedGruposServicios = useMemo(() => {
    return Object.values(gruposServicios || {}).sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }, [gruposServicios]);
  const [expandedCategories, setExpandedCategories] = useState(['Suministros', 'Servicios', 'Condiciones', 'Cliente']);
  const [generalConditions, setGeneralConditions] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');

  const [gruposExpandidos, setGruposExpandidos] = useState({});

  const toggleGrupo = (grupoId) => {
    setGruposExpandidos(prev => ({ ...prev, [grupoId]: !prev[grupoId] }));
  };

  const [nuevoGrupoTemp, setNuevoGrupoTemp] = useState({ activo: false, tipo: null, nombre: '', cantidad: 1 });

  // Inline Editing State
  const [editingItemId, setEditingItemId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isEditingGenerals, setIsEditingGenerals] = useState(false);
  const [formGenerals, setFormGenerals] = useState({});

  // Notes & Documents State
  const [documents, setDocuments] = useState([]);
  const [docDescription, setDocDescription] = useState('');
  const [showDocInput, setShowDocInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null); // Para disparar el input file oculto
  const loadedConditionsRef = useRef(""); // Para evitar auto-guardar el valor inicial
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [archivoNombreVisual, setArchivoNombreVisual] = useState("");

  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isAlert, setIsAlert] = useState(false); // S o N

  // Modals state
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [openGrupoModal, setOpenGrupoModal] = useState(false);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [itemActivo, setItemActivo] = useState(null);
  const [openRegistroItem, setOpenRegistroItem] = useState(false);



  // Modeless inline states for Services
  const [categoriasPersonal, setCategoriasPersonal] = useState([]);
  const [tiposGasto, setTiposGasto] = useState([]);
  const [editingGrupoServicioId, setEditingGrupoServicioId] = useState(null);
  const [editingGrupoForm, setEditingGrupoForm] = useState({ nombre: '', cantidad: 1 });
  const [addingItemSubgrupoId, setAddingItemSubgrupoId] = useState(null);
  const [addingServicioForm, setAddingServicioForm] = useState({});
  const [editingItemServicioId, setEditingItemServicioId] = useState(null);
  const [editingServicioForm, setEditingServicioForm] = useState({});

  // Collapse/Expand state for Services and Subgroups
  const [serviciosExpandidos, setServiciosExpandidos] = useState({});
  const [subgruposExpandidos, setSubgruposExpandidos] = useState({});

  const toggleServicioGrupo = (idServicio) => {
    setServiciosExpandidos(prev => ({ ...prev, [idServicio]: !prev[idServicio] }));
  };

  const toggleSubgrupo = (subgrupoKey) => {
    setSubgruposExpandidos(prev => ({ ...prev, [subgrupoKey]: !prev[subgrupoKey] }));
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const catRes = await api.get("/cotizaciones/categorias/");
        setCategoriasPersonal(Array.isArray(catRes.data) ? catRes.data : []);
      } catch (err) {
        console.error("Error loading categories:", err);
      }
      try {
        const tgRes = await api.get("/cotizaciones/tgasto_d/");
        setTiposGasto(Array.isArray(tgRes.data) ? tgRes.data : []);
      } catch (err) {
        console.error("Error loading expense types:", err);
      }
    };
    fetchDropdownData();
  }, []);

  const PIPELINE = [
    { id: 'Oportunidad', label: 'Oportunidad', color: 'bg-blue-500' },
    { id: 'En Elaboración', label: 'Elaboración', color: 'bg-amber-500' },
    { id: 'Enviada', label: 'Enviada', color: 'bg-indigo-500' },
    { id: 'Adjudicada', label: 'Adjudicada', color: 'bg-green-600' },
    { id: 'Perdida', label: 'Perdida', color: 'bg-red-500' }
  ];

  const updatePreviewCode = async (areaId, tipoId, clienteId) => {
    if (!numReg || isReadOnly) return;
    try {
      const { data: res } = await api.get(`cotizaciones/generar-codigo/${numReg}/`, {
        params: {
          id_area: areaId || "",
          id_tipo: tipoId || "",
          id_cliente: clienteId || ""
        }
      });
      if (res.ok && res.codigo) {
        setData(prev => {
          if (!prev) return prev;
          return { ...prev, codigo: res.codigo };
        });
      }
    } catch (err) {
      console.error("Error previsualizando código:", err);
    }
  };

  // Previsualización automática del código cuando cambian id_area, id_tipo o id_cliente
  useEffect(() => {
    if (data && (data.id_area !== originalData?.id_area || data.id_tipo !== originalData?.id_tipo || data.id_cliente !== originalData?.id_cliente)) {
      updatePreviewCode(data.id_area, data.id_tipo, data.id_cliente);
    } else if (data && originalData && data.id_area === originalData.id_area && data.id_tipo === originalData.id_tipo && data.id_cliente === originalData.id_cliente) {
      setData(prev => ({ ...prev, codigo: originalData.codigo }));
    }
  }, [data?.id_area, data?.id_tipo, data?.id_cliente]);

  // ==============================
  // CONTEXT MENU AND DETAIL MODALS
  // ==============================
  const [contextMenuPos, setContextMenuPos] = useState(null);
  const [contextMenuType, setContextMenuType] = useState(null); // 'cliente' | 'representante'
  const [contextMenuOpen, setContextMenuOpen] = useState(false);

  const [modalTargetId, setModalTargetId] = useState(null);
  const [modalTargetName, setModalTargetName] = useState("");
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const handleVerDetalles = async (type, id, name) => {
    if (!id) {
      toast.warn(`Seleccione un ${type === 'cliente' ? 'cliente' : 'encargado'} primero.`);
      return;
    }
    setModalTargetId(id);
    setModalTargetName(name);
    setContextMenuType(type);

    setModalLoading(true);
    setModalData(null);
    setAnalysisData(null);
    try {
      const endpoint = type === 'cliente'
        ? `core/clientes/?id_cliente=${id}`
        : `core/representantes/?id_representante=${id}`;

      const params = type === 'cliente'
        ? { cliente: id, anno: '%' }
        : { id_representante: id, anno: '%' };

      const [resDetails, resAnalysis] = await Promise.all([
        api.get(endpoint),
        api.get('cotizaciones/lista_cotizaciones/', { params })
      ]);
      setModalData(resDetails.data);

      const cotizaciones = resAnalysis.data?.tabla || (Array.isArray(resAnalysis.data) ? resAnalysis.data : (resAnalysis.data.results || []));
      const totalCount = cotizaciones.length;
      let totalAmount = 0;
      let wonCount = 0;
      let wonAmount = 0;
      let activeCount = 0;
      let lostCount = 0;

      cotizaciones.forEach(c => {
        const value = parseFloat(c.total_cotizacion || c.total || 0);
        totalAmount += value;
        const isWon = c.id_estado === 1 || c.id_estado === '1' || c.id_estado?.id_estado === 1 || c.id_estado?.id_estado === '1' || c.estado_nombre?.toLowerCase() === 'adjudicado' || c.estado_nombre?.toLowerCase() === 'adjudicada';
        const isLost = c.id_estado === 3 || c.id_estado === '3' || c.id_estado?.id_estado === 3 || c.id_estado?.id_estado === '3' || c.estado_nombre?.toLowerCase() === 'perdida';

        if (isWon) {
          wonCount++;
          wonAmount += value;
        } else if (isLost) {
          lostCount++;
        } else {
          activeCount++;
        }
      });

      const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
      const successRate = totalCount > 0 ? Math.round((wonCount / totalCount) * 100) : 0;

      setAnalysisData({
        cotizaciones,
        stats: {
          totalCount,
          totalAmount,
          wonCount,
          wonAmount,
          lostCount,
          activeCount,
          averageAmount,
          successRate
        }
      });
    } catch (err) {
      console.error("Error al obtener detalles/análisis:", err);
      toast.error("No se pudieron cargar los datos.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleVerAnalisis = async (type, id, name) => {
    if (!id) {
      toast.warn(`Seleccione un ${type === 'cliente' ? 'cliente' : 'encargado'} primero.`);
      return;
    }
    setModalTargetId(id);
    setModalTargetName(name);
    setContextMenuType(type);
    setAnalysisLoading(true);
    setAnalysisData(null);
    try {
      const params = type === 'cliente'
        ? { cliente: id, anno: '%' }
        : { id_representante: id, anno: '%' };
      const { data: resData } = await api.get('cotizaciones/lista_cotizaciones/', { params });

      const cotizaciones = resData?.tabla || (Array.isArray(resData) ? resData : (resData.results || []));
      const totalCount = cotizaciones.length;
      let totalAmount = 0;
      let wonCount = 0;
      let wonAmount = 0;
      let activeCount = 0;
      let lostCount = 0;

      cotizaciones.forEach(c => {
        const value = parseFloat(c.total_cotizacion || c.total || 0);
        totalAmount += value;
        const isWon = c.id_estado === 1 || c.id_estado === '1' || c.id_estado?.id_estado === 1 || c.id_estado?.id_estado === '1' || c.estado_nombre?.toLowerCase() === 'adjudicado' || c.estado_nombre?.toLowerCase() === 'adjudicada';
        const isLost = c.id_estado === 3 || c.id_estado === '3' || c.id_estado?.id_estado === 3 || c.id_estado?.id_estado === '3' || c.estado_nombre?.toLowerCase() === 'perdida';

        if (isWon) {
          wonCount++;
          wonAmount += value;
        } else if (isLost) {
          lostCount++;
        } else {
          activeCount++;
        }
      });

      const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
      const successRate = totalCount > 0 ? Math.round((wonCount / totalCount) * 100) : 0;

      setAnalysisData({
        cotizaciones,
        stats: {
          totalCount,
          totalAmount,
          wonCount,
          wonAmount,
          lostCount,
          activeCount,
          averageAmount,
          successRate
        }
      });
    } catch (err) {
      console.error("Error al obtener análisis:", err);
      toast.error("No se pudo cargar el análisis.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // ==============================
  // CONTROL DE EDICIÓN POR ENVÍO
  // ==============================

  // Track if changes have been made in header fields
  const isDirty = useMemo(() => {
    if (!data || !originalData) return false;
    const keysToCompare = [
      "referencia",
      "forma_pago",
      "lugar",
      "tipo_moneda",
      "tipo_cambio",
      "igv",
      "entrega_suministros",
      "id_unidad_tiempo_entrega_suministros",
      "entrega_servicios",
      "id_unidad_tiempo_entrega_servicios",
      "validez_oferta",
      "id_unidad_tiempo_validez",
      "id_area",
      "id_tipo",
      "tipo_venta",
      "probabilidad",
      "id_cliente",
      "id_representante",
      "representante_nombre",
      "representante_cargo",
      "representante_telefono",
      "representante_movil",
      "representante_correo"
    ];
    return keysToCompare.some(key => data[key] !== originalData[key]);
  }, [data, originalData]);

  const [savingHeader, setSavingHeader] = useState(false);

  const handleGuardarCabecera = async () => {
    if (isReadOnly) return;
    setSavingHeader(true);
    try {
      const endpoint = esOportunidad ? `oportunidades/modal/${numReg}/` : `cotizaciones/cotizacion_detalle/${numReg}/`;
      const payload = {
        referencia: data.referencia,
        forma_pago: data.forma_pago,
        lugar: data.lugar,
        tipo_moneda: data.tipo_moneda,
        tipo_cambio: data.tipo_cambio,
        igv: data.igv,
        entrega_suministros: data.entrega_suministros,
        id_unidad_tiempo_entrega_suministros: data.id_unidad_tiempo_entrega_suministros,
        entrega_servicios: data.entrega_servicios,
        id_unidad_tiempo_entrega_servicios: data.id_unidad_tiempo_entrega_servicios,
        validez_oferta: data.validez_oferta,
        id_unidad_tiempo_validez: data.id_unidad_tiempo_validez,
        id_area: data.id_area,
        id_tipo: data.id_tipo,
        tipo_venta: data.tipo_venta,
        probabilidad: data.probabilidad,
        id_cliente: data.id_cliente,
        id_representante: data.id_representante,
        representante_nombre: data.representante_nombre,
        representante_cargo: data.representante_cargo,
        representante_telefono: data.representante_telefono,
        representante_movil: data.representante_movil,
        representante_correo: data.representante_correo,
      };

      const res = await api.put(endpoint, payload);
      setData(res.data);
      setOriginalData(res.data);
      toast.success("Cabecera guardada correctamente");
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });
      queryClient.invalidateQueries({ queryKey: ["cotizacion", numReg] });
      queryClient.invalidateQueries({ queryKey: ["cotizacion-detalle", numReg] });
    } catch (err) {
      console.error("Error al guardar cabecera:", err);
      const errMsg = err.response?.data?.error || "Error al guardar cambios de cabecera";
      toast.error(errMsg);
    } finally {
      setSavingHeader(false);
    }
  };

  // Handler único para edición de campos de cabecera
  const handleFieldChange = (field, value) => {
    if (!canEdit) {
      toast.warn("Edición bloqueada: cotización congelada");
      return;
    }

    setData(prev => {
      const newState = { ...prev, [field]: value };

      // 1. Si el tipo de cotización deja de ser Venta (V), 
      // reseteamos los campos logísticos (tven y costo_envio)
      if (field === "cotit" && value !== "V") {
        newState.tven = "";
        newState.costo_envio = "";
      }

      // 2. Lógica de limpieza al cambiar entre Total y Parcial
      if (field === "tven" && value === "P") {
        newState.costo_envio = 0;
      }

      return newState;
    });
  };

  useEffect(() => {
    loadAllData();
  }, [numReg]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Cabecera
      const endpoint = esOportunidad ? `oportunidades/modal/${numReg}/` : `cotizaciones/cotizacion_detalle/${numReg}/`;
      const res = await api.get(endpoint);
      setData(res.data);
      setOriginalData(res.data);
      setCurrentStatus(res.data.estado_nombre || 'Pendiente');

      // Cargar condiciones desde el nuevo endpoint
      try {
        const condRes = await api.get(`cotizaciones/condiciones-generales/${numReg}/`);
        setGeneralConditions(condRes.data.condiciones || '');
        loadedConditionsRef.current = condRes.data.condiciones || '';
      } catch (err) {
        console.error("Error cargando condiciones", err);
        setGeneralConditions(res.data.acu_e || ''); // Fallback al campo antiguo
        loadedConditionsRef.current = res.data.acu_e || '';
      }

      // 2. Suministros (Ya se cargan y mapean en el hook useCotizacionSuministros)

      // 3. Servicios (simulado o endpoint real si existe)
      // const srvRes = await api.get(`cotizaciones/cotizacion/${numReg}/servicios/`);
      // setGruposServicios(mapServiciosBackendToState(srvRes.data));

    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Error al cargar la información");
    } finally {
      setLoading(false);
    }
  };

  // Auto-guardado de condiciones generales con debounce
  useEffect(() => {
    if (isReadOnly) return;
    if (generalConditions === loadedConditionsRef.current) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        await api.post(`cotizaciones/condiciones-generales/${numReg}/`, { condiciones: generalConditions });
        loadedConditionsRef.current = generalConditions; // Actualizamos la referencia
        toast.success("Condiciones guardadas", { id: 'auto-save-cond', position: 'bottom-right' });
      } catch (error) {
        console.error("Error al guardar condiciones:", error);
      }
    }, 1500); // 1.5 segundos de retraso

    return () => clearTimeout(delayDebounceFn);
  }, [generalConditions, numReg]);

  const handleAgregarGrupoSuministro = async (form) => {
    const success = await hookAgregarGrupoSuministro(form);
    if (success) setOpenGrupoModal(false);
  };

  const handleAgregarItem = async (form) => {
    const activeGrupoKey = form.cog_override || grupoActivo;
    const success = await hookAgregarItem(form, activeGrupoKey);
    if (success) setOpenItemModal(false);
  };

  const saveEditItem = async () => {
    const success = await hookSaveEditItem(editingItemId, editForm);
    if (success) setEditingItemId(null);
  };

  const handleConfirmGrupoServicio = async (form) => {
    await handleAgregarGrupoServicio({
      nombre: form.nombre,
      cantidad: form.cantidad,
      lineasPdf: form.lineasPdf,
      detalle: form.detalle,
      _key: form._key
    });
  };

  const handleConfirmManoObraInline = async (form, grupoId, subgrupoId) => {
    const hookForm = {
      id_servicio: form.id_servicio || null,
      codigo_item: form.codigo_item,
      descripcion_item: form.descripcion_item,
      cantidad_hombres: Number(form.cantidad_hombres || 0),
      cantidad_dias: Number(form.cantidad_dias || 0),
      horas: Number(form.horas || 0),
      costo_hombre_dia: Number(form.costo_hombre_dia || 0),
      porcentaje: Number(form.porcentaje || 0),
    };
    const success = await handleAgregarItemServicio(hookForm, grupoId, subgrupoId, data?.id_area);
    if (success) {
      setAddingItemSubgrupoId(null);
      setEditingItemServicioId(null);
    }
  };

  const handleConfirmGastosServicioInline = async (form, grupoId, subgrupoId) => {
    const hookForm = {
      id_servicio: form.id_servicio || null,
      codigo_item: form.codigo_item,
      descripcion_item: form.descripcion_item,
      cantidad_hombres: Number(form.cantidad_hombres || 0),
      cantidad_dias: Number(form.cantidad_dias || 0),
      costo_hombre_dia: Number(form.costo_hombre_dia || 0),
      horas: 8,
      porcentaje: 0,
    };
    const success = await handleAgregarItemServicio(hookForm, grupoId, subgrupoId, data?.id_area);
    if (success) {
      setAddingItemSubgrupoId(null);
      setEditingItemServicioId(null);
    }
  };

  const handleConfirmOtrosInline = async (form, grupoId, subgrupoId) => {
    const hookForm = {
      id_servicio: form.id_servicio || null,
      codigo_item: form.codigo_item,
      descripcion_item: form.descripcion_item,
      cantidad_hombres: Number(form.cantidad_hombres || 0),
      cantidad_dias: 1,
      costo_hombre_dia: Number(form.costo_hombre_dia || 0),
      horas: 8,
      porcentaje: Number(form.porcentaje || 0),
    };
    const success = await handleAgregarItemServicio(hookForm, grupoId, subgrupoId, data?.id_area);
    if (success) {
      setAddingItemSubgrupoId(null);
      setEditingItemServicioId(null);
    }
  };

  const handleStartAddingItem = (subgrupoId, tipoCodigo) => {
    setAddingItemSubgrupoId(subgrupoId);
    if (tipoCodigo === "04") {
      setAddingServicioForm({
        codigo_item: "",
        descripcion_item: "",
        cantidad_hombres: 1,
        cantidad_dias: 1,
        horas: 8,
        costo_hombre_dia: 0,
        porcentaje: 20
      });
    } else if (tipoCodigo === "05") {
      setAddingServicioForm({
        codigo_item: "",
        descripcion_item: "",
        cantidad_hombres: 1,
        cantidad_dias: 1,
        costo_hombre_dia: 0
      });
    } else if (tipoCodigo === "06") {
      setAddingServicioForm({
        codigo_item: "",
        descripcion_item: "",
        cantidad_hombres: 1,
        costo_hombre_dia: 0,
        porcentaje: 20
      });
    }
  };

  const handleStartEditingItemInline = (item) => {
    setEditingItemServicioId(item.id_servicio);
    setEditingServicioForm({
      id_servicio: item.id_servicio,
      codigo_item: item.codigo_item,
      descripcion_item: item.descripcion_item,
      cantidad_hombres: item.cantidad_hombres,
      cantidad_dias: item.cantidad_dias,
      horas: item.horas,
      costo_hombre_dia: item.costo_hombre_dia,
      porcentaje: item.porcentaje
    });
  };

  const renderGrupoSuministro = (grupo, gIdx, dndListeners = {}, dndAttributes = {}) => {
    const isExpanded = gruposExpandidos[grupo.codigo_grupo] !== false;

    return (
      <motion.div
        layout
        key={grupo.codigo_grupo || `grupo-${gIdx}`}
        className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
      >
        {/* Cabecera del Grupo */}
        <div
          onClick={() => toggleGrupo(grupo.codigo_grupo)}
          className="group cursor-pointer px-4 py-2 flex justify-between items-center hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {/* Manija de Arrastre de Grupo */}
            {!isReadOnly ? (
              <div
                {...dndListeners}
                {...dndAttributes}
                data-drag-handle
                onClick={(e) => e.stopPropagation()}
                className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 rounded transition-colors"
              >
                <Icon name="grip-vertical" className="h-3.5 w-3.5" />
              </div>
            ) : (
              <div className="p-1 text-gray-200">
                <Icon name="grip-vertical" className="h-3.5 w-3.5" />
              </div>
            )}

            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
              <Icon name="chevron-down" className="h-3.5 w-3.5 text-gray-400" />
            </div>

            <div className="flex flex-col">
              <span className="font-black text-gray-800 text-[12px] uppercase tracking-wide">
                {grupo.nombre_grupo}
              </span>
            </div>

            <span className="text-[11px] text-gray-600 font-medium bg-gray-100 px-1.5 rounded">
              {grupo.items.length} Items
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md">
              <span className="text-[9px] font-black text-indigo-500 uppercase">Cant:</span>
              <span className="text-[11.5px] font-black text-indigo-700">
                {grupo.cantidad || 0}
              </span>
            </div>

            <div className="text-right min-w-[120px]">
              <span className="text-[11.5px] font-black text-gray-900">
                {formatMoney((grupo.items || []).reduce((acc, curr) => acc + (Number(curr.venta_total) || 0), 0) * (grupo.cantidad || 1))}
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Tabla de Items */}
              <div className="w-full overflow-x-auto border-t border-gray-100">
                <table className="min-w-full table-fixed">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="w-[3%] py-1.5"></th>
                      <th className={isVenta ? "w-[14%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase" : "w-[15%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase"}>Código / Marca</th>
                      <th className={isVenta ? "w-[25%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase" : "w-[28%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase"}>Descripción</th>
                      <th className={isVenta ? "w-[6%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase" : "w-[7%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase"}>Cantidad</th>
                      <th className={isVenta ? "w-[11%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase" : "w-[12%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase"}>Costo Unit.</th>
                      {isVenta && (
                        <th className="w-[10%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase">Envío</th>
                      )}
                      <th className={isVenta ? "w-[9%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase" : "w-[10%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase"}>Utilidad</th>
                      <th className={isVenta ? "w-[11%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase" : "w-[12%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase"}>Precio Unit.</th>
                      <th className={isVenta ? "w-[11%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase" : "w-[13%] px-3 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase"}>Venta Total</th>
                      <th className="w-[5%] py-1.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <SortableContext
                      items={grupo.items.map(item => `item-${item.id_suministro}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {grupo.items.map(item => (
                        <SortableItemRow
                          key={item.id_suministro}
                          item={item}
                          isReadOnly={isReadOnly}
                          editingItemId={editingItemId}
                          editForm={editForm}
                          setEditForm={setEditForm}
                          startEditItem={startEditItem}
                          handleEliminarItem={handleEliminarItem}
                          saveEditItem={saveEditItem}
                          cancelEditItem={cancelEditItem}
                          formatMoney={formatMoney}
                          formatMoneySymbol={formatMoneySymbol}
                          proveedores={proveedores}
                          tcamb={data?.tipo_cambio || 1}
                          handleRowChange={handleRowChange}
                          handleEditRowLookup={handleEditRowLookup}
                          normalizarProductoDB={normalizarProductoDB}
                          recalculateRowValues={recalculateRowValues}
                          tipoMoneda={data?.tipo_moneda || "S"}
                          isVenta={isVenta}
                        />
                      ))}
                    </SortableContext>
                    {grupo.items.length === 0 && (
                      <tr>
                        <td colSpan={isVenta ? "10" : "9"} className="px-4 py-6 text-center">
                          <span className="text-[10px] text-gray-400 italic">No hay ítems registrados</span>
                        </td>
                      </tr>
                    )}
                    {/* Fila de agregado rápido */}
                    {!isReadOnly && (() => {
                      const currentForm = quickAddForm[grupo.codigo_grupo] || {
                        cantidad: 1,
                        porcentaje_utilidad: 20,
                        costo_precio: 0,
                        proveedor: "",
                        codigo_item: "",
                        descripcion: "",
                        observacion: "",
                        utilidad: 0,
                        precio_venta: 0,
                        venta_total: 0,
                        costo_envio: 0,
                        porcentaje_envio: 0,
                        costo_con_envio: 0
                      };
                      const brandOptions = (proveedores || []).map(p => ({
                        id: String(p.id_marca).padStart(2, '0'),
                        nombre: p.nombre
                      }));

                      return (
                        <tr className="bg-indigo-50/20">
                          <td></td>
                          {/* Código / Marca */}
                          <td className="px-3 py-1.5">
                            <div className="flex flex-col gap-1 items-center justify-center text-center relative">
                              <select
                                className="w-full text-[10.5px] border border-gray-300 rounded px-1 py-0.5 uppercase font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                                value={currentForm.proveedor || ""}
                                onChange={e => {
                                  const code = e.target.value;
                                  const brandId = parseInt(code, 10) || null;
                                  handleRowChange("proveedor", code, "add", grupo.codigo_grupo);
                                  handleRowChange("id_marca", brandId, "add", grupo.codigo_grupo);
                                }}
                              >
                                <option value="" className="text-center">-- Marca --</option>
                                {brandOptions.map(p => (
                                  <option key={p.id} value={p.id} className="text-center">{p.nombre}</option>
                                ))}
                              </select>
                              <ProductoAutocomplete
                                value={currentForm.codigo_item || ""}
                                idMarca={currentForm.id_marca}
                                tcamb={data?.tipo_cambio || 1}
                                tipoMoneda={data?.tipo_moneda || "S"}
                                onSelect={(prod) => {
                                  if (prod.isCustom) {
                                    handleRowChange("codigo_item", prod.codigo, "add", grupo.codigo_grupo);
                                  } else {
                                    const normalizado = normalizarProductoDB(prod, data?.tipo_moneda, data?.tipo_cambio || 1, Number(currentForm.cantidad || 1));
                                    setQuickAddForm(prev => {
                                      const current = prev[grupo.codigo_grupo] || { cantidad: 1 };
                                      const updated = {
                                        ...current,
                                        proveedor: normalizado.proveedor,
                                        id_marca: prod.id_marca,
                                        codigo_item: normalizado.codigo,
                                        descripcion: normalizado.descripcion,
                                        tipo_unidad: normalizado.unidad,
                                        costo_precio: normalizado.costoPrecio,
                                        porcentaje_utilidad: current.porcentaje_utilidad || 20
                                      };
                                      const recalculated = recalculateRowValues(updated, 'porcentaje_utilidad');
                                      return {
                                        ...prev,
                                        [grupo.codigo_grupo]: recalculated
                                      };
                                    });
                                  }
                                }}
                              />
                            </div>
                          </td>
                          {/* Descripción / Observación */}
                          <td className="px-3 py-1.5">
                            <div className="flex flex-col gap-1 items-center justify-center text-center">
                              <input
                                type="text"
                                className="w-full text-[11px] border border-gray-300 rounded px-1.5 py-0.5 font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                                value={currentForm.descripcion || ""}
                                placeholder="Descripción..."
                                onChange={e => handleRowChange("descripcion", e.target.value.toUpperCase(), "add", grupo.codigo_grupo)}
                              />
                              <input
                                type="text"
                                className="w-full text-[9px] border border-gray-200 text-gray-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                                value={currentForm.observacion || ""}
                                placeholder="Observación..."
                                onChange={e => handleRowChange("observacion", e.target.value.toUpperCase(), "add", grupo.codigo_grupo)}
                              />
                            </div>
                          </td>
                          {/* Cantidad */}
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              className="w-full text-[11px] border border-gray-300 text-center rounded px-1 py-0.5 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              value={currentForm.cantidad === undefined || currentForm.cantidad === null ? "" : currentForm.cantidad}
                              onChange={e => handleRowChange("cantidad", e.target.value, "add", grupo.codigo_grupo)}
                            />
                          </td>
                          {/* Costo Unit. */}
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              step="0.01"
                              className="w-full text-[11px] border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                              value={currentForm.costo_precio === undefined || currentForm.costo_precio === null ? "" : currentForm.costo_precio}
                              onChange={e => handleRowChange("costo_precio", e.target.value, "add", grupo.codigo_grupo)}
                            />
                          </td>
                          {/* Envío */}
                          {isVenta && (
                            <td className="px-3 py-1.5">
                              <div className="flex flex-col gap-1 items-center justify-center text-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full text-[11px] border border-gray-300 text-center rounded px-1 py-0.5 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                                  value={currentForm.costo_envio === undefined || currentForm.costo_envio === null ? "" : currentForm.costo_envio}
                                  onChange={e => handleRowChange("costo_envio", e.target.value, "add", grupo.codigo_grupo)}
                                  placeholder="0.00"
                                />
                                <span className="text-[9px] text-gray-400 font-medium">
                                  {Number(currentForm.porcentaje_envio || 0).toFixed(2)}%
                                </span>
                              </div>
                            </td>
                          )}
                          {/* Utilidad */}
                          <td className="px-3 py-1.5">
                            <div className="flex flex-col gap-1 items-center justify-center text-center">

                              {/* Monto de utilidad (Ahora ARRIBA) */}
                              <span className="text-[11px] font-bold text-gray-700">
                                {formatMoneySymbol(Number(currentForm.utilidad || 0))}
                              </span>

                              {/* Porcentaje de utilidad / Input (Ahora ABAJO) */}
                              <div className="relative flex items-center justify-center w-full">
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-full text-[10px] border border-gray-300 text-center rounded px-1 py-0.5 font-medium text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  value={currentForm.porcentaje_utilidad === undefined || currentForm.porcentaje_utilidad === null ? "" : currentForm.porcentaje_utilidad}
                                  onChange={e => handleRowChange("porcentaje_utilidad", e.target.value, "add", grupo.codigo_grupo)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleQuickAddSubmit(grupo.codigo_grupo);
                                    }
                                  }}
                                />
                                {/* Opcional: Un pequeño sufijo "%" si quieres que el usuario sepa que es un porcentaje al bajar la intensidad del texto */}
                                <span className="absolute right-1 text-[9px] text-gray-400">%</span>
                              </div>

                            </div>
                          </td>
                          {/* Precio Unit. */}
                          <td className="px-3 py-1.5 text-center text-[11.5px] font-semibold text-gray-500">
                            {formatMoneySymbol(Number(currentForm.precio_venta || 0))}
                          </td>
                          {/* Venta Total */}
                          <td className="px-3 py-1.5 text-center text-[11.5px] font-black text-indigo-600">
                            {formatMoneySymbol(Number(currentForm.venta_total || 0))}
                          </td>
                          {/* Acciones */}
                          <td className="px-3 py-1.5 text-center">
                            <div className="flex justify-center items-center gap-1">
                              <button
                                onClick={() => handleQuickAddSubmit(grupo.codigo_grupo)}
                                className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm transition-colors flex items-center justify-center"
                                title="Agregar ítem (Enter)"
                              >
                                <Icon name="plus" className="h-3 w-3" />
                              </button>
                              <ActionMenu
                                title="Logística y Detalles del Nuevo Ítem"
                                align="end"
                                closeOnSelect={false}
                                contentClassName="min-w-[300px]"
                                customTrigger={
                                  <button
                                    type="button"
                                    className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded shadow-sm transition-colors flex items-center justify-center"
                                    title="Detalles Adicionales"
                                  >
                                    <Icon name="ellipsis-vertical" className="h-3.5 w-3.5" />
                                  </button>
                                }
                              >
                                <div className="p-3 space-y-3 text-xs text-left">
                                  {/* U. Medida */}
                                  <div className="flex flex-col gap-1">
                                    <span className="font-bold text-gray-400 uppercase text-[9px]">U. Medida:</span>
                                    <input
                                      type="text"
                                      className="w-full border border-gray-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-semibold text-gray-700"
                                      value={currentForm.tipo_unidad || ""}
                                      onChange={e => handleRowChange("tipo_unidad", e.target.value.toUpperCase(), "add", grupo.codigo_grupo)}
                                      placeholder="UNI, GLN, etc."
                                    />
                                  </div>
                                  {/* Tiempo Entrega */}
                                  <div className="flex flex-col gap-1">
                                    <span className="font-bold text-gray-400 uppercase text-[9px]">Tiempo Entrega:</span>
                                    <div className="flex gap-2">
                                      <input
                                        type="number"
                                        className="w-2/3 border border-gray-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-700"
                                        value={currentForm.tiempo_entrega === undefined || currentForm.tiempo_entrega === null ? "" : currentForm.tiempo_entrega}
                                        onChange={e => handleRowChange("tiempo_entrega", e.target.value, "add", grupo.codigo_grupo)}
                                        placeholder="0"
                                      />
                                      <select
                                        className="w-1/3 border border-gray-200 rounded px-1 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-700 bg-white"
                                        value={currentForm.id_unidad_tiempo_entrega || 1}
                                        onChange={e => handleRowChange("id_unidad_tiempo_entrega", parseInt(e.target.value, 10), "add", grupo.codigo_grupo)}
                                      >
                                        <option value={1}>Días</option>
                                        <option value={2}>Semanas</option>
                                        <option value={3}>Meses</option>
                                      </select>
                                    </div>
                                  </div>
                                  {/* Observación */}
                                  <div className="flex flex-col gap-1">
                                    <span className="font-bold text-gray-400 uppercase text-[9px]">Observación:</span>
                                    <input
                                      type="text"
                                      className="w-full border border-gray-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-700"
                                      value={currentForm.observacion || ""}
                                      onChange={e => handleRowChange("observacion", e.target.value.toUpperCase(), "add", grupo.codigo_grupo)}
                                      placeholder="Observación..."
                                    />
                                  </div>

                                  {/* RESUMEN DE VENTA */}
                                  {(() => {
                                    const qaCantidad = Number(currentForm.cantidad || 0);
                                    const qaCostoPrecio = Number(currentForm.costo_precio || 0);
                                    const qaCostoEnvio = Number(currentForm.costo_envio || 0);
                                    const qaCostoConEnvio = Number(currentForm.costo_con_envio || 0);
                                    const qaPrecioVenta = Number(currentForm.precio_venta || 0);
                                    const qaVentaTotal = Number(currentForm.venta_total || 0);
                                    const qaUtilidad = Number(currentForm.utilidad || 0);

                                    const costoTotal = qaCostoPrecio * qaCantidad;
                                    const costoConEnvioTotal = qaCostoConEnvio * qaCantidad;
                                    const precioVentaUnit = qaPrecioVenta;
                                    const ventaTotal = qaVentaTotal;
                                    const utilidadTotal = qaUtilidad * qaCantidad;

                                    return (
                                      <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-3 space-y-2 shadow-inner mt-2">
                                        <div className="flex items-center gap-2 text-teal-700">
                                          <Icon name="trending-up" className="h-3.5 w-3.5" />
                                          <span className="text-[10px] font-black uppercase tracking-tight">Resumen de Venta</span>
                                        </div>
                                        <div className="space-y-1 text-[11px]">
                                          <div className="flex justify-between items-center text-gray-500 py-0.5 border-b border-gray-100/50">
                                            <span>Costo Total:</span>
                                            <span className="font-semibold text-gray-700">{formatMoneySymbol(costoTotal)}</span>
                                          </div>
                                          {isVenta && (
                                            <div className="flex justify-between items-center text-gray-500 py-0.5 border-b border-gray-100/50">
                                              <span>Costo c/ Envío:</span>
                                              <span className="font-semibold text-gray-700">{formatMoneySymbol(costoConEnvioTotal)}</span>
                                            </div>
                                          )}
                                          <div className="flex justify-between items-center text-gray-500 py-0.5 border-b border-gray-100/50">
                                            <span>Precio Venta:</span>
                                            <span className="font-semibold text-gray-700">{formatMoneySymbol(precioVentaUnit)}</span>
                                          </div>
                                          <div className="flex justify-between items-center text-teal-800 py-0.5 border-b border-teal-100/50 font-black">
                                            <span>Venta Total:</span>
                                            <span className="text-teal-700 text-[12px]">{formatMoneySymbol(ventaTotal)}</span>
                                          </div>
                                          <div className="flex justify-between items-center text-emerald-800 py-0.5 font-bold">
                                            <span>Utilidad Total:</span>
                                            <span className="text-emerald-600">{formatMoneySymbol(utilidadTotal)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </ActionMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* 🛠️ FOOTER DEL GRUPO: TODAS LAS ACCIONES REUNIDAS AQUÍ */}
              <div className="px-4 py-2 border-t border-gray-50 flex justify-end items-center bg-gray-50/20">

                {/* BOTONERA DE GESTIÓN */}
                <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-md p-0.5 shadow-sm">
                  {!isReadOnly && (
                    <>
                      {/* Botón: DUPLICAR GRUPO */}
                      <button
                        type="button"
                        title="Duplicar Grupo"
                        onClick={(e) => { e.stopPropagation(); handleDuplicarGrupo(grupo.codigo_grupo); }}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon name="copy" className="h-3.5 w-3.5" />
                      </button>

                      {/* Botón: IMPORTAR DATOS */}
                      <button
                        type="button"
                        title="Importar Datos (.xlsx)"
                        onClick={(e) => {
                          e.stopPropagation();
                          setXlsImportGrupoActivo(grupo.codigo_grupo);
                          xlsInputRef.current?.click();
                        }}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon name="file-up" className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}

                  {/* Botón: EXPORTAR DATOS */}
                  <button
                    type="button"
                    title="Exportar Grupo a Excel"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportarGrupoXLS(grupo.codigo_grupo);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                  >
                    <Icon name="file-down" className="h-3.5 w-3.5" />
                  </button>

                  {!isReadOnly && (
                    <>
                      <div className="w-[1px] h-3.5 bg-gray-200 mx-0.5" />

                      {/* Botón: CONFIGURACIÓN DEL GRUPO */}
                      <button
                        type="button"
                        title="Configuración del Grupo"
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Icon name="settings-2" className="h-3.5 w-3.5" />
                      </button>

                      <div className="w-[1px] h-3.5 bg-gray-200 mx-0.5" />

                      {/* Botón: ELIMINAR GRUPO */}
                      <button
                        type="button"
                        title="Eliminar Grupo Completo"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarGrupo(grupo.codigo_grupo);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Icon name="trash-2" className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // --- INLINE EDITING LOGIC ---
  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setEditForm({ ...item });
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
  };

  const formatMoney = (val) => `$ ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const formatMoneySymbol = (val) => {
    const symbol = (data?.tipo_moneda === 'S' || data?.tipo_moneda === 'PEN') ? 'S/' : '$';
    return `${symbol} ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const renderAddingItemRow = (grupo, sg) => {
    if (addingItemSubgrupoId !== sg.id_servicio) return null;

    const gripPlaceholder = (
      <td className="px-2 text-center align-middle">
        <Icon name="grip-vertical" className="h-3.5 w-3.5 text-gray-200 mx-auto" />
      </td>
    );

    if (sg.tipoCodigo === "04") {
      return (
        <tr className="bg-teal-50/10">
          {gripPlaceholder}
          <td className="px-2 py-1">
            <select
              className="w-full text-[10.5px] border border-gray-300 rounded px-1 py-0.5 uppercase font-bold text-gray-800"
              value={addingServicioForm.codigo_item || ""}
              onChange={(e) => {
                const matched = categoriasPersonal.find(c => c.codigo === e.target.value);
                if (matched) {
                  setAddingServicioForm({
                    ...addingServicioForm,
                    codigo_item: matched.codigo,
                    descripcion_item: matched.nombre,
                    costo_hombre_dia: parseFloat(matched.cos_max || matched.cos_min || 0)
                  });
                }
              }}
            >
              <option value="">-- Perfil --</option>
              {categoriasPersonal.map(c => (
                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
              ))}
            </select>
          </td>
          <td className="px-2 py-1">
            <input
              type="text"
              className="w-full text-[10.5px] border border-gray-300 rounded px-1.5 py-0.5 uppercase font-semibold text-gray-700"
              placeholder="DESCRIPCIÓN DE LA TAREA..."
              value={addingServicioForm.descripcion_item || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, descripcion_item: e.target.value.toUpperCase() })}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-16 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-bold"
              value={addingServicioForm.cantidad_hombres || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, cantidad_hombres: parseInt(e.target.value) || 0 })}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-14 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-semibold"
              value={addingServicioForm.cantidad_dias || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, cantidad_dias: parseInt(e.target.value) || 0 })}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-14 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5"
              value={addingServicioForm.horas || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, horas: parseInt(e.target.value) || 0 })}
            />
          </td>
          <td className="px-2 py-1 text-right">
            <input
              type="number"
              className="w-20 text-[10.5px] border border-gray-300 text-right rounded px-1 py-0.5"
              value={addingServicioForm.costo_hombre_dia || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, costo_hombre_dia: parseFloat(e.target.value) || 0 })}
            />
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 text-right font-medium">
            {formatMoneySymbol((addingServicioForm.cantidad_hombres || 0) * (addingServicioForm.cantidad_dias || 0) * (addingServicioForm.costo_hombre_dia || 0))}
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-16 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-bold text-teal-600"
              value={addingServicioForm.porcentaje || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, porcentaje: parseFloat(e.target.value) || 0 })}
            />
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-900 text-right font-black">
            {formatMoneySymbol(((addingServicioForm.cantidad_hombres || 0) * (addingServicioForm.cantidad_dias || 0) * (addingServicioForm.costo_hombre_dia || 0)) * (1 + (addingServicioForm.porcentaje || 0) / 100))}
          </td>
          <td className="px-3 py-1 text-right">
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => handleConfirmManoObraInline(addingServicioForm, grupo.id_servicio, sg.id_servicio)}
                className="p-1 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded-lg transition-all"
                title="Agregar"
              >
                <Icon name="check" className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setAddingItemSubgrupoId(null)}
                className="p-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg transition-all"
                title="Cancelar"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            </div>
          </td>
        </tr>
      );
    }

    if (sg.tipoCodigo === "05") {
      return (
        <tr className="bg-teal-50/10">
          {gripPlaceholder}
          <td className="px-2 py-1">
            <select
              className="w-full text-[10.5px] border border-gray-300 rounded px-1 py-0.5 uppercase font-bold text-gray-800"
              value={addingServicioForm.codigo_item || ""}
              onChange={(e) => {
                const matched = tiposGasto.find(c => c.codigo === e.target.value);
                if (matched) {
                  setAddingServicioForm({
                    ...addingServicioForm,
                    codigo_item: matched.codigo,
                    descripcion_item: matched.nombre
                  });
                }
              }}
            >
              <option value="">-- Gasto --</option>
              {tiposGasto.map(c => (
                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
              ))}
            </select>
          </td>
          <td className="px-2 py-1">
            <input
              type="text"
              className="w-full text-[10.5px] border border-gray-300 rounded px-1.5 py-0.5 uppercase font-semibold text-gray-700"
              placeholder="CONCEPTO DEL GASTO..."
              value={addingServicioForm.descripcion_item || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, descripcion_item: e.target.value.toUpperCase() })}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-16 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-bold"
              value={addingServicioForm.cantidad_hombres || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, cantidad_hombres: parseInt(e.target.value) || 0 })}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-14 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-semibold"
              value={addingServicioForm.cantidad_dias || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, cantidad_dias: parseInt(e.target.value) || 0 })}
            />
          </td>
          <td className="px-2 py-1 text-right">
            <input
              type="number"
              className="w-24 text-[10.5px] border border-gray-300 text-right rounded px-1 py-0.5"
              value={addingServicioForm.costo_hombre_dia || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, costo_hombre_dia: parseFloat(e.target.value) || 0 })}
            />
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-900 text-right font-black">
            {formatMoneySymbol((addingServicioForm.cantidad_hombres || 0) * (addingServicioForm.cantidad_dias || 0) * (addingServicioForm.costo_hombre_dia || 0))}
          </td>
          <td className="px-3 py-1 text-right">
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => handleConfirmGastosServicioInline(addingServicioForm, grupo.id_servicio, sg.id_servicio)}
                className="p-1 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded-lg transition-all"
                title="Agregar"
              >
                <Icon name="check" className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setAddingItemSubgrupoId(null)}
                className="p-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg transition-all"
                title="Cancelar"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            </div>
          </td>
        </tr>
      );
    }

    if (sg.tipoCodigo === "06") {
      return (
        <tr className="bg-teal-50/10">
          {gripPlaceholder}
          <td className="px-2 py-1">
            <select
              className="w-full text-[10.5px] border border-gray-300 rounded px-1 py-0.5 uppercase font-bold text-gray-800"
              value={addingServicioForm.codigo_item || ""}
              onChange={(e) => {
                const matched = tiposGasto.find(c => c.codigo === e.target.value);
                if (matched) {
                  setAddingServicioForm({
                    ...addingServicioForm,
                    codigo_item: matched.codigo,
                    descripcion_item: matched.nombre
                  });
                }
              }}
            >
              <option value="">-- Gasto --</option>
              {tiposGasto.map(c => (
                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
              ))}
            </select>
          </td>
          <td className="px-2 py-1">
            <input
              type="text"
              className="w-full text-[10.5px] border border-gray-300 rounded px-1.5 py-0.5 uppercase font-semibold text-gray-700"
              placeholder="DESCRIPCIÓN DEL CONCEPTO..."
              value={addingServicioForm.descripcion_item || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, descripcion_item: e.target.value.toUpperCase() })}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-16 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-bold"
              value={addingServicioForm.cantidad_hombres || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, cantidad_hombres: parseInt(e.target.value) || 0 })}
            />
          </td>
          <td className="px-2 py-1 text-right">
            <input
              type="number"
              className="w-20 text-[10.5px] border border-gray-300 text-right rounded px-1 py-0.5"
              value={addingServicioForm.costo_hombre_dia || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, costo_hombre_dia: parseFloat(e.target.value) || 0 })}
            />
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 text-right font-medium">
            {formatMoneySymbol((addingServicioForm.cantidad_hombres || 0) * (addingServicioForm.costo_hombre_dia || 0))}
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-16 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-bold text-teal-600"
              value={addingServicioForm.porcentaje || ""}
              onChange={(e) => setAddingServicioForm({ ...addingServicioForm, porcentaje: parseFloat(e.target.value) || 0 })}
            />
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-900 text-right font-black">
            {formatMoneySymbol(((addingServicioForm.cantidad_hombres || 0) * (addingServicioForm.costo_hombre_dia || 0)) * (1 + (addingServicioForm.porcentaje || 0) / 100))}
          </td>
          <td className="px-3 py-1 text-right">
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => handleConfirmOtrosInline(addingServicioForm, grupo.id_servicio, sg.id_servicio)}
                className="p-1 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded-lg transition-all"
                title="Agregar"
              >
                <Icon name="check" className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setAddingItemSubgrupoId(null)}
                className="p-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg transition-all"
                title="Cancelar"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            </div>
          </td>
        </tr>
      );
    }
    return null;
  };

  const renderGrupoServicio = (grupo, gIdx, dndListeners = {}, dndAttributes = {}) => {
    const isExpanded = serviciosExpandidos[grupo.id_servicio] !== false;
    const itemsTotales = (grupo.subgrupos || []).reduce((acc, sg) => acc + (sg.items || []).length, 0);

    const totalCotizadoGrupo = (grupo.subgrupos || []).reduce((acc, sg) => {
      const sgTotal = (sg.items || []).reduce((sum, it) => sum + (it.cotizado_total || 0), 0);
      return acc + sgTotal;
    }, 0) * (grupo.cantidad || 1);

    const isEditingGroup = editingGrupoServicioId === grupo.id_servicio;

    const getSubgrupoWeight = (sg) => {
      const code = sg.tipoCodigo || "";
      if (code.endsWith("04") || code === "04" || code === "4") return 1;
      if (code.endsWith("05") || code === "05" || code === "5") return 2;
      if (code.endsWith("06") || code === "06" || code === "6") return 3;

      const name = (sg.tipoNombre || sg.titulo || "").toUpperCase();
      if (name.includes("MANO") || name.includes("PERSONAL") || name.includes("OBRA")) return 1;
      if (name.includes("GASTO") || name.includes("SERVICIO")) return 2;
      if (name.includes("OTRO")) return 3;

      return 99;
    };

    const subgruposOrdenados = [...(grupo.subgrupos || [])].sort((a, b) => {
      return getSubgrupoWeight(a) - getSubgrupoWeight(b);
    });

    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div
          onClick={() => !isEditingGroup && toggleServicioGrupo(grupo.id_servicio)}
          className={cn(
            "group px-5 py-3.5 flex justify-between items-center hover:bg-gray-50/50 transition-colors border-b border-gray-100",
            isEditingGroup ? "cursor-default" : "cursor-pointer"
          )}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!isReadOnly && !isEditingGroup ? (
              <div
                {...dndListeners}
                {...dndAttributes}
                data-drag-handle
                onClick={(e) => e.stopPropagation()}
                className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 rounded transition-colors"
              >
                <Icon name="grip-vertical" className="h-3.5 w-3.5" />
              </div>
            ) : (
              !isEditingGroup && (
                <div className="p-1 text-gray-200">
                  <Icon name="grip-vertical" className="h-3.5 w-3.5" />
                </div>
              )
            )}

            {!isEditingGroup && (
              <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                <Icon name="chevron-down" className="h-3.5 w-3.5 text-gray-400" />
              </div>
            )}

            {isEditingGroup ? (
              <div className="flex items-center gap-2 flex-1 max-w-[500px]" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  className="border border-gray-300 rounded-xl px-3 py-1.5 text-[11px] font-black text-gray-800 uppercase flex-1 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  value={editingGrupoForm.nombre}
                  onChange={(e) => setEditingGrupoForm({ ...editingGrupoForm, nombre: e.target.value.toUpperCase() })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmGrupoServicio({
                        _key: grupo.id_servicio,
                        nombre: editingGrupoForm.nombre,
                        cantidad: editingGrupoForm.cantidad,
                        detalle: editingGrupoForm.detalle
                      });
                      setEditingGrupoServicioId(null);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col min-w-0">
                <span className="font-black text-gray-800 text-[12px] uppercase tracking-wide truncate">
                  {grupo.tituloGeneral ? grupo.tituloGeneral.split('\n')[0] : ''}
                </span>
              </div>
            )}

            {!isEditingGroup && (
              <span className="text-[10px] text-gray-600 font-medium bg-gray-100 px-1.5 rounded shrink-0">
                {itemsTotales} Ítems
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
            {isEditingGroup ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 border border-teal-100 rounded-md">
                  <span className="text-[9px] font-black text-teal-600 uppercase">Cant:</span>
                  <input
                    type="number"
                    min="1"
                    className="w-10 bg-transparent border-none outline-none text-[11.5px] font-black text-teal-800 text-center focus:ring-0 p-0"
                    value={editingGrupoForm.cantidad}
                    onChange={(e) => setEditingGrupoForm({ ...editingGrupoForm, cantidad: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      handleConfirmGrupoServicio({
                        _key: grupo.id_servicio,
                        nombre: editingGrupoForm.nombre,
                        cantidad: editingGrupoForm.cantidad,
                        detalle: editingGrupoForm.detalle
                      });
                      setEditingGrupoServicioId(null);
                    }}
                    className="p-1 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded-lg transition-all"
                    title="Guardar"
                  >
                    <Icon name="check" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingGrupoServicioId(null)}
                    className="p-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg transition-all"
                    title="Cancelar"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 border border-teal-100 rounded-md">
                  <span className="text-[9px] font-black text-teal-600 uppercase">Cant:</span>
                  <span className="text-[11.5px] font-black text-teal-800">
                    {grupo.cantidad || 1}
                  </span>
                </div>

                <div className="text-right min-w-[120px]">
                  <span className="text-[11.5px] font-black text-gray-900">
                    {formatMoneySymbol(totalCotizadoGrupo)}
                  </span>
                </div>

                {!isReadOnly && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      title="Duplicar Grupo de Servicios"
                      onClick={(e) => { e.stopPropagation(); handleDuplicarServicio(grupo.id_servicio); }}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                      <Icon name="copy" className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Editar Grupo"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGrupoServicioId(grupo.id_servicio);
                        setEditingGrupoForm({
                          nombre: grupo.tituloGeneral ? grupo.tituloGeneral.split('\n')[0] : '',
                          cantidad: grupo.cantidad,
                          detalle: grupo.detalle
                        });
                      }}
                      className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                      <Icon name="edit-2" className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Eliminar Grupo Completo"
                      onClick={(e) => { e.stopPropagation(); handleEliminarGrupoServicio(grupo.id_servicio, grupo.tituloGeneral); }}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Icon name="trash-2" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && !isEditingGroup && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4 space-y-4 bg-gray-50/20">
                {subgruposOrdenados.map((sg) => {
                  const sgKey = `${grupo.id_servicio}-${sg.tipoCodigo}`;
                  const isSgExpanded = subgruposExpandidos[sgKey] !== false;
                  const sgCotizadoTotal = (sg.items || []).reduce((sum, it) => sum + (it.cotizado_total || 0), 0);

                  const sortedItems = sg.items || [];

                  return (
                    <div key={sg.id || sgKey} className="bg-white border border-gray-150 rounded-lg overflow-hidden shadow-xs">
                      <div
                        onClick={() => toggleSubgrupo(sgKey)}
                        className="cursor-pointer px-4 py-2 bg-gray-50/80 hover:bg-gray-100/50 flex justify-between items-center transition-colors border-b border-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`transition-transform duration-200 ${isSgExpanded ? 'rotate-0' : '-rotate-90'}`}>
                            <Icon name="chevron-down" className="h-3 w-3 text-gray-400" />
                          </div>
                          <span className="text-[10px] font-black text-gray-700 tracking-wider uppercase">
                            {sg.tipoNombre || sg.titulo}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 bg-white border border-gray-200 px-1.5 rounded-full">
                            {sortedItems.length}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10.5px] font-black text-gray-600">
                            {formatMoneySymbol(sgCotizadoTotal)}
                          </span>
                        </div>
                      </div>

                      <AnimatePresence initial={false}>
                        {isSgExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className="w-full overflow-x-auto">
                              <table className="min-w-full table-fixed border-collapse">
                                {sg.tipoCodigo === "04" && (
                                  <thead className="bg-gray-50/30 border-b border-gray-100">
                                    <tr>
                                      <th className="w-[4%]"></th>
                                      <th className="w-[15%] px-3 py-1.5 text-left text-[8.5px] font-bold text-gray-400 uppercase">Cód. Personal</th>
                                      <th className="w-[21%] px-3 py-1.5 text-left text-[8.5px] font-bold text-gray-400 uppercase">Descripción / Tarea</th>
                                      <th className="w-[8%] px-3 py-1.5 text-center text-[8.5px] font-bold text-gray-400 uppercase">Cant. (H)</th>
                                      <th className="w-[7%] px-3 py-1.5 text-center text-[8.5px] font-bold text-gray-400 uppercase">Días</th>
                                      <th className="w-[7%] px-3 py-1.5 text-center text-[8.5px] font-bold text-gray-400 uppercase">Horas</th>
                                      <th className="w-[10%] px-3 py-1.5 text-right text-[8.5px] font-bold text-gray-400 uppercase">Costo H/D</th>
                                      <th className="w-[10%] px-3 py-1.5 text-right text-[8.5px] font-bold text-gray-400 uppercase">Costo Total</th>
                                      <th className="w-[8%] px-3 py-1.5 text-center text-[8.5px] font-bold text-gray-400 uppercase">Util. %</th>
                                      <th className="w-[10%] px-3 py-1.5 text-right text-[8.5px] font-bold text-gray-400 uppercase">Cotizado Total</th>
                                      <th className="w-[7%] px-3 py-1.5"></th>
                                    </tr>
                                  </thead>
                                )}

                                {sg.tipoCodigo === "05" && (
                                  <thead className="bg-gray-50/30 border-b border-gray-100">
                                    <tr>
                                      <th className="w-[4%]"></th>
                                      <th className="w-[15%] px-3 py-1.5 text-left text-[8.5px] font-bold text-gray-400 uppercase">Tipo Gasto</th>
                                      <th className="w-[31%] px-3 py-1.5 text-left text-[8.5px] font-bold text-gray-400 uppercase">Concepto</th>
                                      <th className="w-[10%] px-3 py-1.5 text-center text-[8.5px] font-bold text-gray-400 uppercase">Cant. (H)</th>
                                      <th className="w-[10%] px-3 py-1.5 text-center text-[8.5px] font-bold text-gray-400 uppercase">Días</th>
                                      <th className="w-[15%] px-3 py-1.5 text-right text-[8.5px] font-bold text-gray-400 uppercase">Precio Unit.</th>
                                      <th className="w-[15%] px-3 py-1.5 text-right text-[8.5px] font-bold text-gray-400 uppercase">Total</th>
                                      <th className="w-[7%] px-3 py-1.5"></th>
                                    </tr>
                                  </thead>
                                )}

                                {sg.tipoCodigo === "06" && (
                                  <thead className="bg-gray-50/30 border-b border-gray-100">
                                    <tr>
                                      <th className="w-[4%]"></th>
                                      <th className="w-[15%] px-3 py-1.5 text-left text-[8.5px] font-bold text-gray-400 uppercase">Cód. Gasto</th>
                                      <th className="w-[26%] px-3 py-1.5 text-left text-[8.5px] font-bold text-gray-400 uppercase">Concepto</th>
                                      <th className="w-[10%] px-3 py-1.5 text-center text-[8.5px] font-bold text-gray-400 uppercase">Cantidad</th>
                                      <th className="w-[12%] px-3 py-1.5 text-right text-[8.5px] font-bold text-gray-400 uppercase">Costo Unit.</th>
                                      <th className="w-[12%] px-3 py-1.5 text-right text-[8.5px] font-bold text-gray-400 uppercase">Costo Total</th>
                                      <th className="w-[8%] px-3 py-1.5 text-center text-[8.5px] font-bold text-gray-400 uppercase">Util. %</th>
                                      <th className="w-[13%] px-3 py-1.5 text-right text-[8.5px] font-bold text-gray-400 uppercase">Venta Total</th>
                                      <th className="w-[7%] px-3 py-1.5"></th>
                                    </tr>
                                  </thead>
                                )}

                                <tbody className="divide-y divide-gray-50">
                                  <SortableContext
                                    items={sortedItems.map(item => `item-${item.id_servicio}`)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {sortedItems.map((item) => (
                                      <SortableItemServicioRow
                                        key={item.id_servicio}
                                        item={item}
                                        sg={sg}
                                        grupo={grupo}
                                        isReadOnly={isReadOnly}
                                        editingItemServicioId={editingItemServicioId}
                                        editingServicioForm={editingServicioForm}
                                        setEditingServicioForm={setEditingServicioForm}
                                        setEditingItemServicioId={setEditingItemServicioId}
                                        categoriasPersonal={categoriasPersonal}
                                        typesGasto={tiposGasto}
                                        handleConfirmManoObraInline={handleConfirmManoObraInline}
                                        handleConfirmGastosServicioInline={handleConfirmGastosServicioInline}
                                        handleConfirmOtrosInline={handleConfirmOtrosInline}
                                        handleStartEditingItemInline={handleStartEditingItemInline}
                                        handleEliminarItemServicio={handleEliminarItemServicio}
                                        formatMoneySymbol={formatMoneySymbol}
                                      />
                                    ))}
                                  </SortableContext>

                                  {renderAddingItemRow(grupo, sg)}

                                  {sortedItems.length === 0 && addingItemSubgrupoId !== sg.id_servicio && (
                                    <tr>
                                      <td colSpan={sg.tipoCodigo === "04" ? 11 : sg.tipoCodigo === "05" ? 8 : 9} className="px-4 py-6 text-center">
                                        <span className="text-[10px] text-gray-400 italic font-medium uppercase tracking-wide">No hay ítems registrados en este subgrupo</span>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {!isReadOnly && (
                              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/10 flex justify-between items-center">
                                <button
                                  type="button"
                                  onClick={() => handleStartAddingItem(sg.id_servicio, sg.tipoCodigo)}
                                  className="text-[9.5px] font-black text-teal-600 hover:text-teal-800 uppercase flex items-center gap-1 transition-colors"
                                >
                                  <Icon name="plus" className="h-3 w-3" />
                                  Agregar Elemento
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ===========
  // OPCIONES
  // ===========
  const probOptions = [
    { id: "0", nombre: "Baja" },
    { id: "1", nombre: "Media" },
    { id: "2", nombre: "Alta" },
    { id: "3", nombre: "Muy Alta" },
  ];

  const tipoOptions = [
    { id: "P", nombre: "Proyecto" },
    { id: "S", nombre: "Servicio" },
    { id: "V", nombre: "Venta" },
  ];

  const tipoVentaOptions = [
    { id: "P", nombre: "Parcial" },
    { id: "T", nombre: "Total" },
  ];

  const areasOptions = [
    { id: "1", nombre: "Industria" },
    { id: "2", nombre: "Mineria" },
    { id: "3", nombre: "Mantenimiento" },
    { id: "4", nombre: "Petroquimica" },
    { id: "8", nombre: "Seguridad de Maquinaria" },
  ];

  const estadosOptions = [
    { id: "1", nombre: "Adjudicado" },
    { id: "2", nombre: "Pendiente" },
    { id: "3", nombre: "Perdida" },
    { id: "4", nombre: "Anulado" },
    { id: "5", nombre: "Postergada" },
    { id: "6", nombre: "En Seguimiento" },
  ];

  const monedasOptions = [
    { id: "S", nombre: "Soles" },
    { id: "D", nombre: "Dólares" },
  ];

  const unidadOptions = [
    { id: "1", nombre: "Dias" },
    { id: "2", nombre: "Semanas" },
    { id: "3", nombre: "Meses" },
  ]

  const igvOptions = [
    { id: "N", nombre: "No Incluye" },
    { id: "S", nombre: "Incluye" },
  ]

  const formasPagoOptions = [
    { id: "100% Contra Entrega", nombre: "100% Contra Entrega" },
    { id: "100% Factura a 30 días", nombre: "100% Factura a 30 días" },
    { id: "100% Factura a 42 días", nombre: "100% Factura a 42 días" },
    { id: "100% Factura a 60 días", nombre: "100% Factura a 60 días" },
    { id: "100% Factura a 180 días, vía factoring", nombre: "100% Factura a 180 días, vía factoring" },
    { id: "50% Adelanto, 50% Contra Entrega", nombre: "50% Adelanto, 50% Contra Entrega" },
    { id: "100% Factura a 180 días", nombre: "100% Factura a 180 días" },
  ]

  const estadoOpOptions = [
    { id: "0", nombre: "Pendiente" },
    { id: "1", nombre: "No Cotizado" },
    { id: "2", nombre: "Rechazado" },
    { id: "3", nombre: "Cotizado" },
  ];

  // ==========
  // ADJUNTOS
  // ==========
  // 1. LISTAR: Ahora lee directamente de la tabla de la base de datos
  const fetchDocuments = async () => {
    try {
      const { data: res } = await api.get(`cotizaciones/adjuntos/${numReg}/`);
      if (res.ok) {
        const mapeados = res.archivos.map((a) => ({
          id: a.id,
          name: a.nombre,
          description: a.description, // <--- AGREGA ESTA LÍNEA
          file_path: a.file_path,
          upload_date: a.fecha,
          uploaded_by: a.usuario,
        }));
        setDocuments(mapeados);
      }
    } catch (err) {
      console.error("Error cargando adjuntos", err);
    }
  };

  useEffect(() => {
    if (numReg) fetchDocuments();
  }, [numReg]);

  // 2. SUBIR: Simplificado, Django se encarga de los nombres y la ruta
  const handleFileAndUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("archivo", file);

      // CAMBIO: Enviamos solo lo que el usuario escribió (puede ser vacío)
      formData.append("descripcion", docDescription.trim());

      const { data: res } = await api.post(`cotizaciones/adjuntos/${numReg}/`, formData);

      if (res.ok) {
        toast.success("Documento vinculado correctamente");
        setDocDescription("");
        fetchDocuments();
        fetchHistory(); // <--- ACTUALIZA TRAZABILIDAD
      }
    } catch (error) {
      console.error("Error subiendo archivo", error);
      toast.error("Error al subir el archivo");
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  // 3. ELIMINAR: Usa el ID de la base de datos y el método DELETE
  const handleDeleteDocument = async (id) => {
    try {
      // Pasamos el ID por la URL como parámetro de consulta (?id=...)
      const { data: res } = await api.delete(`cotizaciones/adjuntos/${numReg}/?id=${id}`);

      if (res.ok) {
        toast.success("Archivo y registro eliminados");
        setDeletingDocId(null);
        fetchDocuments();
        fetchHistory(); // <--- ACTUALIZA TRAZABILIDAD
      }
    } catch (error) {
      console.error("Error al eliminar", error);
      toast.error("No se pudo eliminar el archivo");
    }
  };

  // ==================
  // MENSAJES SEGUIMIENTO
  // ==================
  // 1. Cargar Mensajes
  const fetchMensajes = async () => {
    try {
      const { data: res } = await api.get(`cotizaciones/mensajes/${numReg}/`);
      if (res.ok) {
        const mapeados = res.registros.map(m => {
          let alertDateObj = null;

          // m.alerta_fecha viene en formato ISO o string desde el backend
          if (m.alerta === "1" && m.alerta_fecha) {
            alertDateObj = new Date(m.alerta_fecha);
          }

          return {
            id: m.id_mensaje,
            timestamp: m.fecha_formateada || m.fecha,
            content: m.mensaje,
            user_role: m.usuario_nombre || 'Usuario',
            is_alert: m.alerta === "1",
            alert_date: alertDateObj,
            is_resolved: m.completo === "1"
          };
        });
        setNotes(mapeados);
      }
    } catch (err) {
      console.error("Error cargando mensajes", err);
    }
  };

  // Esta es la función que llama el botón "Marcar Listo"
  const handleResolveReminderInside = async (id) => {
    try {
      const { data: res } = await api.patch(`cotizaciones/mensajes/${numReg}/`, { id, completar: true });
      if (res.ok) {
        toast.success("Tarea completada");
        fetchMensajes();
        fetchHistory(); // <--- ACTUALIZA TRAZABILIDAD
      }
    } catch (err) {
      toast.error("No se pudo actualizar");
    }
  };

  // 2. Agregar Nota Actualizada
  const handleAddNote = React.useCallback(async (textOverride) => {
    let text = (typeof textOverride === 'string' ? textOverride : newNote).trim();
    if (!text) return;

    let finalMsj = text;

    try {
      // PREPARACIÓN DE LA FECHA:
      // Si isAlert es un objeto Date, lo formateamos para el backend.
      // Usamos una función auxiliar para obtener "YYYY-MM-DD HH:mm:ss"
      const fechaFormateada = (isAlert instanceof Date)
        ? isAlert.toLocaleString('sv-SE').replace('T', ' ')
        : null;

      const payload = {
        msj: finalMsj,
        alerta: isAlert ? "1" : "0",
        alerta_fecha: fechaFormateada
      };

      const { data: res } = await api.post(`cotizaciones/mensajes/${numReg}/`, payload);

      if (res.ok) {
        toast.success(isAlert ? "Alerta programada" : "Registro guardado");
        setNewNote('');
        setIsAlert(null);
        fetchMensajes();
        fetchHistory(); // <--- ACTUALIZA TRAZABILIDAD
      }
    } catch (err) {
      console.error("Error en handleAddNote:", err);
      toast.error("Error al guardar");
    }
  }, [newNote, isAlert, numReg, fetchMensajes]);

  const handleSaveQuickNote = (text) => {
    if (!text.trim()) return;
    handleAddNote(text);
  };

  // 3. NUEVO: Función para completar tarea (Check)
  const handleManageAlert = async (note, action, dateOverride = null) => {
    try {
      let payload = { id: note.id };

      if (action === 'complete') {
        payload.completar = true; // El backend usará timezone.now()
      } else if (action === 'reprogram') {
        if (dateOverride) {
          payload.nueva_fecha = dateOverride;
        } else {
          const nuevaFecha = prompt("Ingrese la nueva fecha (YYYY-MM-DD HH:mm)");
          if (!nuevaFecha) return;
          payload.nueva_fecha = nuevaFecha;
        }
      }

      const { data: res } = await api.patch(`cotizaciones/mensajes/${numReg}/`, payload);

      if (res.ok) {
        toast.success(action === 'complete' ? "¡Alerta completada!" : "Alerta reprogramada");
        fetchMensajes();
        fetchHistory(); // <--- ACTUALIZA TRAZABILIDAD
      }
    } catch (err) {
      toast.error("Error al actualizar");
    }
  };

  // 4. ELIMINAR MENSAJE (Sin confirmación de navegador)
  const [deletingId, setDeletingId] = useState(null);
  const [deletingDocId, setDeletingDocId] = useState(null);

  // 5. TRAZABILIDAD (HISTORIAL)
  const [history, setHistory] = useState([]);
  const fetchHistory = async () => {
    try {
      const { data: res } = await api.get(`cotizaciones/seguimientos/${numReg}/`);
      if (res.ok) {
        setHistory(res.seguimientos || []);
      }
    } catch (err) {
      console.error("Error cargando trazabilidad", err);
    }
  };

  const getHistoryType = (detalle) => {
    const text = (detalle || "").toUpperCase();
    if (text.includes("CREACIÓN") || text.includes("APERTURA") || text.includes("REGISTRO BASE")) return "CREACION";
    if (text.includes("ADJUNTÓ ARCHIVO") || text.includes("DOCUMENTO")) return "ADJUNTOS";
    if (text.includes("ESTADO") || text.includes("CAMBIO")) return "ESTADO";
    if (text.includes("REGISTRO:")) return "SEGUIMIENTO";
    return "SISTEMA";
  };

  const handleDeleteMensaje = async (id) => {
    try {
      const { data: res } = await api.delete(`cotizaciones/mensajes/${numReg}/`, {
        params: { id }
      });

      if (res.ok) {
        toast.success("Registro eliminado");
        setDeletingId(null);
        fetchMensajes();
        fetchHistory(); // <--- ACTUALIZA TRAZABILIDAD
      }
    } catch (err) {
      console.error("Error al eliminar mensaje", err);
      toast.error("No se pudo eliminar el registro");
    }
  };

  // Urgencia de Alertas
  const getAlertUrgency = (alertDate, isDone) => {
    if (!alertDate || isDone) return 'none';

    // Creamos la fecha. 
    const alert = new Date(alertDate);

    // Si sigue dando error, devolvemos 'none' para no romper el diseño
    if (isNaN(alert.getTime())) return 'none';

    const now = new Date();
    const diffInMs = alert - now;
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInMs < 0) return 'expired';      // Rojo: Ya venció
    if (diffInDays <= 2) return 'urgent';    // Naranja: 2 días o menos
    return 'normal';                         // Ámbar: Más de 2 días
  };

  useEffect(() => {
    if (numReg) {
      fetchMensajes();
      fetchHistory();
    }
  }, [numReg]);

  // ===========
  // NOTAS
  // ===========
  const [notasComunes, setNotasComunes] = useState([]);
  const [loadingNotas, setLoadingNotas] = useState(true);

  // Función para traer las notas de la DB
  const fetchNotas = async () => {
    try {
      setLoadingNotas(true);
      const response = await api.get("core/notas/");

      // El backend retorna { ok: true, data: [...] }
      const dataNotas = response.data.ok ? response.data.data : [];

      setNotasComunes(dataNotas);
    } catch (error) {
      console.error("Error al cargar notas:", error);
    } finally {
      setLoadingNotas(false);
    }
  };

  // Función para crear una nota nueva en la DB
  const handleAddNuevaNota = async (texto) => {
    if (!texto.trim()) return;
    try {
      const nuevaNota = {
        descripcion: texto,
        activo: 1
      };
      const response = await api.post("core/notas/", nuevaNota);

      // Si se crea con éxito, la añadimos al editor y a la lista local
      // El backend retorna { ok: true, data: {...} }
      const notaCreada = response.data.ok ? response.data.data : response.data;

      setGeneralConditions(prev => prev ? `${prev}\n- ${texto}` : `- ${texto}`);
      setNotasComunes(prev => [...prev, notaCreada]);
    } catch (error) {
      alert("Error al guardar la nota en la base de datos");
    }
  };

  useEffect(() => {
    fetchNotas();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Sincronizando con Backend Antigravity...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center max-w-md text-center">
        <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
          <Icon name="alert-circle" className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Error de Carga</h3>
        <p className="text-sm text-gray-500 mt-2">No se pudo encontrar la información solicitada o el servidor no respondió correctamente.</p>
        <button
          onClick={() => navigate('/sigecom/comercial')}
          className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all"
        >
          Volver al Listado
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full max-w-[1920px] mx-auto animate-in fade-in duration-700 font-sans">

      {/* 70% MAIN PANEL - Scrollable Content */}
      <div className="lg:w-8/12 flex flex-col space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-visible font-sans">
          <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              {/* Botón Atrás */}
              <button
                onClick={() => navigate('/sigecom/comercial')}
                className="mr-5 p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-gray-100 group"
              >
                <Icon name="arrow-left" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </button>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">
                    {data?.codigo || data?.numero || 'S/N'}
                  </h1>

                  {isDirty && (
                    <div className="flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 border border-amber-200 text-amber-700 uppercase tracking-widest shadow-sm animate-pulse">
                      Falta Guardar
                    </div>
                  )}

                  {/* BADGE ESTADO COTIZACION */}
                  <div className="relative group">
                    <button className={`flex items-center px-3 py-1 rounded-full text-[9px] font-black text-white transition-all shadow-sm uppercase tracking-widest ${PIPELINE.find(s => s.label === currentStatus)?.color || 'bg-indigo-600'} hover:brightness-105 border border-white/20`}>
                      <Icon name="refresh-cw" className="h-2.5 w-2.5 mr-1.5" />
                      {currentStatus}
                    </button>
                    <select
                      value={currentStatus}
                      onChange={(e) => setCurrentStatus(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      disabled={isReadOnly}
                    >
                      {PIPELINE.map(s => <option key={s.id} value={s.label}>{s.label.toUpperCase()}</option>)}
                    </select>
                  </div>

                  {/* BADGE ESTADO DE ENVÍO */}
                  <div className="relative flex items-center">
                    {data?.estado_envio === 2 ? (
                      // Estado ENVIADO: Badge estático premium y deshabilitado
                      <div className="flex items-center px-3 py-1 rounded-full text-[9px] font-black bg-emerald-100 border border-emerald-200 text-emerald-700 uppercase tracking-widest shadow-sm">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                        Enviado
                      </div>
                    ) : (
                      // Estado PENDIENTE: Botón interactivo con Toast de Confirmación Premium
                      <div className="relative flex items-center group/confirm">
                        <button
                          onClick={() => {
                            toast.info(({ closeToast }) => (
                              <div className="flex flex-col min-w-[340px] overflow-hidden rounded-lg">
                                <div className="flex items-center gap-3 px-4 py-2 bg-rose-50/50 border-b border-rose-100">
                                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white shadow-sm border border-rose-100">
                                    <Icon name="send" className="h-3.5 w-3.5 text-rose-600" />
                                  </div>
                                  <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight">
                                    Marcar como Enviado
                                  </span>
                                </div>
                                <div className="px-4 py-3">
                                  <p className="text-[11px] text-gray-600 leading-tight">
                                    ¿Confirmar marcar esta cotización como <span className="font-bold text-gray-900 underline decoration-rose-200 underline-offset-2">ENVIADA AL CLIENTE</span>? Esta acción no se puede deshacer.
                                  </p>
                                </div>
                                <div className="flex items-center justify-end gap-3 px-4 pb-3">
                                  <button onClick={closeToast} className="whitespace-nowrap text-[9px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">Cancelar</button>
                                  <button
                                    onClick={() => { enviarCotizacionAprobacion.mutate(data.id_registro); closeToast(); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-[9px] font-black rounded-xl uppercase shadow-md shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95 whitespace-nowrap"
                                  >
                                    <span>Confirmar Envío</span>
                                    <Icon name="arrow-right" className="h-3 w-3 opacity-70" />
                                  </button>
                                </div>
                              </div>
                            ), { position: "top-right", autoClose: false, closeOnClick: false, draggable: false, icon: false, className: "p-0 rounded-2xl border border-gray-100 shadow-2xl overflow-hidden !w-max !max-w-[400px]" });
                          }}
                          className="flex items-center px-3 py-1 rounded-full text-[9px] font-black bg-rose-50 border border-rose-200 text-rose-600 uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all duration-200 shadow-sm cursor-pointer"
                          disabled={enviarCotizacionAprobacion.isPending}
                        >
                          {enviarCotizacionAprobacion.isPending ? (
                            <div className="h-2.5 w-2.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mr-1.5" />
                          ) : (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-rose-500 mr-1.5 group-hover/confirm:bg-white" />
                          )}
                          Pendiente de Envío
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* LÍNEA DE DATOS EDITABLES */}
                <div className="relative flex items-center text-[12px] gap-x-4">
                  {/* CLIENTE (Editable Autocomplete) */}
                  <ClienteAutocomplete
                    value={data.cliente_nombre}
                    initialId={data.id_cliente}
                    isReadOnly={isReadOnly}
                    onSelect={(cliente) => {
                      setData(prev => ({
                        ...prev,
                        id_cliente: cliente.id_cliente,
                        cliente_nombre: cliente.nombre,
                        id_representante: null,
                        representante_nombre: "",
                        representante_cargo: "",
                        representante_telefono: "",
                        representante_movil: "",
                        representante_correo: "",
                      }));
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuPos({ x: e.clientX, y: e.clientY });
                      setContextMenuType('cliente');
                      setContextMenuOpen(true);
                    }}
                    onOptionsClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setContextMenuPos({ x: rect.left, y: rect.bottom });
                      setContextMenuType('cliente');
                      setContextMenuOpen(true);
                    }}
                  />

                  {/* REPRESENTANTE (Editable Autocomplete) */}
                  <RepresentanteAutocomplete
                    value={data.representante_nombre}
                    clienteId={data.id_cliente}
                    initialId={data.id_representante}
                    isReadOnly={isReadOnly}
                    onSelect={(enc) => {
                      setData(prev => ({
                        ...prev,
                        id_representante: enc.id_representante,
                        representante_nombre: enc.nombre_representante,
                        representante_cargo: enc.cargo || "",
                        representante_telefono: enc.telefono || "",
                        representante_movil: enc.movil || "",
                        representante_correo: enc.email || "",
                      }));
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuPos({ x: e.clientX, y: e.clientY });
                      setContextMenuType('representante');
                      setContextMenuOpen(true);
                    }}
                    onOptionsClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setContextMenuPos({ x: rect.left, y: rect.bottom });
                      setContextMenuType('representante');
                      setContextMenuOpen(true);
                    }}
                  />

                  {/* ÁREA COMERCIAL (Select Directo con opciones reales) */}
                  <div className="group relative flex items-center cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-50 transition-all">
                    <Icon name="layers" className="h-3.5 w-3.5 mr-1.5 text-teal-400" />
                    <span className="font-bold text-gray-800 uppercase tracking-tight">
                      {areasOptions.find(o => o.id === String(data.id_area))?.nombre || data.area_nombre || 'Seleccionar Área'}
                    </span>
                    {!isReadOnly && <Icon name="chevron-down" className="h-3 w-3 ml-1 text-gray-400" />}

                    <select
                      value={data.id_area || ""}
                      onChange={(e) => handleFieldChange("id_area", e.target.value ? Number(e.target.value) : "")}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      disabled={isReadOnly}
                    >
                      <option value="">Seleccionar Área</option>
                      {areasOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.nombre.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* TIPO Y TIPO VENTA*/}
                  <div className="group relative flex items-center cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-50 transition-all whitespace-nowrap">
                    <Icon name="tag" className="h-3.5 w-3.5 mr-1.5 text-blue-500" />

                    <div className="flex items-center flex-nowrap">
                      {/* Selector Principal (Tipo) */}
                      <div className="relative flex items-center shrink-0">
                        <span className="font-bold text-gray-800 uppercase tracking-tight">
                          {tipoOptions.find(o => o.id === data.id_tipo)?.nombre || 'Tipo'}
                        </span>

                        <select
                          value={data.id_tipo || ""}
                          onChange={(e) => handleFieldChange("id_tipo", e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          disabled={isReadOnly}
                        >
                          {tipoOptions.map(o => <option key={o.id} value={o.id}>{o.nombre.toUpperCase()}</option>)}
                        </select>
                      </div>

                      {/* Divisor interno y Sub-tipo solo si es Venta */}
                      {data.cotit === "V" && (
                        <div className="flex items-center animate-in fade-in slide-in-from-left-1">
                          <span className="text-gray-300 font-light mx-1.5">|</span>
                          <div className="relative flex items-center">
                            <span className="font-bold text-blue-600 uppercase tracking-tight">
                              {tipoVentaOptions.find(o => o.id === data.tven)?.nombre || 'tipo venta'}
                            </span>
                            <select
                              value={data.tven || ""}
                              onChange={(e) => handleFieldChange("tven", e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              disabled={isReadOnly}
                            >
                              {tipoVentaOptions.map(o => <option key={o.id} value={o.id}>{o.nombre.toUpperCase()}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isReadOnly && <Icon name="chevron-down" className="h-3 w-3 ml-1 text-gray-400 group-hover:text-gray-600 transition-colors" />}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isDirty && !isReadOnly && (
                <button
                  onClick={handleGuardarCabecera}
                  disabled={savingHeader}
                  className="flex items-center px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] font-black text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all h-[42px] uppercase group"
                >
                  {savingHeader ? (
                    <div className="h-3.5 w-3.5 mr-2 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Icon name="save" className="h-3.5 w-3.5 mr-2 text-emerald-600 group-hover:scale-110 transition-transform" />
                  )}
                  {savingHeader ? "Guardando..." : "Guardar Cambios"}
                </button>
              )}
              {/* MENÚ DESPLEGABLE DE REPORTES */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setReporteMenuOpen(!reporteMenuOpen)}
                  className="flex items-center px-4 py-2 bg-sky-50/70 border border-sky-200 rounded-xl text-[10px] font-black text-sky-700 hover:bg-sky-100/70 hover:border-sky-300 hover:shadow-sm transition-all h-[42px] uppercase group"
                >
                  <Icon name="file-text" className="h-3.5 w-3.5 mr-2 text-sky-600 group-hover:scale-110 transition-transform" />
                  <span>Reporte</span>
                  <Icon name="chevron-down" className={`ml-1.5 h-3 w-3 transition-transform duration-200 ${reporteMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Tarjeta Flotante de Opciones */}
                {reporteMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                      <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Opciones de Cliente</span>
                    </div>

                    {/* Opción 1: Reporte Detallado */}
                    <button
                      onClick={() => {
                        handleReporteDetallado(setReporteDetalladoOpen);
                        setReporteMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <div className="p-1 bg-indigo-50 rounded-lg text-indigo-600">
                        <Icon name="list-ordered" className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-bold leading-none">Reporte Detallado</p>
                        <span className="text-[9px] text-slate-400 font-medium">Desglose completo</span>
                      </div>
                    </button>

                    {/* Opción 2: Reporte Resumen */}
                    <button
                      onClick={() => {
                        handleReporteResumen(setReporteResumenOpen);
                        setReporteMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <div className="p-1 bg-amber-50 rounded-lg text-amber-600">
                        <Icon name="file-spreadsheet" className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-bold leading-none">Reporte Resumen</p>
                        <span className="text-[9px] text-slate-400 font-medium">Totales generales</span>
                      </div>
                    </button>

                    {/* Opción 3: Formato Word/PDF*/}
                    <button
                      onClick={() => {
                        toast.success("Se harán reportes WORD y PDF (API pendiente)");
                        setReporteMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[11px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                    >
                      <div className="p-1 bg-slate-50 rounded-lg text-slate-400">
                        <Icon name="file-doc" className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-bold leading-none text-slate-600">Exportar Word / PDF</p>
                        <span className="text-[9px] text-slate-400 font-medium">Formatos de descarga</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SUMINISTROS SECTION */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Cabecera Principal - Nivel 1 */}
          <button
            onClick={() => toggleCategory('Suministros')}
            className="flex items-center justify-between w-full px-5 py-4 bg-gray-50 hover:bg-gray-100/80 transition-colors border-b border-gray-200"
          >
            <div className="flex items-center gap-3">
              <Icon name={expandedCategories.includes('Suministros') ? 'chevron-down' : 'chevron-right'} className="h-4 w-4 text-gray-500" />
              <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">Suministros</h3>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md uppercase">
                {Object.keys(gruposSuministros || {}).length} Grupos
              </span>
            </div>

            {Object.keys(gruposSuministros || {}).length > 0 && (
              <div className="flex items-center gap-2">
                {/* BOTÓN DE REPORTE (SUMINISTROS) */}
                {/* BOTÓN DE REPORTE HTML DESDE EL BACKEND */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setReporteSuministrosOpen(true); // <--- Cambiado para abrir el modal interno
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-black rounded-lg uppercase shadow-sm hover:bg-teal-100 hover:text-teal-900 transition-all cursor-pointer"
                  title="Ver reporte oficial en HTML"
                >
                  <Icon name="bar-chart-3" className="h-3 w-3" />
                  <span>Reporte</span>
                </span>

                {/* BOTÓN DE EXPORTAR EXISTENTE */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportarGeneralXLS();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-black rounded-lg uppercase shadow-sm hover:bg-green-100 transition-all cursor-pointer"
                >
                  <Icon name="file-down" className="h-3 w-3" />
                  <span>Exportar</span>
                </span>
              </div>
            )}
          </button>

          <AnimatePresence>
            {expandedCategories.includes('Suministros') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 space-y-6">
                  {/* EL "ESPEJO" PARA AGREGAR NUEVOS GRUPOS */}
                  <EditableGroupRow
                    tipo="01"
                    onSave={(data) => handleAgregarGrupoSuministro(data)}
                    formatMoneySymbol={formatMoneySymbol}
                  />

                  {/* Renderizado de Grupos de Suministros */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={sortedGrupos.map(g => `grupo-${g.codigo_grupo}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {sortedGrupos.map((grupo, idx) => (
                          <SortableWrapper
                            key={`grupo-wrapper-${grupo.codigo_grupo}`}
                            id={`grupo-${grupo.codigo_grupo}`}
                            data={{ type: 'grupo', codigo_grupo: grupo.codigo_grupo }}
                            className="relative"
                          >
                            {({ listeners, attributes, isDragging }) => (
                              <div style={{ opacity: isDragging ? 0.6 : 1 }}>
                                {renderGrupoSuministro(grupo, idx, listeners, attributes)}
                              </div>
                            )}
                          </SortableWrapper>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {/* Empty State mejorado */}
                  {Object.keys(gruposSuministros || {}).length === 0 && (
                    <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                      <Icon name="package-2" className="h-5 w-5 text-gray-300 mx-auto mb-2" />
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                        No hay suministros registrados en esta cotización.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SERVICIOS SECTION */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleCategory('Servicios')}
            className="flex items-center justify-between w-full px-5 py-4 bg-gray-50 hover:bg-gray-100/80 transition-colors border-b border-gray-200"
          >
            <div className="flex items-center gap-3">
              <Icon name={expandedCategories.includes('Servicios') ? 'chevron-down' : 'chevron-right'} className="h-4 w-4 text-gray-500" />
              <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">Servicios</h3>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md uppercase">
                {Object.keys(gruposServicios || {}).length} Grupos
              </span>
            </div>

            {Object.keys(gruposServicios || {}).length > 0 && (
              <div className="flex items-center gap-2">
                {/* BOTÓN DE REPORTE (SERVICIOS) */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setReporteServiciosOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-black rounded-lg uppercase shadow-sm hover:bg-teal-100 hover:text-teal-900 transition-all cursor-pointer"
                >
                  <Icon name="bar-chart-3" className="h-3 w-3" />
                  <span>Reporte</span>
                </span>
              </div>
            )}
          </button>

          <AnimatePresence>
            {expandedCategories.includes('Servicios') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-6">
                  {/* EL "ESPEJO" INLINE PARA AGREGAR NUEVOS GRUPOS DE SERVICIOS */}
                  {!isReadOnly && (
                    <EditableGroupRow
                      tipo="SERVICIOS"
                      onSave={(data) => handleConfirmGrupoServicio(data)}
                    />
                  )}

                  <div className="space-y-6">
                    {sortedGruposServicios.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                        <Icon name="package-2" className="h-5 w-5 text-gray-300 mx-auto mb-2" />
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                          No hay grupos de servicios registrados. Crea uno nuevo arriba.
                        </p>
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensorsServicios}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEndServicios}
                      >
                        <SortableContext
                          items={sortedGruposServicios.map(g => `grupo-${g.id_servicio}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-6">
                            {sortedGruposServicios.map((grupo, gIdx) => (
                              <SortableWrapper
                                key={`grupo-srv-wrapper-${grupo.id_servicio}`}
                                id={`grupo-${grupo.id_servicio}`}
                                data={{ type: 'grupo', id_servicio: grupo.id_servicio }}
                                className="relative"
                              >
                                {({ listeners, attributes, isDragging }) => (
                                  <div style={{ opacity: isDragging ? 0.6 : 1 }}>
                                    {renderGrupoServicio(grupo, gIdx, listeners, attributes)}
                                  </div>
                                )}
                              </SortableWrapper>
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CONDICIONES GENERALES */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleCategory('Condiciones')}
            className="flex items-center justify-between w-full px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200 rounded-t-xl"
          >
            <div className="flex items-center">
              <Icon
                name={expandedCategories.includes('Condiciones') ? 'chevron-down' : 'chevron-right'}
                className="h-5 w-5 text-gray-500 mr-2"
              />
              <h3 className="text-lg font-bold text-gray-900 uppercase">Términos y Condiciones</h3>
            </div>
          </button>

          {expandedCategories.includes('Condiciones') && (
            <div className="flex flex-col md:flex-row animate-in fade-in duration-300 border-t border-gray-100 items-stretch relative min-h-[500px]">

              {/* PANEL IZQUIERDO: SELECCIÓN DE NOTAS - SE ADAPTA AL ALTO DEL EDITOR */}
              <div className="w-full md:w-80 border-r border-gray-100 bg-gray-50/50 flex flex-col shrink-0 relative">
                <div className="absolute inset-0 flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-gray-200/60 bg-white/60 backdrop-blur-md flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 rounded-lg">
                        <Icon name="bookmark" className="h-3.5 w-3.5 text-indigo-600" />
                      </div>
                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Catálogo</span>
                    </div>
                    {loadingNotas && <div className="animate-spin h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full" />}
                  </div>

                  {/* Área de scroll de Notas */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-gray-50/30">
                    {notasComunes.map((nota) => (
                      <div
                        key={nota.id_nota || nota.codigo}
                        onClick={() => {
                          if (isReadOnly) return;
                          const quill = quillRef.current.getEditor();
                          const range = quill.getSelection() || { index: quill.getLength() };
                          const textoInsertar = nota.descripcion || '';
                          quill.insertText(range.index, `${textoInsertar}\n`, { bold: false });
                          quill.formatLine(range.index, textoInsertar.length, 'list', 'bullet');
                          quill.setSelection(range.index + textoInsertar.length + 1);
                        }}
                        className={cn(
                          "flex items-start p-3 bg-white border border-gray-200 rounded-xl transition-all group",
                          isReadOnly
                            ? "cursor-not-allowed opacity-70"
                            : "cursor-pointer hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5"
                        )}
                      >
                        {!isReadOnly && (
                          <div className="mt-0.5 h-4 w-4 rounded-lg border border-gray-200 flex items-center justify-center group-hover:border-indigo-500 group-hover:bg-indigo-600 transition-all">
                            <Icon name="plus" className="h-2.5 w-2.5 text-gray-400 group-hover:text-white transition-colors" />
                          </div>
                        )}
                        <span className="ml-3 text-[11px] font-semibold text-slate-600 group-hover:text-slate-900 leading-tight">
                          {nota.descripcion}
                        </span>
                      </div>
                    ))}
                    {notasComunes.length === 0 && !loadingNotas && (
                      <div className="flex flex-col items-center justify-center py-10 opacity-30">
                        <Icon name="inbox" className="h-8 w-8 mb-2" />
                        <span className="text-[10px] font-bold uppercase">Sin notas</span>
                      </div>
                    )}
                  </div>

                  {/* Footer del Panel Izquierdo */}
                  <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder={isReadOnly ? "Lectura protegida..." : "Escribir y guardar nota..."}
                        className="w-full text-[11px] pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            handleAddNuevaNota(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        disabled={isReadOnly}
                      />
                      {!isReadOnly && <Icon name="plus-circle" className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 group-focus-within:text-indigo-500" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* PANEL DERECHO: EDITOR (EXPANDIBLE) */}
              <div className="flex-1 flex flex-col bg-white min-h-full">
                <div className="px-6 py-4 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Documento Final</span>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="h-4 w-[1px] bg-gray-200" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Acuerdos Comerciales</span>
                  </div>
                  {!isReadOnly && (
                    <button
                      onClick={() => setGeneralConditions('')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black text-rose-500 hover:bg-rose-50 transition-all uppercase tracking-tighter"
                    >
                      <Icon name="trash-2" className="h-3 w-3" />
                      Borrar Todo
                    </button>
                  )}
                </div>

                <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
                  <style>{`
                    .editor-container {
                      display: flex;
                      flex-direction: column;
                      height: 100%;
                    }
                    .editor-container .quill {
                      display: flex;
                      flex-direction: column;
                      height: 100%;
                    }
                    .editor-container .ql-toolbar.ql-snow {
                      border: none !important;
                      border-bottom: 1px solid #f1f5f9 !important;
                      background: #f8fafc !important;
                      padding: 10px 20px !important;
                    }
                    .editor-container .ql-container.ql-snow {
                      border: none !important;
                    }
                    .editor-container .ql-editor {
                      padding: 40px;
                      font-size: 14px;
                      line-height: 1.8;
                      color: #1e293b;
                      background: white;
                      height: auto !important;
                      min-height: 500px;
                    }
                    /* Custom Scrollbar para el editor */
                    .editor-container .ql-editor::-webkit-scrollbar { width: 5px; }
                    .editor-container .ql-editor::-webkit-scrollbar-track { background: transparent; }
                    .editor-container .ql-editor::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                    
                    .editor-container .ql-editor ul li { list-style-type: disc !important; }
                    .editor-container .ql-editor ul li.ql-indent-1 { list-style-type: circle !important; }
                  `}</style>

                  <div className="editor-container">
                    <ReactQuill
                      ref={quillRef} // <--- IMPORTANTE: Referencia asignada
                      theme="snow"
                      value={generalConditions}
                      onChange={setGeneralConditions}
                      readOnly={isReadOnly}
                      placeholder="Las notas aparecerán aquí. Puedes editarlas libremente..."
                      modules={{
                        toolbar: isReadOnly ? false : [
                          ['bold', 'italic', 'underline'],
                          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                          [{ 'indent': '-1' }, { 'indent': '+1' }],
                          ['clean']
                        ],
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RESUMEN FINANCIERO STICKY CARD COMPACTO */}
        <div className="bg-indigo-900 rounded-2xl shadow-2xl overflow-hidden text-white border border-white/10 sticky top-6 max-w-sm">
          <div className="px-5 py-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-800/50 rounded-lg">
                  <Icon name="bar-chart-3" className="h-4 w-4 text-indigo-300" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-200">Resumen Ejecutivo</span>
              </div>
              <div className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[8px] font-black rounded-full border border-green-500/20 uppercase tracking-tighter">
                Rentable
              </div>
            </div>

            {/* Financial Data Core */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase">Costo Total</span>
                <span className="text-lg font-bold font-mono tracking-tight text-indigo-100">{formatMoney(data.cos_tot)}</span>
              </div>

              <div className="flex justify-between items-baseline border-b border-white/5 pb-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">Venta Neta</span>
                <span className="text-2xl font-black text-white font-mono tracking-tighter">{formatMoney(data.tot_c)}</span>
              </div>

              {/* Margen Destacado pero Integrado */}
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 mt-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.1em]">Margen Bruto</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-black text-green-400 tracking-tighter">{data.mar_g || 0}%</span>
                    <Icon name="trending-up" className="h-4 w-4 text-green-400" />
                  </div>
                </div>
                {/* Gráfico visual pequeño opcional */}
                <div className="h-10 w-10 flex items-center justify-center bg-green-400/10 rounded-full">
                  <Icon name="activity" className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </div>

            {/* Acciones Compactas */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button className="flex items-center justify-center space-x-2 py-2.5 bg-indigo-800/40 hover:bg-indigo-800/60 rounded-xl border border-white/5 transition-all group">
                <Icon name="printer" className="h-3.5 w-3.5 text-indigo-300 group-hover:text-white" />
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-100 group-hover:text-white">PDF</span>
              </button>
              <button className="flex items-center justify-center space-x-2 py-2.5 bg-indigo-800/40 hover:bg-indigo-800/60 rounded-xl border border-white/5 transition-all group">
                <Icon name="file-spreadsheet" className="h-3.5 w-3.5 text-indigo-300 group-hover:text-white" />
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-100 group-hover:text-white">Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 30% LATERAL PANEL - Sticky Dashboard */}
      <div className="lg:w-4/12 space-y-6">

        {/* BOTONES*/}
        <div className="flex justify-end items-center gap-2">
          {/* NUEVA VERSIÓN */}
          <button
            onClick={() => {
              toast.info(({ closeToast }) => (
                <div className="flex flex-col min-w-[340px] overflow-hidden rounded-lg">
                  <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50/50 border-b border-indigo-100">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white shadow-sm border border-indigo-100">
                      <Icon name="layers" className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight">
                      Nueva Versión de Registro
                    </span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-[11px] text-gray-600 leading-tight">
                      ¿Confirmar la generación de una <span className="font-bold text-gray-900 underline decoration-indigo-200 underline-offset-2">nueva versión</span>?
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-3 px-4 pb-3">
                    <button onClick={closeToast} className="whitespace-nowrap text-[9px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">Cancelar</button>
                    <button
                      onClick={() => { crearNuevaVersion.mutate(); closeToast(); }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-[9px] font-black rounded-xl uppercase shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap"
                    >
                      <span>Confirmar Nueva Versión</span>
                      <Icon name="arrow-right" className="h-3 w-3 opacity-70" />
                    </button>
                  </div>
                </div>
              ), { position: "top-right", autoClose: false, closeOnClick: false, draggable: false, icon: false, className: "p-0 rounded-2xl border border-gray-100 shadow-2xl overflow-hidden !w-max !max-w-[400px]" });
            }}
            disabled={isPending}
            className={cn(
              "flex items-center px-4 py-2 bg-indigo-50/50 border border-indigo-200 rounded-xl text-[10px] font-black text-indigo-700 transition-all shadow-sm h-[42px] uppercase group",
              isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-100/50 hover:border-indigo-300 hover:shadow-md"
            )}
          >
            {crearNuevaVersion.isPending ? (
              <div className="h-3.5 w-3.5 mr-2 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="layers" className="h-3.5 w-3.5 mr-2 text-indigo-600 group-hover:scale-110 transition-transform" />
            )}
            {crearNuevaVersion.isPending ? "Procesando..." : "Nueva Versión"}
          </button>

          {/* DUPLICAR */}
          <button
            onClick={() => {
              toast.info(({ closeToast }) => (
                <div className="flex flex-col min-w-[340px] overflow-hidden rounded-lg">
                  <div className="flex items-center gap-3 px-4 py-2 bg-amber-50/50 border-b border-amber-100">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white shadow-sm border border-amber-100">
                      <Icon name="copy" className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight">Generar Copia</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Referencia */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Referencia *</label>
                      <input
                        type="text"
                        placeholder="Ej: Suministro de materiales para mina"
                        className="w-full border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 bg-gray-50"
                        id="copy_referencia"
                        defaultValue={`${data?.referencia || ''} - COPIA`}
                      />
                    </div>
                    {/* Área */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Área *</label>
                      <select
                        className="w-full border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 bg-gray-50"
                        id="copy_id_area"
                        defaultValue={data?.id_area || ''}
                      >
                        <option value="">Seleccione Área</option>
                        <option value="1">PROYECTOS</option>
                        <option value="2">INGENIERÍA</option>
                        <option value="3">VENTAS</option>
                      </select>
                    </div>
                    {/* Cliente */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Cliente *</label>
                      <input
                        type="text"
                        placeholder="Nombre del cliente"
                        className="w-full border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 bg-gray-50"
                        id="copy_cliente"
                        defaultValue={data?.cliente_nombre || ''}
                      />
                    </div>
                    {/* Representante */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Representante *</label>
                      <input
                        type="text"
                        placeholder="Nombre del representante"
                        className="w-full border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 bg-gray-50"
                        id="copy_representante"
                        defaultValue={data?.representante_nombre || ''}
                      />
                    </div>
                    {/* Tipo */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Tipo *</label>
                      <select
                        className="w-full border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 bg-gray-50"
                        id="copy_id_tipo"
                        defaultValue={data?.id_tipo || ''}
                      >
                        {typeof tipoOptions !== 'undefined' ? tipoOptions.map(o => (
                          <option key={o.id} value={o.id}>{o.nombre.toUpperCase()}</option>
                        )) : (
                          <>
                            <option value="S">SERVICIO</option>
                            <option value="P">PRODUCTO</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 px-4 pb-3 border-t border-gray-100 bg-gray-50">
                    <button onClick={closeToast} className="whitespace-nowrap text-[9px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">Cancelar</button>
                    <button
                      onClick={() => {
                        const payload = {
                          referencia: document.getElementById('copy_referencia').value,
                          id_area: document.getElementById('copy_id_area').value,
                          id_cliente: data?.id_cliente,
                          id_representante: data?.id_representante,
                          id_tipo: document.getElementById('copy_id_tipo').value,
                        };
                        if (!payload.referencia || !payload.id_area || !payload.id_tipo) {
                          toast.warn('Por favor complete los campos obligatorios.');
                          return;
                        }
                        copiarCotizacion.mutate(payload);
                        closeToast();
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-[9px] font-black rounded-xl uppercase shadow-md shadow-amber-200 hover:bg-amber-700 transition-all"
                    >
                      <span>Confirmar Copia</span>
                      <Icon name="arrow-right" className="h-3 w-3 opacity-70" />
                    </button>
                  </div>
                </div>
              ), { position: "top-right", autoClose: false, closeOnClick: false, draggable: false, icon: false, className: "p-0 rounded-2xl border border-gray-100 shadow-2xl overflow-hidden !w-max !max-w-[400px]" });
            }}
            disabled={copiarCotizacion.isPending}
            className={cn(
              "flex items-center px-4 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-[10px] font-black text-amber-700 transition-all shadow-sm h-[42px] uppercase group",
              copiarCotizacion.isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-amber-100/50 hover:border-amber-300 hover:shadow-md"
            )}
          >
            {copiarCotizacion.isPending ? (
              <div className="h-3.5 w-3.5 mr-2 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="copy" className="h-3.5 w-3.5 mr-2 text-amber-600 group-hover:scale-110 transition-transform" />
            )}
            {copiarCotizacion.isPending ? "Procesando..." : "Generar Copia"}
          </button>

          {/* ELIMINAR */}
          {!isReadOnly && (
            <button
              onClick={() => {
                toast.error(({ closeToast }) => (
                  <div className="flex flex-col min-w-[340px] overflow-hidden rounded-lg">
                    <div className="flex items-center gap-3 px-4 py-2 bg-rose-50/50 border-b border-rose-100">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white shadow-sm border border-rose-100">
                        <Icon name="trash" className="h-3.5 w-3.5 text-rose-600" />
                      </div>
                      <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight">Eliminar Registro</span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[11px] text-gray-600 leading-tight">¿Estás seguro de que deseas <span className="font-bold text-red-600 underline decoration-red-200 underline-offset-2">eliminar permanentemente</span> este registro? Esta acción no se puede deshacer.</p>
                    </div>
                    <div className="flex items-center justify-end gap-3 px-4 pb-3">
                      <button onClick={closeToast} className="whitespace-nowrap text-[9px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">Cancelar</button>
                      <button
                        onClick={() => { eliminarCotizacion.mutate(); closeToast(); }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-[9px] font-black rounded-xl uppercase shadow-md shadow-red-200 hover:bg-red-700 transition-all active:scale-95 whitespace-nowrap"
                      >
                        <span>Confirmar Eliminación</span>
                        <Icon name="trash" className="h-3 w-3 opacity-70" />
                      </button>
                    </div>
                  </div>
                ), { position: "top-right", autoClose: false, closeOnClick: false, draggable: false, icon: false, className: "p-0 rounded-2xl border border-gray-100 shadow-2xl overflow-hidden !w-max !max-w-[400px]" });
              }}
              disabled={eliminarCotizacion.isPending}
              className={cn(
                "flex items-center px-4 py-2 bg-red-50/50 border border-red-200 rounded-xl text-[10px] font-black text-red-700 transition-all shadow-sm h-[42px] uppercase group",
                eliminarCotizacion.isPending ? "opacity-50 cursor-not-allowed" : "hover:bg-red-100/50 hover:border-red-300 hover:shadow-md"
              )}
            >
              {eliminarCotizacion.isPending ? (
                <div className="h-3.5 w-3.5 mr-2 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="trash" className="h-3.5 w-3.5 mr-2 text-red-600 group-hover:scale-110 transition-transform" />
              )}
              {eliminarCotizacion.isPending ? "Eliminando..." : "Eliminar"}
            </button>
          )}
        </div>

        {/* DATOS COTIZACION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden font-sans">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-black text-gray-900 flex items-center text-[11px] uppercase tracking-wider">
              <Icon name="clipboard-list" className="h-3.5 w-3.5 mr-2 text-indigo-500" /> Datos Cotización
            </h3>
          </div>

          <div className="p-4 space-y-4">
            {/* Referencia */}
            <div className="group relative bg-gray-50/80 p-3 rounded-xl border border-gray-100 transition-all">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-tighter">
                  Referencia del Proyecto
                </label>
                {!isReadOnly && (
                  <Icon name="pencil" className="h-2.5 w-2.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              <div className="relative min-h-[1.5rem] flex items-center">
                {/* Texto Visual */}
                <p className="text-[10.5px] font-black uppercase leading-snug text-gray-900 break-words w-full">
                  {data.referencia || 'SIN REFERENCIA ASIGNADA'}
                </p>

                {/* Input Real (Oculto hasta el focus) */}
                {!isReadOnly && (
                  <textarea
                    rows="2"
                    className="absolute inset-0 w-full h-full opacity-0 focus:opacity-100 bg-white border border-indigo-300 rounded-lg px-2 py-1 text-[10px] font-black text-gray-900 uppercase outline-none resize-none shadow-sm"
                    defaultValue={data.referencia}
                    onBlur={(e) => handleFieldChange("referencia", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.target.blur();
                      }
                    }}
                    disabled={isReadOnly}
                  />
                )}
              </div>
            </div>

            {/* Cards de Datos */}
            <div className="grid grid-cols-3 gap-3">
              {/* Probabilidad */}
              <CompactField label="Probabilidad" className="group relative">
                <div className="relative">
                  <SelectField
                    id="probabilidad"
                    inline
                    value={data.probabilidad || ""}
                    onChange={(e) => handleFieldChange("probabilidad", e.target.value)}
                    options={probOptions}
                    disabled={isReadOnly}
                    // Quitamos colores llamativos para que se vea "limpio"
                    className="bg-transparent border-none p-0 h-auto font-black text-[10px] text-gray-900 focus:ring-0 cursor-pointer"
                  />

                  {/* Flecha sutil que aparece al hacer hover si no es lectura */}
                  {!isReadOnly && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Icon name="chevron-down" className="h-2 w-2 text-gray-400" />
                    </div>
                  )}
                </div>
              </CompactField>

              {/* Forma Pago */}
              <CompactField label="Forma Pago" className="group relative">
                <div className="relative cursor-pointer min-h-[15px] flex items-center">
                  {/* Texto Visual */}
                  <span className="text-[10px] font-black text-gray-900 truncate group-hover:text-gray-900 transition-colors">
                    {data.forma_pago || '---'}
                  </span>

                  {!isReadOnly && (
                    <>
                      <Icon name="pencil" className="h-2 w-2 ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {/* Input Real */}
                      <input
                        type="text"
                        className="absolute inset-0 w-full h-full opacity-0 focus:opacity-100 bg-white border border-indigo-300 rounded px-1 text-[10px] font-black text-gray-900 uppercase outline-none"
                        defaultValue={data.forma_pago}
                        onBlur={(e) => handleFieldChange("forma_pago", e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                        disabled={isReadOnly}
                      />
                    </>
                  )}
                </div>
              </CompactField>

              {/* Lugar Entrega */}
              <CompactField label="Lugar Entrega" className="group relative">
                <div className="relative cursor-pointer min-h-[15px] flex items-center">
                  {/* Texto Visual */}
                  <span className="text-[10px] font-black text-gray-900 truncate group-hover:text-gray-900 transition-colors">
                    {data.lugar || '---'}
                  </span>

                  {!isReadOnly && (
                    <>
                      <Icon name="pencil" className="h-2 w-2 ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {/* Input Real */}
                      <input
                        type="text"
                        className="absolute inset-0 w-full h-full opacity-0 focus:opacity-100 bg-white border border-indigo-300 rounded px-1 text-[10px] font-black text-gray-900 uppercase outline-none"
                        defaultValue={data.lugar}
                        onBlur={(e) => handleFieldChange("lugar", e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                        disabled={isReadOnly}
                      />
                    </>
                  )}
                </div>
              </CompactField>

              {/* Moneda */}
              <CompactField label="Moneda" className="group relative">
                <div className="relative">
                  <SelectField
                    id="tipo_moneda"
                    inline
                    value={data.tipo_moneda || ""}
                    onChange={(e) => handleFieldChange("tipo_moneda", e.target.value)}
                    options={monedasOptions}
                    disabled={isReadOnly}
                    className="bg-transparent border-none p-0 h-auto font-black text-[10px] text-gray-900 focus:ring-0 cursor-pointer"
                  />

                  {!isReadOnly && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <Icon name="chevron-down" className="h-2 w-2 text-gray-400" />
                    </div>
                  )}
                </div>
              </CompactField>

              {/* Tipo Cambio */}
              <CompactField label="T. Cambio" className="group relative">
                <div className="relative cursor-pointer min-h-[15px] flex items-center">
                  {/* Texto Visual */}
                  <span className="text-[10px] font-black text-gray-900 truncate group-hover:text-gray-900 transition-colors">
                    {data.tipo_cambio || '0.00'}
                  </span>

                  {!isReadOnly && (
                    <>
                      <Icon name="pencil" className="h-2 w-2 ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {/* Input Real (Oculto hasta el focus) */}
                      <input
                        type="number"
                        step="0.001"
                        className="absolute inset-0 w-full h-full opacity-0 focus:opacity-100 bg-white border border-indigo-300 rounded px-1 text-[10px] font-black text-gray-900 outline-none"
                        defaultValue={data.tipo_cambio}
                        onBlur={(e) => handleFieldChange("tipo_cambio", e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                        disabled={isReadOnly}
                      />
                    </>
                  )}
                </div>
              </CompactField>

              {/* IGV */}
              <CompactField label="IGV">
                <SelectField
                  id="igv"
                  inline
                  value={data.igv || "N"}
                  onChange={(e) => handleFieldChange("igv", e.target.value)}
                  options={igvOptions}
                  disabled={isReadOnly}
                  className="bg-transparent border-none p-0 h-auto font-black text-[10px] text-gray-900 focus:ring-0 cursor-pointer"
                />
              </CompactField>

              {/* Entrega Suministros */}
              <CompactTiempoUnidad
                label="Entrega Suministros"
                value={data.entrega_suministros}
                onValueChange={(e) => handleFieldChange("entrega_suministros", e.target.value)}
                unitValue={data.id_unidad_tiempo_entrega_suministros || ""}
                onUnitChange={(e) => handleFieldChange("id_unidad_tiempo_entrega_suministros", e.target.value)}
                options={unidadOptions}
                isReadOnly={isReadOnly}
              />

              {/* Entrega Servicios */}
              <CompactTiempoUnidad
                label="Entrega Servicios"
                value={data.entrega_servicios}
                onValueChange={(e) => handleFieldChange("entrega_servicios", e.target.value)}
                unitValue={data.id_unidad_tiempo_entrega_servicios || ""}
                onUnitChange={(e) => handleFieldChange("id_unidad_tiempo_entrega_servicios", e.target.value)}
                options={unidadOptions}
                isReadOnly={isReadOnly}
              />

              {/* Validez de Oferta */}
              <CompactTiempoUnidad
                label="Validez Oferta"
                value={data.validez_oferta}
                onValueChange={(e) => handleFieldChange("validez_oferta", e.target.value)}
                unitValue={data.id_unidad_tiempo_validez || ""} // Generalmente se guarda por separado la unidad de validez
                onUnitChange={(e) => handleFieldChange("id_unidad_tiempo_validez", e.target.value)}
                options={unidadOptions}
                isReadOnly={isReadOnly}
              />
            </div>

            {/* Responsables */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">

              {/* Comercial */}
              <div className={cn(
                "group flex flex-col border rounded-xl p-2.5 shadow-sm transition-all duration-300",
                data.nombc
                  ? "bg-white border-indigo-100 hover:border-indigo-300 hover:shadow-md"
                  : "bg-gray-50/50 border-gray-200 opacity-80"
              )}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      data.nombc ? "bg-indigo-500 animate-pulse" : "bg-gray-400"
                    )}></div>
                    <span className={cn(
                      "text-[9.5px] font-black uppercase tracking-widest",
                      data.nombc ? "text-indigo-500" : "text-gray-500"
                    )}>Comercial</span>
                  </div>
                  <Icon
                    name={data.nombc ? "user-check" : "user-plus"}
                    className={cn("h-3 w-3 transition-colors", data.nombc ? "text-indigo-300 group-hover:text-indigo-500" : "text-gray-400")}
                  />
                </div>

                <div className="flex flex-col space-y-0.5">
                  <span className="text-[10px] font-black text-slate-800 uppercase leading-none truncate">
                    {data.nombc || 'PENDIENTE ASIGNAR'}
                  </span>
                  {data.nombc && (
                    <div className="flex flex-col gap-0.5 mt-1">
                      <div className="flex items-center gap-1.5">
                        <Icon name="phone" className="h-3 w-3 text-slate-400" />
                        <span className="text-[10.5px] font-medium text-slate-500 tracking-tight">{data.telec}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Icon name="mail" className="h-3 w-3 text-slate-400" />
                        <span className="text-[10.5px] font-medium text-slate-500 lowercase truncate tracking-tight">{data.mailc}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Técnico */}
              <div className={cn(
                "group flex flex-col border rounded-xl p-2.5 shadow-sm transition-all duration-300",
                data.nombt
                  ? "bg-white border-emerald-100 hover:border-emerald-300 hover:shadow-md"
                  : "bg-gray-50/50 border-gray-200 opacity-80"
              )}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      data.nombt ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                    )}></div>
                    <span className={cn(
                      "text-[9.5px] font-black uppercase tracking-widest",
                      data.nombt ? "text-emerald-500" : "text-gray-500"
                    )}>Técnico</span>
                  </div>
                  <Icon
                    name={data.nombt ? "settings" : "user-plus"}
                    className={cn("h-3 w-3 transition-colors", data.nombt ? "text-emerald-300 group-hover:text-emerald-500" : "text-gray-400")}
                  />
                </div>

                <div className="flex flex-col space-y-0.5">
                  <span className="text-[11px] font-black text-slate-800 uppercase leading-none truncate">
                    {data.nombt || 'PENDIENTE ASIGNAR'}
                  </span>
                  {data.nombt && (
                    <div className="flex flex-col gap-0.5 mt-1">
                      <div className="flex items-center gap-1.5">
                        <Icon name="phone" className="h-3 w-3 text-slate-400" />
                        <span className="text-[10.5px] font-medium text-slate-500 tracking-tight">{data.telet}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Icon name="mail" className="h-3 w-3 text-slate-400" />
                        <span className="text-[10.5px] font-medium text-slate-500 lowercase truncate tracking-tight">{data.mailt}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* DOCUMENTOS ADJUNTOS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 flex items-center text-sm uppercase">
              <Icon name="paperclip" className="h-4 w-4 mr-2 text-indigo-500" /> Documentos Adjuntos
            </h3>
          </div>

          <div className="p-5 space-y-4">
            {documents.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 italic">Sin documentos adjuntos.</p>
            ) : (
              <ul className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gray-100 ml-1">
                {documents.map((doc, idx) => (
                  <li key={doc.id && doc.id !== 'None' ? doc.id : `doc-${idx}`} className="relative pl-7 group">
                    <div className="absolute left-0 top-1 w-5 h-5 bg-white border-2 border-indigo-400 rounded-full flex items-center justify-center shadow-sm">
                      <Icon name="file-text" className="h-3 w-3 text-indigo-600" />
                    </div>

                    <div className="flex flex-col">
                      <div className="flex justify-between items-start">
                        {/* 1. NOMBRE DEL ARCHIVO (PRUEBA.pdf) */}
                        <a
                          href={`http://localhost:8001${doc.file_path}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 font-black text-[11px] truncate uppercase tracking-tight"
                        >
                          {doc.name}
                        </a>
                        {/* Acciones de Documento */}
                        <div className="flex items-center gap-1">
                          {deletingDocId === doc.id ? (
                            <div className="flex items-center gap-1 bg-red-50 rounded-lg px-1 py-0.5 border border-red-100 animate-in fade-in zoom-in duration-200">
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="text-[9px] font-black text-red-600 hover:text-red-700 px-1.5 py-0.5 uppercase tracking-tighter"
                              >
                                Confirmar
                              </button>
                              <span className="h-2 w-px bg-red-200"></span>
                              <button
                                onClick={() => setDeletingDocId(null)}
                                className="text-[9px] font-black text-slate-400 hover:text-slate-600 px-1.5 py-0.5 uppercase tracking-tighter"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingDocId(doc.id)}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2"
                              title="Eliminar documento"
                            >
                              <Icon name="trash-2" className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 2. DESCRIPCIÓN - Solo se muestra si existe contenido */}
                      {doc.description && (
                        <p className="text-[11px] text-gray-600 font-black leading-tight mt-0.5">
                          {doc.description}
                        </p>
                      )}
                      {/* 3. FECHA Y USUARIO */}
                      <div className="flex items-center space-x-2 mt-1 opacity-70">
                        <span className="text-[11px] font-semibold text-slate-900 uppercase">{doc.upload_date}</span>
                        <span className="h-1 w-1 bg-gray-300 rounded-full"></span>
                        <span className="text-[11px] font-semibold text-slate-900">{doc.uploaded_by}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Nombre o descripción del documento..."
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={docDescription}
                onChange={(e) => setDocDescription(e.target.value)}
              />

              <label className={`w-full flex justify-center items-center px-4 py-2.5 border-2 border-dashed rounded-xl text-xs font-bold transition-all shadow-sm ${isUploading ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer'}`}>
                {isUploading ? (
                  <><Icon name="refresh-cw" className="h-4 w-4 mr-2 animate-spin" /> SUBIENDO...</>
                ) : (
                  <><Icon name="upload-cloud" className="h-4 w-4 mr-2" /> SELECCIONAR Y VINCULAR</>
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileAndUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* MENSAJES */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden max-h-[600px] transition-all">

          {/* Header Estandarizado */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 flex items-center text-sm uppercase">
              <Icon name="message-square" className="h-4 w-4 mr-2 text-indigo-500" /> Seguimiento Comercial
            </h3>
            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-100 uppercase">
              {notes.length} {notes.length === 1 ? 'REGISTRO' : 'REGISTROS'}
            </span>
          </div>

          {/* Cuerpo del Log Compacto */}
          <div className="flex-1 p-5 bg-white overflow-y-auto custom-scrollbar">
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-20">
                <Icon name="message-square" className="h-8 w-8 mb-2" />
                <p className="text-[9px] uppercase font-black tracking-widest text-center">Inicia la conversación</p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gray-100">
                {notes.map((note, index) => {
                  const safeKey = (note.id && note.id !== 'None') ? note.id : `note-${index}`;
                  const isAlert = note.is_alert;
                  const isDone = note.is_resolved;
                  const urgency = getAlertUrgency(note.alert_date, isDone);

                  return (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={safeKey}
                      className="relative pl-7 group"
                    >
                      {/* Icono de Timeline Estilo Adjuntos */}
                      <div className={cn(
                        "absolute left-0 top-0.5 w-5 h-5 bg-white border-2 rounded-full flex items-center justify-center shadow-sm z-10 transition-colors",
                        (isAlert && isDone) ? "border-emerald-400" :
                          (isAlert && urgency === 'expired') ? "border-red-400" :
                            (isAlert && urgency === 'urgent') ? "border-orange-400" : "border-indigo-400"
                      )}>
                        <Icon
                          name={(isAlert && isDone) ? "check" : isAlert ? "bell" : "message-square"}
                          className={cn(
                            "h-3 w-3",
                            (isAlert && isDone) ? "text-emerald-600" :
                              (isAlert && urgency === 'expired') ? "text-red-600" :
                                (isAlert && urgency === 'urgent') ? "text-orange-600" : "text-indigo-600"
                          )}
                        />
                      </div>

                      <div className="flex flex-col">
                        {/* Meta e Info de Usuario */}
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tight">
                              {note.user_role === 'SISTEMA' ? '🤖 SISTEMA' : `@${note.user_role}`}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 tabular-nums uppercase">
                              {note.timestamp}
                            </span>
                          </div>

                          {/* Badges y Acciones Compactas */}
                          <div className="flex items-center gap-2">
                            {isAlert && !isDone && (
                              <div className="flex gap-1.5 items-center">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${urgency === 'expired' ? 'bg-red-50 text-red-600 border-red-100' :
                                  urgency === 'urgent' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                    'bg-slate-50 text-slate-400 border-slate-100'
                                  }`}>
                                  {urgency === 'expired' ? 'Vencido' : urgency === 'urgent' ? 'Pronto' : 'Alerta'}
                                </span>

                                <div className="flex items-center gap-1">
                                  {urgency === 'expired' ? (
                                    <ReprogramMenu note={note} onReprogram={handleManageAlert} />
                                  ) : null}

                                  <button
                                    onClick={() => handleManageAlert(note, 'complete')}
                                    className="p-1 rounded hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 transition-all"
                                    title="Marcar como completado"
                                  >
                                    <Icon name="check" className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Botones de Acción */}
                            <div className="flex items-center gap-1">
                              {deletingId === note.id ? (
                                <div className="flex items-center gap-1 bg-red-50 rounded-lg px-1 py-0.5 border border-red-100 animate-in fade-in zoom-in duration-200">
                                  <button
                                    onClick={() => handleDeleteMensaje(note.id)}
                                    className="text-[9px] font-black text-red-600 hover:text-red-700 px-1.5 py-0.5 uppercase tracking-tighter"
                                  >
                                    Confirmar
                                  </button>
                                  <span className="h-2 w-px bg-red-200"></span>
                                  <button
                                    onClick={() => setDeletingId(null)}
                                    className="text-[9px] font-black text-slate-400 hover:text-slate-600 px-1.5 py-0.5 uppercase tracking-tighter"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeletingId(note.id)}
                                  className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                  title="Eliminar mensaje"
                                >
                                  <Icon name="trash-2" className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Contenido del Mensaje (Estilo Adjuntos) */}
                        <div className="text-[11px] font-black leading-tight text-slate-700">
                          {note.content}
                        </div>

                        {/* Fecha de Alerta Minimalista */}
                        {isAlert && !isDone && note.alert_date && (
                          <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight ${urgency === 'expired' ? 'text-red-500' :
                            urgency === 'urgent' ? 'text-orange-500' : 'text-indigo-400'
                            }`}>
                            <Icon name="calendar" className="h-3 w-3" />
                            {note.alert_date.toLocaleString('es-PE', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat Input Compacto */}
          <div className="bg-white border-t border-slate-100">
            <TrackingInput
              value={newNote}
              onChange={setNewNote}
              onAddNote={handleAddNote}
              isAlert={isAlert}
              onAlertChange={setIsAlert}
            />
          </div>
        </div>

        {/* SECCIÓN DE TRAZABILIDAD MULTI-TIPO */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden max-h-[600px] transition-all hover:shadow-md">

          {/* Header Estandarizado */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 flex items-center text-sm uppercase">
              <Icon name="history" className="h-4 w-4 mr-2.5 text-indigo-500" /> Trazabilidad del Registro
            </h3>
            <span className="bg-slate-50 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-200 uppercase">
              {history.length} Hitos Totales
            </span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto bg-white custom-scrollbar">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-20">
                <Icon name="history" className="h-8 w-8 mb-2" />
                <p className="text-[9px] uppercase font-black tracking-widest text-center">Sin historial aún</p>
              </div>
            ) : (
              <div className="relative space-y-0 pb-2">
                {/* Línea conectora */}
                <div className="absolute left-[5px] top-2 bottom-0 w-[2px] bg-gradient-to-b from-indigo-200 via-slate-100 to-transparent"></div>

                {/* Mapeo de Hitos */}
                {history.map((n, idx) => {
                  const type = getHistoryType(n.detalle);
                  const typeConfig = {
                    CREACION: { color: 'indigo', icon: 'star', label: 'Apertura de Registro' },
                    SEGUIMIENTO: { color: 'amber', icon: 'message-square', label: 'Seguimiento Comercial' },
                    ADJUNTOS: { color: 'emerald', icon: 'paperclip', label: 'Gestión de Archivos' },
                    SISTEMA: { color: 'slate', icon: 'settings', label: 'Actividad del Sistema' },
                    ESTADO: { color: 'rose', icon: 'refresh-cw', label: 'Cambio de Estado' }
                  };

                  const config = typeConfig[type] || typeConfig.SISTEMA;
                  const colorClass = config.color;

                  return (
                    <div key={n.id_seguimiento || idx} className="relative pl-8 pb-6 group">
                      {/* Punto conector dinámico según color */}
                      <div className={`absolute left-0 top-1.5 w-3 h-3 bg-white border-2 border-${colorClass}-500 rounded-full z-10 transition-all group-hover:scale-110`}></div>

                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-2">
                            <span className={`text-[10px] font-black text-${colorClass}-700 uppercase tracking-tight`}>
                              {config.label}
                            </span>
                            <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                            <span className="text-[10px] font-bold text-slate-400">@{n.usuario_nombre || 'sistema'}</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 tabular-nums">{n.fecha_formateada}</span>
                        </div>

                        {/* Contenedor de contenido según tipo */}
                        <div className={`rounded-xl p-2.5 transition-all ${type === 'CREACION' ? 'bg-indigo-50/30 border border-indigo-100/50' :
                          'bg-transparent group-hover:bg-gray-50/50'
                          }`}>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                            {type === 'ADJUNTOS' && <Icon name="file-text" className="inline h-3 w-3 mr-1 text-emerald-500" />}
                            {type === 'ESTADO' && <Icon name="arrow-right" className="inline h-3 w-3 mr-1 text-rose-500" />}
                            {n.detalle}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NOTAS (TRAZABILIDAD) */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-sm font-bold text-gray-900 uppercase">Nueva Nota de Seguimiento</h4>
              <button onClick={() => setShowNoteModal(false)} className="text-gray-400 hover:text-gray-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Registrar actualización comercial, acuerdos de reunión, etc..."
                className="w-full border-gray-300 rounded-xl p-3 text-sm focus:ring-indigo-500 min-h-[120px] bg-gray-50 shadow-inner"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex space-x-3">
              <button onClick={() => {
                if (newNote.trim()) {
                  setNotes([...notes, { content: newNote, date: new Date().toLocaleDateString() }]);
                  setNewNote('');
                  setShowNoteModal(false);
                }
              }} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-indigo-700 transition-all shadow-md">
                Guardar
              </button>
              <button onClick={() => setShowNoteModal(false)} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-bold uppercase hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GENERAR COPIA */}
      {showCopyModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white rounded-lg border border-amber-200 text-amber-600">
                  <Icon name="copy" className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 uppercase">Generar Copia de Cotización</h4>
              </div>
              <button onClick={() => setShowCopyModal(false)} className="text-gray-400 hover:text-gray-600"><Icon name="x" className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-500">Complete los siguientes campos para generar la copia. Estos datos se usarán para el nuevo código comercial.</p>

              {/* Referencia */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Referencia *</label>
                <input
                  type="text"
                  placeholder="Ej: Suministro de materiales para mina"
                  className="w-full border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 bg-gray-50"
                  id="copy_referencia"
                  defaultValue={`${data?.referencia || ''} - COPIA`}
                />
              </div>

              {/* Área */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Área *</label>
                <select
                  className="w-full border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 bg-gray-50"
                  id="copy_id_area"
                  defaultValue={data?.id_area || ''}
                >
                  <option value="">Seleccione Área</option>
                  <option value="1">PROYECTOS</option>
                  <option value="2">INGENIERÍA</option>
                  <option value="3">VENTAS</option>
                </select>
              </div>

              {/* Cliente */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Cliente *</label>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  className="w-full border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 bg-gray-50"
                  id="copy_cliente"
                  defaultValue={data?.cliente_nombre || ''}
                />
              </div>

              {/* Representante */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Representante *</label>
                <input
                  type="text"
                  placeholder="Nombre del representante"
                  className="w-full border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 bg-gray-50"
                  id="copy_representante"
                  defaultValue={data?.representante_nombre || ''}
                />
              </div>

              {/* Tipo */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Tipo *</label>
                <select
                  className="w-full border-gray-200 rounded-xl p-2.5 text-sm focus:ring-indigo-500 bg-gray-50"
                  id="copy_id_tipo"
                  defaultValue={data?.id_tipo || ''}
                >
                  {typeof tipoOptions !== 'undefined' ? tipoOptions.map(o => (
                    <option key={o.id} value={o.id}>{o.nombre.toUpperCase()}</option>
                  )) : (
                    <>
                      <option value="S">SERVICIO</option>
                      <option value="P">PRODUCTO</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex space-x-3">
              <button
                onClick={() => {
                  const payload = {
                    referencia: document.getElementById('copy_referencia').value,
                    id_area: document.getElementById('copy_id_area').value,
                    id_cliente: data?.id_cliente, // Mantenemos el ID original si no se puede buscar por nombre
                    id_representante: data?.id_representante, // Mantenemos el ID original
                    id_tipo: document.getElementById('copy_id_tipo').value,
                  };

                  // Validaciones básicas
                  if (!payload.referencia || !payload.id_area || !payload.id_tipo) {
                    toast.warn("Por favor complete todos los campos requeridos.");
                    return;
                  }

                  copiarCotizacion.mutate(payload);
                  setShowCopyModal(false);
                }}
                className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-amber-700 transition-all shadow-md flex items-center justify-center gap-2"
                disabled={copiarCotizacion.isPending}
              >
                {copiarCotizacion.isPending ? (
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirmar Copia</span>
                    <Icon name="arrow-right" className="h-3 w-3" />
                  </>
                )}
              </button>
              <button onClick={() => setShowCopyModal(false)} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl text-xs font-bold uppercase hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INPUT XLS IMPORT */}
      <input
        type="file"
        ref={xlsInputRef}
        style={{ display: 'none' }}
        accept=".xlsx, .xls"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file && xlsImportGrupoActivo) {
            handleImportarDesdeXLS(file, xlsImportGrupoActivo, data?.tipo_cambio || 1);
          }
          e.target.value = '';
        }}
      />

      {/* REPORTE DE SUMINISTROS */}
      {reporteSuministrosOpen && (
        <div className="fixed inset-0 bg-slate-900/20 z-50 flex items-center justify-center p-4 transition-all">
          {reporteLoading ? (
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center border border-slate-200 w-80 h-40 animate-in fade-in zoom-in-95 duration-150">
              <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Preparando reporte...</span>
            </div>
          ) : (
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200"
              style={{
                height: reporteHeight ? `${Math.min(window.innerHeight * 0.9, reporteHeight + 90)}px` : '88vh'
              }}
            >
              {/* Cabecera del Modal */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div>
                  <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">
                    Previsualización del Reporte Oficial
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
                    Módulo Suministros • Cotización N° {numReg}
                  </p>
                </div>
                
                {/* Botón Cerrar */}
                <button 
                  onClick={() => setReporteSuministrosOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-600 bg-slate-100 border border-slate-200/60"
                  title="Cerrar Previsualización"
                >
                  <LucideIcons.X className="h-4 w-4" />
                </button>
              </div>

              {/* Cuerpo del Modal con Iframe */}
              <div className="flex-1 bg-slate-50 p-4 overflow-hidden">
                <iframe 
                  src={`${api.defaults.baseURL}/cotizaciones/reporte-suministros-html/${numReg}/`}
                  className="w-full h-full bg-white rounded-xl border border-slate-200 shadow-sm"
                  title="Reporte de Suministros Oficial"
                />
              </div>

            </div>
          )}
        </div>
      )}

      {/* REPORTE DE SERVICIOS */}
      {reporteServiciosOpen && (
        <div className="fixed inset-0 bg-slate-900/20 z-50 flex items-center justify-center p-4 transition-all">
          {reporteLoading ? (
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center border border-slate-200 w-80 h-40 animate-in fade-in zoom-in-95 duration-150">
              <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Preparando reporte...</span>
            </div>
          ) : (
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-200"
              style={{
                height: reporteHeight ? `${Math.min(window.innerHeight * 0.9, reporteHeight + 90)}px` : '88vh'
              }}
            >
              {/* Cabecera del Modal */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div>
                  <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">
                    Previsualización del Reporte de Servicios
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">
                    Módulo Servicios • Cotización N° {numReg}
                  </p>
                </div>
                
                {/* Botón Cerrar */}
                <button 
                  onClick={() => setReporteServiciosOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-600 bg-slate-100 border border-slate-200/60"
                  title="Cerrar Previsualización"
                >
                  <LucideIcons.X className="h-4 w-4" />
                </button>
              </div>

              {/* Cuerpo del Modal con el Iframe apuntando al endpoint de Servicios */}
              <div className="flex-1 bg-slate-50 p-4 overflow-hidden">
                <iframe 
                  src={`${api.defaults.baseURL}/cotizaciones/reporte-servicios-html/${numReg}/`}
                  className="w-full h-full bg-white rounded-xl border border-slate-200 shadow-sm"
                  title="Reporte de Servicios Oficial"
                />
              </div>

            </div>
          )}
        </div>
      )}

      {/*  REPORTE DETALLADO */}
      {reporteDetalladoOpen && (
        <div className="fixed inset-0 bg-slate-900/20 z-50 flex items-center justify-center p-4">
          {reporteLoading ? (
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center border border-slate-200 w-80 h-40 animate-in fade-in zoom-in-95 duration-150">
              <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Preparando reporte...</span>
            </div>
          ) : (
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
              style={{
                height: reporteHeight ? `${Math.min(window.innerHeight * 0.9, reporteHeight + 90)}px` : '88vh'
              }}
            >
              {/* Cabecera del Modal */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div>
                  <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">
                    Reporte de Cotización Detallado
                  </h3>
                </div>
                <button 
                  onClick={() => setReporteDetalladoOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-600 bg-slate-100"
                >
                  <LucideIcons.X className="h-4 w-4" />
                </button>
              </div>

              {/* CUERPO: El iframe usa exactamente tu PATH de Django */}
              <div className="flex-1 bg-slate-50 p-4 overflow-hidden">
                <iframe 
                  src={`${api.defaults.baseURL}/cotizaciones/reporte-detallado/${numReg}/`}
                  className="w-full h-full bg-white rounded-xl border border-slate-200 shadow-sm"
                  title="Reporte Cliente Detallado"
                />
              </div>

            </div>
          )}
        </div>
      )}

      {/*  REPORTE RESUMEN */}
      {reporteResumenOpen && (
        <div className="fixed inset-0 bg-slate-900/20 z-50 flex items-center justify-center p-4">
          {reporteLoading ? (
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center border border-slate-200 w-80 h-40 animate-in fade-in zoom-in-95 duration-150">
              <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Preparando reporte...</span>
            </div>
          ) : (
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
              style={{
                height: reporteHeight ? `${Math.min(window.innerHeight * 0.9, reporteHeight + 90)}px` : '88vh'
              }}
            >
              {/* Cabecera del Modal */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div>
                  <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-widest">
                    Reporte de Cotización Resumen
                  </h3>
                </div>
                <button 
                  onClick={() => setReporteResumenOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-slate-600 bg-slate-100"
                >
                  <LucideIcons.X className="h-4 w-4" />
                </button>
              </div>

              {/* CUERPO: El iframe usa exactamente tu PATH de Django */}
              <div className="flex-1 bg-slate-50 p-4 overflow-hidden">
                <iframe 
                  src={`${api.defaults.baseURL}/cotizaciones/reporte-resumen/${numReg}/`}
                  className="w-full h-full bg-white rounded-xl border border-slate-200 shadow-sm"
                  title="Reporte Cliente Resumen"
                />
              </div>

            </div>
          )}
        </div>
      )}

      {/* Context Menu for right-click on Autocompletes */}
      {contextMenuOpen && contextMenuPos && (
        <div
          style={{
            position: 'fixed',
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            width: 1,
            height: 1,
            pointerEvents: 'none',
            zIndex: 9999
          }}
        >
          <ActionMenu
            open={contextMenuOpen}
            onOpenChange={setContextMenuOpen}
            title={contextMenuType === 'cliente' ? "Opciones Cliente" : "Opciones Encargado"}
            align="start"
            customTrigger={<div className="w-0 h-0" />}
            options={[
              {
                label: contextMenuType === 'cliente' ? "Ver Ficha de Cliente" : "Ver Ficha de Encargado",
                icon: LucideIcons.UserCheck,
                hasSubmenu: true,
                onHover: () => {
                  if (contextMenuType === 'cliente') {
                    handleVerDetalles('cliente', data.id_cliente, data.cliente_nombre);
                  } else {
                    handleVerDetalles('representante', data.id_representante, data.representante_nombre);
                  }
                },
                onClick: () => {
                  if (contextMenuType === 'cliente') {
                    handleVerDetalles('cliente', data.id_cliente, data.cliente_nombre);
                  } else {
                    handleVerDetalles('representante', data.id_representante, data.representante_nombre);
                  }
                },
                submenuContent: (
                  <div className="w-fit min-w-[320px] max-w-[450px] p-3 text-left">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1.5 flex items-center gap-1.5 select-none">
                      <LucideIcons.Info className="h-3.5 w-3.5 text-indigo-500" />
                      {contextMenuType === 'cliente' ? "Detalles de la Empresa" : "Información de Contacto"}
                    </h4>
                    {modalLoading ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-2">
                        <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Cargando...</span>
                      </div>
                    ) : (
                      contextMenuType === 'cliente' ? (
                        <div className="space-y-2.5 animate-in fade-in duration-200">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Nombre / Razón Social</span>
                            <span className="text-[10px] font-black text-slate-800 uppercase block leading-tight">{data.cliente_nombre || '---'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">RUC</span>
                              <span className="text-[10px] font-black text-slate-800">{modalData?.ruc || '---'}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Tipo</span>
                              <span className="text-[10px] font-black text-slate-800 uppercase">
                                {modalData?.tipo === 0 || modalData?.tipo === '0'
                                  ? 'Cliente'
                                  : modalData?.tipo === 1 || modalData?.tipo === '1'
                                    ? 'Proveedor'
                                    : '---'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5 animate-in fade-in duration-200">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Nombre</span>
                            <span className="text-[10px] font-black text-slate-800 uppercase block leading-tight">{data.representante_nombre || '---'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Empresa</span>
                              <span className="text-[10px] font-black text-slate-800 uppercase block leading-tight">{data.cliente_nombre || '---'}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Cargo</span>
                              <span className="text-[10px] font-black text-slate-800 uppercase">{data.representante_cargo || '---'}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Móvil</span>
                              <span className="text-[10px] font-black text-slate-800">{data.representante_movil || '---'}</span>
                            </div>
                            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Correo</span>
                              <span className="text-[10px] font-black text-slate-800 lowercase block truncate">{data.representante_correo || '---'}</span>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )
              },
              {
                label: "Análisis de Cotizaciones",
                icon: LucideIcons.BarChart3,
                hasSubmenu: true,
                onHover: () => {
                  if (contextMenuType === 'cliente') {
                    handleVerDetalles('cliente', data.id_cliente, data.cliente_nombre);
                  } else {
                    handleVerDetalles('representante', data.id_representante, data.representante_nombre);
                  }
                },
                onClick: () => {
                  if (contextMenuType === 'cliente') {
                    handleVerDetalles('cliente', data.id_cliente, data.cliente_nombre);
                  } else {
                    handleVerDetalles('representante', data.id_representante, data.representante_nombre);
                  }
                },
                submenuContent: (
                  <div className="w-fit min-w-[340px] max-w-[480px] p-3 text-left">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1.5 flex items-center gap-1.5 select-none">
                      <LucideIcons.BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
                      Historial y Métricas Comerciales
                    </h4>
                    {modalLoading ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-2">
                        <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Cargando...</span>
                      </div>
                    ) : analysisData ? (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 flex flex-col justify-between animate-in fade-in duration-300">
                            <span className="text-[8px] font-black text-slate-400 uppercase block tracking-wider">Cotizaciones</span>
                            <span className="text-xs font-black text-slate-800">{analysisData.stats.totalCount}</span>
                          </div>

                          <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-2 flex flex-col justify-between animate-in fade-in duration-300">
                            <span className="text-[8px] font-black text-emerald-600 uppercase block tracking-wider">Monto Total</span>
                            <span className="text-[10px] font-black text-emerald-700 truncate">
                              {new Intl.NumberFormat('es-PE', { style: 'currency', currency: data?.tipo_moneda === 'S' || data?.tipo_moneda === 'PEN' ? 'PEN' : 'USD' }).format(analysisData.stats.totalAmount)}
                            </span>
                          </div>

                          <div className="bg-teal-50/50 border border-teal-100/50 rounded-xl p-2 flex flex-col justify-between animate-in fade-in duration-300">
                            <span className="text-[8px] font-black text-teal-600 uppercase block tracking-wider">Aprobadas</span>
                            <span className="text-xs font-black text-teal-700">{analysisData.stats.wonCount}</span>
                          </div>

                          <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-2 flex flex-col justify-between animate-in fade-in duration-300">
                            <span className="text-[8px] font-black text-amber-600 uppercase block tracking-wider">Tasa Éxito</span>
                            <span className="text-xs font-black text-amber-700">{analysisData.stats.successRate}%</span>
                          </div>

                          <div className="bg-sky-50/50 border border-sky-100/50 rounded-xl p-2 flex flex-col justify-between animate-in fade-in duration-300">
                            <span className="text-[8px] font-black text-sky-600 uppercase block tracking-wider">Monto Adjudicado</span>
                            <span className="text-[10px] font-black text-sky-700 truncate">
                              {new Intl.NumberFormat('es-PE', { style: 'currency', currency: data?.tipo_moneda === 'S' || data?.tipo_moneda === 'PEN' ? 'PEN' : 'USD' }).format(analysisData.stats.wonAmount)}
                            </span>
                          </div>

                          <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-2 flex flex-col justify-between animate-in fade-in duration-300">
                            <span className="text-[8px] font-black text-indigo-600 uppercase block tracking-wider">Media (Promedio)</span>
                            <span className="text-[10px] font-black text-indigo-700 truncate">
                              {new Intl.NumberFormat('es-PE', { style: 'currency', currency: data?.tipo_moneda === 'S' || data?.tipo_moneda === 'PEN' ? 'PEN' : 'USD' }).format(analysisData.stats.averageAmount)}
                            </span>
                          </div>
                        </div>

                        <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-inner max-h-[140px] overflow-y-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-2 py-1 text-[8px] font-black text-slate-400 uppercase tracking-wider">Código</th>
                                <th className="px-2 py-1 text-[8px] font-black text-slate-400 uppercase tracking-wider text-center">Estado</th>
                                <th className="px-2 py-1 text-[8px] font-black text-slate-400 uppercase tracking-wider text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {analysisData.cotizaciones.map((coti) => {
                                const isWon = coti.id_estado === 1 || coti.id_estado === '1' || coti.id_estado?.id_estado === 1 || coti.id_estado?.id_estado === '1' || coti.estado_nombre?.toLowerCase() === 'adjudicado' || coti.estado_nombre?.toLowerCase() === 'adjudicada';
                                const isLost = coti.id_estado === 3 || coti.id_estado === '3' || coti.id_estado?.id_estado === 3 || coti.id_estado?.id_estado === '3' || coti.estado_nombre?.toLowerCase() === 'perdida';
                                const isPending = coti.id_estado === 2 || coti.id_estado === '2' || coti.id_estado?.id_estado === 2 || coti.id_estado?.id_estado === '2' || coti.estado_nombre?.toLowerCase() === 'pendiente';
                                const isFollowing = coti.id_estado === 6 || coti.id_estado === '6' || coti.id_estado?.id_estado === 6 || coti.id_estado?.id_estado === '6' || coti.estado_nombre?.toLowerCase() === 'en seguimiento';

                                let badgeClass = "text-slate-600 bg-slate-50 border border-slate-100";
                                if (isWon) badgeClass = "text-emerald-600 bg-emerald-50 border border-emerald-100";
                                else if (isLost) badgeClass = "text-rose-600 bg-rose-50 border border-rose-100";
                                else if (isPending) badgeClass = "text-amber-600 bg-amber-50 border border-amber-100";
                                else if (isFollowing) badgeClass = "text-blue-600 bg-blue-50 border border-blue-100";

                                return (
                                  <tr key={coti.id_registro} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-2 py-1.5 text-[8px] font-black text-slate-800 uppercase">{coti.codigo || 'SIN CÓDIGO'}</td>
                                    <td className="px-2 py-1.5 text-center">
                                      <span className={`inline-block px-1 rounded text-[7px] font-bold uppercase tracking-wider ${badgeClass}`}>
                                        {coti.estado_nombre || '---'}
                                      </span>
                                    </td>
                                    <td className="px-2 py-1.5 text-[8px] font-black text-slate-800 text-right">
                                      {new Intl.NumberFormat('es-PE', { style: 'currency', currency: coti.tipo_moneda === 'S' || coti.tipo_moneda === 'PEN' ? 'PEN' : 'USD' }).format(coti.total_cotizacion || coti.total || 0)}
                                    </td>
                                  </tr>
                                );
                              })}
                              {analysisData.cotizaciones.length === 0 && (
                                <tr>
                                  <td colSpan="3" className="text-center text-[8px] text-slate-400 py-3 font-bold uppercase tracking-wider">
                                    Sin registros.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-[8px] text-slate-400 py-3 font-bold uppercase tracking-wider">No se encontraron cotizaciones.</div>
                    )}
                  </div>
                )
              }
            ]}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPONENTES AUXILIARES ORDENABLES (Definidos fuera para evitar re-montaje)
// ============================================================================
const SortableWrapper = ({ id, data, children, className = "" }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {typeof children === 'function' ? children({ listeners, attributes, isDragging }) : children}
    </div>
  );
};

const SuggestionsList = ({
  type,
  targetKey,
  suggestions,
  suggestionsType,
  suggestionsKey,
  focusedSuggestionIndex,
  setFocusedSuggestionIndex,
  handleSelectSuggestion,
  formatMoney,
}) => {
  if (suggestions.length === 0 || suggestionsType !== type || suggestionsKey !== targetKey) {
    return null;
  }

  if (suggestions[0]?.isWarning) {
    return (
      <div className="absolute left-0 mt-1 min-w-[340px] max-w-[480px] p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-xl z-50 text-left animate-in fade-in slide-in-from-top-1 duration-150 select-none">
        <span className="text-[11px] font-black text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
          {suggestions[0].message}
        </span>
      </div>
    );
  }

  return (
    <div className="absolute left-0 mt-1 min-w-[340px] max-w-[480px] max-h-[220px] overflow-y-auto bg-white border border-indigo-100 rounded-xl shadow-xl z-50 text-left divide-y divide-gray-50 border-t-2 border-t-indigo-500 animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="px-3 py-1.5 bg-indigo-50/50 text-[9px] font-black text-indigo-500 uppercase tracking-widest flex justify-between select-none">
        <span>Sugerencias de Catálogo</span>
        <span>{suggestions.length} items</span>
      </div>
      {suggestions.map((sug, idx) => {
        const isFocused = idx === focusedSuggestionIndex;
        return (
          <div
            key={`${sug.proveedor}-${sug.codigo}-${idx}`}
            onMouseDown={() => handleSelectSuggestion(sug, type, targetKey)}
            onMouseEnter={() => setFocusedSuggestionIndex(idx)}
            className={cn(
              "px-3 py-2 cursor-pointer transition-all flex flex-col gap-0.5",
              isFocused ? "bg-indigo-50 text-indigo-900 font-bold" : "hover:bg-gray-50 text-gray-700"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-black tracking-tight text-gray-900">
                {sug.codigo}
              </span>
              <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-teal-50 border border-teal-100 text-teal-600 uppercase tracking-tighter">
                {sug.marca || "Otros"}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 line-clamp-1 leading-normal font-semibold">
              {sug.descripcion}
            </span>
            <div className="flex items-center justify-between text-[9px] text-gray-400 mt-0.5 font-bold uppercase">
              <span>Unid: {sug.unidad || "UNI"}</span>
              <span className="text-gray-600 font-black">
                Costo: {formatMoney(sug.costoPrecio)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SortableItemRow = ({
  item,
  isReadOnly,
  editingItemId,
  editForm,
  setEditForm,
  startEditItem,
  handleEliminarItem,
  saveEditItem,
  cancelEditItem,
  formatMoney,
  formatMoneySymbol,
  proveedores = [],
  tcamb = 1,
  handleRowChange,
  handleEditRowLookup,
  normalizarProductoDB,
  recalculateRowValues,
  tipoMoneda,
  isVenta,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `item-${item.id_suministro}`,
    data: {
      type: 'item',
      id_suministro: item.id_suministro
    }
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const itemId = item.id_suministro;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const proveedoresOptions = (proveedores || []).map(p => ({
    id: String(p.id_marca).padStart(2, '0'),
    nombre: p.nombre
  }));

  if (editingItemId === itemId) {
    return (
      <tr ref={setNodeRef} style={style} className="bg-indigo-50/50">
        <td className="px-2 text-center align-middle">
          <Icon name="grip-vertical" className="h-3.5 w-3.5 text-gray-200 mx-auto" />
        </td>
        {/* Código / Marca */}
        <td className="px-3 py-1">
          <div className="flex flex-col gap-1 items-center justify-center text-center relative">
            <select
              className="w-full text-[10.5px] border border-gray-300 rounded px-1 py-0.5 uppercase font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
              value={editForm.proveedor || ""}
              onChange={e => {
                const code = e.target.value;
                const brandId = parseInt(code, 10) || null;
                setEditForm(prev => ({
                  ...prev,
                  proveedor: code,
                  id_marca: brandId
                }));
              }}
            >
              <option value="" className="text-center">-- Marca --</option>
              {proveedoresOptions.map(p => (
                <option key={p.id} value={p.id} className="text-center">{p.nombre}</option>
              ))}
            </select>
            <ProductoAutocomplete
              value={editForm.codigo_item || ""}
              idMarca={editForm.id_marca}
              tcamb={tcamb}
              tipoMoneda={tipoMoneda}
              onSelect={(prod) => {
                if (prod.isCustom) {
                  setEditForm(prev => ({ ...prev, codigo_item: prod.codigo }));
                } else {
                  const normalizado = normalizarProductoDB(prod, tipoMoneda, tcamb, Number(editForm.cantidad || 1));
                  setEditForm(prev => {
                    const updated = {
                      ...prev,
                      proveedor: normalizado.proveedor,
                      id_marca: prod.id_marca,
                      codigo_item: normalizado.codigo,
                      descripcion: normalizado.descripcion,
                      tipo_unidad: normalizado.unidad,
                      costo_precio: normalizado.costoPrecio,
                      porcentaje_utilidad: prev.porcentaje_utilidad || 20
                    };
                    return recalculateRowValues(updated, 'porcentaje_utilidad');
                  });
                }
              }}
            />
          </div>
        </td>
        {/* Descripción / Observación */}
        <td className="px-3 py-1">
          <div className="flex flex-col gap-1 items-center justify-center text-center">
            <input
              type="text"
              className="w-full text-[11px] border border-gray-300 rounded px-1.5 py-0.5 font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
              value={editForm.descripcion || ''}
              placeholder="Descripción..."
              onChange={e => setEditForm({ ...editForm, descripcion: e.target.value.toUpperCase() })}
            />
            <input
              type="text"
              className="w-full text-[9px] border border-gray-200 text-gray-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
              value={editForm.observacion || ''}
              placeholder="Observación..."
              onChange={e => setEditForm({ ...editForm, observacion: e.target.value.toUpperCase() })}
            />
          </div>
        </td>
        {/* Cant */}
        <td className="px-3 py-1">
          <input
            type="number"
            className="w-full text-[11px] border border-gray-300 text-center rounded px-1 py-0.5 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
            value={editForm.cantidad === undefined || editForm.cantidad === null ? '' : editForm.cantidad}
            onChange={e => handleRowChange('cantidad', e.target.value, 'edit')}
          />
        </td>
        {/* Costo Unit. */}
        <td className="px-3 py-1">
          <input
            type="number"
            step="0.01"
            className="w-full text-[11px] border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
            value={editForm.costo_precio === undefined || editForm.costo_precio === null ? '' : editForm.costo_precio}
            onChange={e => handleRowChange('costo_precio', e.target.value, 'edit')}
          />
        </td>
        {/* Envío */}
        {isVenta && (
          <td className="px-3 py-1">
            <div className="flex flex-col gap-1 items-center justify-center text-center">
              <input
                type="number"
                step="0.01"
                className="w-full text-[11px] border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center font-semibold"
                value={editForm.costo_envio === undefined || editForm.costo_envio === null ? '' : editForm.costo_envio}
                onChange={e => handleRowChange('costo_envio', e.target.value, 'edit')}
              />
              <span className="text-[9px] text-gray-400 font-medium">
                {Number(editForm.porcentaje_envio || 0).toFixed(2)}%
              </span>
            </div>
          </td>
        )}
        {/* % Util */}
        <td className="px-3 py-1">
          <div className="flex flex-col gap-1 items-center justify-center text-center">
            {/* Monto de utilidad (ARRIBA) */}
            <span className="text-[11px] font-bold text-gray-700">
              {formatMoneySymbol(Number(editForm.utilidad || 0))}
            </span>

            {/* Porcentaje / Input (ABAJO) */}
            <div className="relative flex items-center justify-center w-full">
              <input
                type="number"
                step="0.1"
                className="w-full text-[10px] border border-gray-300 text-center rounded px-1 py-0.5 font-medium text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center"
                value={editForm.porcentaje_utilidad === undefined || editForm.porcentaje_utilidad === null ? '' : editForm.porcentaje_utilidad}
                onChange={e => handleRowChange('porcentaje_utilidad', e.target.value, 'edit')}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    saveEditItem();
                  }
                }}
              />
              <span className="absolute right-1 text-[9px] text-gray-400">%</span>
            </div>
          </div>
        </td>
        {/* Precio Unit. */}
        <td className="px-3 py-1 text-center text-[11.5px] font-semibold text-gray-500">
          {formatMoney(Number(editForm.precio_venta || 0))}
        </td>
        {/* Venta Total */}
        <td className="px-3 py-1 text-center text-[11.5px] font-black text-gray-900">
          {formatMoney(Number(editForm.venta_total || 0))}
        </td>
        {/* Actions */}
        <td className="px-3 py-1">
          <div className="flex justify-center items-center gap-1">
            <button
              onClick={saveEditItem}
              className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm transition-colors flex items-center justify-center"
              title="Guardar (Enter)"
            >
              <Icon name="check" className="h-3 w-3" />
            </button>
            <button
              onClick={cancelEditItem}
              className="p-1 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded transition-colors flex items-center justify-center"
              title="Cancelar"
            >
              <Icon name="x" className="h-3 w-3" />
            </button>
            <ActionMenu
              title="Logística y Detalles del Ítem"
              align="end"
              closeOnSelect={false}
              contentClassName="min-w-[300px]"
              customTrigger={
                <button
                  type="button"
                  className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded shadow-sm transition-colors flex items-center justify-center"
                  title="Detalles Adicionales"
                >
                  <Icon name="ellipsis-vertical" className="h-3.5 w-3.5" />
                </button>
              }
            >
              <div className="p-3 space-y-3 text-xs text-left">
                {/* U. Medida */}
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-gray-400 uppercase text-[9px]">U. Medida:</span>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase font-semibold text-gray-700"
                    value={editForm.tipo_unidad || ""}
                    onChange={e => handleRowChange("tipo_unidad", e.target.value.toUpperCase(), "edit")}
                    placeholder="UNI, GLN, etc."
                  />
                </div>
                {/* Tiempo Entrega */}
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-gray-400 uppercase text-[9px]">Tiempo Entrega:</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="w-2/3 border border-gray-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-700"
                      value={editForm.tiempo_entrega === undefined || editForm.tiempo_entrega === null ? "" : editForm.tiempo_entrega}
                      onChange={e => handleRowChange("tiempo_entrega", e.target.value, "edit")}
                      placeholder="0"
                    />
                    <select
                      className="w-1/3 border border-gray-200 rounded px-1 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-700 bg-white"
                      value={editForm.id_unidad_tiempo_entrega || 1}
                      onChange={e => handleRowChange("id_unidad_tiempo_entrega", parseInt(e.target.value, 10), "edit")}
                    >
                      <option value={1}>Días</option>
                      <option value={2}>Semanas</option>
                      <option value={3}>Meses</option>
                    </select>
                  </div>
                </div>
                {/* Costo Envío */}
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-gray-400 uppercase text-[9px]">Costo Envío Unit.:</span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-gray-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-gray-700"
                    value={editForm.costo_envio === undefined || editForm.costo_envio === null ? "" : editForm.costo_envio}
                    onChange={e => handleRowChange("costo_envio", e.target.value, "edit")}
                    placeholder="0.00"
                  />
                </div>
                {/* Observación */}
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-gray-400 uppercase text-[9px]">Observación:</span>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-700"
                    value={editForm.observacion || ""}
                    onChange={e => handleRowChange("observacion", e.target.value.toUpperCase(), "edit")}
                    placeholder="Observación..."
                  />
                </div>

                {/* RESUMEN DE VENTA */}
                {(() => {
                  const editCantidad = Number(editForm.cantidad || 0);
                  const editCostoPrecio = Number(editForm.costo_precio || 0);
                  const editCostoEnvio = Number(editForm.costo_envio || 0);
                  const editCostoConEnvio = Number(editForm.costo_con_envio || 0);
                  const editPrecioVenta = Number(editForm.precio_venta || 0);
                  const editVentaTotal = Number(editForm.venta_total || 0);
                  const editUtilidad = Number(editForm.utilidad || 0);

                  const costoTotal = editCostoPrecio * editCantidad;
                  const costoConEnvioTotal = editCostoConEnvio * editCantidad;
                  const precioVentaUnit = editPrecioVenta;
                  const ventaTotal = editVentaTotal;
                  const utilidadTotal = editUtilidad * editCantidad;

                  return (
                    <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-3 space-y-2 shadow-inner mt-2">
                      <div className="flex items-center gap-2 text-teal-700">
                        <Icon name="trending-up" className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-tight">Resumen de Venta</span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between items-center text-gray-500 py-0.5 border-b border-gray-100/50">
                          <span>Costo Total:</span>
                          <span className="font-semibold text-gray-700">{formatMoneySymbol(costoTotal)}</span>
                        </div>
                        {isVenta && (
                          <div className="flex justify-between items-center text-gray-500 py-0.5 border-b border-gray-100/50">
                            <span>Costo c/ Envío:</span>
                            <span className="font-semibold text-gray-700">{formatMoneySymbol(costoConEnvioTotal)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-gray-500 py-0.5 border-b border-gray-100/50">
                          <span>Precio Venta:</span>
                          <span className="font-semibold text-gray-700">{formatMoneySymbol(precioVentaUnit)}</span>
                        </div>
                        <div className="flex justify-between items-center text-teal-800 py-0.5 border-b border-teal-100/50 font-black">
                          <span>Venta Total:</span>
                          <span className="text-teal-700 text-[12px]">{formatMoneySymbol(ventaTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-800 py-0.5 font-bold">
                          <span>Utilidad Total:</span>
                          <span className="text-emerald-600">{formatMoneySymbol(utilidadTotal)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </ActionMenu>
          </div>
        </td>
      </tr>
    );
  }

  // Visualizar Renglón en la Tabla
  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "hover:bg-gray-50 cursor-pointer group transition-all duration-150 border-b border-gray-100",
        isDragging && "bg-indigo-50/20 shadow-inner"
      )}
      onDoubleClick={() => !isReadOnly && startEditItem(item)}
    >
      {!isReadOnly ? (
        <td
          {...listeners}
          data-drag-handle
          className="px-2 text-center align-middle cursor-grab active:cursor-grabbing hover:bg-gray-100/50"
        >
          <Icon name="grip-vertical" className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 mx-auto transition-colors" />
        </td>
      ) : (
        <td className="px-2 text-center align-middle cursor-default">
          <Icon name="grip-vertical" className="h-3.5 w-3.5 text-gray-100 mx-auto" />
        </td>
      )}
      {/* P/N / Marca */}
      <td className="px-3 py-1 text-center">
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[12px] font-bold text-gray-900">{item.codigo_item}</span>
          {item.marca_nombre && (
            <span className="text-[9.5px] font-semibold text-teal-600 uppercase tracking-tighter">{item.marca_nombre}</span>
          )}
        </div>
      </td>
      {/* Descripción / Observación */}
      <td className="px-3 py-1 text-center">
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[12px] text-gray-600 font-semibold leading-tight line-clamp-2" title={item.descripcion}>
            {item.descripcion}
          </span>
          {item.observacion && (
            <span className="text-[9.5px] text-gray-400 italic mt-0.5">{item.observacion}</span>
          )}
        </div>
      </td>
      {/* Cantidad */}
      <td className="px-3 py-1 text-[12px] text-gray-900 text-center font-bold">{item.cantidad}</td>
      {/* Costo Unitario */}
      <td className="px-3 py-1 text-[12px] text-gray-500 font-medium text-center">
        {formatMoney(item.costo_precio)}
      </td>
      {/* Envío */}
      {isVenta && (
        <td className="px-3 py-1 text-center">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[12px] text-gray-500 font-medium">
              {formatMoney(item.costo_envio)}
            </span>
            <span className="text-[9.5px] text-gray-400 font-medium">
              {Number(item.porcentaje_envio || 0).toFixed(2)}%
            </span>
          </div>
        </td>
      )}
      {/* % Utilidad */}
      <td className="px-3 py-1 text-center">
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-[12px] font-bold text-gray-900">
            {formatMoneySymbol(Number(item.utilidad || 0))}
          </span>
          <span className="text-[9.5px] font-medium text-gray-400">
            {Number(item.porcentaje_utilidad || 0).toFixed(1)}%
          </span>
        </div>
      </td>
      {/* Precio Unitario */}
      <td className="px-3 py-1 text-[12px] text-gray-500 font-medium text-center">
        {formatMoney(item.precio_venta)}
      </td>
      {/* Venta Total */}
      <td className="px-3 py-1 text-[12px] font-black text-gray-900 text-center">
        {formatMoney(item.venta_total)}
      </td>
      {/* Acciones */}
      <td className="px-3 py-1 align-middle text-center w-[45px] relative">
        <div onClick={e => e.stopPropagation()} className="flex justify-center items-center">
          <ActionMenu
            title="Opciones del Item"
            align="end"
            open={menuOpen}
            onOpenChange={(isOpen) => {
              setMenuOpen(isOpen);
              if (!isOpen) {
                setShowDeleteConfirm(false);
              }
            }}
            closeOnSelect={false}
            contentClassName="min-w-[210px] bg-white rounded-xl shadow-xl border border-gray-100/80 p-1 tracking-tight z-50 animate-in fade-in-50 duration-100"
            customTrigger={
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-slate-100/80 rounded-lg transition-all flex items-center justify-center group-hover:scale-105"
                title="Menú de opciones"
              >
                <Icon name="ellipsis-vertical" className="h-4 w-4" />
              </button>
            }
            options={[
              {
                label: "Resumen de Venta",
                icon: LucideIcons.TrendingUp,
                hasSubmenu: true,
                submenuContent: (
                  <div className="w-fit min-w-[320px] max-w-[450px] p-3.5 text-left text-xs space-y-3.5 animate-in fade-in zoom-in-95 duration-100 select-none">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-gray-100 pb-1.5">
                      <Icon name="info" className="h-3.5 w-3.5 text-slate-400" />
                      <span>Especificaciones de Suministro</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="block font-bold text-gray-400 text-[9px] uppercase tracking-wide mb-0.5">U. Medida</span>
                        <span className="font-bold text-gray-700 uppercase">{item.tipo_unidad || "UNI"}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="block font-bold text-gray-400 text-[9px] uppercase tracking-wide mb-0.5">Tiempo Entrega</span>
                        <span className="font-bold text-gray-700">
                          {item.tiempo_entrega ?? 0} {item.id_unidad_tiempo_entrega === 3 ? 'Meses' : item.id_unidad_tiempo_entrega === 2 ? 'Semanas' : 'Días'}
                        </span>
                      </div>
                    </div>

                    {item.observacion && (
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px]">
                        <span className="block font-bold text-gray-400 text-[9px] uppercase tracking-wide mb-0.5">Observación</span>
                        <span className="text-gray-600 italic font-medium">{item.observacion}</span>
                      </div>
                    )}

                    {/* PANEL CÁLCULO MONETARIO */}
                    {(() => {
                      const itemCantidad = Number(item.cantidad || 0);
                      const itemCostoPrecio = Number(item.costo_precio || 0);
                      const itemCostoConEnvio = Number(item.costo_con_envio || 0);
                      const itemPrecioVenta = Number(item.precio_venta || 0);
                      const itemVentaTotal = Number(item.venta_total || 0);
                      const itemUtilidad = Number(item.utilidad || 0);

                      const costoTotal = itemCostoPrecio * itemCantidad;
                      const costoConEnvioTotal = itemCostoConEnvio * itemCantidad;
                      const utilidadTotal = itemUtilidad * itemCantidad;

                      return (
                        <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 space-y-2 shadow-inner">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider">
                            <Icon name="calculator" className="h-3.5 w-3.5" />
                            <span>Desglose Comercial Total</span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between items-center text-gray-500 py-0.5 border-b border-gray-200/30">
                              <span>Costo Neto Total:</span>
                              <span className="font-semibold text-gray-700">{formatMoneySymbol(costoTotal)}</span>
                            </div>
                            {isVenta && item.costo_envio > 0 && (
                              <div className="flex justify-between items-center text-gray-500 py-0.5 border-b border-gray-200/30">
                                <span>Costo con Envío:</span>
                                <span className="font-semibold text-gray-700">{formatMoneySymbol(costoConEnvioTotal)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-gray-500 py-0.5 border-b border-gray-200/30">
                              <span>Precio Venta (Unit):</span>
                              <span className="font-semibold text-gray-700">{formatMoneySymbol(itemPrecioVenta)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-800 py-0.5 border-b border-slate-200/50 font-bold">
                              <span>Importe Venta Total:</span>
                              <span className="text-slate-900 font-black text-xs">{formatMoneySymbol(itemVentaTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-900 pt-0.5 font-bold">
                              <span>Utilidad Bruta Ganada:</span>
                              <span className="text-emerald-600 font-black text-xs">{formatMoneySymbol(utilidadTotal)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )
              }
            ]}
          >
            <div className="flex flex-col p-1 space-y-0.5">

              {/* 1. OPCIÓN: EDITAR RENGLÓN */}
              {!isReadOnly && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    startEditItem(item);
                    setMenuOpen(false);
                  }}
                  className="group/item w-full flex items-center gap-2.5 px-3 py-2 text-[11.5px] font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-left"
                >
                  <Icon
                    name="edit-2"
                    className="h-3.5 w-3.5 text-gray-400 group-hover/item:text-indigo-500 transition-colors"
                  />
                  <span>Editar Renglón</span>
                </button>
              )}

              {/* 2. OPCIÓN: ELIMINAR ÍTEM (Con Confirmación inline estilo Adjuntos) */}
              {!isReadOnly && (
                <div className="w-full" onClick={e => e.stopPropagation()}>
                  {showDeleteConfirm ? (
                    <div className="flex items-center justify-between w-full bg-red-50/80 border border-red-100 rounded-lg p-2 text-[11px] animate-in fade-in zoom-in-95 duration-100">
                      <span className="font-bold text-red-700 select-none">¿Remover?</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleEliminarItem(item.id_suministro, item.codigo_grupo);
                            setMenuOpen(false);
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-black text-[9px] rounded uppercase tracking-wider transition-colors shadow-sm"
                        >
                          Sí
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setShowDeleteConfirm(false);
                          }}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-[9px] rounded uppercase tracking-wider transition-colors"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowDeleteConfirm(true);
                      }}
                      className="group/item w-full flex items-center gap-2.5 px-3 py-2 text-[11.5px] font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                    >
                      <Icon
                        name="trash-2"
                        className="h-3.5 w-3.5 text-red-400 group-hover/item:text-red-500 transition-colors"
                      />
                      <span>Eliminar Ítem</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          </ActionMenu>
        </div>
      </td>
    </tr>
  );
};

const SortableItemServicioRow = ({
  item,
  sg,
  grupo,
  isReadOnly,
  editingItemServicioId,
  editingServicioForm,
  setEditingServicioForm,
  setEditingItemServicioId,
  categoriasPersonal,
  typesGasto,
  handleConfirmManoObraInline,
  handleConfirmGastosServicioInline,
  handleConfirmOtrosInline,
  handleStartEditingItemInline,
  handleEliminarItemServicio,
  formatMoneySymbol,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `item-${item.id_servicio}`,
    data: {
      type: 'item',
      id_servicio: item.id_servicio
    }
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isEditingItem = editingItemServicioId === item.id_servicio;

  if (isEditingItem) {
    if (sg.tipoCodigo === "04") {
      return (
        <tr ref={setNodeRef} style={style} className="bg-indigo-50/30">
          <td className="px-2 text-center align-middle">
            <Icon name="grip-vertical" className="h-3.5 w-3.5 text-gray-200 mx-auto" />
          </td>
          <td className="px-2 py-1">
            <select
              className="w-full text-[10.5px] border border-gray-300 rounded px-1 py-0.5 uppercase font-bold text-gray-800"
              value={editingServicioForm.codigo_item || ""}
              onChange={(e) => {
                const matched = categoriasPersonal.find(c => c.codigo === e.target.value);
                if (matched) {
                  setEditingServicioForm({
                    ...editingServicioForm,
                    codigo_item: matched.codigo,
                    descripcion_item: matched.nombre,
                    costo_hombre_dia: parseFloat(matched.cos_max || matched.cos_min || 0)
                  });
                }
              }}
            >
              <option value="">-- Perfil --</option>
              {categoriasPersonal.map(c => (
                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
              ))}
            </select>
          </td>
          <td className="px-2 py-1">
            <input
              type="text"
              className="w-full text-[10.5px] border border-gray-300 rounded px-1.5 py-0.5 uppercase font-semibold text-gray-700"
              value={editingServicioForm.descripcion_item || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, descripcion_item: e.target.value.toUpperCase() })}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-16 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-bold"
              value={editingServicioForm.cantidad_hombres || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, cantidad_hombres: parseInt(e.target.value) || 0 })}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-14 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-semibold"
              value={editingServicioForm.cantidad_dias || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, cantidad_dias: parseInt(e.target.value) || 0 })}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-14 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5"
              value={editingServicioForm.horas || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, horas: parseInt(e.target.value) || 0 })}
            />
          </td>
          <td className="px-2 py-1 text-right">
            <input
              type="number"
              className="w-20 text-[10.5px] border border-gray-300 text-right rounded px-1 py-0.5"
              value={editingServicioForm.costo_hombre_dia || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, costo_hombre_dia: parseFloat(e.target.value) || 0 })}
            />
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 text-right font-medium">
            {formatMoneySymbol((editingServicioForm.cantidad_hombres || 0) * (editingServicioForm.cantidad_dias || 0) * (editingServicioForm.costo_hombre_dia || 0))}
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-16 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-bold text-teal-600"
              value={editingServicioForm.porcentaje || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, porcentaje: parseFloat(e.target.value) || 0 })}
            />
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-900 text-right font-black">
            {formatMoneySymbol(((editingServicioForm.cantidad_hombres || 0) * (editingServicioForm.cantidad_dias || 0) * (editingServicioForm.costo_hombre_dia || 0)) * (1 + (editingServicioForm.porcentaje || 0) / 100))}
          </td>
          <td className="px-3 py-1 text-right">
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => handleConfirmManoObraInline(editingServicioForm, grupo.id_servicio, sg.id_servicio)}
                className="p-1 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded-lg transition-all"
                title="Guardar"
              >
                <Icon name="check" className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setEditingItemServicioId(null)}
                className="p-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg transition-all"
                title="Cancelar"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            </div>
          </td>
        </tr>
      );
    }

    if (sg.tipoCodigo === "05") {
      return (
        <tr ref={setNodeRef} style={style} className="bg-indigo-50/30">
          <td className="px-2 text-center align-middle">
            <Icon name="grip-vertical" className="h-3.5 w-3.5 text-gray-200 mx-auto" />
          </td>
          <td className="px-2 py-1">
            <select
              className="w-full text-[10.5px] border border-gray-300 rounded px-1 py-0.5 uppercase font-bold text-gray-800"
              value={editingServicioForm.codigo_item || ""}
              onChange={(e) => {
                const matched = typesGasto.find(c => c.codigo === e.target.value);
                if (matched) {
                  setEditingServicioForm({
                    ...editingServicioForm,
                    codigo_item: matched.codigo,
                    descripcion_item: matched.nombre
                  });
                }
              }}
            >
              <option value="">-- Gasto --</option>
              {typesGasto.map(c => (
                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
              ))}
            </select>
          </td>
          <td className="px-2 py-1">
            <input
              type="text"
              className="w-full text-[10.5px] border border-gray-300 rounded px-1.5 py-0.5 uppercase font-semibold text-gray-700"
              value={editingServicioForm.descripcion_item || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, descripcion_item: e.target.value.toUpperCase() })}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-16 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-bold"
              value={editingServicioForm.cantidad_hombres || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, cantidad_hombres: parseInt(e.target.value) || 0 })}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-14 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-semibold"
              value={editingServicioForm.cantidad_dias || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, cantidad_dias: parseInt(e.target.value) || 0 })}
            />
          </td>
          <td className="px-2 py-1 text-right">
            <input
              type="number"
              className="w-24 text-[10.5px] border border-gray-300 text-right rounded px-1 py-0.5"
              value={editingServicioForm.costo_hombre_dia || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, costo_hombre_dia: parseFloat(e.target.value) || 0 })}
            />
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-900 text-right font-black">
            {formatMoneySymbol((editingServicioForm.cantidad_hombres || 0) * (editingServicioForm.cantidad_dias || 0) * (editingServicioForm.costo_hombre_dia || 0))}
          </td>
          <td className="px-3 py-1 text-right">
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => handleConfirmGastosServicioInline(editingServicioForm, grupo.id_servicio, sg.id_servicio)}
                className="p-1 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded-lg transition-all"
                title="Guardar"
              >
                <Icon name="check" className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setEditingItemServicioId(null)}
                className="p-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg transition-all"
                title="Cancelar"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            </div>
          </td>
        </tr>
      );
    }

    if (sg.tipoCodigo === "06") {
      return (
        <tr ref={setNodeRef} style={style} className="bg-indigo-50/30">
          <td className="px-2 text-center align-middle">
            <Icon name="grip-vertical" className="h-3.5 w-3.5 text-gray-200 mx-auto" />
          </td>
          <td className="px-2 py-1">
            <select
              className="w-full text-[10.5px] border border-gray-300 rounded px-1 py-0.5 uppercase font-bold text-gray-800"
              value={editingServicioForm.codigo_item || ""}
              onChange={(e) => {
                const matched = typesGasto.find(c => c.codigo === e.target.value);
                if (matched) {
                  setEditingServicioForm({
                    ...editingServicioForm,
                    codigo_item: matched.codigo,
                    descripcion_item: matched.nombre
                  });
                }
              }}
            >
              <option value="">-- Gasto --</option>
              {typesGasto.map(c => (
                <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nombre}</option>
              ))}
            </select>
          </td>
          <td className="px-2 py-1">
            <input
              type="text"
              className="w-full text-[10.5px] border border-gray-300 rounded px-1.5 py-0.5 uppercase font-semibold text-gray-700"
              value={editingServicioForm.descripcion_item || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, descripcion_item: e.target.value.toUpperCase() })}
            />
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-16 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-bold"
              value={editingServicioForm.cantidad_hombres || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, cantidad_hombres: parseInt(e.target.value) || 0 })}
            />
          </td>
          <td className="px-2 py-1 text-right">
            <input
              type="number"
              className="w-20 text-[10.5px] border border-gray-300 text-right rounded px-1 py-0.5"
              value={editingServicioForm.costo_hombre_dia || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, costo_hombre_dia: parseFloat(e.target.value) || 0 })}
            />
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 text-right font-medium">
            {formatMoneySymbol((editingServicioForm.cantidad_hombres || 0) * (editingServicioForm.costo_hombre_dia || 0))}
          </td>
          <td className="px-2 py-1 text-center">
            <input
              type="number"
              className="w-16 text-[10.5px] border border-gray-300 text-center rounded px-1 py-0.5 font-bold text-teal-600"
              value={editingServicioForm.porcentaje || ""}
              onChange={(e) => setEditingServicioForm({ ...editingServicioForm, porcentaje: parseFloat(e.target.value) || 0 })}
            />
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-900 text-right font-black">
            {formatMoneySymbol(((editingServicioForm.cantidad_hombres || 0) * (editingServicioForm.costo_hombre_dia || 0)) * (1 + (editingServicioForm.porcentaje || 0) / 100))}
          </td>
          <td className="px-3 py-1 text-right">
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => handleConfirmOtrosInline(editingServicioForm, grupo.id_servicio, sg.id_servicio)}
                className="p-1 bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 rounded-lg transition-all"
                title="Guardar"
              >
                <Icon name="check" className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setEditingItemServicioId(null)}
                className="p-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg transition-all"
                title="Cancelar"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            </div>
          </td>
        </tr>
      );
    }
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onDoubleClick={() => !isReadOnly && handleStartEditingItemInline(item)}
      className="hover:bg-gray-50/70 group transition-colors cursor-pointer animate-in fade-in duration-150"
    >
      <td className="px-2 text-center align-middle">
        {!isReadOnly ? (
          <div
            {...listeners}
            {...attributes}
            data-drag-handle
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 rounded transition-colors"
          >
            <Icon name="grip-vertical" className="h-3.5 w-3.5" />
          </div>
        ) : (
          <Icon name="grip-vertical" className="h-3.5 w-3.5 text-gray-200" />
        )}
      </td>

      {sg.tipoCodigo === "04" && (
        <>
          <td className="px-3 py-1.5 text-[10.5px] font-bold text-gray-800 uppercase">{item.codigo_item}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 uppercase font-semibold truncate" title={item.descripcion_item}>
            {item.descripcion_item}
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-800 text-center font-bold">{item.cantidad_hombres}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 text-center font-semibold">{item.cantidad_dias}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 text-center">{item.horas}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 text-right">{formatMoneySymbol(item.costo_hombre_dia)}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 text-right font-medium">{formatMoneySymbol(item.costo_total)}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-teal-600 text-center font-bold">{item.porcentaje}%</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-900 text-right font-black">{formatMoneySymbol(item.cotizado_total)}</td>
        </>
      )}

      {sg.tipoCodigo === "05" && (
        <>
          <td className="px-3 py-1.5 text-[10.5px] font-bold text-gray-800 uppercase">{item.codigo_item}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 uppercase font-semibold truncate" title={item.descripcion_item}>
            {item.descripcion_item}
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-800 text-center font-bold">{item.cantidad_hombres}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 text-center font-semibold">{item.cantidad_dias}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 text-right">{formatMoneySymbol(item.costo_hombre_dia)}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-900 text-right font-black">{formatMoneySymbol(item.cotizado_total)}</td>
        </>
      )}

      {sg.tipoCodigo === "06" && (
        <>
          <td className="px-3 py-1.5 text-[10.5px] font-bold text-gray-800 uppercase">{item.codigo_item}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 uppercase font-semibold truncate" title={item.descripcion_item}>
            {item.descripcion_item}
          </td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-800 text-center font-bold">{item.cantidad_hombres}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 text-right">{formatMoneySymbol(item.costo_hombre_dia)}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-600 text-right font-medium">{formatMoneySymbol(item.costo_total)}</td>
          <td className="px-3 py-1.5 text-[10.5px] text-teal-600 text-center font-bold">{item.porcentaje}%</td>
          <td className="px-3 py-1.5 text-[10.5px] text-gray-900 text-right font-black">{formatMoneySymbol(item.cotizado_total)}</td>
        </>
      )}

      <td className="px-3 py-1.5 text-right">
        {!isReadOnly ? (
          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartEditingItemInline(item);
              }}
              className="p-0.5 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Editar ítem"
            >
              <Icon name="edit-2" className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEliminarItemServicio(item.id_servicio);
              }}
              className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
              title="Eliminar ítem"
            >
              <Icon name="trash-2" className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="h-4" />
        )}
      </td>
    </tr>
  );
};

export default CotizacionPremiumDetail;
