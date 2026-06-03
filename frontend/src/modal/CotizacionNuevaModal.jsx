// src/dashboard/cotizaciones/CotizacionNuevaModal.jsx
import React, { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/InputField";
import SelectField from "@/components/ui/SelectField";
import { CompactTiempoUnidad } from "@/components/ui/CompactTiempoUnidad";
import QuickCreateClienteModal from "@/components/ui/QuickCreateClienteModal";
import ActionMenu from "@/components/ui/ActionMenu";
import * as LucideIcons from "lucide-react";
import { 
  LayoutDashboard, 
  Check, 
  Loader, 
  Plus, 
  FileText, 
  UserCheck, 
  ChevronsRight, 
  Wrench, 
  Search,
  CalendarRange,
  Clock,
  Coins,
  ShieldCheck,
  Phone,
  Mail,
  Building2,
  UserPlus
} from "lucide-react"; 

import { ClienteAutocomplete, RepresentanteAutocomplete } from "@/components/comercial/CotizacionAutocompletes";

const Icon = ({ name, className }) => {
  const iconName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  const LucideIcon = LucideIcons[iconName] || LucideIcons.HelpCircle;
  return <LucideIcon className={className} />;
}; 

import CondicionesModal from "./Gestion/CondicionesModal";
import GenerarCodigoModal from "./GenerarCodigoModal";
import DescuentosModal from "./Gestion/DescuentosModal";
import EnviarCotiModal from "./Gestion/EnviarCotiModal";
import ProbabilidadModal from "./Gestion/ProbabilidadModal";
import MensajesModal from "./Gestion/MensajesModal";
import SeguimientoModal from "./Gestion/SeguimientoModal";
import CopiaCotizacionModal from "./Gestion/CopiaCotizacionModal";
import NuevaVersionModal from "./Gestion/NuevaVersionModal";
import RetornarCotizacionModal from "./Gestion/RetornarCotizacionModal";
import EliminarCotizacionModal from "./Gestion/EliminarCotizacionModal";
import EnviarCotiAprobacionModal from "./Gestion/EnviarCotiAprobacionModal";
import AdjuntosModal from "./Gestion/AdjuntosModal";
import AgregarGrupoSuministroModal from "../dashboard/Suministros/AgregarGrupoSuministroModal";
import RegistroItemModal from "../dashboard/Suministros/RegistroItemModal";
import RegistroItemBuscadorModal from "../dashboard/Suministros/RegistroItemBuscadorModal";
import ServicioModal from "../dashboard/Servicios/ServicioModal";
import AgregarSubgrupoGastoModal from "../dashboard/Servicios/AgregarSubgrupoGastoModal";
import RegistroItemManoObraModal from "../dashboard/Servicios/RegistroItemManoObraModal";
import RegistroItemGastosServicioModal from "../dashboard/Servicios/RegistroItemGastosServicioModal";
import RegistroItemOtrosModal from "../dashboard/Servicios/RegistroItemOtrosModal";
import AsignarCotiModal from "./Gestion/AsignarCotiModal";
import ImportarXLS1Modal from "../dashboard/Suministros/ImportarXLS1Modal";
import ImportarXLS2Modal from "../dashboard/Suministros/ImportarXLS2Modal";
import { calcularItemSegunProveedor, resolverEndpointPorCodigo } from "../dashboard/Suministros/tables/tablaUtils";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crearCotizacion } from "@/api/cotizaciones";
import { toast } from "react-toastify";

const parseTiempoTexto = (texto) => {
  if (!texto) return { cantidad: 0, unidad: "D" };
  const matchNumero = texto.match(/\d+/);
  const cantidad = matchNumero ? parseInt(matchNumero[0], 10) : 0;
  
  const txtLower = texto.toLowerCase();
  let unidad = "D"; // por defecto
  
  if (txtLower.includes("sem") || txtLower.includes("wk")) {
    unidad = "S";
  } else if (txtLower.includes("mes") || txtLower.includes("mon")) {
    unidad = "M";
  } else if (txtLower.includes("di") || txtLower.includes("day")) {
    unidad = "D";
  }
  
  return { cantidad, unidad };
};

const formatTiempoTexto = (cantidad, unidad) => {
  if (cantidad === undefined || cantidad === null || cantidad === "") return "";
  if (Number(cantidad) === 0) return "0 Días";
  const unitLabels = {
    D: "Días",
    S: "Semanas",
    M: "Meses",
  };
  const label = unitLabels[unidad] || "Días";
  return `${cantidad} ${label}`;
};

const getStatusLabel = (code) => {
  const labels = {
    "1": "Adjudicado",
    "2": "Pendiente",
    "3": "Perdida",
    "4": "Anulado",
    "5": "Postergada",
    "6": "En Seguimiento",
  };
  return labels[String(code)] || "Pendiente";
};

const getStatusColor = (code) => {
  const colors = {
    "1": "bg-emerald-500", // Adjudicado
    "2": "bg-amber-500",   // Pendiente
    "3": "bg-rose-500",    // Perdida
    "4": "bg-slate-500",   // Anulado
    "5": "bg-purple-500",  // Postergada
    "6": "bg-blue-500",    // En Seguimiento
  };
  return colors[String(code)] || "bg-amber-500";
};

