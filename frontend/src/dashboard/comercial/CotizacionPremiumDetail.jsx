import React, { useState, useEffect, useMemo, useRef } from 'react';
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

// Import sub-components from SIGECOM_5 (using existing ones where possible)
import AgregarGrupoSuministroModal from '../Suministros/AgregarGrupoSuministroModal';
import RegistroItemModal from '../Suministros/RegistroItemModal';
import RegistroItemBuscadorModal from '../Suministros/RegistroItemBuscadorModal';
import { useCotizacionAcciones } from '@/hook/useCotizacionAcciones';

const Icon = ({ name, className }) => {
  const iconName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  const LucideIcon = LucideIcons[iconName] || LucideIcons.HelpCircle;
  return <LucideIcon className={className} />;
};

const CotizacionPremiumDetail = ({ esOportunidad = false }) => {
  const { numReg } = useParams();
  const navigate = useNavigate();
  const { 
    crearNuevaVersion, 
    copiarCotizacion, // Extraer la función de copia
    eliminarCotizacion, 
    isPending 
  } = useCotizacionAcciones(numReg);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const quillRef = useRef(null);

  // State from Drawer logic
  const [gruposSuministros, setGruposSuministros] = useState({ equipos: {}, materiales: {} });
  const [gruposServicios, setGruposServicios] = useState({});
  const [expandedCategories, setExpandedCategories] = useState(['Suministros', 'Servicios', 'Condiciones', 'Cliente']);
  const [generalConditions, setGeneralConditions] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  
  const [subBloquesExpandidos, setSubBloquesExpandidos] = useState({
    equipos: true,
    materiales: true
  });

  const [gruposExpandidos, setGruposExpandidos] = useState({});

  const toggleSubBloque = (bloque) => {
    setSubBloquesExpandidos(prev => ({ ...prev, [bloque]: !prev[bloque] }));
  };

  const toggleGrupo = (grupoId) => {
    setGruposExpandidos(prev => ({ ...prev, [grupoId]: !prev[grupoId] }));
  };

  const [nuevoGrupoTemp, setNuevoGrupoTemp] = useState({ activo: false, tipo: null, nombre: '', cantidad: 1 });

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
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [archivoNombreVisual, setArchivoNombreVisual] = useState("");

  // MENSAJES
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedType, setSelectedType] = useState('N'); // N, L, C, M
  const [isAlert, setIsAlert] = useState(false); // S o N

  // Modals state
  const [openGrupoModal, setOpenGrupoModal] = useState(false);
  const [openItemModal, setOpenItemModal] = useState(false);
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [itemActivo, setItemActivo] = useState(null);
  const [openRegistroItem, setOpenRegistroItem] = useState(false);

  const PIPELINE = [
    { id: 'Oportunidad', label: 'Oportunidad', color: 'bg-blue-500' },
    { id: 'En Elaboración', label: 'Elaboración', color: 'bg-amber-500' },
    { id: 'Enviada', label: 'Enviada', color: 'bg-indigo-500' },
    { id: 'Adjudicada', label: 'Adjudicada', color: 'bg-green-600' },
    { id: 'Perdida', label: 'Perdida', color: 'bg-red-500' }
  ];

  // ==============================
  // CONTROL DE EDICIÓN POR ENVÍO
  // ==============================
  const envio = Number(data?.envio ?? 0);

  // Editable solo si envio es 0, 1 o 2 (ajusta según tu lógica de negocio)
  const canEdit = envio !== 3;

  // Solo lectura cuando envio es 3
  const isReadOnly = !canEdit;

  // Handler único para edición de campos de cabecera
  const handleFieldChange = (field, value) => {
    if (!canEdit) {
      toast.warn("Edición bloqueada: envío finalizado");
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
      const endpoint = esOportunidad ? `oportunidades/modal/${numReg}/` : `cotizaciones/modal/${numReg}/`;
      const res = await api.get(endpoint);
      setData(res.data);
      setGeneralConditions(res.data.acu_e || '');
      setCurrentStatus(res.data.estado_nombre || 'Pendiente');

      // 2. Suministros
      const sumRes = await api.get(`cotizacion/${numReg}/suministros/`);
      const sumRows = Array.isArray(sumRes.data) ? sumRes.data : [];
      setGruposSuministros(mapSuministrosBackendToState(sumRows));

      // 3. Servicios (simulado o endpoint real si existe)
      // const srvRes = await api.get(`cotizacion/${numReg}/servicios/`);
      // setGruposServicios(mapServiciosBackendToState(srvRes.data));

    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Error al cargar la información");
    } finally {
      setLoading(false);
    }
  };

  const renderGrupoSuministro = (grupo, gIdx) => {
    // Estado para el colapso individual del grupo
    const isExpanded = gruposExpandidos[grupo.cog] !== false;

    return (
      <motion.div 
        layout
        key={grupo.cog || `grupo-${gIdx}`} 
        className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 shadow-sm"
      >
        {/* Cabecera del Grupo */}
        <div 
          onClick={() => toggleGrupo(grupo.cog)}
          className="group cursor-pointer px-4 py-2 flex justify-between items-center hover:bg-gray-50/50 transition-colors border-b border-transparent"
        >
          <div className="flex items-center gap-3">
            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
              <Icon name="chevron-down" className="h-3.5 w-3.5 text-gray-400" />
            </div>
            
            <div className="flex flex-col">
              <span className="font-black text-gray-800 text-[12px] uppercase tracking-tight leading-none">
                {grupo.titulo}
              </span>
            </div>

            {/* CANTIDAD ITEMS */}
            <span className="text-[11px] text-gray-600 font-medium bg-gray-100 px-1.5 rounded">
              {grupo.items.length} Items
            </span>

            {/* BOTÓN TOTAL POR GRUPO */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                // Aquí iría tu lógica para disparar el cálculo total
                console.log("Calculando total para grupo:", grupo.cog);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-100 bg-white hover:border-cyan-300 hover:bg-cyan-50 transition-all group/btn"
            >
              <Icon name="calculator" className="h-3 w-3 text-gray-600 group-hover/btn:text-cyan-700" />
              <span className="text-[9px] font-black uppercase text-gray-500 group-hover/btn:text-cyan-700">Total Grupo</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* CANTIDAD GRUPO */}
            <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md">
              <span className="text-[9px] font-black text-indigo-500 uppercase">Cant:</span>
              <span className="text-[11.5px] font-black text-indigo-700">
                {grupo.cabecera?.can || 0} 
              </span>
            </div>

            {/* TOTAL GRUPO */}
            <div className="text-right min-w-[120px] flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">
                  Total Grupo:
                </span>
                
                <span className="text-[11.5px] font-black text-gray-900 uppercase tracking-tight">
                  {formatMoney(
                    (Number(grupo.totalGrupo) || 0) * (Number(grupo.cabecera?.can) || 1)
                  )}
                </span>
              </div>
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
              {/* Tabla de Items: Sin bordes laterales para mayor limpieza */}
              <div className="w-full overflow-x-auto border-t border-gray-100">
                <table className="min-w-full table-fixed">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="w-[20%] px-4 py-1.5 text-left text-[9px] font-bold text-gray-400 uppercase">P/N</th>
                      <th className="w-[35%] px-4 py-1.5 text-left text-[9px] font-bold text-gray-400 uppercase">Descripción</th>
                      <th className="w-[10%] px-4 py-1.5 text-center text-[9px] font-bold text-gray-400 uppercase">Cant</th>
                      <th className="w-[15%] px-4 py-1.5 text-right text-[9px] font-bold text-gray-400 uppercase">Costo U.</th>
                      <th className="w-[15%] px-4 py-1.5 text-right text-[9px] font-bold text-gray-400 uppercase">Total</th>
                      <th className="w-[5%] px-4 py-1.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {grupo.items.map(item => renderItemRow(item, false))}
                    {grupo.items.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-4 py-6 text-center">
                          <span className="text-[10px] text-gray-400 italic">No hay ítems registrados</span>
                        </td>
                      </tr>
                    )}
                    {/* 🚀 NUEVA FILA: AGREGADO RÁPIDO DE ÍTEM */}
                    <tr className="bg-indigo-50/20">
                      <td className="px-4 py-2 text-indigo-400 font-black text-center">+</td>
                      <td className="px-4 py-2" colSpan={4}>
                        <input 
                          type="text"
                          placeholder="ESCRIBE PRODUCTO Y PRESIONA ENTER..."
                          className="w-full bg-transparent border-none outline-none text-[10px] font-bold uppercase text-indigo-700 placeholder:text-indigo-300"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              handleAgregarItem({ 
                                descripcion: e.target.value.toUpperCase(),
                                cantidad: 1,
                                ventaPrecio: 0,
                                cog_override: grupo.cog
                              });
                              e.target.value = '';
                            }
                          }}

                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Footer del Grupo: Acciones sutiles */}
              <div className="px-4 py-2 border-t border-gray-50 flex justify-between items-center bg-gray-50/20">
                <button 
                  onClick={(e) => { e.stopPropagation(); setGrupoActivo(grupo.cog); setOpenItemModal(true); }} 
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase flex items-center gap-1 transition-colors"
                >
                  + Agregar elemento
                </button>
                
                <div className="flex gap-1">
                  <button className="p-1 text-gray-300 hover:text-gray-500 transition-colors">
                    <Icon name="settings-2" className="h-3 w-3" />
                  </button>
                  <button className="p-1 text-gray-300 hover:text-red-400 transition-colors">
                    <Icon name="trash-2" className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const EditableGroupRow = ({ tipo, onSave }) => {
    const [tempData, setTempData] = useState({ titulo: '', cantidad: 1 });
    const isEquipos = tipo === '01';

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && tempData.titulo.trim()) {
        onSave({
          nombre: tempData.titulo.toUpperCase(),
          cantidad: tempData.cantidad,
          tipo: tipo
        });
        setTempData({ titulo: '', cantidad: 1 }); // Reset
      }
    };

    return (
      <div className="bg-white border border-indigo-200 rounded-lg overflow-hidden transition-all duration-200 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 mb-4">
        <div className="px-4 py-2 flex justify-between items-center bg-indigo-50/10 border-b border-transparent">
          <div className="flex items-center gap-3 flex-1">
            <div className="transition-transform duration-200 rotate-0">
              <Icon name="plus" className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            
            <div className="flex flex-col flex-1 max-w-[300px]">
              <input
                type="text"
                placeholder="NOMBRE DE LA NUEVA PARTIDA..."
                className="bg-transparent border-none outline-none font-black text-gray-800 text-[12px] uppercase tracking-tight leading-none w-full placeholder:text-gray-400 focus:ring-0 px-0"
                value={tempData.titulo}
                onChange={(e) => setTempData({ ...tempData, titulo: e.target.value })}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>

            {/* CANTIDAD ITEMS (Simulado) */}
            <span className="text-[11px] text-gray-600 font-medium bg-gray-100 px-1.5 rounded opacity-50">
              0 Items
            </span>

            {/* BOTÓN TOTAL POR GRUPO (Simulado) */}
            <button 
              disabled
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-100 bg-white opacity-50 cursor-not-allowed"
            >
              <Icon name="calculator" className="h-3 w-3 text-gray-400" />
              <span className="text-[9px] font-black uppercase text-gray-400">Total Grupo</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* CANTIDAD GRUPO (Editable) */}
            <div className="flex items-center gap-1.5 ml-2 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md focus-within:border-indigo-400">
              <span className="text-[9px] font-black text-indigo-500 uppercase">Cant:</span>
              <input 
                type="number"
                min="1"
                className="w-10 bg-transparent border-none outline-none text-[11.5px] font-black text-indigo-700 text-center focus:ring-0 p-0"
                value={tempData.cantidad}
                onChange={(e) => setTempData({ ...tempData, cantidad: parseInt(e.target.value) || 1 })}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* TOTAL GRUPO (Simulado) */}
            <div className="text-right min-w-[120px] flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">
                  Total Grupo:
                </span>
                <span className="text-[11.5px] font-black text-gray-400 uppercase tracking-tight">
                  $0.00
                </span>
              </div>
            </div>
            
            {/* INSTRUCCIÓN VISUAL */}
            <div className="text-right flex justify-end ml-2">
               <span className="text-[8px] font-bold text-indigo-500 uppercase bg-indigo-50 px-2 py-1 rounded border border-indigo-100 animate-pulse">
                 ↵ Enter
               </span>
            </div>
          </div>
        </div>
      </div>
    );
  };



  const mapSuministrosBackendToState = (rows = []) => {
    const estructura = { equipos: {}, materiales: {} };

    if (!Array.isArray(rows) || rows.length === 0) return estructura;

    rows.forEach((row) => {
      const categoria = row.mov === '02' ? 'materiales' : 'equipos';
      const grupoId = row.cog;

      if (!estructura[categoria][grupoId]) {
        estructura[categoria][grupoId] = {
          id: grupoId,
          cog: grupoId,
          mov: row.mov,
          titulo: row.nog || "",
          totalGrupo: 0,
          cabecera: null, // Inicializamos cabecera
          items: []
        };
      }

      if (row.nig === 0) {
        // Guardamos toda la fila nig=0 en 'cabecera' para que el render lo encuentre
        estructura[categoria][grupoId].titulo = row.nog;
        estructura[categoria][grupoId].totalGrupo = Number(row.tot || 0);
        estructura[categoria][grupoId].cabecera = {
          ...row,
          can: Number(row.can || 0),
          tot: Number(row.tot || 0)
        };
      } else {
        estructura[categoria][grupoId].items.push({
          ...row,
          id: `I-${row.num}`,
          can: Number(row.can || 0),
          val: Number(row.val || 0),
          tot: Number(row.tot || 0),
        });
      }
    });

    return estructura;
  };

  const toggleCategory = (cat) => {
    setExpandedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // SUMINISTROS
  const fetchSuministros = async () => {
    try {
      const res = await api.get(`cotizacion/${numReg}/suministros/`);
      const dataPlana = res.data;

      // Transformamos el array plano de Django al objeto agrupado que usa tu UI
      const agrupados = dataPlana.reduce((acc, curr) => {
        const { cog, nig, nog, can, id } = curr;
        
        if (nig === 0) {
          // Es una cabecera de grupo
          acc[cog] = {
            ...curr,
            id: id,          // ID de DB para el PUT
            titulo: nog,     // Mapeo para tu UI
            cantidad: can,   // Mapeo para tu UI
            items: acc[cog]?.items || []
          };
        } else {
          // Es un ítem
          if (!acc[cog]) acc[cog] = { items: [] };
          acc[cog].items.push(curr);
        }
        return acc;
      }, {});

      setGruposSuministros(agrupados);
    } catch (error) {
      console.error("Error cargando suministros:", error);
    }
  };

  // Cargar al montar el componente
  useEffect(() => {
    if (numReg) fetchSuministros();
  }, [numReg]);

  const handleCalcularTotalGrupo = (cog) => {
    // 1. Buscamos el grupo en nuestro estado actual
    // Buscamos tanto en equipos como en materiales
    const grupo = gruposSuministros.equipos[cog] || gruposSuministros.materiales[cog];
    
    if (!grupo) return;

    // 2. Extraemos la cantidad de la cabecera (nig = 0)
    const cantidadGrupo = parseFloat(grupo.cabecera?.can || 0);
    
    if (cantidadGrupo === 0) {
      toast.warning(`La cantidad del grupo ${cog} es 0. No se puede calcular el total.`);
      return;
    }

    // 3. Calculamos la suma de los totales de los ítems (nig > 0)
    const sumaItems = grupo.items.reduce((acc, item) => acc + parseFloat(item.tot || 0), 0);

    // 4. El total del grupo según tu lógica de SQL (Cantidad Grupo * Suma de Items o similar)
    // Aquí ajusta según tu regla de negocio:
    const nuevoTotal = sumaItems * cantidadGrupo;

    console.log(`Calculando para ${cog}: Cant (${cantidadGrupo}) x Suma Items (${sumaItems}) = ${nuevoTotal}`);
    
    // 5. Aquí deberías disparar la actualización a tu API o estado local
    // Ejemplo de actualización local (depende de cómo manejes el setGruposSuministros):
    /*
    actualizarTotalEnDB({
      num_reg: numReg,
      cog: cog,
      total: nuevoTotal
    });
    */

    toast.success(`Total del grupo ${grupo.titulo} recalculado.`);
  };

  const handleSaveNuevoGrupoInline = async () => {
    if (!nuevoGrupoTemp.nombre.trim()) {
      toast.warning("El nombre de la partida es obligatorio");
      return;
    }

    try {
      const payload = {
        num_reg: numReg,
        mov: nuevoGrupoTemp.tipo === 'materiales' ? '02' : '01',
        nog: nuevoGrupoTemp.nombre.toUpperCase(),
        can: nuevoGrupoTemp.cantidad || 1,
        // Mantenemos tu lógica de inicialización en 0 para partidas nuevas
        puc: 0, val: 0, tot: 0, nig: 0, cod: '0' 
      };

      const res = await api.post(`cotizacion/suministros/`, payload);
      
      if (res.status === 201 || res.status === 200) {
        toast.success("Partida creada correctamente");
        setNuevoGrupoTemp({ activo: false, tipo: null, nombre: '', cantidad: 1 });
        loadAllData(); // Refrescamos para ver la nueva partida en la lista
      }
    } catch (err) {
      console.error("Error al crear grupo:", err);
      toast.error("No se pudo crear la partida");
    }
  };

  const handleAgregarGrupoSuministro = async (form) => {
    try {
      // 1. DETERMINAR EL COSTO DE ENVÍO CON FALLBACK (Tu lógica original)
      const envioGeneral = data?.tven === "T" ? (data?.env_tot || 0) : (data?.env_par || 0);
      const costoEnvioFinal = Number(form.costoEnvio) > 0 ? Number(form.costoEnvio) : Number(envioGeneral);

      let payload = {
        nog: form.nombre.toUpperCase(),
        nig: 0, // Indica que es Cabecera
        can: Number(form.cantidad),
        tot: form.totalGrupo || 0,
        cost_env: costoEnvioFinal,
        env_tot: data?.tven === "T" ? costoEnvioFinal : 0,
        env_par: data?.tven === "P" ? costoEnvioFinal : 0,
        mov: form.tipo, // '01' o '02'
      };

      if (form._key && gruposSuministros[form._key]) {
        // ✏️ EDITAR: Necesitamos el ID numérico de la DB
        const idReal = gruposSuministros[form._key].id;
        payload = { ...payload, id: idReal, cog: form._key };
        
        await api.put(`cotizacion/${numReg}/suministros/`, payload);
        toast.success("Grupo actualizado");
      } else {
        // ➕ CREAR NUEVO: Calculamos el nuevoCog (Tu lógica original)
        const existentes = Object.keys(gruposSuministros)
          .map(k => parseInt(k.substring(0, 2), 10))
          .filter(n => !isNaN(n));
        const maxContador = existentes.length > 0 ? Math.max(...existentes) : 0;
        const nuevoCog = String(maxContador + 1).padStart(2, "0") + form.tipo;
        
        payload = { ...payload, cog: nuevoCog };

        await api.post(`cotizacion/${numReg}/suministros/`, payload);
        toast.success("Grupo creado");
      }

      setOpenGrupoModal(false);
      fetchSuministros(); // Sincroniza con el backend
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar el grupo");
    }
  };

  const handleAgregarItem = async (form) => {
    const activeGrupo = form.cog_override || grupoActivo;
    if (!activeGrupo) {
      toast.error("No hay un grupo activo seleccionado");
      return;
    }

    const esEdicion = Boolean(form.id);

    try {
      const payload = {
        // Si es edición, mandamos el ID para que el PUT sepa qué registro tocar
        ...(esEdicion && { id: form.id }),
        
        cog: activeGrupo, // Vinculamos al grupo actual o al override
        nig: 1,           // Indica que es un Ítem

        
        // Mantenemos tus mapeos de nombres
        cod: (form.codigo || form.cod || "").toUpperCase(),
        des: (form.descripcion || form.des || "").toUpperCase(),
        pro: (form.marca || form.pro || "").toUpperCase(),
        tpr: (form.proveedor || form.tpr || "").toUpperCase(),
        tde: (form.unidad || form.tde || "").toUpperCase(),
        obs: form.observacion || form.obs || "",

        // Valores Numéricos
        can: Number(form.cantidad || 0),
        puc: Number(form.costoPrecio || form.puc || 0),
        tou: Number(form.utilidad || form.tou || 0),
        cau: Number(form.porcentaje || form.cau || 0),
        toc: Number(form.costoTotal || form.toc || 0),
        val: Number(form.ventaPrecio || form.val || 0),
        tot: Number(form.ventaTotal || form.tot || 0),
        cost_c_env: Number(form.costoConEnvio || form.cost_c_env || 0),
        cost_env: Number(form.costoEnvio || form.cost_env || 0),
        por_env: Number(form.porcentajeEnvio || form.por_env || 0),

        // Logística
        ent: form.entrega ? Number(form.entrega) : null,
        enu: form.entrega_uni || form.enu || "D",
        mov: grupoActivo.endsWith("01") ? "01" : "02"
      };

      if (esEdicion) {
        await api.put(`cotizacion/${numReg}/suministros/`, payload);
        toast.success("Ítem actualizado");
      } else {
        await api.post(`cotizacion/${numReg}/suministros/`, payload);
        toast.success("Ítem añadido");
      }

      setOpenItemModal(false);
      setOpenRegistroItem(false);
      fetchSuministros(); // Refrescamos la lista completa
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el ítem");
    }
  };

  // --- INLINE EDITING LOGIC ---
  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setEditForm({ ...item });
  };

  const cancelEditItem = () => {
    setEditingItemId(null);
  };

  const saveEditItem = () => {
    // Implement logic to save to backend
    toast.success("Ítem actualizado localmente (falta conexión a API)");
    // Update local state temporarily
    setGruposSuministros(prev => {
      const newGrupos = { ...prev };
      Object.keys(newGrupos).forEach(grupoId => {
        const itemIndex = newGrupos[grupoId].items.findIndex(i => i.id === editingItemId);
        if (itemIndex > -1) {
          newGrupos[grupoId].items[itemIndex] = { ...editForm };
        }
      });
      return newGrupos;
    });
    setEditingItemId(null);
  };

  const formatMoney = (val) => `$ ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const renderItemRow = (item, isService = false) => {
    if (editingItemId === item.id) {
      return (
        <tr key={item.id && item.id !== 'None' ? item.id : `edit-${item.num || Math.random()}`} className="bg-indigo-50/50">
          <td className="px-3 py-1"><input type="text" className="w-full text-[12px] border-gray-300 rounded px-1 py-0.5" value={editForm.cod || ''} onChange={e => setEditForm({ ...editForm, cod: e.target.value })} /></td>
          <td className="px-3 py-1"><input type="text" className="w-full text-[12px] border-gray-300 rounded px-1 py-0.5" value={editForm.des || ''} onChange={e => setEditForm({ ...editForm, des: e.target.value })} /></td>
          <td className="px-3 py-1"><input type="number" className="w-full text-[12px] border-gray-300 rounded text-center px-1 py-0.5" value={editForm.can || ''} onChange={e => setEditForm({ ...editForm, can: e.target.value })} /></td>
          <td className="px-3 py-1"><input type="number" className="w-full text-[12px] border-gray-300 rounded px-1 py-0.5" value={editForm.val || ''} onChange={e => setEditForm({ ...editForm, val: e.target.value })} /></td>
          <td className="px-3 py-1 text-[12px] font-bold text-gray-900">${(editForm.can * editForm.val).toFixed(2)}</td>
          <td className="px-3 py-1">
            <div className="flex space-x-1">
              <button onClick={saveEditItem} className="text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">OK</button>
              <button onClick={cancelEditItem} className="text-gray-500 bg-gray-200 hover:bg-gray-300 px-2 py-0.5 rounded text-[10px] font-bold">X</button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={item.id && item.id !== 'None' ? item.id : `item-${item.num || Math.random()}`} className="hover:bg-gray-50 cursor-pointer group" onDoubleClick={() => startEditItem(item)}>
        <td className="px-3 py-1 text-[12px] font-bold text-gray-900">{item.cod}</td>
        <td className="px-3 py-1 text-[12px] text-gray-500 line-clamp-1" title={item.des}>{item.des}</td>
        <td className="px-3 py-1 text-[12px] text-gray-900 text-center font-bold">{item.can}</td>
        <td className="px-3 py-1 text-[12px] text-gray-500 font-medium">{formatMoney(item.val)}</td>
        <td className="px-3 py-1 text-[12px] font-black text-gray-900">{formatMoney(item.tot)}</td>
        <td className="px-3 py-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); startEditItem(item); }} className="text-gray-300 hover:text-indigo-600 mr-2"><Icon name="edit-2" className="h-3.5 w-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); /* deleteLogic */ }} className="text-gray-300 hover:text-red-500"><Icon name="trash-2" className="h-3.5 w-3.5" /></button>
        </td>
      </tr>
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
    { id: "D", nombre: "Dias" },
    { id: "S", nombre: "Semanas" },
    { id: "M", nombre: "Meses" },
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
      const { data: res } = await api.get(`cotizaciones/adjuntos/gestion/${numReg}/`);
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

      const { data: res } = await api.post(`cotizaciones/adjuntos/gestion/${numReg}/`, formData);

      if (res.ok) {
        toast.success("Documento vinculado correctamente");
        setDocDescription(""); 
        fetchDocuments(); 
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
    if (!window.confirm(`¿Eliminar permanentemente este documento?`)) return;

    try {
      // Pasamos el ID por la URL como parámetro de consulta (?id=...)
      const { data: res } = await api.delete(`cotizaciones/adjuntos/gestion/${numReg}/?id=${id}`);

      if (res.ok) {
        toast.success("Archivo y registro eliminados");
        fetchDocuments(); 
      }
    } catch (error) {
      console.error("Error al eliminar", error);
      toast.error("No se pudo eliminar el archivo");
    }
  };

  // ==================
  // NOTAS SEGUIMIENTO
  // ==================
  // 1. Cargar Notas
  const fetchNotes = async () => {
    try {
      const { data: res } = await api.get(`cotizaciones/mensajes/gestion/${numReg}/`);
      if (res.ok) {
        const mapeados = res.registros.map(m => {
          let alertDateObj = null;

          if (m.alerta_fecha) {
            // m.alerta_fecha viene como "2026-05-14 16:11:49"
            const [fecha, hora] = m.alerta_fecha.split(' ');
            const [year, month, day] = fecha.split('-').map(Number);
            const [hrs, mins, secs] = hora.split(':').map(Number);

            // IMPORTANTE: month - 1 porque en JS los meses van de 0 a 11
            // Al usar este constructor con números, JS SIEMPRE usa la hora local del sistema
            alertDateObj = new Date(year, month - 1, day, hrs, mins, secs);
          }

          return {
            id: m.id,
            timestamp: m.dat,
            content: m.msj,
            user_role: m.cod,
            type: m.tipo,
            is_alert: m.alerta === "S",
            // Guardamos el objeto Date real para que getAlertUrgency funcione bien
            alert_date: alertDateObj, 
            is_resolved: m.alerta_completada === "1" 
          };
        });
        setNotes(mapeados);
      }
    } catch (err) {
      console.error("Error cargando notas", err);
    }
  };

  // Esta es la función que llama el botón "Marcar Listo"
  const handleResolveReminderInside = async (id) => {
    try {
      const { data: res } = await api.patch(`cotizaciones/mensajes/gestion/${numReg}/`, { id });
      if (res.ok) {
        toast.success("Tarea completada");
        fetchNotes(); 
      }
    } catch (err) {
      toast.error("No se pudo actualizar");
    }
  };

  // 2. Agregar Nota Actualizada
  const handleAddNote = React.useCallback(async (textOverride) => {
    let text = (typeof textOverride === 'string' ? textOverride : newNote).trim();
    if (!text) return;

    const commandMap = {
      '/llamada': 'L', '/ll': 'L',
      '/correo': 'C',  '/co': 'C',
      '/mensaje': 'M', '/me': 'M',
      '/nota': 'N',    '/no': 'N'
    };

    let finalType = selectedType || "N"; 
    let finalMsj = text;

    if (text.startsWith('/')) {
      const firstSpaceIndex = text.indexOf(' ');
      const cmd = firstSpaceIndex !== -1 
        ? text.substring(0, firstSpaceIndex).toLowerCase() 
        : text.toLowerCase();
      
      if (commandMap[cmd]) {
        finalType = commandMap[cmd];
        finalMsj = firstSpaceIndex !== -1 ? text.substring(firstSpaceIndex).trim() : '';
      }
    }

    if (!finalMsj) {
      const defaults = { 
        'L': 'Llamada registrada', 
        'C': 'Correo enviado', 
        'M': 'Mensaje enviado', 
        'N': 'Nota de seguimiento' 
      };
      finalMsj = defaults[finalType] || 'Registro de actividad';
    }

    try {
      // PREPARACIÓN DE LA FECHA:
      // Si isAlert es un objeto Date, lo formateamos para el backend.
      // Usamos una función auxiliar para obtener "YYYY-MM-DD HH:mm:ss"
      const fechaFormateada = (isAlert instanceof Date) 
        ? isAlert.toLocaleString('sv-SE').replace('T', ' ') 
        : null;

      const payload = {
        msj: finalMsj, 
        tipo: finalType,
        alerta: isAlert ? "S" : "N",
        alerta_fecha: fechaFormateada // Enviamos la fecha y hora seleccionada
      };

      const { data: res } = await api.post(`cotizaciones/mensajes/gestion/${numReg}/`, payload);

      if (res.ok) {
        toast.success(isAlert ? "Alerta programada" : "Registro guardado");
        setNewNote('');
        setIsAlert(null);    // IMPORTANTE: Volvemos a null para que la campana se apague
        setSelectedType('N'); 
        fetchNotes();
      }
    } catch (err) {
      console.error("Error en handleAddNote:", err);
      toast.error("Error al guardar");
    }
  }, [newNote, selectedType, isAlert, numReg, fetchNotes]);

  const handleSaveQuickNote = (text) => {
    if (!text.trim()) return;
    // Forzamos el tipo a 'N' para trazabilidad rápida y guardamos
    handleAddNote(text);
  };

  // 3. NUEVO: Función para completar tarea (Check)
  const handleManageAlert = async (note, action) => {
    try {
      let payload = { id: note.id };

      if (action === 'complete') {
        payload.completar = true; // El backend usará timezone.now()
      } else if (action === 'reprogram') {
        const nuevaFecha = prompt("Ingrese la nueva fecha (YYYY-MM-DD HH:mm)");
        if (!nuevaFecha) return;
        payload.nueva_fecha = nuevaFecha;
      }

      const { data: res } = await api.patch(`cotizaciones/mensajes/gestion/${numReg}/`, payload);
      
      if (res.ok) {
        toast.success(action === 'complete' ? "¡Alerta completada!" : "Alerta reprogramada");
        fetchNotes(); 
      }
    } catch (err) {
      toast.error("Error al actualizar");
    }
  };

  // Urgencia de Alertas
  const getAlertUrgency = (alertDate, isDone) => {
    if (!alertDate || isDone) return 'none';
    
    // Creamos la fecha. Al venir con "/" desde fetchNotes, JS la toma como local.
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

  const getTypeConfig = (type) => {
    const configs = {
      'L': { icon: 'phone', color: 'text-blue-500', bg: 'bg-blue-50' },
      'C': { icon: 'mail', color: 'text-emerald-500', bg: 'bg-emerald-50' },
      'M': { icon: 'send', color: 'text-indigo-500', bg: 'bg-indigo-50' },
      'N': { icon: 'file-text', color: 'text-slate-500', bg: 'bg-slate-50' }
    };
    return configs[type] || configs['N'];
  };

  useEffect(() => {
    if (numReg) fetchNotes();
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
      const response = await api.get("cotizaciones/notas/"); // Asumiendo que usas una instancia de axios configurada
      // Filtramos solo las que están activas (activo === "1")
      setNotasComunes(response.data.filter(n => n.activo === "1"));
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
        nombre: texto,
        activo: "1"
      };
      const response = await api.post("cotizaciones/notas/", nuevaNota);
      
      // Si se crea con éxito, la añadimos al editor y a la lista local
      setGeneralConditions(prev => prev ? `${prev}\n- ${texto}` : `- ${texto}`);
      setNotasComunes(prev => [...prev, response.data]);
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


  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full max-w-[1920px] mx-auto animate-in fade-in duration-700 font-sans">

      {/* 70% MAIN PANEL - Scrollable Content */}
      <div className="lg:w-8/12 flex flex-col space-y-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden font-sans">
          <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              {/* Botón Atrás */}
              <button
                onClick={() => navigate('/dashboard/aprobacion-cotizacion')}
                className="mr-5 p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-gray-100 group"
              >
                <Icon name="arrow-left" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </button>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none uppercase">
                    {data.numero}
                  </h1>

                  {/* Status Select con mejor estilo */}
                  <div className="relative group">
                    <button className={`flex items-center px-3 py-1 rounded-full text-[9px] font-black text-white transition-all shadow-sm uppercase tracking-widest ${PIPELINE.find(s => s.label === currentStatus)?.color || 'bg-indigo-600'} hover:brightness-105 border border-white/20`}>
                      <Icon name="refresh-cw" className="h-2.5 w-2.5 mr-1.5" />
                      {currentStatus}
                    </button>
                    <select
                      value={currentStatus}
                      onChange={(e) => setCurrentStatus(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    >
                      {PIPELINE.map(s => <option key={s.id} value={s.label}>{s.label.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                {/* LÍNEA DE DATOS EDITABLES */}
                <div className="flex items-center text-[12px] gap-x-4">

                  {/* CLIENTE (Editable) */}
                  <div className="group relative flex items-center cursor-pointer px-2 py-1 -ml-2 rounded-lg hover:bg-gray-50 transition-all">
                    <Icon name="briefcase" className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                    <span className="font-bold text-gray-800 uppercase tracking-tight truncate max-w-[200px]">
                      {data.cliente_nombre || 'SIN CLIENTE'}
                    </span>
                    <Icon name="pencil" className="h-2.5 w-2.5 ml-2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <input
                      type="text"
                      className="absolute inset-0 opacity-0 focus:opacity-100 bg-white border border-indigo-300 rounded-lg px-2 font-bold text-gray-800 uppercase outline-none"
                      defaultValue={data.cliente_nombre}
                      onBlur={(e) => {/* Lógica para guardar nombre cliente */ }}
                    />
                  </div>

                  {/* REPRESENTANTE (Editable) */}
                  <div className="group relative flex items-center cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-50 transition-all">
                    <Icon name="user" className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                    <span className="font-bold text-gray-800 uppercase tracking-tight truncate max-w-[150px]">
                      {data.nombr || 'SIN NOMBRE'}
                    </span>
                    <Icon name="pencil" className="h-2.5 w-2.5 ml-2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <input
                      type="text"
                      className="absolute inset-0 opacity-0 focus:opacity-100 bg-white border border-indigo-300 rounded-lg px-2 font-bold text-gray-800 uppercase outline-none"
                      defaultValue={data.nombr}
                      onBlur={(e) => {/* Lógica para guardar representante */ }}
                    />
                  </div>

                  {/* ÁREA COMERCIAL (Select Directo) */}
                  <div className="group relative flex items-center cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-50 transition-all">
                    <Icon name="layers" className="h-3.5 w-3.5 mr-1.5 text-teal-400" />
                    <span className="font-bold text-gray-800 uppercase tracking-tight">
                      {data.area_nombre || 'Seleccionar Área'}
                    </span>
                    <Icon name="chevron-down" className="h-3 w-3 ml-1 text-gray-400" />

                    <select
                      value={data.area_nombre}
                      onChange={(e) => {/* Lógica para guardar nueva área */ }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    >
                      <option value="Proyectos">PROYECTOS</option>
                      <option value="Ingeniería">INGENIERÍA</option>
                      <option value="Ventas">VENTAS</option>
                    </select>
                  </div>

                  {/* TIPO Y TIPO VENTA*/}
                  <div className="group relative flex items-center cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-50 transition-all whitespace-nowrap">
                    <Icon name="tag" className="h-3.5 w-3.5 mr-1.5 text-blue-500" />

                    <div className="flex items-center flex-nowrap">
                      {/* Selector Principal (Tipo) */}
                      <div className="relative flex items-center shrink-0">
                        <span className="font-bold text-gray-800 uppercase tracking-tight">
                          {tipoOptions.find(o => o.id === data.cotit)?.nombre || 'Tipo'}
                        </span>

                        <select
                          value={data.cotit}
                          onChange={(e) => handleFieldChange("cotit", e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
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
                              value={data.tven}
                              onChange={(e) => handleFieldChange("tven", e.target.value)}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            >
                              {tipoVentaOptions.map(o => <option key={o.id} value={o.id}>{o.nombre.toUpperCase()}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <Icon name="chevron-down" className="h-3 w-3 ml-1 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.success("Cambios guardados")}
                className="flex items-center px-4 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-[10px] font-black text-emerald-700 hover:bg-emerald-100/50 hover:border-emerald-300 hover:shadow-sm transition-all h-[42px] uppercase group"
              >
                <Icon name="save" className="h-3.5 w-3.5 mr-2 text-emerald-600 group-hover:scale-110 transition-transform" />
                Guardar
              </button>
              <button
                onClick={() => toast.success("Se haran reportes WORD y PDF (API pendiente)")}
                className="flex items-center px-4 py-2 bg-sky-50/70 border border-sky-200 rounded-xl text-[10px] font-black text-sky-700 hover:bg-sky-100/70 hover:border-sky-300 hover:shadow-sm transition-all h-[42px] uppercase group"
              >
                <Icon name="file-text" className="h-3.5 w-3.5 mr-2 text-sky-600 group-hover:scale-110 transition-transform" />
                Reporte
              </button>
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
                {Object.keys(gruposSuministros.equipos || {}).length + Object.keys(gruposSuministros.materiales || {}).length} Grupos
              </span>
            </div>
          </button>

          <AnimatePresence>
            {expandedCategories.includes('Suministros') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 space-y-12">
                  {/* BLOQUE EQUIPOS (MOV 01) - Nivel 2 */}
                  <div className="space-y-4">
                    <div 
                      onClick={() => toggleSubBloque('equipos')}
                      className="flex items-center justify-between px-2 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-3.5 bg-indigo-500 rounded-full transition-all ${subBloquesExpandidos.equipos ? 'opacity-100' : 'opacity-30'}`} />
                        <h4 className="text-[12px] font-black text-gray-700 uppercase tracking-widest">Equipos</h4>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {Object.keys(gruposSuministros.equipos || {}).length}
                        </span>
                      </div>
                      <Icon name={subBloquesExpandidos.equipos ? 'chevron-down' : 'chevron-right'} className="h-3.5 w-3.5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    
                    {/* DENTRO DEL BLOQUE DE EQUIPOS (MOV 01) */}
                    <AnimatePresence>
                      {subBloquesExpandidos.equipos && (
                        <motion.div className="space-y-4 ml-1">
                          
                          {/* 🚀 EL "ESPEJO" PARA AGREGAR NUEVOS GRUPOS */}
                          <EditableGroupRow 
                            tipo="01" 
                            onSave={(data) => handleAgregarGrupoSuministro(data)} 
                          />

                          <div className="space-y-4">
                            {Object.values(gruposSuministros.equipos || {}).map((grupo, idx) => 
                              renderGrupoSuministro(grupo, idx)
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* BLOQUE MATERIALES (MOV 02) - Nivel 2 */}
                  <div className="space-y-4">
                    <div 
                      onClick={() => toggleSubBloque('materiales')}
                      className="flex items-center justify-between px-2 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        {/* Indicador visual en Ámbar */}
                        <div className={`w-1 h-3.5 bg-amber-500 rounded-full transition-all ${subBloquesExpandidos.materiales ? 'opacity-100' : 'opacity-30'}`} />
                        <h4 className="text-[12px] font-black text-gray-700 uppercase tracking-widest">Materiales</h4>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {Object.keys(gruposSuministros.materiales || {}).length}
                        </span>
                      </div>
                      <Icon 
                        name={subBloquesExpandidos.materiales ? 'chevron-down' : 'chevron-right'} 
                        className="h-3.5 w-3.5 text-gray-300 group-hover:text-amber-500 transition-colors" 
                      />
                    </div>

                    <AnimatePresence>
                      {subBloquesExpandidos.materiales && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4 ml-1"
                        >
                          {/* QUICK ADD ARRIBA: Para acceso inmediato en Materiales */}
                          <QuickAddGroupRow 
                            tipo="materiales" 
                            onAdd={(data) => handleAgregarGrupoSuministroDirecto('02', data)} 
                          />

                          {/* Renderizado de Grupos de Materiales */}
                          <div className="space-y-4">
                            {Object.values(gruposSuministros.materiales || {}).map((grupo, idx) => (
                              renderGrupoSuministro(grupo, idx)
                            ))}
                          </div>
                          
                          {/* Empty State mejorado */}
                          {Object.keys(gruposSuministros.materiales || {}).length === 0 && (
                            <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                              <Icon name="package-2" className="h-5 w-5 text-gray-300 mx-auto mb-2" />
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                                No hay materiales registrados en esta cotización.
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SERVICIOS SECTION */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleCategory('Servicios')}
            className="flex items-center justify-between w-full px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200 rounded-t-xl"
          >
            <div className="flex items-center">
              <Icon name={expandedCategories.includes('Servicios') ? 'chevron-down' : 'chevron-right'} className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-bold text-gray-900 uppercase">Servicios</h3>
              <span className="ml-4 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-md uppercase">
                {Object.keys(gruposServicios).length} Grupos
              </span>
            </div>
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
                  {/* SUB-CATEGORÍAS DE SERVICIOS */}
                  <div className="flex space-x-6 border-b border-gray-200 px-2">
                    <button className="text-[11px] font-black text-indigo-600 border-b-2 border-indigo-600 pb-3 tracking-widest uppercase">Mano de Obra</button>
                    <button className="text-[11px] font-bold text-gray-400 hover:text-gray-800 pb-3 tracking-widest uppercase transition-colors">Gastos Servicio</button>
                    <button className="text-[11px] font-bold text-gray-400 hover:text-gray-800 pb-3 tracking-widest uppercase transition-colors">Otros</button>
                  </div>

                  <div className="space-y-8">
                    {Object.keys(gruposServicios).length === 0 ? (
                      <div className="text-center py-6 text-gray-500 text-sm italic">
                        No hay grupos de servicios registrados. Crea uno nuevo abajo.
                      </div>
                    ) : (
                      Object.values(gruposServicios).map((grupo, gIdx) => (
                        <div key={grupo.cog && grupo.cog !== 'None' ? grupo.cog : `grupo-srv-${gIdx}`} className="bg-white rounded-lg border border-gray-200 overflow-visible relative">
                          {/* Logic for service groups will go here */}
                        </div>
                      ))
                    )}
                    <div className="flex justify-center pt-2">
                      <button
                        className="text-xs font-bold text-gray-600 border-2 border-dashed border-gray-300 bg-white hover:border-indigo-400 hover:text-indigo-600 px-6 py-2.5 rounded-xl flex items-center transition-all group"
                      >
                        <Icon name="folder-plus" className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        NUEVO GRUPO DE SERVICIOS
                      </button>
                    </div>
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
                      key={nota.codigo || nota.nombre} 
                      onClick={() => {
                        const quill = quillRef.current.getEditor();
                        const range = quill.getSelection() || { index: quill.getLength() };
                        quill.insertText(range.index, `${nota.nombre}\n`, { bold: false });
                        quill.formatLine(range.index, nota.nombre.length, 'list', 'bullet');
                        quill.setSelection(range.index + nota.nombre.length + 1);
                      }}
                      className="flex items-start p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                    >
                      <div className="mt-0.5 h-4 w-4 rounded-lg border border-gray-200 flex items-center justify-center group-hover:border-indigo-500 group-hover:bg-indigo-600 transition-all">
                        <Icon name="plus" className="h-2.5 w-2.5 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                      <span className="ml-3 text-[11px] font-semibold text-slate-600 group-hover:text-slate-900 leading-tight">
                        {nota.nombre}
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
                      placeholder="Escribir y guardar nota..."
                      className="w-full text-[11px] pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      onKeyDown={(e) => {
                        if(e.key === 'Enter' && e.target.value.trim()) {
                          handleAddNuevaNota(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <Icon name="plus-circle" className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300 group-focus-within:text-indigo-500" />
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
                  <button 
                    onClick={() => setGeneralConditions('')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black text-rose-500 hover:bg-rose-50 transition-all uppercase tracking-tighter"
                  >
                    <Icon name="trash-2" className="h-3 w-3" />
                    Borrar Todo
                  </button>
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
                      placeholder="Las notas aparecerán aquí. Puedes editarlas libremente..."
                      modules={{
                        toolbar: [
                          ['bold', 'italic', 'underline'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          [{ 'indent': '-1'}, { 'indent': '+1' }],
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
                  <div className="px-4 py-3">
                    <p className="text-[11px] text-gray-600 leading-tight">¿Confirmar la generación de una <span className="font-bold text-gray-900 underline decoration-amber-200 underline-offset-2">copia exacta</span> de esta cotización?</p>
                  </div>
                  <div className="flex items-center justify-end gap-3 px-4 pb-3">
                    <button onClick={closeToast} className="whitespace-nowrap text-[9px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">Cancelar</button>
                    <button
                      onClick={() => { copiarCotizacion.mutate(); closeToast(); }}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-[9px] font-black rounded-xl uppercase shadow-md shadow-amber-200 hover:bg-amber-700 transition-all active:scale-95 whitespace-nowrap"
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
          <button
            onClick={() => {
              toast.error(({ closeToast }) => (
                <div className="flex flex-col min-w-[340px] overflow-hidden rounded-lg">
                  <div className="flex items-center gap-3 px-4 py-2 bg-red-50/50 border-b border-red-100">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white shadow-sm border border-red-100">
                      <Icon name="trash" className="h-3.5 w-3.5 text-red-600" />
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
                <Icon name="pencil" className="h-2.5 w-2.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="relative min-h-[1.5rem] flex items-center">
                {/* Texto Visual */}
                <p className="text-[10.5px] font-black uppercase leading-snug text-gray-900 break-words w-full">
                  {data.referencia || 'SIN REFERENCIA ASIGNADA'}
                </p>

                {/* Input Real (Oculto hasta el focus) */}
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
                />
              </div>
            </div>

            {/* Cards de Datos */}
            <div className="grid grid-cols-3 gap-3">
              {/* Probabilidad */}
              <CompactField label="Probabilidad" className="group relative">
                <div className="relative">
                  <SelectField
                    id="prob"
                    inline
                    value={data.prob || ""}
                    onChange={(e) => handleFieldChange("prob", e.target.value)}
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
              <CompactField label="Forma Pago" value={data.fpago} />

              {/* Lugar Entrega */}
              <CompactField label="Lugar Entrega" className="group relative">
                <div className="relative cursor-pointer min-h-[15px] flex items-center">
                  {/* Texto Visual */}
                  <span className="text-[10px] font-black text-gray-900 truncate group-hover:text-gray-900 transition-colors">
                    {data.lugar || '---'}
                  </span>

                  <Icon name="pencil" className="h-2 w-2 ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Input Real */}
                  <input
                    type="text"
                    className="absolute inset-0 w-full h-full opacity-0 focus:opacity-100 bg-white border border-indigo-300 rounded px-1 text-[10px] font-black text-gray-900 uppercase outline-none"
                    defaultValue={data.lugar}
                    onBlur={(e) => handleFieldChange("lugar", e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                  />
                </div>
              </CompactField>

              {/* Moneda */}
              <CompactField label="Moneda" className="group relative">
                <div className="relative">
                  <SelectField
                    id="tmone"
                    inline
                    value={data.tmone || ""}
                    onChange={(e) => handleFieldChange("tmone", e.target.value)}
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
                    {data.tcamb || '0.00'}
                  </span>
                  
                  <Icon name="pencil" className="h-2 w-2 ml-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Input Real (Oculto hasta el focus) */}
                  <input
                    type="number"
                    step="0.001"
                    className="absolute inset-0 w-full h-full opacity-0 focus:opacity-100 bg-white border border-indigo-300 rounded px-1 text-[10px] font-black text-gray-900 outline-none"
                    defaultValue={data.tcamb}
                    onBlur={(e) => handleFieldChange("tcamb", e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                  />
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
                value={data.plazo}
                onValueChange={(e) => handleFieldChange("plazo", e.target.value)}
                unitValue={data.tot_d || ""}
                onUnitChange={(e) => handleFieldChange("tot_d", e.target.value)}
                options={unidadOptions}
                isReadOnly={isReadOnly}
              />

              {/* Entrega Servicios */}
              <CompactTiempoUnidad
                label="Entrega Servicios"
                value={data.por_c}
                onValueChange={(e) => handleFieldChange("por_c", e.target.value)}
                unitValue={data.uni_s || ""}
                onUnitChange={(e) => handleFieldChange("uni_s", e.target.value)}
                options={unidadOptions}
                isReadOnly={isReadOnly}
              />

              {/* Validez de Oferta */}
              <CompactTiempoUnidad
                label="Validez Oferta"
                value={data.valid}
                onValueChange={(e) => handleFieldChange("valid", e.target.value)}
                unitValue={data.val_o || ""} // Generalmente se guarda por separado la unidad de validez
                onUnitChange={(e) => handleFieldChange("val_o", e.target.value)}
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
                        <button 
                          onClick={() => handleDeleteDocument(doc.id)} 
                          className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2"
                        >
                          <Icon name="trash-2" className="h-3 w-3" />
                        </button>
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

        {/* SEGUIMIENTO - MENSAJES */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-[600px]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center text-sm uppercase tracking-wider">
              <Icon name="message-square" className="h-4 w-4 mr-2 text-indigo-500" /> 
              Historial de Seguimiento
            </h3>
            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-100">
              {notes.length} {notes.length === 1 ? 'REGISTRO' : 'REGISTROS'}
            </span>
          </div>

          {/* Cuerpo del Chat */}
          <div className="flex-1 p-3 bg-white overflow-y-auto custom-scrollbar">
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30">
                <Icon name="archive" className="h-8 w-8 mb-2" />
                <p className="text-[10px] uppercase font-bold tracking-widest">Sin actividad</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notes.map((note, index) => {
                  const safeKey = (note.id && note.id !== 'None') ? note.id : `note-${index}`;
                  const config = getTypeConfig(note.type);
                  const isAlert = note.is_alert;
                  const isDone = note.is_resolved;
                  const noteId = note.dat;
                  
                  // Calculamos el nivel de urgencia basado en la nueva columna 'alerta_fecha'
                  const urgency = getAlertUrgency(note.alert_date, isDone);

                  const urgencyStyles = {
                    // Rojo suave para vencidos
                    expired: 'border-red-500 bg-red-50/70 shadow-sm', 
                    
                    // Naranja vibrante pero fondo muy tenue para lo que vence pronto
                    urgent: 'border-orange-400 bg-orange-50/50 animate-pulse-subtle', 
                    
                    // Amarillo/Ámbar cálido para lo programado a futuro
                    normal: 'border-amber-300 bg-amber-50/40', 
                    
                    // Gris neutro para lo completado o notas sin alerta
                    none: isDone 
                      ? 'border-emerald-200 bg-emerald-50/30' // Opcional: un toque verde muy tenue si está listo
                      : 'border-transparent hover:bg-slate-50/80'
                  };

                  return (
                    <div key={safeKey} 
                      className={`group flex items-start gap-3 p-2 rounded-lg transition-all border-l-4 ${urgencyStyles[urgency] || urgencyStyles.none}`}>
                      
                      {/* 1. ICONO DE TIPO */}
                      <div className={`mt-0.5 p-1.5 rounded-md ${config.bg} ${config.color} shadow-sm`}>
                        <Icon name={config.icon} className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* 2. METADATOS */}
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10.5px] font-black text-slate-500 tabular-nums uppercase">
                              {note.timestamp}
                            </span>
                            <span className="text-[10.5px] font-bold text-indigo-600 truncate max-w-[100px]">
                              @{note.user_role}
                            </span>
                            
                            {/* Badge de Tiempo Restante (Solo si es alerta y no está resuelto) */}
                            {isAlert && !isDone && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                                urgency === 'expired' ? 'bg-red-600 text-white' : 
                                urgency === 'urgent' ? 'bg-orange-500 text-white' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {urgency === 'expired' ? 'Vencido' : urgency === 'urgent' ? '¡Pronto!' : 'Programado'}
                              </span>
                            )}
                          </div>

                          {/* 3. ESTADO DINÁMICO */}
                          <div className="flex items-center gap-2">
                            {isAlert && !isDone && (
                              <>
                                {urgency === 'expired' ? (
                                  <button
                                    onClick={() => handleManageAlert(note, 'reprogram')}
                                    className="flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-1 bg-amber-100 text-amber-700 border border-amber-300 rounded hover:bg-amber-200 transition-all shadow-sm"
                                  >
                                    <Icon name="calendar" className="h-2.5 w-2.5" />
                                    Reprogramar
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleManageAlert(note, 'complete')}
                                    className="flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-1 bg-white border border-slate-200 text-slate-500 hover:border-green-500 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                  >
                                    <Icon name="check" className="h-2.5 w-2.5" />
                                    Completar
                                  </button>
                                )}
                              </>
                            )}

                            {isDone && (
                              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded shadow-sm">
                                <Icon name="check-circle" className="h-2.5 w-2.5" />
                                Cumplido
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 4. MENSAJE */}
                        <p className={`text-[12px] leading-snug break-words ${
                          isDone ? 'text-gray-800 font-semibold' : 'text-gray-800 font-semibold'
                        }`}>
                          {note.content}
                        </p>
                        
                        {/* 5. FECHA DE ALERTA (Visualización debajo del mensaje) */}
                        {isAlert && !isDone && note.alert_date && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase italic">
                            <Icon name="clock" className="h-2.5 w-2.5" />
                            Alerta: { 
                              note.alert_date.toLocaleString('es-PE', { 
                                day: '2-digit', 
                                month: 'short', 
                                year: 'numeric', // Muestra el año completo (ej. 2027)
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: true 
                              })
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <TrackingInput 
              value={newNote}               // Estado: string
              onChange={setNewNote}         // Función para actualizar string
              onAddNote={handleAddNote}     // Tu función async que hace el POST
              selectedType={selectedType}   // Estado: 'N', 'L', etc.
              onTypeChange={setSelectedType} // Función para cambiar tipo
              isAlert={isAlert}             // Estado: boolean
              onAlertChange={setIsAlert}    // Función para cambiar alerta
            />
          </div>
        </div>

        {/* SECCIÓN DE TRAZABILIDAD MULTI-TIPO */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden max-h-[600px] transition-all hover:shadow-md">
          
          {/* Header dinámico */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex justify-between items-center">
            <h3 className="font-black text-gray-800 flex items-center text-[11px] uppercase tracking-widest">
              <Icon name="history" className="h-4 w-4 mr-2.5 text-indigo-500" /> 
              Trazabilidad del Registro
            </h3>
            <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-gray-200 uppercase">
              {notes.length + 1} Hitos Totales
            </span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto bg-white custom-scrollbar">
            <div className="relative space-y-0 pb-2">
              {/* Línea conectora */}
              <div className="absolute left-[5px] top-2 bottom-0 w-[2px] bg-gradient-to-b from-indigo-200 via-slate-100 to-transparent"></div>
              
              {/* Mapeo de Hitos */}
              {[...notes].map((n, idx) => {
                // Configuración de tipos
                const typeConfig = {
                  CREACION: { color: 'indigo', icon: 'star', label: 'Apertura de Registro' },
                  SEGUIMIENTO: { color: 'amber', icon: 'message-circle', label: 'Seguimiento Comercial' },
                  ADJUNTOS: { color: 'emerald', icon: 'paperclip', label: 'Gestión de Archivos' },
                  SISTEMA: { color: 'slate', icon: 'settings', label: 'Actividad del Sistema' },
                  ESTADO: { color: 'rose', icon: 'refresh-cw', label: 'Cambio de Estado' }
                };

                const config = typeConfig[n.type] || typeConfig.SISTEMA;
                const colorClass = config.color;

                return (
                  <div key={n.id || idx} className="relative pl-8 pb-6 group">
                    {/* Punto conector dinámico según color */}
                    <div className={`absolute left-0 top-1.5 w-3 h-3 bg-white border-2 border-${colorClass}-500 rounded-full z-10 transition-all group-hover:scale-110 group-hover:shadow-[0_0_0_3px_rgba(var(--${colorClass}-rgb),0.1)]`}></div>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-black text-${colorClass}-700 uppercase tracking-tight`}>
                            {config.label}
                          </span>
                          <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                          <span className="text-[10px] font-bold text-slate-400">@{n.user || 'sistema'}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 tabular-nums">{n.date}</span>
                      </div>
                      
                      {/* Contenedor de contenido según tipo */}
                      <div className={`rounded-xl p-2.5 transition-all ${
                        n.type === 'CREACION' ? 'bg-indigo-50/30 border border-indigo-100/50' : 
                        'bg-transparent group-hover:bg-gray-50/50'
                      }`}>
                        <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">
                          {/* Icono pequeño descriptivo dentro del texto si es ADJUNTO o ESTADO */}
                          {n.type === 'ADJUNTOS' && <Icon name="file-text" className="inline h-3 w-3 mr-1 text-emerald-500" />}
                          {n.type === 'ESTADO' && <Icon name="arrow-right" className="inline h-3 w-3 mr-1 text-rose-500" />}
                          {n.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Input Rápido - Solo para SEGUIMIENTO */}
          <div className="p-4 bg-gray-50/50 border-t border-gray-100">
            <div className="relative group">
              <input 
                type="text"
                placeholder="Escribe un nuevo seguimiento comercial..."
                className="w-full bg-white border border-gray-200 rounded-2xl py-2.5 pl-10 pr-12 text-[11px] focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm"
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && e.target.value.trim()) {
                    // Aquí enviarías el objeto con type: 'SEGUIMIENTO'
                    handleSaveQuickNote(e.target.value, 'SEGUIMIENTO');
                    e.target.value = '';
                  }
                }}
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <Icon name="message-square" className="h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>
            <div className="mt-2.5 flex justify-between items-center px-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center">
                <Icon name="zap" className="h-3 w-3 mr-1 text-amber-400" /> Registro Instantáneo
              </span>
              {/* Leyenda de colores rápida */}
              <div className="flex gap-1">
                {['indigo', 'amber', 'emerald', 'slate', 'rose'].map(c => (
                  <div key={c} className={`w-1.5 h-1.5 rounded-full bg-${c}-400 opacity-60`}></div>
                ))}
              </div>
            </div>
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

      {/* MODALS INTEGRATION */}
      <AgregarGrupoSuministroModal
        open={openGrupoModal}
        onClose={() => setOpenGrupoModal(false)}
        onConfirm={handleAgregarGrupoSuministro}
        tipoVenta={data?.tven}
      />
      <RegistroItemModal
        open={openItemModal}
        onClose={() => setOpenItemModal(false)}
        onConfirm={handleAgregarItem}
        num_reg={numReg}
        tipoVenta={data?.tven}
      />
      <RegistroItemBuscadorModal
        open={openRegistroItem}
        onClose={() => setOpenRegistroItem(false)}
        onSelect={handleAgregarItem}
        num_reg={numReg}
      />
    </div>
  );
};

export default CotizacionPremiumDetail;
