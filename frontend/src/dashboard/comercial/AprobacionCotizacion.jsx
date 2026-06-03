import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, Filter, MoreHorizontal, LayoutDashboard, ClipboardCheck, TrendingUp, FolderCheck, CalendarRange, ArrowUpRight } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { ERPTable, StatusBadge, ERPButton, ERPInput, FilterDropdown } from "@/components/ui/ERPComponents";
import CotizacionNuevaModal from "../../modal/CotizacionNuevaModal";
import { formatDate } from "@/utils/formatters";
import TablaCotizaciones from "./tablas/TablaCotizaciones";
import TablaOportunidades from "./tablas/TablaOportunidades";
import TablaApertura from "./tablas/TablaAperturas";

const fetchCotizaciones = async ({ queryKey }) => {
  const [
    _key, anno, mes, probabilidad, comercialSearch, tecnicoSearch, envioFilter,
    suministrosValor, suministrosUnidad, serviciosValor, serviciosUnidad, ofertaValor, ofertaUnidad
  ] = queryKey;
  const token = localStorage.getItem("access_token");

  const { data } = await api.get("cotizaciones/lista_cotizaciones/", {
    params: {
      anno,
      mes,
      probabilidad,
      comercial_search: comercialSearch,
      tecnico_search: tecnicoSearch,
      envio: envioFilter,
      suministros_val: suministrosValor,
      suministros_uni: suministrosUnidad,
      servicios_val: serviciosValor,
      servicios_uni: serviciosUnidad,
      oferta_val: ofertaValor,
      oferta_uni: ofertaUnidad
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  return {
    tabla: Array.isArray(data?.tabla) ? data.tabla : [],
    dashboard: data?.dashboard || {}
  };
};

const fetchOportunidades = async ({ queryKey }) => {
  const [
    _key, anno, mes, comercialSearch, estadoOportunidad
  ] = queryKey;
  const token = localStorage.getItem("access_token");

  const { data } = await api.get("cotizaciones/lista_oportunidades/", {
    params: {
      anno,
      mes,
      comercial_search: comercialSearch,
      estado_oportunidad: estadoOportunidad // 1, 2, 3, 4 o '%'
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  return {
    tabla: Array.isArray(data?.tabla) ? data.tabla : [],
    dashboard: data?.dashboard || {}
  };
};

export default function AprobacionCotizacion() {
  const navigate = useNavigate();
  const { authUser: user } = useAuth();
  const [currentTab, setCurrentTab] = useState("cotizaciones");

  // ESTADOS DE FILTROS
  const [globalSearch, setGlobalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODAS");
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedAnno, setSelectedAnno] = useState(new Date().getFullYear());
  const [selectedMes, setSelectedMes] = useState("%"); // "%" para mostrar todo el año

  // ESTADO PARA PANEL DE FILTROS
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const filterPanelRef = useRef(null); // Para cerrar al hacer clic fuera
  const [envioFilter, setEnvioFilter] = useState("%");
  const [probabilidadFilter, setProbabilidadFilter] = useState("%");
  const [responsableTipo, setResponsableTipo] = useState("COMERCIAL");
  const [comercialSearch, setComercialSearch] = useState("%");
  const [tecnicoSearch, setTecnicoSearch] = useState("%");
  const [inputBusqueda, setInputBusqueda] = useState("");
  const [responsableNombre, setResponsableNombre] = useState("%");
  const [suministrosValor, setSuministrosValor] = useState("");
  const [suministrosUnidad, setSuministrosUnidad] = useState("D");
  const [serviciosValor, setServiciosValor] = useState("");
  const [serviciosUnidad, setServiciosUnidad] = useState("D");
  const [ofertaValor, setOfertaValor] = useState("");
  const [ofertaUnidad, setOfertaUnidad] = useState("D");
  const [activeFilterTab, setActiveFilterTab] = useState("FECHAS");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sorting state - Default by date descending
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageOportunidades, setCurrentPageOportunidades] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. QUERY DE COTIZACIONES (Existente)
  const { 
    data: dataCotizaciones, 
    isLoading: isLoadingCotizaciones 
  } = useQuery({
    queryKey: [
      "cotizaciones", selectedAnno, selectedMes, probabilidadFilter, comercialSearch, tecnicoSearch, envioFilter,
      suministrosValor, suministrosUnidad, serviciosValor, serviciosUnidad, ofertaValor, ofertaUnidad
    ],
    queryFn: fetchCotizaciones,
    enabled: currentTab === "cotizaciones", // Solo se ejecuta si estamos en este tab
  });

  // 2. NUEVA QUERY DE OPORTUNIDADES
  const [estadoOportunidad, setEstadoOportunidad] = useState("%"); 

  const { 
    data: dataOportunidades, 
    isLoading: isLoadingOportunidades 
  } = useQuery({
    queryKey: ["oportunidades", selectedAnno, selectedMes, comercialSearch, estadoOportunidad],
    queryFn: fetchOportunidades,
  });

  const cotizaciones = dataCotizaciones?.tabla || [];
  const oportunidades = dataOportunidades?.tabla || [];
  const backendStats = (currentTab === "cotizaciones" ? dataCotizaciones?.dashboard : dataOportunidades?.dashboard) || {};
  const isLoading = currentTab === "cotizaciones" ? isLoadingCotizaciones : isLoadingOportunidades;

  // Dynamic PageSize based on screen height
  useEffect(() => {
    const calculatePageSize = () => {
      const vh = window.innerHeight;
      const headerHeight = 400; // Header + KPIs + Search (approx)
      const rowHeight = 72; // Avg row height
      const footerHeight = 60;
      const availableHeight = vh - headerHeight - footerHeight;
      const calculatedSize = Math.max(5, Math.floor(availableHeight / rowHeight));
      setPageSize(calculatedSize);
    };

    calculatePageSize();
    window.addEventListener('resize', calculatePageSize);
    return () => window.removeEventListener('resize', calculatePageSize);
  }, []);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredData = useMemo(() => {
    let result = cotizaciones.filter((item) => {
      const matchesSearch =
        item.num_reg?.toString().includes(globalSearch) ||
        item.cliente?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        item.cliente_nombre?.toLowerCase().includes(globalSearch.toLowerCase()) ||
        item.referencia?.toLowerCase().includes(globalSearch.toLowerCase());

      const matchesStatus = statusFilter === "TODAS" ||
        item.estado_nombre?.toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [cotizaciones, globalSearch, statusFilter, sortConfig]);

  const stats = useMemo(() => {
    return {
      total: filteredData.length,
      adjudicadas: filteredData.filter(c => c.estado_nombre?.includes('ADJUDICADA')).length,
      pendientes: filteredData.filter(c => c.estado_nombre?.includes('PENDIENTE')).length,
    };
  }, [filteredData]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on filter/search change
  }, [globalSearch, statusFilter]);

  const headers = [
    { label: "Código", key: "codigo", className: "w-[12%]" },
    { label: "Descripción", key: "referencia", className: "w-[25%]" },
    { label: "Cliente", key: "cliente_nombre", className: "w-[20%]" },
    { label: "Área", key: "area_nombre", className: "w-[10%]" },
    { label: "Estado", key: "estado_nombre", className: "w-[10%]" },
    { label: "Envío", key: "envio", className: "w-[8%]" },
    { label: "Fecha", key: "fecha", className: "w-[5%]" },
    { label: "Monto($)", key: "total_cotizacion", className: "w-[10%]" }
  ];

  // Lógica para cerrar el panel al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
        setShowAdvancedFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calcular filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedAnno !== "%") count++;
    if (selectedMes !== "%") count++;
    if (envioFilter !== "%") count++;
    if (probabilidadFilter !== "%") count++;
    if (comercialSearch !== "%") count++;
    if (tecnicoSearch !== "%") count++;
    if (suministrosValor !== "") count++;
    if (serviciosValor !== "") count++;
    if (ofertaValor !== "") count++;
    return count;
  }, [selectedAnno, selectedMes, envioFilter, probabilidadFilter, comercialSearch, tecnicoSearch, suministrosValor, serviciosValor, ofertaValor]);

  // ========
  // FECHAS
  // ========
  // Generar años para filtro
  const currentYear = new Date().getFullYear();
  const yearsOptions = [{ v: "%", n: "TODOS" }, ...Array.from({ length: currentYear - 2011 + 1 }, (_, i) => ({
    v: (currentYear - i).toString(),
    n: (currentYear - i).toString()
  }))];

  const monthsOptions = [
    { v: "%", n: "TODOS" },
    { v: "1", n: "ENERO" }, { v: "2", n: "FEBRERO" }, { v: "3", n: "MARZO" },
    { v: "4", n: "ABRIL" }, { v: "5", n: "MAYO" }, { v: "6", n: "JUNIO" },
    { v: "7", n: "JULIO" }, { v: "8", n: "AGOSTO" }, { v: "9", n: "SETIEMBRE" },
    { v: "10", n: "OCTUBRE" }, { v: "11", n: "NOVIEMBRE" }, { v: "12", n: "DICIEMBRE" }
  ];
  const [searchYear, setSearchYear] = useState("");
  const [searchMonth, setSearchMonth] = useState("");

  // Filtrar años según lo que se escribe
  const filteredYears = yearsOptions.filter(opt =>
    opt.n.toLowerCase().includes(searchYear.toLowerCase())
  );

  // Filtrar meses según lo que se escribe
  const filteredMonths = monthsOptions.filter(opt =>
    opt.n.toLowerCase().includes(searchMonth.toLowerCase())
  );

  // ==============
  // PROBABILIDAD
  // ==============
  const opcionesProbabilidad = [
    { id: "0", n: "BAJA", desc: "Menos del 25%", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    { id: "1", n: "MEDIA", desc: "Entre 25% y 50%", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    { id: "2", n: "ALTA", desc: "Entre 50% y 75%", bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
    { id: "3", n: "MUY ALTA", desc: "Entre 75% y 100%", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  ];

  // ==============
  // RESPONSABLES
  // ==============
  // Extraer listas únicas de comerciales y técnicos presentes en los datos
  const listaResponsablesUnicos = useMemo(() => {
    const registros = cotizaciones;
    const mapa = new Map();

    registros.forEach(item => {
      if (responsableTipo === "COMERCIAL" && item.comercial_nombre && item.comercial_nombre !== "Por asignar") {
        if (!mapa.has(item.comercial_nombre)) {
          mapa.set(item.comercial_nombre, {
            nombre: item.comercial_nombre,
            correo: item.comercial_correo,
            movil: item.comercial_movil_corp || item.comercial_movil_pers || "S/N"
          });
        }
      } else if (responsableTipo === "TECNICO" && item.tecnico_nombre && item.tecnico_nombre !== "Por asignar") {
        if (!mapa.has(item.tecnico_nombre)) {
          mapa.set(item.tecnico_nombre, {
            nombre: item.tecnico_nombre,
            correo: item.tecnico_correo,
            movil: item.tecnico_movil_corp || item.tecnico_movil_pers || "S/N"
          });
        }
      }
    });

    let resultado = Array.from(mapa.values());

    // Si el usuario está escribiendo en el buscador, filtramos la lista desplegada
    if (inputBusqueda.trim() !== "") {
      resultado = resultado.filter(r =>
        r.nombre.toLowerCase().includes(inputBusqueda.toLowerCase())
      );
    }

    return resultado;
  }, [cotizaciones, responsableTipo, inputBusqueda]);

  // Obtener iniciales para el avatar visual
  const getIniciales = (nombre) => {
    if (!nombre) return "??";
    const partes = nombre.split(" ").filter(p => p);
    if (partes.length >= 2) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    return partes[0] ? partes[0][0].toUpperCase() : "??";
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Módulo Comercial</h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium">{stats.total} Cotizaciones encontradas</p>
        </div>
        <div className="flex items-center gap-2">
          <ERPButton
            onClick={() => setShowNewModal(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Nueva Cotización
          </ERPButton>
        </div>
      </div>


      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">

        {/* 1. OPORTUNIDADES */}
        <button
          type="button"
          onClick={() => setCurrentTab("oportunidades")}
          className={`w-full text-left bg-white p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-sm cursor-pointer active:scale-[0.98] ${currentTab === "oportunidades"
              ? "border-indigo-500 ring-2 ring-indigo-500/10 shadow-md"
              : "border-gray-100 hover:border-indigo-300 hover:shadow-md"
            }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
              Oportunidades
            </span>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className={`w-3.5 h-3.5 text-gray-300 transition-all duration-300 group-hover:text-indigo-400 ${currentTab === "oportunidades" && "text-indigo-500 translate-x-0.5 -translate-y-0.5"}`} />
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${currentTab === "oportunidades" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"}`}>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black text-gray-950 tracking-tight leading-none mt-0.5">
              {isLoadingOportunidades ? (
                <div className="h-7 w-16 bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                `${dataOportunidades?.dashboard?.total || 0}`
              )}
            </h3>
          </div>

          <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold tracking-tight">
            <div className="flex flex-col">
              <span className="text-gray-900 font-black">
                ${Number(0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="text-right bg-indigo-50/70 text-indigo-700 px-2 py-1 rounded-lg flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-wider leading-none mb-0.5">Este Mes</span>
              <span className="font-black text-[10px]">
                {dataOportunidades?.dashboard?.esteMes || 0} • ${Number(0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </button>

        {/* 2. COTIZACIONES */}
        <button
          type="button"
          onClick={() => setCurrentTab("cotizaciones")}
          className={`w-full text-left bg-white p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-sm cursor-pointer active:scale-[0.98] ${currentTab === "cotizaciones"
              ? "border-blue-500 ring-2 ring-blue-500/10 shadow-md"
              : "border-gray-100 hover:border-blue-300 hover:shadow-md"
            }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
              Cotizaciones
            </span>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className={`w-3.5 h-3.5 text-gray-300 transition-all duration-300 group-hover:text-blue-400 ${currentTab === "cotizaciones" && "text-blue-500 translate-x-0.5 -translate-y-0.5"}`} />
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${currentTab === "cotizaciones" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"}`}>
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black text-gray-950 tracking-tight leading-none mt-0.5">
              {isLoadingCotizaciones ? (
                <div className="h-7 w-16 bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                `${dataCotizaciones?.dashboard?.total || 0}`
              )}
            </h3>
          </div>

          <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold tracking-tight">
            <div className="flex flex-col">
              <span className="text-gray-900 font-black">
                ${Number(dataCotizaciones?.dashboard?.montoTotalDolares || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="text-right bg-blue-50/70 text-blue-700 px-2 py-1 rounded-lg flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-wider leading-none mb-0.5">Este Mes</span>
              <span className="font-black text-[10px]">
                {dataCotizaciones?.dashboard?.esteMes || 0} • ${Number(dataCotizaciones?.dashboard?.montoTotalDolares || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </button>

        {/* 3. APERTURAS */}
        <button
          type="button"
          onClick={() => setCurrentTab("apertura")}
          className={`w-full text-left bg-white p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-sm cursor-pointer active:scale-[0.98] ${currentTab === "apertura"
              ? "border-amber-500 ring-2 ring-amber-500/10 shadow-md"
              : "border-gray-100 hover:border-amber-300 hover:shadow-md"
            }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
              Aperturas
            </span>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className={`w-3.5 h-3.5 text-gray-300 transition-all duration-300 group-hover:text-amber-400 ${currentTab === "apertura" && "text-amber-500 translate-x-0.5 -translate-y-0.5"}`} />
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${currentTab === "apertura" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white"}`}>
                <FolderCheck className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black text-gray-950 tracking-tight leading-none mt-0.5">
              {false ? (
                <div className="h-7 w-16 bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                `0`
              )}
            </h3>
          </div>

          <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold tracking-tight">
            <div className="flex flex-col">
              <span className="text-gray-900 font-black">
                ${Number(0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="text-right bg-amber-50/70 text-amber-700 px-2 py-1 rounded-lg flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-wider leading-none mb-0.5">Este Mes</span>
              <span className="font-black text-[10px]">
                0 • ${Number(0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </button>

        {/* 4. PROGRAMACIÓN */}
        <button
          type="button"
          onClick={() => setCurrentTab("programacion")}
          className={`w-full text-left bg-white p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-sm cursor-pointer active:scale-[0.98] ${currentTab === "programacion"
              ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-md"
              : "border-gray-100 hover:border-emerald-300 hover:shadow-md"
            }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
              Programación
            </span>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className={`w-3.5 h-3.5 text-gray-300 transition-all duration-300 group-hover:text-emerald-400 ${currentTab === "programacion" && "text-emerald-500 translate-x-0.5 -translate-y-0.5"}`} />
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${currentTab === "programacion" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"}`}>
                <CalendarRange className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-black text-gray-950 tracking-tight leading-none mt-0.5">
              {false ? (
                <div className="h-7 w-16 bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                `0`
              )}
            </h3>
          </div>

          <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold tracking-tight">
            <div className="flex flex-col">
              <span className="text-gray-900 font-black">
                ${Number(0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="text-right bg-emerald-50/70 text-emerald-700 px-2 py-1 rounded-lg flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-wider leading-none mb-0.5">Este Mes</span>
              <span className="font-black text-[10px]">
                0 • ${Number(0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Search and Filter Bar - Estilo JIRA Centralizado */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">

        <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:max-w-3xl">
          {/* 1. Buscador Global */}
          <ERPInput
            placeholder="Buscar en la tabla..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
            className="w-full md:w-80"
          />

          {/* 2. BOTÓN DE FILTROS ESPECIALES */}
          <div className="relative" ref={filterPanelRef}>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[11px] font-black transition-all uppercase shadow-sm ${showAdvancedFilters
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300"
                }`}
            >
              <Filter className={`h-3.5 w-3.5 ${showAdvancedFilters ? "text-indigo-600" : "text-gray-400"}`} />
              <span>Filtros</span>

              {/* Contador Dinámico: Solo brilla si hay filtros activos */}
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center bg-indigo-600 text-white h-4 w-4 rounded-full text-[9px] ml-1 animate-in zoom-in">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* PANEL DESPLEGABLE TIPO JIRA/LINEAR */}
            {showAdvancedFilters && (
              <div className="absolute left-0 mt-2 w-[500px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] p-0 animate-in fade-in zoom-in duration-200 origin-top-left overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex justify-between items-center shrink-0">
                  <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Filtros Avanzados</h4>
                  <button
                    onClick={() => {
                      setSelectedAnno(new Date().getFullYear());
                      setSelectedMes("%");
                      setEnvioFilter("%");
                      setProbabilidadFilter("%");
                      setResponsableTipo("COMERCIAL");
                      setResponsableNombre("%");
                      setSuministrosValor("");
                      setSuministrosUnidad("D");
                      setServiciosValor("");
                      setServiciosUnidad("D");
                      setOfertaValor("");
                      setOfertaUnidad("D");
                    }}
                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 uppercase"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="flex-1 flex min-h-0">
                  {/* Panel Izquierdo: Categorías */}
                  <div className="w-[160px] border-r border-gray-100 bg-gray-50/50 flex flex-col p-1.5 gap-1 shrink-0">
                    {[
                      { id: "FECHAS", label: "Fechas" },
                      { id: "ESTADO", label: "Estado de Envío" },
                      { id: "PROBABILIDAD", label: "Probabilidad" },
                      { id: "RESPONSABLE", label: "Responsable" },
                      { id: "TIEMPOS", label: "Tiempos" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveFilterTab(tab.id)}
                        className={`text-left px-3 py-2 rounded-lg text-[10px] font-black transition-all uppercase ${activeFilterTab === tab.id
                            ? "bg-white text-indigo-600 shadow-sm border border-gray-100 font-black"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Panel Derecho: Contenido */}
                  <div className={`flex-1 p-4 transition-all duration-300 ${isDropdownOpen ? 'pb-60' : ''}`}>

                    {/* FECHAS */}
                    {activeFilterTab === "FECHAS" && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter italic">
                            Periodo de tiempo
                          </label>
                          <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                            {selectedAnno === "%" ? "Histórico" : selectedAnno}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* COLUMNA AÑO */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-gray-400 ml-1 tracking-widest">AÑO</span>
                            <FilterDropdown
                              label="Año"
                              icon="Calendar"
                              value={selectedAnno === "%" ? "Todos" : selectedAnno}
                              onSelect={setSelectedAnno}
                              options={yearsOptions}
                              onToggle={setIsDropdownOpen}
                            />
                          </div>

                          {/* COLUMNA MES */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-gray-400 ml-1 tracking-widest">MES</span>
                            <FilterDropdown
                              label="Mes"
                              icon="CalendarDays"
                              value={selectedMes === "%" ? "Todos" : monthsOptions.find(m => m.v === selectedMes)?.n}
                              onSelect={setSelectedMes}
                              options={monthsOptions}
                              onToggle={setIsDropdownOpen}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ESTADO */}
                    {activeFilterTab === "ESTADO" && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Estado de Envío</label>
                        <div className="flex flex-col gap-2">
                          {[
                            { v: "%", n: "TODOS" },
                            { v: "2", n: "ENVIADO" },
                            { v: "1", n: "PENDIENTE" }
                          ].map(opt => (
                            <button
                              key={opt.v}
                              onClick={() => setEnvioFilter(opt.v)}
                              className={`w-full py-2 rounded-lg text-[10px] font-black border transition-all ${envioFilter === opt.v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-200'}`}
                            >
                              {opt.n}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PROBABILIDAD */}
                    {activeFilterTab === "PROBABILIDAD" && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter italic">
                            Probabilidad de Cierre
                          </label>
                          <div className="h-px flex-1 bg-gray-100 ml-4 opacity-50"></div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {opcionesProbabilidad.map((opt) => {
                            const isSelected = probabilidadFilter === opt.id;

                            return (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  // Si ya está seleccionado, mandamos "%" (limpiar), si no, el ID
                                  setProbabilidadFilter(isSelected ? "%" : opt.id);
                                }}
                                className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${isSelected
                                    ? `${opt.bg} ${opt.text} border-transparent ring-2 ring-indigo-500/20 shadow-sm`
                                    : 'bg-white border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 text-gray-500'
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Indicador Circular Animado */}
                                  <div className={`w-2 h-2 rounded-full shadow-sm transition-all duration-300 ${isSelected ? `${opt.dot} scale-125` : 'bg-gray-300 group-hover:bg-gray-400'
                                    }`} />

                                  <div className="flex flex-col text-left">
                                    <span className={`text-[10px] font-black tracking-wide uppercase transition-colors ${isSelected ? opt.text : 'text-gray-600 group-hover:text-indigo-600'
                                      }`}>
                                      {opt.n}
                                    </span>
                                    <span className="text-[8px] font-bold opacity-60 uppercase tracking-tight">
                                      {opt.desc}
                                    </span>
                                  </div>
                                </div>

                                {/* Check visual minimalista */}
                                <div className={`flex items-center justify-center w-5 h-5 rounded-lg transition-all duration-300 ${isSelected ? 'bg-white/50 shadow-inner scale-100 opacity-100' : 'scale-50 opacity-0'
                                  }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* RESPONSABLE */}
                    {activeFilterTab === "RESPONSABLE" && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                        {/* Encabezado */}
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter italic">
                            Filtrar por Responsable Asignado
                          </label>
                          <div className="h-px flex-1 bg-gray-100 ml-4 opacity-50"></div>
                        </div>

                        {/* Segmented Control (Switch) */}
                        <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200/40">
                          <button
                            onClick={() => {
                              setResponsableTipo("COMERCIAL");
                              setInputBusqueda("");
                            }}
                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${responsableTipo === "COMERCIAL"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-gray-400 hover:text-gray-600"
                              }`}
                          >
                            Área Comercial
                          </button>
                          <button
                            onClick={() => {
                              setResponsableTipo("TECNICO");
                              setInputBusqueda("");
                            }}
                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${responsableTipo === "TECNICO"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-gray-400 hover:text-gray-600"
                              }`}
                          >
                            Área Técnica
                          </button>
                        </div>

                        {/* Buscador inteligente */}
                        <div className="relative">
                          <ERPInput
                            placeholder={`Buscar ${responsableTipo.toLowerCase()}...`}
                            className="h-9 pl-8 text-[10px] font-medium rounded-xl border-gray-200 focus:ring-2 focus:ring-indigo-500/20"
                            value={inputBusqueda}
                            onChange={(e) => {
                              const val = e.target.value;
                              setInputBusqueda(val);
                              // Si borra el buscador por completo, limpiamos el filtro en la API automáticamente
                              if (val.trim() === "") {
                                if (responsableTipo === "COMERCIAL") setComercialSearch("%");
                                else setTecnicoSearch("%");
                              }
                            }}
                            onKeyDown={(e) => {
                              // Al presionar Enter, ejecutamos la búsqueda directa en el Backend
                              if (e.key === 'Enter') {
                                if (responsableTipo === "COMERCIAL") setComercialSearch(inputBusqueda || "%");
                                else setTecnicoSearch(inputBusqueda || "%");
                              }
                            }}
                          />
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          {inputBusqueda && (
                            <button
                              onClick={() => {
                                setInputBusqueda("");
                                if (responsableTipo === "COMERCIAL") setComercialSearch("%");
                                else setTecnicoSearch("%");
                              }}
                              className="absolute right-2.5 top-2.5 text-[9px] font-bold text-gray-400 hover:text-gray-600 uppercase"
                            >
                              Limpiar
                            </button>
                          )}
                        </div>

                        {/* Listado de Tarjetas de Usuarios de Acceso Rápido */}
                        <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                          {listaResponsablesUnicos.map((persona) => {
                            const filterActivo = responsableTipo === "COMERCIAL" ? comercialSearch : tecnicoSearch;
                            const isSelected = filterActivo === persona.nombre;

                            return (
                              <button
                                key={persona.nombre}
                                onClick={() => {
                                  // Lógica Toggle inteligente: si ya está seleccionado se limpia (%)
                                  if (responsableTipo === "COMERCIAL") {
                                    setComercialSearch(isSelected ? "%" : persona.nombre);
                                    setInputBusqueda(isSelected ? "" : persona.nombre);
                                  } else {
                                    setTecnicoSearch(isSelected ? "%" : persona.nombre);
                                    setInputBusqueda(isSelected ? "" : persona.nombre);
                                  }
                                }}
                                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-200 ${isSelected
                                    ? "bg-indigo-50/60 border-indigo-200 ring-1 ring-indigo-500/10"
                                    : "bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50/50"
                                  }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Avatar con Iniciales */}
                                  <div className={`w-7 h-7 flex items-center justify-center rounded-lg font-black text-[9px] tracking-tighter shrink-0 transition-colors ${isSelected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                                    }`}>
                                    {getIniciales(persona.nombre)}
                                  </div>

                                  {/* Datos de la Persona */}
                                  <div className="flex flex-col min-w-0">
                                    <span className={`text-[10px] font-black truncate uppercase ${isSelected ? "text-indigo-900" : "text-gray-700"}`}>
                                      {persona.nombre}
                                    </span>
                                    <span className="text-[8px] font-bold text-gray-400 truncate tracking-tight lowercase">
                                      {persona.correo || "sin correo institucional"}
                                    </span>
                                  </div>
                                </div>

                                {/* Teléfono o Badge indicador */}
                                <div className="text-right hidden sm:block shrink-0 pl-2">
                                  <span className={`text-[8px] font-black block tracking-tight ${isSelected ? "text-indigo-600" : "text-gray-500"}`}>
                                    {persona.movil}
                                  </span>
                                  <span className="text-[7px] font-medium text-gray-400 uppercase tracking-tighter block">
                                    Móvil
                                  </span>
                                </div>
                              </button>
                            );
                          })}

                          {/* Mensaje de feedback si la lista está vacía */}
                          {listaResponsablesUnicos.length === 0 && (
                            <div className="p-4 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                                {inputBusqueda ? "No hay coincidencias" : `No hay ${responsableTipo.toLowerCase()}es en este mes`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TIEMPOS Y VALIDEZ */}
                    {activeFilterTab === "TIEMPOS" && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter italic">
                            Tiempos y Validez
                          </label>
                          <div className="h-px flex-1 bg-gray-100 ml-4 opacity-50"></div>
                        </div>

                        <div className="space-y-3">
                          {/* SUMINISTROS */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-gray-400 ml-1 tracking-widest uppercase block">
                              Entrega Suministros
                            </span>
                            <div className="flex items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-xl border border-gray-100">
                              <div className="w-24 shrink-0">
                                <ERPInput
                                  placeholder="Cant."
                                  type="number"
                                  value={suministrosValor}
                                  onChange={(e) => setSuministrosValor(e.target.value)}
                                  className="h-8 w-full bg-white text-[11px] font-bold px-2 rounded-lg"
                                />
                              </div>
                              {/* Segmented Control Horizontal en la misma línea */}
                              <div className="flex-1 grid grid-cols-3 gap-0.5 bg-gray-100 p-0.5 rounded-lg border border-gray-200/40">
                                {[
                                  { code: "D", sing: "Día", plur: "Días" },
                                  { code: "S", sing: "Semana", plur: "Semanas" },
                                  { code: "M", sing: "Mes", plur: "Meses" }
                                ].map((u) => {
                                  const isSelected = suministrosUnidad === u.code;
                                  const label = Number(suministrosValor) === 1 ? u.sing : u.plur;
                                  return (
                                    <button
                                      key={u.code}
                                      type="button"
                                      onClick={() => setSuministrosUnidad(u.code)}
                                      className={`py-1 text-[8.5px] font-black uppercase tracking-tight rounded-md transition-all duration-150 ${isSelected
                                          ? "bg-white text-indigo-600 shadow-sm border border-gray-200/50"
                                          : "text-gray-500 hover:text-gray-900"
                                        }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* SERVICIOS */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-gray-400 ml-1 tracking-widest uppercase block">
                              Entrega Servicios
                            </span>
                            <div className="flex items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-xl border border-gray-100">
                              <div className="w-24 shrink-0">
                                <ERPInput
                                  placeholder="Cant."
                                  type="number"
                                  value={serviciosValor}
                                  onChange={(e) => setServiciosValor(e.target.value)}
                                  className="h-8 w-full bg-white text-[11px] font-bold px-2 rounded-lg"
                                />
                              </div>
                              {/* Segmented Control Horizontal en la misma línea */}
                              <div className="flex-1 grid grid-cols-3 gap-0.5 bg-gray-100 p-0.5 rounded-lg border border-gray-200/40">
                                {[
                                  { code: "D", sing: "Día", plur: "Días" },
                                  { code: "S", sing: "Semana", plur: "Semanas" },
                                  { code: "M", sing: "Mes", plur: "Meses" }
                                ].map((u) => {
                                  const isSelected = serviciosUnidad === u.code;
                                  const label = Number(serviciosValor) === 1 ? u.sing : u.plur;
                                  return (
                                    <button
                                      key={u.code}
                                      type="button"
                                      onClick={() => setServiciosUnidad(u.code)}
                                      className={`py-1 text-[8.5px] font-black uppercase tracking-tight rounded-md transition-all duration-150 ${isSelected
                                          ? "bg-white text-indigo-600 shadow-sm border border-gray-200/50"
                                          : "text-gray-500 hover:text-gray-900"
                                        }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* OFERTA */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-black text-gray-400 ml-1 tracking-widest uppercase block">
                              Validez Oferta
                            </span>
                            <div className="flex items-center gap-1.5 bg-gray-50/50 p-1.5 rounded-xl border border-gray-100">
                              <div className="w-24 shrink-0">
                                <ERPInput
                                  placeholder="Cant."
                                  type="number"
                                  value={ofertaValor}
                                  onChange={(e) => setOfertaValor(e.target.value)}
                                  className="h-8 w-full bg-white text-[11px] font-bold px-2 rounded-lg"
                                />
                              </div>
                              {/* Segmented Control Horizontal en la misma línea */}
                              <div className="flex-1 grid grid-cols-3 gap-0.5 bg-gray-100 p-0.5 rounded-lg border border-gray-200/40">
                                {[
                                  { code: "D", sing: "Día", plur: "Días" },
                                  { code: "S", sing: "Semana", plur: "Semanas" },
                                  { code: "M", sing: "Mes", plur: "Meses" }
                                ].map((u) => {
                                  const isSelected = ofertaUnidad === u.code;
                                  const label = Number(ofertaValor) === 1 ? u.sing : u.plur;
                                  return (
                                    <button
                                      key={u.code}
                                      type="button"
                                      onClick={() => setOfertaUnidad(u.code)}
                                      className={`py-1 text-[8.5px] font-black uppercase tracking-tight rounded-md transition-all duration-150 ${isSelected
                                          ? "bg-white text-indigo-600 shadow-sm border border-gray-200/50"
                                          : "text-gray-500 hover:text-gray-900"
                                        }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Filtros de Estado */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full xl:w-auto no-scrollbar pb-1 xl:pb-0 justify-end">
          {[
            "TODAS", "OPORTUNIDAD", "PENDIENTE", "EN SEGUIMIENTO",
            "ADJUDICADO", "POSTERGADA", "PERDIDA", "ANULADO"
          ].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`whitespace-nowrap px-4 py-2.5 text-[9px] font-black rounded-xl transition-all ${statusFilter === status
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENEDOR DINÁMICO DE TABLAS */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {currentTab === "cotizaciones" && (
          <TablaCotizaciones
            data={filteredData} // Tus datos filtrados en tiempo real
            isLoading={isLoading}
            headers={headers}
            sortConfig={sortConfig}
            onSort={handleSort}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onRowClick={(id) => navigate(`/sigecom/comercial/${id}`)}
          />
        )}

        {currentTab === "oportunidades" && (
          <TablaOportunidades
            data={dataOportunidades?.tabla || []} // Inyecta la lista histórica de solicitudes
            isLoading={isLoadingOportunidades}   // Su propio loading spinner aislado
            currentPage={currentPageOportunidades} // Si manejas paginación independiente
            pageSize={pageSize}
            onPageChange={setCurrentPageOportunidades}
            onRowClick={(id) => navigate(`/sigecom/comercial/${id}`)} // Mantiene la navegación fluida al detalle
          />
        )}

        {currentTab === "apertura" && (
          <TablaApertura
            //data={dataAperturas?.tabla || []} // Enganchará con tu nuevo estado/fetch de la base de datos
            //isLoading={isLoadingAperturas}   // Su respectivo loading aislado
            //currentPage={currentPageApertura} // Paginación independiente para no mezclar tablas
            //pageSize={pageSize}
            //onPageChange={setCurrentPageApertura}
            //onRowClick={(id) => navigate(`/sigecom/comercial/${id}?tipo=apertura`)}
          />
        )}

        {currentTab === "programacion" && (
          <div className="p-8 text-center text-xs font-bold text-gray-400 uppercase">
            Tabla de Programación de Servicios
          </div>
        )}
      </div>

      {/* Modals */}
      <CotizacionNuevaModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        modo="A"
        tipo="N"
        dashboard="C"
      />
    </div>
  );
}
