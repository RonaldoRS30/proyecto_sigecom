import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, Filter, MoreHorizontal, LayoutDashboard, ClipboardCheck } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { ERPTable, StatusBadge, ERPButton, ERPInput } from "@/components/ui/ERPComponents";
import CotizacionNuevaModal from "../../modal/CotizacionNuevaModal";

const fetchCotizaciones = async () => {
  const token = localStorage.getItem("access_token");
  const { data } = await api.get("cotizaciones/aprobacion_cotizacion", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(data?.tabla) ? data.tabla : [];
};

export default function AprobacionCotizacion() {
  const navigate = useNavigate();
  const { authUser: user } = useAuth();
  const [globalSearch, setGlobalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODAS");
  const [showNewModal, setShowNewModal] = useState(false);
  
  // Sorting state - Default by date descending
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'desc' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ["cotizaciones-aprobacion"],
    queryFn: fetchCotizaciones,
  });

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
    { label: "Código", key: "numero", className: "w-[12%]" },
    { label: "Descripción", key: "referencia", className: "w-[25%]" },
    { label: "Cliente", key: "cliente_nombre", className: "w-[20%]" },
    { label: "Área", key: "area_nombre", className: "w-[10%]" },
    { label: "Estado", key: "estado_nombre", className: "w-[10%]" },
    { label: "Envío", key: "envio", className: "w-[8%]" },
    { label: "Fecha", key: "fecha", className: "w-[5%]" },
    { label: "Monto($)", key: "tot_c", className: "w-[10%]" }
  ];

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Módulo Comercialzxzx</h1>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md">
            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</p>
                <p className="text-xl font-black text-gray-900">{stats.total}</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md">
            <div className="bg-green-50 p-3 rounded-xl text-green-600">
                <ClipboardCheck className="h-6 w-6" />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adjudicadas</p>
                <p className="text-xl font-black text-gray-900">{stats.adjudicadas}</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-4 transition-all hover:shadow-md">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                <FileText className="h-6 w-6" />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendientes</p>
                <p className="text-xl font-black text-gray-900">{stats.pendientes}</p>
            </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
        <ERPInput 
          placeholder="Buscar por cliente, título o registro..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          icon={<Search className="h-4 w-4" />}
          className="w-full xl:max-w-md"
        />
        
        <div className="flex items-center space-x-1 overflow-x-auto w-full xl:w-auto no-scrollbar pb-1 xl:pb-0">
          {["TODAS", "PENDIENTE", "EN ELABORACION", "ENVIADA", "ADJUDICADA", "PERDIDA"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`whitespace-nowrap px-4 py-2.5 text-[9px] font-black rounded-xl transition-all ${
                statusFilter === status 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 min-h-0">
        <ERPTable 
          loading={isLoading}
          headers={headers}
          onSort={handleSort}
          sortConfig={sortConfig}
          pagination={{
            currentPage,
            totalPages,
            total: filteredData.length,
            from: (currentPage - 1) * pageSize + 1,
            to: Math.min(currentPage * pageSize, filteredData.length),
            onPageChange: setCurrentPage
          }}
        >
          {paginatedData.map((item) => (
            <tr 
              key={item.numero} 
              onClick={() => navigate(`/dashboard/cotizacion-detalle/${item.num_reg}`)}
              className="group hover:bg-gray-50/80 transition-colors cursor-pointer border-b last:border-0 border-gray-100 h-[72px]"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                {item.numero}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-600 font-medium line-clamp-1 max-w-xs xl:max-w-2xl" title={item.referencia}>
                  {item.referencia}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[200px]">{item.cliente_nombre}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{item.nombr || 'S/V'}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-bold uppercase tracking-tight">
                {item.area_nombre}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={item.estado_nombre} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${item.envio === 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {item.envio === 2 ? 'Enviado' : 'Pendiente'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-[10px] text-gray-400 font-black uppercase">
                {item.fecha}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900 text-right">
                ${Number(item.tot_c || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
          {filteredData.length === 0 && !isLoading && (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-400 font-bold uppercase text-xs">
                No se encontraron registros
              </td>
            </tr>
          )}
        </ERPTable>
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