export default function CotizacionNuevaModal({ open, onClose, cotizacion, modo, tipo, dashboard, cotizaciones = [], esOportunidad }) {

  // ==========================
  // DATA INICIAL (LIMPIA)
  // ==========================
  const [data, setData] = useState({
    num_reg: "",
    fecha: new Date().toISOString().split("T")[0],
    estado_codigo: 2,
    tot_d: "D",
    tot_s: "D",
    tmone: "D",
    tcamb: "3.362",
    acu_s: "D",
    nombc: "",
    telec: "",
    mov1c: "",
    mov2c: "",
    mov3c: "",
    mailc: "",
  });
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [reporteMenuOpen, setReporteMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const updatePreviewCode = async (areaId, tipoId, clienteId) => {
    const targetId = cotizacion?.id_registro || 0;
    try {
      const { data: res } = await api.get(`cotizaciones/generar-codigo/${targetId}/`, {
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

  // Previsualización automática del código cuando cambian area_codigo, cotit y id_cliente
  useEffect(() => {
    if (data && data.area_codigo && data.cotit && data.id_cliente) {
      updatePreviewCode(data.area_codigo, data.cotit, data.id_cliente);
    } else {
      setData(prev => {
        if (!prev) return prev;
        if (prev.codigo === "") return prev;
        return { ...prev, codigo: "" };
      });
    }
  }, [data?.area_codigo, data?.cotit, data?.id_cliente]);

  // Estados locales para entrada de plazos en texto libre
  const [suministrosTexto, setSuministrosTexto] = useState("");
  const [serviciosTexto, setServiciosTexto] = useState("");
  const [validezTexto, setValidezTexto] = useState("");

  const [suministrosFocused, setSuministrosFocused] = useState(false);
  const [serviciosFocused, setServiciosFocused] = useState(false);
  const [validezFocused, setValidezFocused] = useState(false);

  // Sincronización de estados de texto cuando cambia la data de origen (desde fuera o por autocompletar)
  useEffect(() => {
    if (!suministrosFocused && data.plazo !== undefined) {
      setSuministrosTexto(formatTiempoTexto(data.plazo, data.tot_d || "D"));
    }
  }, [data.plazo, data.tot_d, suministrosFocused]);

  useEffect(() => {
    if (!serviciosFocused && data.por_c !== undefined) {
      setServiciosTexto(formatTiempoTexto(data.por_c, data.tot_s || "D"));
    }
  }, [data.por_c, data.tot_s, serviciosFocused]);

  useEffect(() => {
    if (!validezFocused && data.valid !== undefined) {
      setValidezTexto(formatTiempoTexto(data.valid, data.acu_s || "D"));
    }
  }, [data.valid, data.acu_s, validezFocused]);

  // Handlers para el ingreso manual de texto libre en plazos
  const handleSuministrosTextoChange = (val) => {
    setSuministrosTexto(val);
    const { cantidad, unidad } = parseTiempoTexto(val);
    
    // Recalcular la fecha proyectada de presentación
    let dias = cantidad;
    if (unidad === "S") dias = cantidad * 7;
    if (unidad === "M") dias = cantidad * 30;
    
    const f = new Date();
    f.setDate(f.getDate() + dias);
    const nuevaFecha = f.toISOString().split('T')[0];

    setData(prev => ({
      ...prev,
      plazo: cantidad,
      tot_d: unidad,
      fecha: nuevaFecha,
    }));
  };

  const handleSuministrosBlur = () => {
    setSuministrosFocused(false);
    const { cantidad, unidad } = parseTiempoTexto(suministrosTexto);
    setSuministrosTexto(formatTiempoTexto(cantidad, unidad));
  };

  const handleServiciosTextoChange = (val) => {
    setServiciosTexto(val);
    const { cantidad, unidad } = parseTiempoTexto(val);
    setData(prev => ({
      ...prev,
      por_c: cantidad,
      tot_s: unidad,
    }));
  };

  const handleServiciosBlur = () => {
    setServiciosFocused(false);
    const { cantidad, unidad } = parseTiempoTexto(serviciosTexto);
    setServiciosTexto(formatTiempoTexto(cantidad, unidad));
  };

  const handleValidezTextoChange = (val) => {
    setValidezTexto(val);
    const { cantidad, unidad } = parseTiempoTexto(val);
    setData(prev => ({
      ...prev,
      valid: cantidad,
      acu_s: unidad,
    }));
  };

  const handleValidezBlur = () => {
    setValidezFocused(false);
    const { cantidad, unidad } = parseTiempoTexto(validezTexto);
    setValidezTexto(formatTiempoTexto(cantidad, unidad));
  };
  const [suministros] = useState([]);
  const [servicios] = useState([]);
  const esNueva = tipo === "N";
  const esVer = tipo === "V";
  const [tcamb, setTcamb] = useState(3.355);
  // Submodales
  const [openCondiciones, setOpenCondiciones] = useState(false);
  const [condicionesHtml, setCondicionesHtml] = useState("");
  const [openGenerarCodigo, setOpenGenerarCodigo] = useState(false);
  const [openDescuentos, setOpenDescuentos] = useState(false);
  const [descuentosForm, setDescuentosForm] = useState({
    aplicar: false,
    afecto: "",
    porcentaje: "",
    importe: "",
  });
  const [openEnviarCoti, setOpenEnviarCoti] = useState(false);
  const [openEncargados, setOpenEncargados] = useState(false);
  const [openContactos, setOpenContactos] = useState(false);
  const [openProbabilidad, setOpenProbabilidad] = useState(false);
  const [openMensajes, setOpenMensajes] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [openSeg, setOpenSeg] = useState(false);
  const [openCopia, setOpenCopia] = useState(false);
  const [openNuevaVersion, setOpenNuevaVersion] = useState(false);
  const [openRetornar, setOpenRetornar] = useState(false);
  const [openEliminar, setOpenEliminar] = useState(false);
  const [openEnviarAprobacion, setOpenEnviarAprobacion] = useState(false);
  const [loadingEnviar, setLoadingEnviar] = useState(false);
  const [openAdjuntos, setOpenAdjuntos] = useState(false);
  const [openAsignar, setOpenAsignar] = useState(false);
  // SUMINISTROS
  const [openGrupoModal, setOpenGrupoModal] = useState(false);
  const [gruposSuministros, setGruposSuministros] = useState({});
  const [openItemModal, setOpenItemModal] = useState(false);
  const [grupoActivo, setGrupoActivo] = useState(null);
  const [openRegistroItem, setOpenRegistroItem] = useState(false);
  const [openImportarXLS1, setOpenImportarXLS1] = useState(false);
  const [openImportarXLS2, setOpenImportarXLS2] = useState(false);
  // SERVICIOS
  const [selectedServicioId, setSelectedServicioId] = useState(null);
  const [selectedSubgrupoId, setSelectedSubgrupoId] = React.useState(null);
  const [gruposServicios, setGruposServicios] = useState({});
  const [servicioActivo, setServicioActivo] = useState(null);
  const [openServicioModal, setOpenServicioModal] = useState(false);
  const [openSubgrupoModal, setOpenSubgrupoModal] = useState(false);
  const [subgrupoActivo, setSubgrupoActivo] = useState(null);
  const [selectedTipoCodigo, setSelectedTipoCodigo] = useState(null);
  const [openRegistroMO, setOpenRegistroMO] = useState(false);
  const [openRegistroGS, setOpenRegistroGS] = useState(false);
  const [openRegistroOtros, setOpenRegistroOtros] = useState(false);
  const abrirModalRegistroPorTipo = (tipoCodigo, servicioId, subgrupoId, item = null) => {
    const servicio = gruposServicios[servicioId];
    if (!servicio) return console.warn("❌ Servicio no encontrado:", servicioId);

    const subgrupo = servicio.subgrupos?.find(sg => sg.id === subgrupoId);
    if (!subgrupo) return console.warn("❌ Subgrupo no encontrado:", subgrupoId);

    // 🔹 Si tipoCodigo viene undefined (editar), lo tomamos del subgrupo
    tipoCodigo = tipoCodigo ?? subgrupo.tipoCodigo;

    setSelectedServicioId(servicioId);
    setSelectedSubgrupoId(subgrupoId);
    setSelectedTipoCodigo(tipoCodigo);
    setItemActivo(item);

    // cerramos todos por seguridad
    setOpenRegistroMO(false);
    setOpenRegistroGS(false);
    setOpenRegistroOtros(false);

    switch (tipoCodigo) {
      case "04": setOpenRegistroMO(true); break;
      case "05": setOpenRegistroGS(true); break;
      case "06": setOpenRegistroOtros(true); break;
      default: console.warn("⚠️ Tipo de gasto no reconocido:", tipoCodigo);
    }
  };

  const [loadingSuministros, setLoadingSuministros] = useState(false);
  const [campoError, setCampoError] = useState(null);

  const [itemActivo, setItemActivo] = useState(null);

  const [cotizacionVista, setCotizacionVista] = useState(cotizacion?.num_reg);
  const [cotizacionEditable, setCotizacionEditable] = useState(null);
  const [tabActiva, setTabActiva] = useState("datos");
  const DASHBOARD_TABS = {
    C: ["datos", "suministros", "servicios", "gestion"],
    O: ["datos"],
  };
  const tabsToShow = DASHBOARD_TABS[dashboard] ?? ["datos"];

  // Estado dedicado para el num_reg de oportunidad
  const [nuevoNumOportunidad, setNuevoNumOportunidad] = useState("");

  // Cuando abrimos el modal, inicializamos el estado
  useEffect(() => {
    if (!open) return;

    const inicializarModal = async () => {
      if (tipo === "N") {
        // Inicialización inmediata y limpia para nuevas cotizaciones
        setData({
          num_reg: "",
          fecha: new Date().toISOString().split("T")[0],
          cliente_codigo: "",
          nombr: "",
          referencia: "",
          estado_codigo: 2,
          tot_d: "D",
          tot_s: "D",
          tmone: "D",
          tcamb: "3.362",
          acu_s: "D",
          nombc: "",
          telec: "",
          mov1c: "",
          mov2c: "",
          mov3c: "",
          mailc: "",
          suministros: {},
          servicios: {},
          tot_c: 0,
        });

        try {
          // Cargamos en paralelo los defaults del backend
          const [usuarioRes, numRegRes] = await Promise.allSettled([
            api.get("users/usuario-actual/"),
            api.get("cotizaciones/siguiente_num_reg_oportunidad/")
          ]);

          const usuario = usuarioRes.status === "fulfilled" ? usuarioRes.value.data : null;
          const numRegData = numRegRes.status === "fulfilled" ? numRegRes.value.data : null;

          if (numRegData && numRegData.num_reg) {
            setNuevoNumOportunidad(numRegData.num_reg);
          }

          // Integramos los defaults del usuario sin machacar lo que el usuario esté escribiendo
          setData(prev => ({
            ...prev,
            regus: usuario?.usuario ?? prev.regus ?? "",
            nombc: usuario?.nombre_completo ?? prev.nombc ?? "",
            telec: usuario?.telefono ?? prev.telec ?? "",
            mov1c: usuario?.movil1 ?? prev.mov1c ?? "",
            mov2c: usuario?.movil2 ?? prev.mov2c ?? "",
            mov3c: usuario?.movil3 ?? prev.mov3c ?? "",
            mailc: usuario?.email_usu ?? prev.mailc ?? "",
          }));
        } catch (err) {
          console.error("Error al cargar datos iniciales del backend:", err);
        }
      } else {
        // ES EDICIÓN / VISTA: Inicializamos con la cotización recibida
        if (cotizacion) {
          const getUnitCodeFromName = (name) => {
            if (!name) return "D";
            const n = name.toLowerCase();
            if (n.includes("sem") || n.includes("week") || n.includes("s")) return "S";
            if (n.includes("mes") || n.includes("mon") || n.includes("m")) return "M";
            return "D";
          };

          setData({
            ...cotizacion,
            plazo: cotizacion.entrega_suministros,
            tot_d: getUnitCodeFromName(cotizacion.unidad_suministro_nombre),
            por_c: cotizacion.entrega_servicios,
            tot_s: getUnitCodeFromName(cotizacion.unidad_servicio_nombre),
            valid: cotizacion.validez_oferta,
            acu_s: getUnitCodeFromName(cotizacion.unidad_validez_nombre),
            forma_pago: cotizacion.forma_pago,
            lugar: cotizacion.lugar,
            cotit: cotizacion.id_tipo,
            area_codigo: cotizacion.id_area,
            tmone: cotizacion.tipo_moneda,
            tcamb: cotizacion.tipo_cambio,
            igv: cotizacion.igv,
            prob: String(cotizacion.probabilidad ?? "0"),
            tven: cotizacion.tipo_venta,
            des_a: cotizacion.descuento_aplica === 1 ? "S" : "N",
            des_t: cotizacion.descuento_afecto,
            des_m: cotizacion.descuento_monto,
            des_p: cotizacion.descuento_porcentaje,

            // Responsable Comercial
            codic: cotizacion.comercial_dni,
            codco: cotizacion.comercial_dni,
            nombc: cotizacion.comercial_nombre,
            telec: cotizacion.comercial_telefono,
            mov1c: cotizacion.comercial_movil_corporativo,
            mov2c: cotizacion.comercial_movil_personal,
            mailc: cotizacion.comercial_correo,

            // Responsable Técnico
            codit: cotizacion.tecnico_dni,
            nombt: cotizacion.tecnico_nombre,
            telet: cotizacion.tecnico_telefono,
            mov1t: cotizacion.tecnico_movil_corporativo,
            mov2t: cotizacion.tecnico_movil_personal,
            mailt: cotizacion.tecnico_correo,
          });

          if (cotizacion.comercial_nombre) {
            setComercialQuery(cotizacion.comercial_nombre);
          }
          if (cotizacion.tecnico_nombre) {
            setTecnicoQuery(cotizacion.tecnico_nombre);
          }
          if (cotizacion.cliente_nombre) {
            setClienteQuery(cotizacion.cliente_nombre);
            setClienteSelected(true);
          }
          if (cotizacion.representante_nombre) {
            setEncargadoQuery(cotizacion.representante_nombre);
          }
          if (cotizacion.condiciones_generales) {
            setCondicionesHtml(cotizacion.condiciones_generales);
          }
        }

        try {
          const { data: usuario } = await api.get("users/usuario-actual/");
          setData(prev => ({
            ...prev,
            regus: prev.regus || usuario?.usuario || "",
          }));
        } catch (err) {
          console.error("Error al cargar usuario actual:", err);
        }
      }
    };

    inicializarModal();
  }, [open, tipo, cotizacion]);

  // ==========
  // MEJORA
  // =========
  const queryClient = useQueryClient();

  const crearMutation = useMutation({
    mutationFn: crearCotizacion,
    onSuccess: (res) => {
      const cot = res?.cotizacion;

      setData(prev => ({
        ...prev,
        num_reg: cot?.num_reg ?? prev.num_reg,
        numero: cot?.numero ?? prev.numero,
        acu_e: condicionesHtml,
      }));

      toast.success("Cotización guardada correctamente");

      // 🔥 aquí está la magia
      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["revision-cotizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["aprobacion-cotizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["seguimiento-cotizaciones"] });
    },
    onError: () => {
      toast.error("Error al guardar la cotización");
    },
  });

  // =======
  // NUMREG
  // ========
  const numReg = data?.num_reg || cotizacion?.num_reg;

  // ==============================
  // CONTROL POR ESTADO ENVIO
  // ==============================
  const envio = Number(data?.envio ?? 0);

  // Puede guardar solo si NO está enviado
  const canSave = envio !== 3;



  // ==========================================
  // CONFIGURACIÓN DE CAMPOS Y AUTOCOMPLETES NATIVOS
  // ==========================================
  const canEdit = envio !== 3;
  const isReadOnly = !canEdit;

  // Refs para click outside
  const clienteRef = useRef(null);
  const encargadosRef = useRef(null);
  const comercialRef = useRef(null);
  const tecnicoRef = useRef(null);

  // Clientes Autocomplete States
  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteResults, setClienteResults] = useState([]);
  const [clienteFocused, setClienteFocused] = useState(false);
  const [clienteSelected, setClienteSelected] = useState(false);
  const [highlightClienteIndex, setHighlightClienteIndex] = useState(-1);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [clienteLoading, setClienteLoading] = useState(false);
  const [openQuickCreate, setOpenQuickCreate] = useState(false);

  // Encargados Autocomplete States
  const [encargadoQuery, setEncargadoQuery] = useState("");
  const [encargadosResults, setEncargadosResults] = useState([]);
  const [encargadosLoading, setEncargadosLoading] = useState(false);
  const [encargadoFocused, setEncargadoFocused] = useState(false);
  const [showEncargadosDropdown, setShowEncargadosDropdown] = useState(false);
  const [highlightEncargadoIndex, setHighlightEncargadoIndex] = useState(-1);

  // Comercial Autocomplete States
  const [comercialQuery, setComercialQuery] = useState("");
  const [comercialResults, setComercialResults] = useState([]);
  const [comercialLoading, setComercialLoading] = useState(false);
  const [showComercialDropdown, setShowComercialDropdown] = useState(false);
  const [highlightComercialIndex, setHighlightComercialIndex] = useState(-1);
  const [comercialFocused, setComercialFocused] = useState(false);

  // Técnico Autocomplete States
  const [tecnicoQuery, setTecnicoQuery] = useState("");
  const [tecnicoResults, setTecnicoResults] = useState([]);
  const [tecnicoLoading, setTecnicoLoading] = useState(false);
  const [showTecnicoDropdown, setShowTecnicoDropdown] = useState(false);
  const [highlightTecnicoIndex, setHighlightTecnicoIndex] = useState(-1);
  const [tecnicoFocused, setTecnicoFocused] = useState(false);

  // =====================
  // SELECT OPTIONS
  // =====================
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
  ];

  const igvOptions = [
    { id: "N", nombre: "No Incluye" },
    { id: "S", nombre: "Incluye" },
  ];

  const formasPagoOptions = [
    { id: "100% Contra Entrega", nombre: "100% Contra Entrega" },
    { id: "100% Factura a 30 días", nombre: "100% Factura a 30 días" },
    { id: "100% Factura a 42 días", nombre: "100% Factura a 42 días" },
    { id: "100% Factura a 60 días", nombre: "100% Factura a 60 días" },
    { id: "100% Factura a 180 días, vía factoring", nombre: "100% Factura a 180 días, vía factoring" },
    { id: "50% Adelanto, 50% Contra Entrega", nombre: "50% Adelanto, 50% Contra Entrega" },
    { id: "100% Factura a 180 días", nombre: "100% Factura a 180 días" },
  ];

  const tipoVentaOptions = [
    { id: "P", nombre: "Venta Parcial" },
    { id: "T", nombre: "Venta Total" },
  ];

  const estadoOpOptions = [
    { id: "0", nombre: "Pendiente" },
    { id: "1", nombre: "No Cotizado" },
    { id: "2", nombre: "Rechazado" },
    { id: "3", nombre: "Cotizado" },
  ];

  // =====================
  // FIELD CHANGE HANDLER
  // =====================
  const handleFieldChange = (field, value) => {
    if (!canEdit) {
      console.warn("Edición bloqueada: envío finalizado");
      return;
    }

    setIsDirty(true);

    setData(prev => {
      const newState = { ...prev, [field]: value };

      // 1. Si el tipo de cotización deja de ser Venta (V), reseteamos los campos logísticos (tven)
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

  // =====================
  // AUTOCOMPLETE FETCHERS & HANDLERS
  // =====================

  // Clientes
  const fetchClientesInline = async (q = "") => {
    setClienteLoading(true);
    try {
      const { data: res } = await api.get("/core/clientes/buscar/", {
        params: { q }
      });
      setClienteResults(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("❌ Error buscando clientes:", err);
      setClienteResults([]);
    } finally {
      setClienteLoading(false);
    }
  };

  const autocompletarTiemposDesdeUltima = async (clienteId, clienteCodigo) => {
    if (!clienteId) return;
    
    try {
      const token = localStorage.getItem("access_token");
      const { data: detalles } = await api.get(`cotizaciones/ultima_cotizacion_cliente/${clienteId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Detalles completos para autocompletar desde última cotización:", detalles);
      
      if (detalles) {
        const getUnitCodeFromName = (name) => {
          if (!name) return "D";
          const n = name.toLowerCase();
          if (n.includes("sem") || n.includes("week") || n.includes("s")) return "S";
          if (n.includes("mes") || n.includes("mon") || n.includes("m")) return "M";
          return "D";
        };

        const plazoVal = detalles.entrega_suministros !== undefined && detalles.entrega_suministros !== null ? Number(detalles.entrega_suministros) : 0;
        const totD = getUnitCodeFromName(detalles.unidad_suministro_nombre);
        const porC = detalles.entrega_servicios !== undefined && detalles.entrega_servicios !== null ? Number(detalles.entrega_servicios) : 0;
        const totS = getUnitCodeFromName(detalles.unidad_servicio_nombre);
        const validVal = detalles.validez_oferta !== undefined && detalles.validez_oferta !== null ? Number(detalles.validez_oferta) : 0;
        const acuS = getUnitCodeFromName(detalles.unidad_validez_nombre);

        setData(prev => ({
          ...prev,
          plazo: plazoVal,
          tot_d: totD,
          por_c: porC,
          tot_s: totS,
          valid: validVal,
          acu_s: acuS,
          // Preservar fecha y referencia
          fecha: prev.fecha,

          // Autocompletar otros campos útiles
          forma_pago: detalles.forma_pago || prev.forma_pago,
          lugar: detalles.lugar || prev.lugar,
          cotit: detalles.id_tipo || prev.cotit,
          area_codigo: detalles.id_area || prev.id_area || prev.area_codigo,
          tipo_moneda: detalles.tipo_moneda || prev.tipo_moneda,
          tipo_cambio: detalles.tipo_cambio || prev.tipo_cambio,
          igv: detalles.igv || prev.igv,
          prob: String(detalles.probabilidad ?? prev.prob ?? "0"),
          tven: detalles.tipo_venta || prev.tven,
          des_a: detalles.descuento_aplica === 1 ? "S" : "N",
          des_t: detalles.descuento_afecto || prev.des_t,
          des_m: detalles.descuento_monto || prev.des_m,
          des_p: detalles.descuento_porcentaje || prev.des_p,

          // Responsable Comercial
          codic: detalles.comercial_dni || prev.codic,
          codco: detalles.comercial_dni || prev.codco,
          nombc: detalles.comercial_nombre || prev.nombc,
          telec: detalles.comercial_telefono || prev.telec,
          mov1c: detalles.comercial_movil_corporativo || prev.mov1c,
          mov2c: detalles.comercial_movil_personal || prev.mov2c,
          mailc: detalles.comercial_correo || prev.mailc,

          // Responsable Técnico
          codit: detalles.tecnico_dni || prev.codit,
          nombt: detalles.tecnico_nombre || prev.nombt,
          telet: detalles.tecnico_telefono || prev.telet,
          mov1t: detalles.tecnico_movil_corporativo || prev.mov1t,
          mov2t: detalles.tecnico_movil_personal || prev.mov2t,
          mailt: detalles.tecnico_correo || prev.mailt,

          // Representante de contacto
          id_representante: detalles.id_representante || prev.id_representante || null,
          codir: detalles.id_representante ? String(detalles.id_representante) : prev.codir,
          nombr: detalles.representante_nombre || prev.nombr,
          cargo: detalles.representante_cargo || prev.cargo,
          teler: detalles.representante_telefono || prev.teler,
          movir: detalles.representante_movil || prev.movir,
          mailr: detalles.representante_correo || prev.mailr,
        }));

        // Sincronizar las queries para que los inputs muestren los nombres correspondientes
        if (detalles.comercial_nombre) {
          setComercialQuery(detalles.comercial_nombre);
        }
        if (detalles.tecnico_nombre) {
          setTecnicoQuery(detalles.tecnico_nombre);
        }
        if (detalles.representante_nombre) {
          setEncargadoQuery(detalles.representante_nombre);
        }

        if (detalles.condiciones_generales) {
          setCondicionesHtml(detalles.condiciones_generales);
        }

        toast.info("Campos autocompletados desde la última cotización de este cliente.");
      }
    } catch (err) {
      console.error("Error al obtener detalles de la última cotización para autocompletar:", err);
    }
  };

  const handleClienteSelect = (cliente) => {
    handleFieldChange("cliente_codigo", String(cliente.ruc || cliente.codigo || ""));
    setClienteQuery(cliente.nombre);
    setShowClienteDropdown(false);
    setClienteSelected(true);
    setHighlightClienteIndex(-1);
    setEncargadoQuery("");
    autocompletarTiemposDesdeUltima(cliente.id_cliente, cliente.ruc || cliente.codigo);
  };

  useEffect(() => {
    if (!clienteFocused || isReadOnly) return;
    const t = setTimeout(() => {
      fetchClientesInline(clienteQuery.trim());
      setShowClienteDropdown(true);
    }, 300);
    return () => clearTimeout(t);
  }, [clienteQuery, clienteFocused, isReadOnly]);

  useEffect(() => {
    if (!clienteQuery) {
      setClienteResults([]);
      setShowClienteDropdown(false);
      setHighlightClienteIndex(-1);
    }
  }, [clienteQuery]);

  useEffect(() => {
    const sincronizarNombre = async () => {
      if (data.cliente_codigo && !clienteQuery) {
        try {
          const { data: res } = await api.get("/core/clientes/buscar/", {
            params: { q: data.cliente_codigo }
          });
          if (res.length > 0) {
            setClienteQuery(res[0].nombre);
            setClienteSelected(true);
          }
        } catch (err) {
          console.error("Error al sincronizar nombre del cliente:", err);
        }
      }
    };
    sincronizarNombre();
  }, [data.cliente_codigo]);

  // Encargados
  const fetchEncargadosInline = async (q = "") => {
    if (!data.cliente_codigo) return;
    setEncargadosLoading(true);
    try {
      const { data: res } = await api.get(`/cotizaciones/representantes/search/`, {
        params: { cliente_codigo: data.cliente_codigo, q }
      });
      setEncargadosResults(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("❌ Error al traer encargados:", err);
      setEncargadosResults([]);
    } finally {
      setEncargadosLoading(false);
    }
  };

  const handleEncargadoSelect = (encargado) => {
    setData(prev => ({
      ...prev,
      cliente_nombre: encargado.representante || encargado.nombre,
      nombr: encargado.representante || encargado.nombre,
      codir: String(encargado.codigo),
      cargo: encargado.cargo || "",
      mailr: encargado.email || "",
      teler: encargado.telefono || "",
      movir: encargado.movil || "",
    }));
    setEncargadoQuery(encargado.representante || encargado.nombre);
    setShowEncargadosDropdown(false);
    setHighlightEncargadoIndex(-1);
  };

  useEffect(() => {
    if (!encargadoFocused || isReadOnly || !data.cliente_codigo) return;
    const t = setTimeout(() => {
      fetchEncargadosInline(encargadoQuery.trim());
      setShowEncargadosDropdown(true);
    }, 300);
    return () => clearTimeout(t);
  }, [encargadoQuery, encargadoFocused, data.cliente_codigo, isReadOnly]);

  useEffect(() => {
    if (!encargadoQuery) {
      setEncargadosResults([]);
      setShowEncargadosDropdown(false);
      setHighlightEncargadoIndex(-1);
    }
  }, [encargadoQuery]);

  useEffect(() => {
    const sincronizarEncargado = async () => {
      if (data.nombr && !encargadoQuery) {
        setEncargadoQuery(data.nombr);
        return;
      }
      if (data.codir && !encargadoQuery && data.cliente_codigo) {
        try {
          const { data: res } = await api.get(`/cotizaciones/representantes/search/`, {
            params: { cliente_codigo: data.cliente_codigo, q: data.codir }
          });
          const exacto = res.find(e => String(e.codigo) === String(data.codir));
          if (exacto) {
            setEncargadoQuery(exacto.representante);
          } else if (res.length > 0) {
            setEncargadoQuery(res[0].representante);
          }
        } catch (err) {
          console.error("❌ Error al sincronizar encargado:", err);
        }
      }
    };
    sincronizarEncargado();
  }, [data.codir, data.nombr, data.cliente_codigo]);

  // Comercial
  const fetchComercialInline = async (q = "") => {
    setComercialLoading(true);
    try {
      const { data } = await api.get("/users/usuarios-activos/", {
        params: { q }
      });
      let usuarios = Array.isArray(data) ? data : [];
      const IDsPermitidos = [
        "eduardo.bonilla",
        "claudia.carbonel",
        "luisa.oncebay",
        "diego.rengifo"
      ];
      const filtrados = usuarios.filter(u => IDsPermitidos.includes(u.usuario));
      setComercialResults(filtrados);
    } catch (err) {
      console.error("❌ Error buscando comerciales:", err);
      setComercialResults([]);
    } finally {
      setComercialLoading(false);
    }
  };

  const handleComercialSelect = (comercial) => {
    setData(prev => ({
      ...prev,
      nombc: comercial.nombre_completo,
      codic: String(comercial.dni),
      codco: String(comercial.dni),
      mailc: comercial.email_usu || "",
      telec: comercial.telefono || "",
      mov1c: comercial.movil1 || "",
      mov2c: comercial.movil2 || "",
      mov3c: comercial.movil3 || "",
    }));
    setComercialQuery(comercial.nombre_completo);
    setShowComercialDropdown(false);
    setHighlightComercialIndex(-1);
  };

  useEffect(() => {
    if (!comercialFocused || isReadOnly) return;
    const t = setTimeout(() => {
      fetchComercialInline(comercialQuery.trim());
      setShowComercialDropdown(true);
    }, 300);
    return () => clearTimeout(t);
  }, [comercialQuery, comercialFocused, isReadOnly]);

  useEffect(() => {
    if (data.nombc) {
      setComercialQuery(data.nombc);
    }
  }, [data.nombc]);

  // Técnico
  const fetchTecnicoInline = async (q = "") => {
    setTecnicoLoading(true);
    try {
      const { data } = await api.get("/users/usuarios-activos/", {
        params: { q }
      });
      setTecnicoResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error buscando técnicos:", err);
      setTecnicoResults([]);
    } finally {
      setTecnicoLoading(false);
    }
  };

  const handleTecnicoSelect = (tecnico) => {
    setData(prev => ({
      ...prev,
      nombt: tecnico.nombre_completo,
      codit: String(tecnico.dni),
      mailt: tecnico.email_usu || "",
      telet: tecnico.telefono || "",
      mov1t: tecnico.movil1 || "",
      mov2t: tecnico.movil2 || "",
      mov3t: tecnico.movil3 || "",
    }));
    setTecnicoQuery(tecnico.nombre_completo);
    setShowTecnicoDropdown(false);
    setHighlightTecnicoIndex(-1);
  };

  useEffect(() => {
    if (!tecnicoFocused || isReadOnly) return;
    const t = setTimeout(() => {
      fetchTecnicoInline(tecnicoQuery.trim());
      setShowTecnicoDropdown(true);
    }, 300);
    return () => clearTimeout(t);
  }, [tecnicoQuery, tecnicoFocused, isReadOnly]);

  useEffect(() => {
    if (data.nombt) {
      setTecnicoQuery(data.nombt);
    }
  }, [data.nombt]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target)) {
        setShowClienteDropdown(false);
        setHighlightClienteIndex(-1);
      }
      if (encargadosRef.current && !encargadosRef.current.contains(e.target)) {
        setShowEncargadosDropdown(false);
        setHighlightEncargadoIndex(-1);
      }
      if (comercialRef.current && !comercialRef.current.contains(e.target)) {
        setShowComercialDropdown(false);
        setHighlightComercialIndex(-1);
      }
      if (tecnicoRef.current && !tecnicoRef.current.contains(e.target)) {
        setShowTecnicoDropdown(false);
        setHighlightTecnicoIndex(-1);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setReporteMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ======================
  // CAMPOS OBLIGATORIOS
  // ======================
  const CAMPOS_OBLIGATORIOS = [
    { key: "fecha", label: "Fecha" },
    { key: "referencia", label: "Referencia" },
    { key: "cliente_codigo", label: "Para (Cliente)" },
    { key: "prob", label: "Probabilidad" },
    { key: "cotit", label: "Tipo Cotización" },
    { key: "area_codigo", label: "Área" },
  ];

  // Validar campos obligatorios
  const validarCamposObligatorios = () => {
    for (const campo of CAMPOS_OBLIGATORIOS) {
      const valor = data[campo.key];

      if (
        valor === undefined ||
        valor === null ||
        String(valor).trim() === ""
      ) {
        return campo; // ⛔ devolvemos el primero que falla
      }
    }
    return null;
  };

  const irACampo = (campoKey) => {
    const el = document.getElementById(campoKey);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      el.focus?.();
    }
  };

  // ==========================================
  // HELPER: CALCULAR ÍTEM CON ENVÍO
  // ==========================================
  const calcularItemConEnvio = (item, todosLosItemsDelGrupo, costoEnvioGrupo, tipoVenta) => {
    const tVenta = tipoVenta?.toUpperCase();

    const cantidad = Number(item.can || 0);
    const costoPrecioUnitario = Number(item.puc || 0);
    const costoTotalLinea = Number((costoPrecioUnitario * cantidad).toFixed(2)); // TOC
    const porcentajeUtil = Number(item.cau || 0);

    const listaItems = Array.isArray(todosLosItemsDelGrupo)
      ? todosLosItemsDelGrupo
      : Object.values(todosLosItemsDelGrupo || {});

    const sumaVentaGrupo = listaItems.reduce((acc, it) => acc + Number(it.toc || 0), 0);

    let costoEnvioUnitario = 0;
    let porcentajeEnvio = 0;

    // VENTA TOTAL (T) -> Prorrateo
    if (tVenta === "T") {
      const ratioEnvio = sumaVentaGrupo > 0 ? (costoTotalLinea / sumaVentaGrupo) : 0;
      porcentajeEnvio = sumaVentaGrupo > 0
        ? Number(((costoPrecioUnitario / sumaVentaGrupo) * 100).toFixed(2))
        : 0;

      const envioTotalParaEsteItem = costoEnvioGrupo * ratioEnvio;
      costoEnvioUnitario = cantidad > 0 ? envioTotalParaEsteItem / cantidad : 0;
    }
    // VENTA PARCIAL (P) -> Envío Directo
    else if (tVenta === "P") {
      costoEnvioUnitario = cantidad > 0 ? costoEnvioGrupo / cantidad : 0;
      porcentajeEnvio = 0;
    }

    if (tVenta === "T" || tVenta === "P") {
      const costoConEnvio = costoPrecioUnitario + costoEnvioUnitario;
      const utilidadUnitaria = (costoConEnvio * porcentajeUtil) / 100;
      const ventaPrecioUnitario = costoConEnvio + utilidadUnitaria;

      return {
        ...item,
        can: cantidad,
        puc: costoPrecioUnitario,
        toc: costoTotalLinea,
        cau: porcentajeUtil,
        tou: Number(utilidadUnitaria.toFixed(4)),
        val: Number(ventaPrecioUnitario.toFixed(2)),
        tot: Number((ventaPrecioUnitario * cantidad).toFixed(2)),
        cost_env: Number(costoEnvioUnitario.toFixed(4)),
        por_env: porcentajeEnvio,
        cost_c_env: Number(costoConEnvio.toFixed(4)),
        utilidadTotal: Number(((ventaPrecioUnitario - costoConEnvio) * cantidad).toFixed(2))
      };
    } else {
      const utilidadUnitaria = (costoPrecioUnitario * porcentajeUtil) / 100;
      const ventaPrecioUnitario = costoPrecioUnitario + utilidadUnitaria;
      return {
        ...item,
        can: cantidad,
        puc: costoPrecioUnitario,
        toc: costoTotalLinea,
        cau: porcentajeUtil,
        tou: Number(utilidadUnitaria.toFixed(4)),
        val: Number(ventaPrecioUnitario.toFixed(2)),
        tot: Number((ventaPrecioUnitario * cantidad).toFixed(2)),
        cost_env: 0,
        por_env: 0,
        cost_c_env: costoPrecioUnitario,
        utilidadTotal: Number((utilidadUnitaria * cantidad).toFixed(2))
      };
    }
  };

  // =====================
  // GUARDAR COTIZACIÓN
  // =====================
  const handleGuardarCotizacion = () => {
    if (crearMutation.isPending) return;

    const campoFaltante = validarCamposObligatorios();
    if (campoFaltante) {
      setCampoError(campoFaltante.key);
      toast.warning(`Falta completar: ${campoFaltante.label}`);
      irACampo(campoFaltante.key);
      setTimeout(() => setCampoError(null), 3000);
      return;
    }

    // 🔹 Mapear suministros para incluir subtotal en la cabecera
    const suministrosPayload = Object.fromEntries(
      Object.entries(gruposSuministros).map(([cog, grupo]) => {
        const costoEnvioGrupo = Number(grupo.costoEnvio || 0);
        const tipoVentaGlobal = data?.tven;
        const itemsDelGrupo = grupo.items || [];


        // 1️⃣ Recalculamos cada ítem usando la lógica de prorrateo por TOC
        const itemsProcesados = itemsDelGrupo.map((item, idx) => {
          const itemCalculado = calcularItemConEnvio(
            item,
            itemsDelGrupo,
            costoEnvioGrupo,
            tipoVentaGlobal
          );


          return itemCalculado;
        });

        // 2️⃣ Sumatoria real de los items recalculados para el total del grupo
        const subtotalItems = itemsProcesados.reduce(
          (acc, item) => acc + (Number(item.tot) || 0),
          0
        );

        return [
          cog,
          {
            ...grupo,
            costoEnvio: costoEnvioGrupo,
            tipoEnvio: grupo.tipoEnvio || "TOTAL",
            total: Number(subtotalItems.toFixed(2)), // Total raíz
            // 🚩 CLAVE: Sincronizamos el header con el nuevo total para evitar el 50288.34
            header: {
              ...grupo.header,
              tot: Number(subtotalItems.toFixed(2))
            },
            items: itemsProcesados,
          },
        ];
      })
    );

    // 🔹 Mapear servicios de la misma manera si quieres hacer totales consistentes
    const serviciosPayload = Object.fromEntries(
      Object.entries(gruposServicios).map(([cog, grupo]) => {
        let totalGrupo = 0;
        const items = [];

        (grupo.subgrupos || []).forEach(sub => {
          (sub.items || []).forEach(it => {
            const itemProcesado = {
              ...it,
              tipoCodigo: sub.tipoCodigo, // 🔹 Asignamos el tipo del subgrupo
              can: Number(it.can || 0),
              puc: Number(it.puc || 0),
              toc: Number(it.toc || 0),
              cau: Number(it.cau || 0),
              tou: Number(it.tou || 0),
              val: Number(it.val || 0),
              tot: Number(it.tot || 0),
            };
            items.push(itemProcesado);
            totalGrupo += itemProcesado.tot;
          });
        });

        totalGrupo *= Number(grupo.cantidad || 1);

        return [
          cog,
          {
            ...grupo,
            cantidad: Number(grupo.cantidad ?? 1), // 🔴 CLAVE
            items,                        // items ya procesados
            total: +totalGrupo.toFixed(2) // total listo para nig=0 y backend
          },
        ];
      })
    );

    // ── CONFIGURACIÓN DEL PAYLOAD DE OPORTUNIDAD (ESPEJO TOTAL) ──
    const oportunidadPayload = {
      // Identificación y Seguimiento
      num_reg: nuevoNumOportunidad,
      num_reg_cot: null,
      cotin: data.numero || data.cotin || "",
      cotif: data.fecha || data.cotif,
      refer: data.referencia || data.refer || "",
      f_recp: data.f_recp || data.fecha,
      f_limite: data.f_limite || null,
      f_emi: data.f_emi || null,
      estado_op: Number(data.estado_op ?? 0), // 0: Pendiente por defecto
      coment: data.coment || "",

      // Clasificación Comercial
      prob: data.prob || "0",
      cotit: data.cotit || "",
      area: data.area_codigo || data.area || "",
      tven: data.tven || "1",
      estad: data.estado_codigo || "2", // Estado de coti (2: Pendiente)
      envio: Number(data.estado_op) === 3 ? 2 : 0, // 🚩 LA LÓGICA CLAVE

      // Cliente y Contacto
      empre: data.cliente_codigo || data.empre || "",
      nombr: data.nombr || "",
      cargr: data.cargr || "",
      codir: data.codir || "",
      teler: data.teler || "",
      movir: data.movir || "",
      mailr: data.mailr || "",

      // Pago / Moneda / Totales (Pestaña DATOS)
      tot_c: Number(data.tot_c || 0),
      forma_pago: data.forma_pago || "",
      lugar: data.lugar || "",
      tmone: data.tmone || "D", // Dólares por defecto
      tcamb: Number(data.tcamb || 0),
      igv: data.igv || "S",

      // Tiempos y Validez
      plazo: Number(data.plazo || 0),
      tot_d: data.tot_d || "D",
      por_c: Number(data.por_c || 0),
      tot_s: data.tot_s || "D",
      valid: Number(data.valid || 0),
      acu_s: data.acu_s || "D",

      // Responsables
      codic: data.codic || "",
      nombc: data.nombc || "",
      codit: data.codit || "",
      nombt: data.nombt || "",

      // Descuentos y Metadatos
      des_a: data.des_a || "N",
      des_t: data.des_t || "N",
      des_m: Number(data.des_m || 0),
      des_p: Number(data.des_p || 0),
      acu_e: condicionesHtml || "", // El HTML de términos y condiciones
      regus: data.regus || "",
      anno: data.anno || new Date().getFullYear().toString(),
      mes: data.mes || (new Date().getMonth() + 1).toString().padStart(2, '0'),
      anno_a: data.anno_a || "2026"
    };

    // DEBUG para que veas qué se va a la tabla vc_mov_oportunidades
    console.log("🎯 OPORTUNIDAD PAYLOAD:", oportunidadPayload);

    const payload = {
      ...data,
      //num_reg: nuevoNumOportunidad, // Envio de num_reg para oportunidades
      detalle: {
        ...data.detalle,
        // ❌ NO enviar tot_c calculado
      },
      acu_e: condicionesHtml,
      suministros: suministrosPayload,
      servicios: serviciosPayload,
      oportunidad: oportunidadPayload,

      descuento: {
        aplicar: descuentosForm.aplicar,
        aplicaA:
          descuentosForm.afecto === "t"
            ? "TOTAL"
            : descuentosForm.afecto === "su"
              ? "SUMINISTROS"
              : "SERVICIOS",
        porcentaje: Number(descuentosForm.porcentaje || 0),
        importe: Number(descuentosForm.importe || 0),
      },
    };

    console.log("🎯 OPORTUNIDAD PAYLOAD:", oportunidadPayload);
    console.log("🎯 PAYLOAD FINAL:", payload);
    console.log("📦 PAYLOAD PARA GUARDAR:", payload);

    crearMutation.mutate(payload);
  };

  // =============
  // SUMINISTROS
  // =============
  // Agregar o Editar Grupo
  const handleAgregarGrupoSuministro = (form) => {
    setGruposSuministros(prev => {

      // ✏️ EDITAR EXISTENTE
      if (form._key && prev[form._key]) {
        const grupoPrev = prev[form._key];
        return {
          ...prev,
          [form._key]: {
            ...grupoPrev,
            titulo: form.nombre,
            cantidad: Number(form.cantidad),
            totalGrupo: form.totalGrupo,
            nroLineasPdf: Number(form.nroLineasPdf),
            header: {
              ...grupoPrev.header,
              can: Number(form.cantidad),
            },
          },
        };
      }

      // ➕ CREAR NUEVO GRUPO (CONTADOR GLOBAL)
      const existentes = Object.keys(prev)
        .map(k => parseInt(k.substring(0, 2), 10))
        .filter(n => !isNaN(n));

      const maxContador = existentes.length > 0 ? Math.max(...existentes) : 0;
      const nuevoContador = maxContador + 1;

      const tipo = form.tipo; // "01" | "02"
      const nuevoCog = String(nuevoContador).padStart(2, "0") + tipo;

      return {
        ...prev,
        [nuevoCog]: {
          cog: nuevoCog,
          titulo: form.nombre,
          cantidad: Number(form.cantidad),
          totalGrupo: form.totalGrupo,
          nroLineasPdf: Number(form.nroLineasPdf),
          items: [],
          header: {
            can: Number(form.cantidad),
            tot: 0,
          },
        },
      };
    });
  };

  // Agregar / Editar Item
  const handleAgregarItem = (form) => {
    if (!grupoActivo) return;

    const esEdicion = Boolean(form.id);

    const itemProcesado = {
      id: esEdicion ? form.id : `I${Date.now()}`, // 🔥 clave
      num: esEdicion ? form.num : Date.now(),
      cod: form.codigo,
      des: form.descripcion,
      pro: form.marca,
      tpr: form.proveedor,
      tde: form.unidad,
      can: Number(form.cantidad),
      puc: Number(form.costoPrecio),
      tou: Number(form.utilidad),
      cau: Number(form.porcentaje),
      toc: Number(form.costoTotal),
      val: Number(form.ventaPrecio),
      tot: Number(form.ventaTotal),
    };

    setGruposSuministros(prev => {
      const itemsActuales = prev[grupoActivo]?.items || [];

      const nuevosItems = esEdicion
        ? itemsActuales.map(item =>
          item.id === form.id ? itemProcesado : item
        )
        : [...itemsActuales, itemProcesado];

      return {
        ...prev,
        [grupoActivo]: {
          ...(prev[grupoActivo] || { titulo: "", items: [] }),
          items: nuevosItems,
        },
      };
    });
  };

  // Actualizar Lista
  const handleRefreshSuministros = async () => {
    if (loadingSuministros) return;

    try {
      setLoadingSuministros(true);

      // 1️⃣ Limpias cambios temporales del frontend
      setGruposSuministros({});

      // 2️⃣ Vuelves a cargar desde backend
      await fetchSuministros();

    } catch (error) {
      console.error("Error actualizando suministros", error);
    } finally {
      setLoadingSuministros(false);
    }
  };

  // Duplicar Grupo
  const handleDuplicarGrupo = (cogOriginal) => {
    const base = Object.keys(gruposSuministros || {}).length > 0
      ? gruposSuministros
      : grupos;

    const grupo = base[cogOriginal];
    if (!grupo) return;

    // Nuevo COG incremental (simple y seguro)
    const existentes = Object.keys(base);
    const maxNum = Math.max(
      ...existentes.map(c => parseInt(c.replace(/\D/g, ""), 10) || 0)
    );
    const nuevoCog = `${grupo.tipo}${maxNum + 1}`;

    const nuevoGrupo = {
      ...grupo,
      cog: nuevoCog,
      titulo: `${grupo.titulo} - Copia`,
      header: {
        ...grupo.header,
        cog: nuevoCog,
        nog: `${grupo.header.nog} - Copia`,
      },
      items: grupo.items.map((item, idx) => ({
        ...item,
        cog: nuevoCog,
        nig: idx + 1,
      })),
    };

    setGruposSuministros(prev => ({
      ...(Object.keys(prev).length > 0 ? prev : grupos),
      [nuevoCog]: nuevoGrupo,
    }));
  };

  // 🔹 Construye los ítems desde el XLS usando la MISMA lógica que RegistroItemModal
  const buildGruposFromXLS = async (
    excelRows,
    gruposExistentes = {},
    grupoActivo,
    tcamb = 1
  ) => {
    if (!grupoActivo) {
      console.error("❌ buildGruposFromXLS: grupoActivo no definido");
      return gruposExistentes;
    }

    console.table(excelRows);

    const grupo = { ...(gruposExistentes[grupoActivo] || {}) };
    grupo.items = [];
    grupo.tipo = grupo.tipo || "SUMINISTRO";
    grupo.titulo = grupo.titulo || grupoActivo;

    // =====================
    // 🔁 Fallback proveedor Excel → TPR
    // =====================
    const mapProveedorExcelToTPR = (proveedor = "") => {
      const p = proveedor.toLowerCase();
      if (p.includes("rockwell")) return "01";
      if (p.includes("rittal")) return "03";
      if (p.includes("phoenix")) return "05";
      if (p.includes("schneider")) return "06";
      if (p.includes("ls")) return "07";
      return "";
    };

    // =====================
    // 1️⃣ Ítems base (Excel puro)
    // =====================
    const itemsBase = excelRows.map((row, idx) => {
      const item = {
        id: crypto.randomUUID(),
        nig: 0,
        cod: String(row.Codigo || row.codigo || "").trim(),
        des: String(row.Descripcion || row.descripcion || "").trim(), // ❗ no inventar
        can: Number(row.Cant || row.cant || 1),
        proveedorExcel: String(row.Proveedor || row.proveedor || "").trim(),
        tpr: "",
        pro: "",
        tde: "UNI",
        vc_pu: 0,
        vc_tot: 0,
        tot: 0,
        origen: "XLS",
        pendienteResolver: true,
      };

      return item;
    });

    // =====================
    // 2️⃣ Resolver por CÓDIGO (fuente de verdad)
    // =====================
    const processedItems = await Promise.all(
      itemsBase.map(async (item, idx) => {
        const row = idx + 1;

        // ⛔ Sin código válido
        if (!item.cod || ["S/C", "."].includes(item.cod.toUpperCase())) {
          return { ...item, pendienteResolver: false };
        }

        try {

          const tprPorCodigo = await resolverEndpointPorCodigo(item.cod);
          let tprFinal = "";

          if (tprPorCodigo && tprPorCodigo !== "99") {
            tprFinal = tprPorCodigo;
          } else {
            const tprExcel = mapProveedorExcelToTPR(item.proveedorExcel);
            tprFinal = tprExcel || "";
            console.warn(
              `⚠️ [${row}] Código no encontrado, fallback Excel →`,
              tprFinal || "editable"
            );
          }

          if (!tprFinal) {
            return { ...item, pendienteResolver: false };
          }

          // =====================
          // Buscar item en endpoint real
          // =====================
          const endpointMap = {
            "01": "/cotizaciones/rockwell/",
            "03": "/cotizaciones/rittal/",
            "05": "/cotizaciones/ceyesa/",
            "06": "/cotizaciones/alm-articulos/?proveedor=Schneider",
            "07": "/cotizaciones/alm-articulos/?proveedor=LS Industrial Systems",
            "99": "/cotizaciones/alm-articulos/?proveedor=OTROS",
          };

          const endpoint = endpointMap[tprFinal];
          if (!endpoint) return item;

          const res = await api.get(endpoint, { params: { search: item.cod } });
          const rows = Array.isArray(res.data) ? res.data : [];

          const encontrado = rows.find(r =>
            String(r.codigo).toUpperCase() === item.cod.toUpperCase() ||
            String(r.ocodigo).toUpperCase() === item.cod.toUpperCase()
          );

          if (!encontrado) {
            console.warn(`⚠️ [${row}] Código no encontrado en endpoint → usando datos de Excel`);

            // 🔹 Normalizamos directamente usando Excel
            const calcFallback = calcularItemSegunProveedor(
              {
                codigo: item.cod,
                descripcion: item.des,
                proveedor: item.proveedorExcel,
                pgc: item.tde,
                precio: 0 // como no hay precio en DB, dejamos 0
              },
              tprFinal,
              tcamb,
              item.can,
              item.proveedorExcel
            );

            return {
              ...item,
              tpr: calcFallback.tpr ?? tprFinal,
              cod: calcFallback.codigo ?? item.cod,
              des: calcFallback.descripcion ?? item.des,
              pro: calcFallback.proveedor ?? item.proveedorExcel,
              tde: calcFallback.unidad ?? "UNI",
              can: calcFallback.cantidad ?? 1,
              puc: calcFallback.costoPrecio ?? 0,
              tou: calcFallback.utilidad ?? 0,
              cau: calcFallback.porcentaje ?? 0,
              toc: calcFallback.costoTotal ?? 0,
              val: calcFallback.ventaPrecio ?? 0,
              tot: calcFallback.ventaTotal ?? 0,
              pendienteResolver: false,
            };
          }

          // =====================
          // Cálculo ÚNICO (tablaUtils)
          // =====================
          const calc = calcularItemSegunProveedor(
            encontrado,
            tprFinal,
            tcamb,
            item.can,
            item.proveedorExcel
          );

          return {
            ...item,

            // Identidad
            tpr: calc.tpr ?? tprFinal,
            cod: calc.codigo ?? item.cod,
            des: calc.descripcion ?? item.des,
            pro: item.proveedorExcel ?? calc.proveedor ?? "",
            tde: calc.unidad ?? "UNI",
            can: calc.cantidad ?? 1,

            // 💰 Campos que el RegistroItemModal SÍ LEE
            puc: calc.costoPrecio ?? 0,
            tou: calc.utilidad ?? 0,
            cau: calc.porcentaje ?? 0,
            toc: calc.costoTotal ?? 0,
            val: calc.ventaPrecio ?? 0,
            tot: calc.ventaTotal ?? 0,

            pendienteResolver: false,
          };

        } catch (err) {
          console.error(`💥 [${row}] Error procesando`, item.cod, err);
          return item;
        }
      })
    );

    // =====================
    // 3️⃣ Asignar NIG
    // =====================
    grupo.items = processedItems.map((item, idx) => ({
      ...item,
      nig: idx + 1,
    }));

    return {
      ...gruposExistentes,
      [grupoActivo]: grupo,
    };
  };

  // 🔹 Maneja la importación desde XLS (ya sea del modal o de un submodal)
  const handleImportarDesdeXLS = async (excelRowsOrFile) => {
    if (!grupoActivo) {
      console.error("❌ No hay grupo activo");
      return;
    }

    if (Array.isArray(excelRowsOrFile)) {
      const gruposActualizados = await buildGruposFromXLS(
        excelRowsOrFile,
        gruposSuministros,
        grupoActivo,
        tcamb
      );
      setGruposSuministros(gruposActualizados);
      return;
    }

    if (!(excelRowsOrFile instanceof Blob)) {
      console.error("❌ Archivo inválido");
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const gruposActualizados = await buildGruposFromXLS(
          excelRows,
          gruposSuministros,
          grupoActivo,
          tcamb
        );

        setGruposSuministros(gruposActualizados);
      } catch (err) {
        console.error("❌ Error procesando XLS", err);
      }
    };

    reader.readAsArrayBuffer(excelRowsOrFile);
  };

  // =============
  // SERVICIOS
  // =============
  // IDs
  const buildSubgrupoId = (servicioId, index) =>
    `SG_BACK_${servicioId}_${index}`;

  // Agregar o Editar Servicio
  const handleAgregarServicio = (form) => {

    setGruposServicios(prev => {

      // ✏️ EDITAR SERVICIO EXISTENTE
      if (form._key && prev[form._key]) {
        const servicioPrev = prev[form._key];

        return {
          ...prev,
          [form._key]: {
            ...servicioPrev,
            tituloGeneral: form.nombre, // 🔹 igual que grupo.titulo
            cantidad: Number(form.cantidad),
            lineasPdf: Number(form.lineasPdf),
            detalle: form.detalle,
            header: {
              ...servicioPrev.header,
              can: Number(form.cantidad), // si quieres reflejarlo en header
            },
          },
        };
      }

      // ➕ CREAR NUEVO SERVICIO
      const id = form.cog ?? `S${Date.now()}`;
      return {
        ...prev,
        [id]: {
          id,
          tituloGeneral: form.nombre,
          cantidad: Number(form.cantidad),
          lineasPdf: Number(form.lineasPdf),
          detalle: form.detalle,
          subgrupos: [],
          header: {
            can: Number(form.cantidad),
            tot: 0,
          },
        },
      };
    });
  };

  // Diccionario de tipos de subgrupos
  const tipoSubgrupoDict = {
    "04": "MANO DE OBRA",
    "05": "GASTOS SERVICIO",
    "06": "OTROS",
    // agrega más según tu DB
  };

  // Normalizador 
  const normalizarTipoSubgrupo = (sub) => {
    if (sub.tipoNombre) return sub;

    return {
      ...sub,
      tipoNombre: tipoSubgrupoDict[sub.tipoCodigo] ?? sub.tipoCodigo,
    };
  };

  // Agregar Subgrupo
  const handleAgregarSubgrupo = (form, servicioId) => {
    setGruposServicios(prev => {
      const servicio = prev[servicioId];
      if (!servicio) return prev;

      // ✏️ editar
      if (form._key) {
        return {
          ...prev,
          [servicioId]: {
            ...servicio,
            subgrupos: servicio.subgrupos.map(sg =>
              sg.id === form._key
                ? {
                  ...sg,
                  titulo: form.nombre,
                  tipoCodigo: form.tipoGasto,
                  tipoNombre: tipoSubgrupoDict[form.tipoGasto],
                }
                : sg
            ),
          },
        };
      }

      // ➕ crear
      const nuevoIndex = servicio.subgrupos.length;
      const nuevoSubgrupo = normalizarTipoSubgrupo({
        id: buildSubgrupoId(servicioId, nuevoIndex),
        titulo: form.nombre,
        tipoCodigo: form.tipoGasto,
        items: [],
        subtotal: 0,
      });

      return {
        ...prev,
        [servicioId]: {
          ...servicio,
          subgrupos: [...servicio.subgrupos, nuevoSubgrupo],
        },
      };
    });
  };

  // Agregar Items (diagnóstico completo)
  const handleAgregarItemServicio = (form) => {
    if (!selectedServicioId || !selectedSubgrupoId) return;

    const esEdicion = Boolean(form.num);

    const itemProcesado = {
      id: esEdicion ? form.id : `IT_${Date.now()}`,
      num: esEdicion ? form.num : Date.now(),
      cod: form.codigoTipoGasto ?? form.personal ?? form.codigo ?? "",
      des: form.concepto ?? form.descripcion ?? "",
      can: Number(form.hombres ?? form.cantidad ?? 0),
      tde: Number(form.dias ?? form.unidad ?? 0),
      pro: Number(form.horas ?? form.pro ?? 0),
      puc: Number(form.costoDia ?? form.costoPrecio ?? form.precio ?? 0),
      tou: Number(form.utilidad ?? 0),
      cau: Number(form.porcentaje ?? 0),
      toc: Number(form.costoTotal ?? 0),
      val: Number(form.cotizadoDia ?? form.ventaPrecio ?? form.precio ?? 0),
      tot: Number(form.cotizadoTotal ?? form.ventaTotal ?? form.total ?? 0),
      tpr: form.area ?? "",
    };

    setGruposServicios(prev => {
      const servicio = prev[selectedServicioId];
      if (!servicio) return prev;

      const subgrupo = servicio.subgrupos?.find(sg => sg.id === selectedSubgrupoId);
      if (!subgrupo) return prev;

      const itemsActuales = subgrupo.items || [];
      const nuevosItems = esEdicion
        ? itemsActuales.map(item =>
          item.num === form.num ? itemProcesado : item
        )
        : [...itemsActuales, itemProcesado];

      return {
        ...prev,
        [selectedServicioId]: {
          ...servicio,
          subgrupos: servicio.subgrupos.map(sg =>
            sg.id === selectedSubgrupoId
              ? { ...sg, items: nuevosItems }
              : sg
          ),
        },
      };
    });
  };

  const mapServiciosStateToPayload = (serviciosObj) => {
    const grupos = {};

    Object.values(serviciosObj).forEach(servicio => {
      const grupoId = servicio.id;

      if (!grupos[grupoId]) {
        grupos[grupoId] = {
          id: grupoId,
          tipo: "SERVICIOS",
          titulo: servicio.nombre || "",
          tituloGeneral: servicio.nombre || "",
          cantidad: Number(servicio.cantidad || 0),
          totalGrupo: 0,
          nroLineasPdf: Number(servicio.lineasPdf || 0),
          header: {
            can: 0,
            tot: 0,
          },
          items: [],
        };
      }

      // Recorrer subgrupos
      (servicio.subgrupos || []).forEach(sub => {
        (sub.items || []).forEach(it => {
          const itemProcesado = {
            id: it.id,
            num: it.num,
            cod: it.cod,
            des: it.des,
            pro: it.pro,
            tde: it.tde,
            can: Number(it.can || 0),
            puc: Number(it.puc || 0),
            toc: Number(it.toc || 0),
            cau: Number(it.cau || 0),
            tou: Number(it.tou || 0),
            val: Number(it.val || 0),
            tot: Number(it.tot || 0),
            mov: it.mov || sub.tipoCodigo || "", // tipo de movimiento
            tpr: it.tpr || "",
          };

          grupos[grupoId].items.push(itemProcesado);
          grupos[grupoId].header.can += itemProcesado.can;
          grupos[grupoId].header.tot += itemProcesado.tot;
          grupos[grupoId].totalGrupo += itemProcesado.tot;
        });
      });
    });

    return Object.values(grupos); // devuelve un array de grupos
  };

  // DUPLICAR SERVICIO
  const handleDuplicarServicio = (servicioIdOriginal) => {
    setGruposServicios(prev => {
      const servicio = prev[servicioIdOriginal];
      if (!servicio) return prev;

      const nuevoServicioId = `S_${Date.now()}`;

      const nuevosSubgrupos = (servicio.subgrupos || []).map(sub => {
        const nuevoSubId = `${nuevoServicioId}_${sub.tipoCodigo}`;

        const nuevosItems = (sub.items || []).map(item => ({
          ...item,
          id: `${nuevoSubId}_${Date.now()}`,
          num: undefined,        // 🔴 CLAVE: rompe vínculo de edición
        }));

        return {
          ...sub,
          id: nuevoSubId,
          items: nuevosItems,
          subtotal: 0,           // 🔴 se recalcula
        };
      });

      return {
        ...prev,
        [nuevoServicioId]: {
          id: nuevoServicioId,
          tituloGeneral: `${servicio.tituloGeneral} (Copia)`,
          cantidad: servicio.cantidad,
          lineasPdf: servicio.lineasPdf,
          detalle: servicio.detalle,
          subgrupos: nuevosSubgrupos,
          header: {
            can: servicio.cantidad,
            tot: 0,               // 🔴 no heredado
          },
        },
      };
    });
  };

  // =========
  // GESTION
  // =========
  const cargarMensajes = async () => {
    if (!numReg) return;

    try {
      const res = await api.get(
        `cotizacion/${numReg}/mensajes/`
      );

      setMensajes(Array.isArray(res.data) ? res.data : []);

    } catch (err) {
      console.error("Error cargando mensajes", err);
      setMensajes([]);
    }
  };

  const eliminarCotizacion = useMutation({
    mutationFn: () => api.delete(`cotizaciones/${numReg}/`),

    onSuccess: () => {
      toast({
        title: "Cotización eliminada",
        description: "El registro fue eliminado correctamente.",
        variant: "destructive",
      });

      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });

      cerrarTodo();
    },

    onError: () => {
      toast.error("Error eliminando la cotización");
    },
  });

  const handleNuevaVersion = useMutation({
    mutationFn: () =>
      api.post(`cotizaciones/nueva-version/${numReg}/`),

    onSuccess: () => {
      toast.success("Nueva versión creada correctamente");
      setOpenNuevaVersion(false);

      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });
    },

    onError: () => {
      toast.error("Error al crear nueva versión");
    },
  });

  const handleCopiarCotizacion = useMutation({
    mutationFn: () =>
      api.post(`cotizaciones/${numReg}/generar-copia/`),

    onSuccess: () => {
      toast.success("Copia de cotización creada correctamente sin COTIN");
      setOpenCopia(false);

      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });
    },

    onError: () => {
      toast.error("Error al crear la copia de la cotización");
    },
  });

  const enviarCotizacionAprobacion = useMutation({
    mutationFn: () =>
      api.patch(`cotizaciones//enviar-aprobacion/${numReg}/`, {
        estado_codigo: 3,
      }),

    onSuccess: () => {
      toast.success("Cotización enviada a aprobación");
      setOpenEnviarAprobacion(false);

      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });
    },

    onError: () => {
      toast.error("Error enviando la cotización a aprobación");
    },
  });

  const retornarCotizacion = useMutation({
    mutationFn: () =>
      api.patch(`cotizaciones/${numReg}/retornar/`),

    onSuccess: () => {
      toast.success("Cotización retornada a edición");
      setOpenRetornar(false); // si tienes modal de confirmación

      queryClient.invalidateQueries({ queryKey: ["cotizaciones"] });
      queryClient.invalidateQueries({ queryKey: ["cotizaciones-aprobacion"] });
      queryClient.invalidateQueries({ queryKey: ["cotizacion", numReg] });
    },

    onError: () => {
      toast.error("Error al retornar la cotización");
    },
  });

  // =============================
  // Función para abrir ventana
  // =============================
  const windowsOpen = (url, alto = 980, ancho = 500) => {
    const left = (screen.width - alto) / 2;
    const top = (screen.height - ancho) / 2;

    const specs = `resizable=yes,location=1,status=1,scrollbars=yes,width=${alto},height=${ancho},top=${top},left=${left}`;

    const popup = window.open(url, "detalle", specs);
    if (popup) popup.focus();
  };

  // =============================
  // Función para cerrar todo
  // =============================
  const cerrarTodo = () => {
    setOpenEliminar(false); // submodal
    onClose();              // modal padre (Dashboard)
  };

  // =====================
  // REPORTES
  // =====================
  // Reporte Suministros
  const handleReporteSuministros = () => {
    if (!numReg) {
      console.warn("⚠️ No hay num_reg para generar el reporte");
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL;

    windowsOpen(
      `${API_URL}/api/cotizaciones/reportes/reporte_suministros_html/${numReg}/`,
      980,
      700
    );
  };

  // Reporte Suministros Excel
  const handleExportSuministrosExcel = () => {
    if (!numReg) return console.warn("⚠️ No hay num_reg para generar Excel");

    const API_URL = import.meta.env.VITE_API_URL;

    window.location.href =
      `${API_URL}/cotizaciones/reportes/reporte_suministros_excel/${numReg}/`;
  };

  // Reporte Servicios
  const handleReporteServicios = () => {
    if (!numReg) {
      console.warn("⚠️ No hay num_reg para generar el reporte");
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL;

    windowsOpen(
      `${API_URL}/cotizaciones/reportes/reporte_servicios_html/${numReg}/`,
      980,
      700
    );

  };

  // Reporte Detallado Cotizacion
  const handleReporteDetallado = () => {
    if (!numReg) return;

    const API_URL = import.meta.env.VITE_API_URL;

    window.open(
      `${API_URL}/cotizaciones/reportes/reporte_detallado_cotizacion/${numReg}/`,
      "_blank",
      "width=800,height=450,scrollbars=yes,resizable=yes"
    );
  };

  // Reporte Detallado Excel
  const handleExportDetalladoExcel = () => {
    if (!numReg) return console.warn("⚠️ No hay num_reg para generar Excel");

    const API_URL = import.meta.env.VITE_API_URL;

    window.location.href =
      `${API_URL}/cotizaciones/reportes/reporte_detallado_excel/${numReg}/`;
  };

  // Reporte Detallado Cotizacion
  const handleReporteResumen = () => {
    if (!numReg) return;

    const API_URL = import.meta.env.VITE_API_URL;

    window.open(
      `${API_URL}/cotizaciones/reportes/reporte_resumen_cotizacion/${numReg}/`,
      "_blank",
      "width=800,height=450,scrollbars=yes,resizable=yes"
    );
  };

  // Reporte Venta Total
  const handleReporteVentaTotal = () => {
    if (!numReg) return;

    const API_URL = import.meta.env.VITE_API_URL;

    window.open(
      `${API_URL}/cotizaciones/reportes/reporte_venta_total/${numReg}/`,
      "_blank",
      "width=800,height=450,scrollbars=yes,resizable=yes"
    );
  };

  // Reporte Venta Parcial
  const handleReporteVentaParcial = () => {
    if (!numReg) return;

    const API_URL = import.meta.env.VITE_API_URL;

    window.open(
      `${API_URL}/cotizaciones/reportes/reporte_venta_parcial/${numReg}/`,
      "_blank",
      "width=800,height=450,scrollbars=yes,resizable=yes"
    );
  };

  //=====================
  // ACTTULIZAR TOTALES
  //=====================
  // 🔹 Totales locales dinámicos
  const [totalesLocales, setTotalesLocales] = useState({
    suministros: 0,
    servicios: 0,
    total: 0,
  });

  // 🔹 Recalcular totales cada vez que cambian gruposSuministros o gruposServicios
  useEffect(() => {
    const totalSuministrosBase = Object.values(gruposSuministros || {}).reduce(
      (acc, grupo) => {
        const subtotal = (grupo.items || []).reduce(
          (sum, it) => sum + Number(it.tot || 0),
          0
        );
        const cantidad = Number(grupo.cantidad || 1);
        return acc + subtotal * cantidad;
      },
      0
    );

    const totalServiciosBase = Object.values(gruposServicios || {}).reduce(
      (acc, srv) => {
        const subtotalSrv = (srv.subgrupos || []).reduce(
          (sAcc, sg) =>
            sAcc +
            (sg.items || []).reduce(
              (iAcc, it) => iAcc + Number(it.tot || 0),
              0
            ),
          0
        );
        const cantidadSrv = Number(srv.cantidad || 1);
        return acc + subtotalSrv * cantidadSrv;
      },
      0
    );

    const importeDescuento =
      descuentosForm?.aplicar ? Number(descuentosForm.importe || 0) : 0;

    let totalSuministros = totalSuministrosBase;
    let totalServicios = totalServiciosBase;

    if (importeDescuento > 0) {
      switch (descuentosForm?.afecto) {
        case "t":
          // Se aplica al total general
          break;

        case "su":
          totalSuministros = Math.max(
            totalSuministrosBase - importeDescuento,
            0
          );
          break;

        case "ser":
          totalServicios = Math.max(
            totalServiciosBase - importeDescuento,
            0
          );
          break;

        default:
          break;
      }
    }

    let totalGeneral = totalSuministros + totalServicios;

    // Si el descuento afecta al TOTAL
    if (importeDescuento > 0 && descuentosForm?.afecto === "t") {
      totalGeneral = Math.max(
        totalSuministrosBase + totalServiciosBase - importeDescuento,
        0
      );
    }

    setTotalesLocales({
      suministros: totalSuministros,
      servicios: totalServicios,
      total: totalGeneral,
    });
  }, [gruposSuministros, gruposServicios, descuentosForm]);





  // 🔹 Descuento calculado
  const descuentoAplicado = (() => {
    if (!descuentosForm?.aplicar) return 0;

    const importe = Number(descuentosForm.importe || 0);
    const porcentaje = Number(descuentosForm.porcentaje || 0);

    if (importe > 0) return Math.min(importe, totalesLocales.total);

    if (porcentaje > 0) {
      return Math.min(
        totalesLocales.total * (porcentaje / 100),
        totalesLocales.total
      );
    }

    return 0;
  })();

  const totalFinal = Math.max(
    totalesLocales.total - descuentoAplicado,
    0
  );

  //============
  // DESCUENTO
  //============
  const handleGuardarDescuento = (payload) => {
    setDescuentosForm(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-[28px] shadow-2xl p-0 flex flex-col border-none">

        {/* ENCABEZADO PREMIUM INTERACTIVO */}
        <div className="relative bg-gradient-to-r from-slate-50/60 to-white/30 backdrop-blur-md border-b border-slate-100/80 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 font-sans">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white shadow-lg shadow-teal-500/20 flex items-center justify-center shrink-0">
              <Icon name="layout-dashboard" className="h-5.5 w-5.5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <DialogTitle className="text-xl font-black text-gray-900 tracking-tight leading-none uppercase">
                  {esNueva 
                    ? (data?.codigo ? `NUEVA COTIZACIÓN ${data.codigo}` : "NUEVA COTIZACIÓN") 
                    : `COTIZACIÓN ${data?.codigo || data?.numero || 'S/N'}`}
                </DialogTitle>
              </div>

              {/* LÍNEA DE DATOS EDITABLES */}
              <div className="relative flex flex-wrap items-center text-[12px] gap-x-4 gap-y-1">
                {/* CLIENTE (Editable Autocomplete) */}
                <ClienteAutocomplete
                  value={clienteQuery}
                  initialId={data.id_cliente}
                  isReadOnly={isReadOnly}
                  onSelect={(cliente) => {
                    setData(prev => ({
                      ...prev,
                      cliente_codigo: cliente.ruc ? String(cliente.ruc) : "",
                      id_cliente: cliente.id_cliente || null,
                      // Reset representative/contact fields
                      codir: "",
                      nombr: "",
                      cargo: "",
                      teler: "",
                      movir: "",
                      mailr: "",
                    }));
                    setClienteQuery(cliente.nombre || "");
                    setClienteSelected(!!cliente.id_cliente);
                    setEncargadoQuery("");
                    if (cliente.id_cliente) {
                      autocompletarTiemposDesdeUltima(cliente.id_cliente, cliente.ruc || cliente.codigo);
                    }
                  }}
                />

                {/* REPRESENTANTE (Editable Autocomplete) */}
                <RepresentanteAutocomplete
                  value={encargadoQuery}
                  clienteId={data.id_cliente}
                  initialId={data.codir}
                  isReadOnly={isReadOnly || !data.id_cliente}
                  onSelect={(enc) => {
                    setData(prev => ({
                      ...prev,
                      nombr: enc.nombre_representante || "",
                      codir: (enc.id_representante || enc.codigo) ? String(enc.id_representante || enc.codigo) : "",
                      cargo: enc.cargo || "",
                      mailr: enc.email || "",
                      teler: enc.telefono || "",
                      movir: enc.movil || "",
                    }));
                    setEncargadoQuery(enc.nombre_representante || "");
                  }}
                />

                {/* ÁREA COMERCIAL */}
                <SelectField
                  inline
                  icon={<Icon name="layers" className="h-3.5 w-3.5 text-teal-400" />}
                  value={data.area_codigo || ""}
                  onChange={(e) => handleFieldChange("area_codigo", e.target.value)}
                  options={areasOptions}
                  disabled={isReadOnly}
                  className="w-auto shrink-0 [&_div]:px-2.5 [&_div]:py-1 [&_div]:rounded-xl [&_div]:border-none [&_div]:shadow-none [&_div]:bg-transparent hover:[&_div]:bg-gray-50 focus-within:[&_div]:bg-white"
                />

                {/* TIPO Y TIPO VENTA */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <SelectField
                    inline
                    icon={<Icon name="tag" className="h-3.5 w-3.5 text-blue-500" />}
                    value={data.cotit || ""}
                    onChange={(e) => handleFieldChange("cotit", e.target.value)}
                    options={tipoOptions}
                    disabled={isReadOnly}
                    className="w-auto shrink-0 [&_div]:px-2.5 [&_div]:py-1 [&_div]:rounded-xl [&_div]:border-none [&_div]:shadow-none [&_div]:bg-transparent hover:[&_div]:bg-gray-50 focus-within:[&_div]:bg-white"
                  />

                  {/* Divisor interno y Sub-tipo solo si es Venta */}
                  {data.cotit === "V" && (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-1">
                      <span className="text-gray-300 font-light">|</span>
                      <SelectField
                        inline
                        value={data.tven || ""}
                        onChange={(e) => handleFieldChange("tven", e.target.value)}
                        options={tipoVentaOptions}
                        disabled={isReadOnly}
                        className="w-auto shrink-0 [&_div]:px-2.5 [&_div]:py-1 [&_div]:rounded-xl [&_div]:border-none [&_div]:shadow-none [&_div]:bg-transparent hover:[&_div]:bg-gray-50 focus-within:[&_div]:bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BOTÓN REPORTE (SOLO PARA EXISTENTES) */}
          {!esNueva && (
            <div className="flex items-center gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setReporteMenuOpen(!reporteMenuOpen)}
                  className="flex items-center px-4 py-2 bg-sky-50/70 border border-sky-200 rounded-xl text-[10px] font-black text-sky-700 hover:bg-sky-100/70 hover:border-sky-300 hover:shadow-sm transition-all h-[42px] uppercase group"
                >
                  <Icon name="file-text" className="h-3.5 w-3.5 mr-2 text-sky-600 group-hover:scale-110 transition-transform" />
                  <span>Reporte</span>
                  <Icon name="chevron-down" className={`ml-1.5 h-3 w-3 transition-transform duration-200 ${reporteMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {reporteMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                      <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Opciones de Cliente</span>
                    </div>

                    <button
                      onClick={() => {
                        handleReporteDetallado();
                        setReporteMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <div className="p-1 bg-indigo-50 rounded-lg text-indigo-600">
                        <Icon name="list" className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-bold leading-none">Reporte Detallado</p>
                        <span className="text-[9px] text-slate-400 font-medium">Desglose completo</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        handleReporteResumen();
                        setReporteMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <div className="p-1 bg-amber-50 rounded-lg text-amber-600">
                        <Icon name="file-text" className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-bold leading-none">Reporte Resumen</p>
                        <span className="text-[9px] text-slate-400 font-medium">Totales generales</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        toast.success("Se harán reportes WORD y PDF (API pendiente)");
                        setReporteMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[11px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                    >
                      <div className="p-1 bg-slate-50 rounded-lg text-slate-400">
                        <Icon name="download" className="h-3.5 w-3.5" />
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
          )}
        </div>

        {/* FORM CENTRAL - DISEÑO 3 COLUMNAS SIN SCROLL INNECESARIO */}
        <div className="flex-initial overflow-y-auto p-6 space-y-5 bg-slate-50/10 no-scrollbar">
          
          {/* SECCIÓN OPORTUNIDADES */}
          {esOportunidad && (
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-100/50 shadow-md shadow-slate-100/40 p-6 space-y-4 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-1">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <CalendarRange className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest block">Seguimiento de Oportunidad</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block -mt-0.5">Control de Fechas</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InputField
                  size="sm" type="date"
                  label="Recepción Solicitud:"
                  value={data.f_recp || ""}
                  onChange={(e) => handleFieldChange("f_recp", e.target.value)}
                  readOnly={isReadOnly}
                  className="[&_input]:border-none [&_input]:bg-slate-50/60 hover:[&_input]:bg-slate-100/40 [&_input]:rounded-full [&_input]:h-8 [&_input]:px-3 focus-within:[&_input]:bg-white focus-within:[&_input]:ring-2 focus-within:[&_input]:ring-teal-500/25 transition-all [&_label]:text-[10px] [&_label]:font-black [&_label]:text-slate-400 [&_label]:uppercase [&_label]:tracking-wider"
                />
                <InputField
                  size="sm" type="date"
                  label="Fecha Límite:*"
                  className="border-red-100 bg-red-50/30 [&_input]:border-none [&_input]:bg-red-50/60 hover:[&_input]:bg-red-100/30 [&_input]:rounded-full [&_input]:h-8 [&_input]:px-3 focus-within:[&_input]:bg-white focus-within:[&_input]:ring-2 focus-within:[&_input]:ring-red-500/25 transition-all [&_label]:text-[10px] [&_label]:font-black [&_label]:text-red-500 [&_label]:uppercase [&_label]:tracking-wider"
                  value={data.f_limite || ""}
                  onChange={(e) => handleFieldChange("f_limite", e.target.value)}
                  readOnly={isReadOnly}
                />
                <InputField
                  size="sm" type="date"
                  label="Emisión Cotización:"
                  value={data.f_emi || ""}
                  onChange={(e) => handleFieldChange("f_emi", e.target.value)}
                  readOnly={isReadOnly}
                  className="[&_input]:border-none [&_input]:bg-slate-50/60 hover:[&_input]:bg-slate-100/40 [&_input]:rounded-full [&_input]:h-8 [&_input]:px-3 focus-within:[&_input]:bg-white focus-within:[&_input]:ring-2 focus-within:[&_input]:ring-teal-500/25 transition-all [&_label]:text-[10px] [&_label]:font-black [&_label]:text-slate-400 [&_label]:uppercase [&_label]:tracking-wider"
                />
                <SelectField
                  size="sm"
                  label="Estado Op.:"
                  value={(data.estado_op !== undefined && data.estado_op !== null) ? data.estado_op : ""}
                  options={estadoOpOptions}
                  onChange={(e) => handleFieldChange("estado_op", e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div className="pt-1">
                <InputField
                  inline size="sm"
                  label="Comentarios:"
                  value={data.coment || ""}
                  onChange={(e) => handleFieldChange("coment", e.target.value)}
                  readOnly={isReadOnly}
                  className="[&_input]:border-none [&_input]:bg-slate-50/60 hover:[&_input]:bg-slate-100/40 [&_input]:rounded-full [&_input]:h-8 [&_input]:px-3 focus-within:[&_input]:bg-white focus-within:[&_input]:ring-2 focus-within:[&_input]:ring-teal-500/25 transition-all [&_label]:text-[10px] [&_label]:font-black [&_label]:text-slate-400 [&_label]:uppercase [&_label]:tracking-wider"
                />
              </div>
            </div>
          )}

          {/* GRID TRIPLE COLUMNAR */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            
            {/* COLUMNA 1: IDENTIFICACIÓN & CONDICIONES */}
            <div className="space-y-5">
              {/* IDENTIFICACIÓN */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-100/50 shadow-md shadow-slate-100/40 p-5 space-y-4 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest block">Identificación</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block -mt-0.5">Registro Base</span>
                    </div>
                  </div>
                  {data?.numero?.trim() ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Loader className="w-4 h-4 text-slate-400 animate-spin" />
                  )}
                </div>
                
                <InputField
                  id="referencia"
                  inline
                  size="sm"
                  label="Referencia:*"
                  as="textarea"
                  rows={2}
                  value={data.referencia || ""}
                  onChange={(e) => handleFieldChange("referencia", e.target.value)}
                  readOnly={isReadOnly}
                  className={`[&_textarea]:border-none [&_textarea]:bg-slate-50/60 hover:[&_textarea]:bg-slate-100/40 [&_textarea]:rounded-2xl [&_textarea]:px-3 focus-within:[&_textarea]:bg-white focus-within:[&_textarea]:ring-2 focus-within:[&_textarea]:ring-teal-500/25 transition-all [&_label]:text-[10px] [&_label]:font-black [&_label]:text-slate-400 [&_label]:uppercase [&_label]:tracking-wider ${campoError === "referencia" ? "[&_textarea]:border [&_textarea]:border-red-400 [&_textarea]:bg-red-50/50" : ""}`}
                />

                <InputField
                  id="fecha"
                  inline
                  size="sm"
                  label="Fecha:*"
                  type="date"
                  value={data.fecha || ""}
                  onChange={(e) => handleFieldChange("fecha", e.target.value)}
                  readOnly={isReadOnly}
                  className={`[&_input]:border-none [&_input]:bg-slate-50/60 hover:[&_input]:bg-slate-100/40 [&_input]:rounded-full [&_input]:h-8 [&_input]:px-3 focus-within:[&_input]:bg-white focus-within:[&_input]:ring-2 focus-within:[&_input]:ring-teal-500/25 transition-all [&_label]:text-[10px] [&_label]:font-black [&_label]:text-slate-400 [&_label]:uppercase [&_label]:tracking-wider ${campoError === "fecha" ? "[&_input]:border [&_input]:border-red-400 [&_input]:bg-red-50/50" : ""}`}
                />
                
                <SelectField
                  id="probbabilidad"
                  inline
                  size="sm"
                  label="Probabilidad:*"
                  value={data.prob || ""}
                  onChange={(e) => handleFieldChange("probbabilidad", e.target.value)}
                  options={probOptions}
                  disabled={isReadOnly}
                  className={campoError === "probbabilidad" ? "border-red-400 bg-red-50/50" : ""}
                />
              </div>

              {/* CONDICIONES */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-100/50 shadow-md shadow-slate-100/40 p-5 space-y-4 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-1">
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest block">Condiciones</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block -mt-0.5">Parámetros de Cotización</span>
                  </div>
                </div>

                <SelectField
                  size="sm"
                  label="Forma Pago:"
                  value={data.forma_pago || ""}
                  onChange={(e) => handleFieldChange("forma_pago", e.target.value)}
                  disabled={isReadOnly}
                  options={formasPagoOptions}
                />

                <InputField
                  inline
                  size="sm"
                  label="Lugar Entrega:"
                  value={data.lugar || ""}
                  onChange={(e) => handleFieldChange("lugar", e.target.value)}
                  readOnly={isReadOnly}
                  className="[&_input]:border-none [&_input]:bg-slate-50/60 hover:[&_input]:bg-slate-100/40 [&_input]:rounded-full [&_input]:h-8 [&_input]:px-3 focus-within:[&_input]:bg-white focus-within:[&_input]:ring-2 focus-within:[&_input]:ring-teal-500/25 transition-all [&_label]:text-[10px] [&_label]:font-black [&_label]:text-slate-400 [&_label]:uppercase [&_label]:tracking-wider"
                />
              </div>
            </div>

            {/* COLUMNA 2: TIEMPOS DE ENTREGA & CONTACTO */}
            <div className="space-y-5">
              {/* TIEMPOS */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-100/50 shadow-md shadow-slate-100/40 p-5 space-y-4 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest block">Tiempos de Entrega</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block -mt-0.5">Plazos Estimados</span>
                    </div>
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex flex-wrap gap-1.5 items-center bg-slate-50/50 p-2 rounded-2xl border border-slate-100/50 mb-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider ml-1 shrink-0">Predeterminados:</span>
                    {[
                      { label: "3 días", val: 3, uni: "D" },
                      { label: "1 Sem.", val: 1, uni: "S" },
                      { label: "15 días", val: 15, uni: "D" },
                      { label: "30 días", val: 30, uni: "D" }
                    ].map((pill, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="text-[9px] px-2 py-0.5 bg-white hover:bg-teal-50 hover:text-teal-600 text-slate-600 rounded-full font-bold border border-slate-200/60 shadow-sm transition-colors uppercase tracking-tight"
                        onClick={() => {
                          let diasASumar = pill.val;
                          if (pill.uni === "S") diasASumar = pill.val * 7;
                          if (pill.uni === "M") diasASumar = pill.val * 30;

                          const nuevaFecha = new Date();
                          nuevaFecha.setDate(nuevaFecha.getDate() + diasASumar);

                          setData(prev => ({
                            ...prev,
                            plazo: pill.val,
                            tot_d: pill.uni,
                            fecha: nuevaFecha.toISOString().split('T')[0]
                          }));
                          toast.success(`Plazo configurado en ${pill.label}`);
                        }}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                )}

                <InputField
                  inline
                  size="sm"
                  label="Suministros:"
                  value={suministrosTexto}
                  onChange={(e) => handleSuministrosTextoChange(e.target.value)}
                  onFocus={() => setSuministrosFocused(true)}
                  onBlur={handleSuministrosBlur}
                  readOnly={isReadOnly}
                  placeholder="ej. 15 días o 2 sem"
                  className="[&_input]:border-none [&_input]:bg-slate-50/60 hover:[&_input]:bg-slate-100/40 [&_input]:rounded-full [&_input]:h-8 [&_input]:px-3 focus-within:[&_input]:bg-white focus-within:[&_input]:ring-2 focus-within:[&_input]:ring-teal-500/25 transition-all [&_label]:text-[10.5px] [&_label]:font-bold [&_label]:text-slate-400 [&_label]:uppercase [&_label]:tracking-wider"
                />

                <InputField
                  inline
                  size="sm"
                  label="Servicios:"
                  value={serviciosTexto}
                  onChange={(e) => handleServiciosTextoChange(e.target.value)}
                  onFocus={() => setServiciosFocused(true)}
                  onBlur={handleServiciosBlur}
                  readOnly={isReadOnly}
                  placeholder="ej. 7 días o 1 sem"
                  className="[&_input]:border-none [&_input]:bg-slate-50/60 hover:[&_input]:bg-slate-100/40 [&_input]:rounded-full [&_input]:h-8 [&_input]:px-3 focus-within:[&_input]:bg-white focus-within:[&_input]:ring-2 focus-within:[&_input]:ring-teal-500/25 transition-all [&_label]:text-[10.5px] [&_label]:font-bold [&_label]:text-slate-400 [&_label]:uppercase [&_label]:tracking-wider"
                />

                <InputField
                  inline
                  size="sm"
                  label="Validez Oferta:"
                  value={validezTexto}
                  onChange={(e) => handleValidezTextoChange(e.target.value)}
                  onFocus={() => setValidezFocused(true)}
                  onBlur={handleValidezBlur}
                  readOnly={isReadOnly}
                  placeholder="ej. 30 días o 1 mes"
                  className="[&_input]:border-none [&_input]:bg-slate-50/60 hover:[&_input]:bg-slate-100/40 [&_input]:rounded-full [&_input]:h-8 [&_input]:px-3 focus-within:[&_input]:bg-white focus-within:[&_input]:ring-2 focus-within:[&_input]:ring-teal-500/25 transition-all [&_label]:text-[10.5px] [&_label]:font-bold [&_label]:text-slate-400 [&_label]:uppercase [&_label]:tracking-wider"
                />
              </div>

              {/* CONTACTO REPRESENTANTE */}
              {data.nombr ? (
                <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-100/50 shadow-md shadow-slate-100/40 p-5 space-y-4 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-1">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest block">Contacto</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block -mt-0.5">Representante de Cliente</span>
                    </div>
                  </div>
                  
                  <div className="text-[11px] text-slate-600 space-y-2 bg-gradient-to-br from-teal-50/40 via-cyan-50/20 to-white border border-teal-100/50 rounded-2xl p-4 shadow-sm border-l-4 border-l-teal-500">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                      <span className="font-black text-slate-700 uppercase text-[9.5px] tracking-wider truncate max-w-[150px]">
                        {data.nombr}
                      </span>
                      <span className="text-[8.5px] font-black text-teal-700 bg-teal-50 border border-teal-100/50 px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0">
                        Representante
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">Cargo</span>
                        <span className="text-slate-700 font-bold text-xs truncate block">{data.cargo || "---"}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">Móvil</span>
                        <span className="text-slate-700 font-bold text-xs flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span className="truncate">{data.movir || data.teler || "---"}</span>
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 uppercase text-[9px] block mb-0.5">Correo Electrónico</span>
                      <span className="text-slate-700 font-bold text-xs truncate flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                        <span className="truncate">{data.mailr || "---"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* COLUMNA 3: FINANCIERO & RESPONSABLES */}
            <div className="space-y-5">
              {/* FINANCIERO */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-100/50 shadow-md shadow-slate-100/40 p-5 space-y-4 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-1">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest block">Financiero</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block -mt-0.5">Moneda e Impuestos</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    size="sm"
                    label="Moneda:"
                    value={data.tipo_moneda || (esNueva ? "D" : "")}
                    onChange={(e) => handleFieldChange("tipo_moneda", e.target.value)}
                    options={monedasOptions}
                    disabled={isReadOnly}
                  />
                  <SelectField
                    size="sm"
                    label="IGV:"
                    value={data.igv || "N"}
                    onChange={(e) => handleFieldChange("igv", e.target.value)}
                    options={igvOptions}
                    disabled={isReadOnly}
                  />
                </div>

                <InputField
                  inline
                  size="sm"
                  label="T.C.:"
                  value={data.tipo_cambio || (esNueva ? "3.425" : "")}
                  onChange={(e) => handleFieldChange("tipo_cambio", e.target.value)}
                  readOnly={isReadOnly}
                  className="[&_input]:border-none [&_input]:bg-slate-50/60 [&_input]:rounded-full [&_input]:h-8 [&_input]:px-3 [&_label]:text-[10px] [&_label]:font-black [&_label]:text-slate-400 [&_label]:uppercase [&_label]:tracking-wider"
                />
              </div>

              {/* RESPONSABLES */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-100/50 shadow-md shadow-slate-100/40 p-5 space-y-4 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-1">
                  <div className="p-2 rounded-xl bg-fuchsia-500/10 text-fuchsia-600 flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest block">Responsables</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block -mt-0.5">Asignación Interna</span>
                  </div>
                </div>

                {/* COMERCIAL */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Comercial:</span>
                  </div>

                  <div className="relative" ref={comercialRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        value={comercialQuery}
                        disabled={isReadOnly}
                        placeholder="Buscar comercial..."
                        onFocus={() => {
                          setComercialFocused(true);
                          fetchComercialInline("");
                          setShowComercialDropdown(true);
                        }}
                        onChange={(e) => {
                          setComercialQuery(e.target.value);
                          if (!e.target.value) {
                            setData(prev => ({ ...prev, nombc: "", codic: "", codco: "", telec: "", mov1c: "", mov2c: "", mailc: "" }));
                          }
                        }}
                        className="w-full pl-9 pr-3 py-1.5 border-none rounded-full text-xs font-bold text-slate-700 bg-slate-50/60 outline-none focus:ring-2 focus:ring-teal-500/25 transition-all"
                      />
                    </div>

                    {/* DROPDOWN COMERCIAL */}
                    {showComercialDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                        {comercialLoading ? (
                          <div className="p-3 text-xs text-center text-slate-400">Buscando...</div>
                        ) : (
                          comercialResults.map((c, i) => (
                            <div
                              key={i}
                              onMouseDown={() => handleComercialSelect(c)}
                              className={`px-3 py-2 text-xs cursor-pointer border-b border-slate-50 last:border-0 transition-colors
                                ${highlightComercialIndex === i ? "bg-teal-600 text-white" : "hover:bg-teal-50 text-slate-700"}`}
                            >
                              <div className="font-bold text-[11px]">{c.nombre_completo}</div>
                              <div className={`text-[9px] ${highlightComercialIndex === i ? "text-teal-100" : "text-slate-400"} mt-0.5`}>
                                {c.mail_usu}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* TÉCNICO */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Técnico:</span>
                  </div>

                  <div className="relative" ref={tecnicoRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        value={tecnicoQuery}
                        disabled={isReadOnly}
                        placeholder="Buscar técnico..."
                        onFocus={() => {
                          setTecnicoFocused(true);
                          fetchTecnicoInline("");
                          setShowTecnicoDropdown(true);
                        }}
                        onChange={(e) => {
                          setTecnicoQuery(e.target.value);
                          if (!e.target.value) {
                            setData(prev => ({ ...prev, nombt: "", codit: "", telet: "", mov1t: "", mov2t: "", mailt: "" }));
                          }
                        }}
                        className="w-full pl-9 pr-3 py-1.5 border-none rounded-full text-xs font-bold text-slate-700 bg-slate-50/60 outline-none focus:ring-2 focus:ring-teal-500/25 transition-all"
                      />
                    </div>

                    {/* DROPDOWN TÉCNICO */}
                    {showTecnicoDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                        {tecnicoLoading ? (
                          <div className="p-3 text-xs text-center text-slate-400">Buscando...</div>
                        ) : (
                          tecnicoResults.map((t, i) => (
                            <div
                              key={i}
                              onMouseDown={() => handleTecnicoSelect(t)}
                              className={`px-3 py-2 text-xs cursor-pointer border-b border-slate-50 last:border-0 transition-colors
                                ${highlightTecnicoIndex === i ? "bg-teal-600 text-white" : "hover:bg-teal-50 text-slate-700"}`}
                            >
                              <div className="font-bold text-[11px]">{t.nombre_completo}</div>
                              <div className={`text-[9px] ${highlightTecnicoIndex === i ? "text-teal-100" : "text-slate-400"} mt-0.5`}>
                                {t.mail_usu}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>

          <QuickCreateClienteModal
            open={openQuickCreate}
            onClose={() => setOpenQuickCreate(false)}
            onSave={async (nuevoCliente) => {
              try {
                const { data: res } = await api.post("core/clientes/", nuevoCliente);
                toast.success("Empresa creada correctamente");
                setOpenQuickCreate(false);
                setData(prev => ({
                  ...prev,
                  cliente_codigo: String(res.ruc || res.codigo || ""),
                  id_cliente: res.id_cliente || null,
                }));
                setClienteQuery(res.nombre);
                setClienteSelected(true);
              } catch (err) {
                console.error("❌ Error creando cliente rápido:", err);
                toast.error("Error al registrar la empresa");
              }
            }}
          />

        </div>

        {/* SECCIÓN DE ACCIONES (FOOTER) - SOLO SALIR Y CREAR */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-100 px-6 py-3 flex justify-end items-center gap-3 shrink-0 z-10">
          {/* SALIR */}
          <Button
            variant="ghost"
            className="h-10 px-6 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-[11px] font-black uppercase tracking-widest border border-slate-200 transition-all"
            onClick={onClose}
          >
            Salir
          </Button>

          {/* BOTÓN CREAR DINÁMICO */}
          {canSave && (
            <Button
              type="button"
              variant="ghost"
              disabled={crearMutation.isPending}
              className={`h-10 px-8 rounded-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all border-none
                ${crearMutation.isPending
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none"
                  : ""
                }`}
              onClick={handleGuardarCotizacion}
            >
              {crearMutation.isPending ? (esNueva ? "Creando..." : "Guardando...") : (esNueva ? "Crear" : "Guardar")}
            </Button>
          )}
        </div>
        
      </DialogContent>
    </Dialog>
  );
}
