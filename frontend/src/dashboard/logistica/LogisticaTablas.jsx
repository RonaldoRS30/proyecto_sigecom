import React, { useState, useEffect } from "react";
import { 
  Users, Home, TrendingUp, Package, Layers, FileText, 
  Search, PlusCircle, Edit3, ShieldAlert, Check, X, Loader
} from "lucide-react";
import api from "@/services/api";
import { toast } from "react-toastify";

const TABS = [
  { id: "proveedores", label: "Proveedores", icon: <Users size={16} /> },
  { id: "almacenes", label: "Almacenes", icon: <Home size={16} /> },
  { id: "grupo_analitico", label: "Grupo Analítico", icon: <TrendingUp size={16} /> },
  { id: "productos", label: "Productos", icon: <Package size={16} /> },
  { id: "centros_costo", label: "Centros de Costo", icon: <Layers size={16} /> },
  { id: "documentos", label: "Documentos Almacén", icon: <FileText size={16} /> },
];

export default function LogisticaTablas() {
  const [activeTab, setActiveTab] = useState("proveedores");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados de datos
  const [proveedores, setProveedores] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [grupoAnalitico, setGrupoAnalitico] = useState([]);
  const [productos, setProductos] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [documentos, setDocumentos] = useState([]);

  // Estados de Modales
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Formulario Dinámico
  const [formData, setFormData] = useState({});

  // Cargar datos por defecto y de APIs
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Proveedores (Clientes reales desde la base de datos)
      const resProv = await api.get("core/clientes/").catch(() => null);
      if (resProv && Array.isArray(resProv.data)) {
        setProveedores(resProv.data.map(p => ({
          id_cliente: p.id_cliente,
          codigo: p.id_cliente_formateado || String(p.id_cliente).padStart(5, "0"),
          nombre: p.nombre || "Sin Nombre",
          ruc: p.ruc || "",
          direccion: p.direccion || "",
          representante_legal: p.representante_legal || "",
          pagina_web: p.pagina_web || "",
          estado: p.activo ? "ACTIVO" : "INACTIVO"
        })));
      } else {
        // Fallback local data
        setProveedores([
          { id_cliente: 1, codigo: "00001", nombre: "ABB S.A.", ruc: "20100452391", direccion: "Av. Argentina 3120, Lima", representante_legal: "Eduardo Torres", pagina_web: "www.abb.pe", estado: "ACTIVO" },
          { id_cliente: 2, codigo: "00002", nombre: "Siemens Perú SAC", ruc: "20100084591", direccion: "Calle Las Begonias 415, San Isidro", representante_legal: "Claudio Rossi", pagina_web: "www.siemens.com", estado: "ACTIVO" },
          { id_cliente: 3, codigo: "00003", nombre: "Schneider Electric", ruc: "20509658214", direccion: "Av. Canaval y Moreyra 380, San Isidro", representante_legal: "Marta Valenzuela", pagina_web: "www.se.com", estado: "ACTIVO" },
        ]);
      }

      // 2. Almacenes
      const resAlm = await api.get("logistica/dashboard/almacenes/").catch(() => null);
      if (resAlm && Array.isArray(resAlm.data)) {
        setAlmacenes(resAlm.data.map(a => ({
          idalmacen: a.idalmacen || "",
          nombre: a.nombre || "Sin Nombre",
          direccion: a.direccion || "Almacén Central SIGECOM",
          tipo: a.tipo || "Materia Prima / Suministros",
          responsable: a.responsable || "Supervisor Almacén",
          estado: a.activo !== "0" ? "ACTIVO" : "INACTIVO"
        })));
      } else {
        setAlmacenes([
          { idalmacen: "01", nombre: "Almacén Principal", direccion: "Planta Industrial Ate, Calle C", tipo: "Materia Prima / Suministros", responsable: "Carlos Mendoza", estado: "ACTIVO" },
          { idalmacen: "02", nombre: "Almacén de Repuestos", direccion: "Planta Industrial Ate, Calle B", tipo: "Repuestos", responsable: "Rosa Landa", estado: "ACTIVO" },
          { idalmacen: "03", nombre: "Almacén Tránsito", direccion: "Muelle Callao Terminal", tipo: "Tránsito", responsable: "Jorge Ramos", estado: "ACTIVO" },
        ]);
      }

      // 3. Productos
      const resProd = await api.get("logistica/dashboard/productos/").catch(() => null);
      if (resProd && Array.isArray(resProd.data)) {
        setProductos(resProd.data.map(p => ({
          codigo: p.codigo || "",
          descripcion: p.descripcion || "Sin Descripción",
          marca: p.marca || "Genérico",
          umed: p.umed || "UND",
          stock: p.stock || 0,
          precio: p.precio || 0.00,
          estado: p.activo !== "0" ? "ACTIVO" : "INACTIVO"
        })));
      } else {
        setProductos([
          { codigo: "P001", descripcion: "Cable Eléctrico Vulcano 3x14 AWG", marca: "Indeco", umed: "MTR", stock: 1250, precio: 8.50, estado: "ACTIVO" },
          { codigo: "P002", descripcion: "Interruptor Termomagnético 3x32A", marca: "Schneider", umed: "UND", stock: 45, precio: 120.00, estado: "ACTIVO" },
          { codigo: "P003", descripcion: "Sensor Inductivo M18 PNP NO", marca: "Autonics", umed: "UND", stock: 15, precio: 75.00, estado: "ACTIVO" },
        ]);
      }

      // 4. Grupo Analítico (Fallback local inicial)
      setGrupoAnalitico([
        { codigo: "G01", nombre: "Conductores y Cables", categoria: "Suministros Eléctricos", cuenta_contable: "6061101", estado: "ACTIVO" },
        { codigo: "G02", nombre: "Dispositivos de Maniobra", categoria: "Automatización", cuenta_contable: "6061102", estado: "ACTIVO" },
        { codigo: "G03", nombre: "Estructuras Metálicas", categoria: "Ferretería Industrial", cuenta_contable: "6061103", estado: "ACTIVO" },
      ]);

      // 5. Centros de Costo Almacén (Fallback local inicial)
      setCentrosCosto([
        { codigo: "CC-PROD", nombre: "Producción Metalmecánica", codigo_presupuestal: "200.10.01", estado: "ACTIVO" },
        { codigo: "CC-MANT", nombre: "Mantenimiento General Planta", codigo_presupuestal: "200.10.02", estado: "ACTIVO" },
        { codigo: "CC-LOGI", nombre: "Operaciones Logísticas y Transporte", codigo_presupuestal: "200.10.03", estado: "ACTIVO" },
      ]);

      // 6. Documentos Almacén (Fallback local inicial)
      setDocumentos([
        { codigo_doc: "NI", tipo_documento: "Nota de Ingreso", serie: "E001", correlativo: 489, estado: "ACTIVO" },
        { codigo_doc: "NS", tipo_documento: "Nota de Salida", serie: "S001", correlativo: 712, estado: "ACTIVO" },
        { codigo_doc: "GR", tipo_documento: "Guía de Remisión Remitente", serie: "T001", correlativo: 104, estado: "ACTIVO" },
      ]);

    } catch (e) {
      console.error("Error al cargar maestros", e);
      toast.error("Error cargando algunos datos maestros");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar según búsqueda y pestaña activa
  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    switch (activeTab) {
      case "proveedores":
        return proveedores.filter(item => 
          (item.codigo || "").toLowerCase().includes(q) || 
          (item.nombre || "").toLowerCase().includes(q) || 
          (item.ruc || "").toLowerCase().includes(q)
        );
      case "almacenes":
        return almacenes.filter(item => 
          (item.idalmacen || "").toLowerCase().includes(q) || 
          (item.nombre || "").toLowerCase().includes(q)
        );
      case "grupo_analitico":
        return grupoAnalitico.filter(item => 
          (item.codigo || "").toLowerCase().includes(q) || 
          (item.nombre || "").toLowerCase().includes(q) ||
          (item.categoria || "").toLowerCase().includes(q)
        );
      case "productos":
        return productos.filter(item => 
          (item.codigo || "").toLowerCase().includes(q) || 
          (item.descripcion || "").toLowerCase().includes(q) ||
          (item.marca || "").toLowerCase().includes(q)
        );
      case "centros_costo":
        return centrosCosto.filter(item => 
          (item.codigo || "").toLowerCase().includes(q) || 
          (item.nombre || "").toLowerCase().includes(q)
        );
      case "documentos":
        return documentos.filter(item => 
          (item.codigo_doc || "").toLowerCase().includes(q) || 
          (item.tipo_documento || "").toLowerCase().includes(q)
        );
      default:
        return [];
    }
  };

  // Abrir modal para crear
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedItem(null);
    
    // Inicializar formulario vacío según tabla activa
    const initialForm = {};
    if (activeTab === "proveedores") {
      initialForm.codigo = String(proveedores.length + 1).padStart(2, "0");
      initialForm.nombre = "";
      initialForm.ruc = "";
      initialForm.direccion = "";
      initialForm.telefono = "";
      initialForm.correo = "";
      initialForm.estado = "ACTIVO";
    } else if (activeTab === "almacenes") {
      initialForm.idalmacen = String(almacenes.length + 1).padStart(2, "0");
      initialForm.nombre = "";
      initialForm.direccion = "";
      initialForm.tipo = "Materia Prima / Suministros";
      initialForm.responsable = "";
      initialForm.estado = "ACTIVO";
    } else if (activeTab === "grupo_analitico") {
      initialForm.codigo = `G${String(grupoAnalitico.length + 1).padStart(2, "0")}`;
      initialForm.nombre = "";
      initialForm.categoria = "";
      initialForm.cuenta_contable = "";
      initialForm.estado = "ACTIVO";
    } else if (activeTab === "productos") {
      initialForm.codigo = `P${String(productos.length + 1).padStart(3, "0")}`;
      initialForm.descripcion = "";
      initialForm.marca = "";
      initialForm.umed = "UND";
      initialForm.stock = 0;
      initialForm.precio = 0.00;
      initialForm.estado = "ACTIVO";
    } else if (activeTab === "centros_costo") {
      initialForm.codigo = "CC-";
      initialForm.nombre = "";
      initialForm.codigo_presupuestal = "";
      initialForm.estado = "ACTIVO";
    } else if (activeTab === "documentos") {
      initialForm.codigo_doc = "";
      initialForm.tipo_documento = "";
      initialForm.serie = "";
      initialForm.correlativo = 1;
      initialForm.estado = "ACTIVO";
    }
    
    setFormData(initialForm);
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (item) => {
    setIsEditMode(true);
    setSelectedItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  // Toggle de Estado Rápido
  const handleToggleState = async (item) => {
    const nextState = item.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";

    if (activeTab === "proveedores") {
      try {
        const payload = {
          id_cliente: item.id_cliente,
          nombre: item.nombre,
          ruc: item.ruc,
          direccion: item.direccion,
          representante_legal: item.representante_legal,
          pagina_web: item.pagina_web,
          activo: nextState === "ACTIVO"
        };
        await api.put("core/clientes/", payload);
        toast.success(`Estado del proveedor ${item.nombre} actualizado`);
        fetchData();
      } catch (err) {
        console.error(err);
        toast.error("Error al actualizar el estado del proveedor");
      }
      return;
    }

    const keyProp = activeTab === "almacenes" ? "idalmacen" : (activeTab === "documentos" ? "codigo_doc" : "codigo");
    
    const updateList = (list, setter) => {
      const updated = list.map(x => x[keyProp] === item[keyProp] ? { ...x, estado: nextState } : x);
      setter(updated);
    };

    if (activeTab === "almacenes") updateList(almacenes, setAlmacenes);
    if (activeTab === "grupo_analitico") updateList(grupoAnalitico, setGrupoAnalitico);
    if (activeTab === "productos") updateList(productos, setProductos);
    if (activeTab === "centros_costo") updateList(centrosCosto, setCentrosCosto);
    if (activeTab === "documentos") updateList(documentos, setDocumentos);

    toast.success(`Estado del registro actualizado a ${nextState}`);
  };

  // Guardar Formulario
  const handleSave = async (e) => {
    e.preventDefault();

    if (activeTab === "proveedores") {
      try {
        const payload = {
          nombre: formData.nombre,
          ruc: formData.ruc,
          direccion: formData.direccion || "Dirección",
          representante_legal: formData.representante_legal || "",
          pagina_web: formData.pagina_web || "",
          activo: formData.estado === "ACTIVO"
        };

        if (isEditMode) {
          payload.id_cliente = selectedItem.id_cliente;
          await api.put("core/clientes/", payload);
          toast.success("Proveedor actualizado correctamente");
        } else {
          await api.post("core/clientes/", payload);
          toast.success("Proveedor registrado correctamente");
        }
        setShowModal(false);
        fetchData();
      } catch (err) {
        console.error(err);
        const errorMsg = err.response?.data?.error || "Error al guardar el proveedor";
        toast.error(errorMsg);
      }
      return;
    }

    const keyProp = activeTab === "almacenes" ? "idalmacen" : (activeTab === "documentos" ? "codigo_doc" : "codigo");
    
    const saveInList = (list, setter) => {
      if (isEditMode) {
        // Modificar
        setter(list.map(x => x[keyProp] === selectedItem[keyProp] ? { ...formData } : x));
        toast.success("Registro modificado con éxito");
      } else {
        // Validar duplicado de clave primaria
        if (list.some(x => x[keyProp] === formData[keyProp])) {
          toast.error(`Ya existe un registro con el código ${formData[keyProp]}`);
          return false;
        }
        // Agregar
        setter([...list, formData]);
        toast.success("Registro agregado con éxito");
      }
      return true;
    };

    let success = false;
    if (activeTab === "almacenes") success = saveInList(almacenes, setAlmacenes);
    if (activeTab === "grupo_analitico") success = saveInList(grupoAnalitico, setGrupoAnalitico);
    if (activeTab === "productos") success = saveInList(productos, setProductos);
    if (activeTab === "centros_costo") success = saveInList(centrosCosto, setCentrosCosto);
    if (activeTab === "documentos") success = saveInList(documentos, setDocumentos);

    if (success !== false) {
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tablas de Logística</h1>
          <p className="text-sm text-gray-500 font-medium">Mantenimiento de tablas auxiliares y maestros de inventario</p>
        </div>

        {/* Selector de pestañas */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-sm max-w-full overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Caja Principal */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        
        {/* Barra de Herramientas de la Tabla */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder={`Buscar en ${TABS.find(t => t.id === activeTab)?.label}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50/50"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
          >
            <PlusCircle size={16} />
            Nuevo Registro
          </button>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
              <Loader className="animate-spin text-indigo-600" size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">Cargando datos...</span>
            </div>
          ) : getFilteredData().length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
              <ShieldAlert size={32} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-widest">No se encontraron registros</span>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[10px] font-black uppercase tracking-wider text-gray-500">
                  {activeTab === "proveedores" && (
                    <>
                      <th className="px-6 py-3">Código</th>
                      <th className="px-6 py-3">Razón Social</th>
                      <th className="px-6 py-3">RUC</th>
                      <th className="px-6 py-3">Dirección</th>
                      <th className="px-6 py-3">Representante</th>
                      <th className="px-6 py-3">Pág. Web</th>
                      <th className="px-6 py-3">Estado</th>
                    </>
                  )}
                  {activeTab === "almacenes" && (
                    <>
                      <th className="px-6 py-3">Código</th>
                      <th className="px-6 py-3">Nombre Almacén</th>
                      <th className="px-6 py-3">Dirección</th>
                      <th className="px-6 py-3">Tipo</th>
                      <th className="px-6 py-3">Responsable</th>
                      <th className="px-6 py-3">Estado</th>
                    </>
                  )}
                  {activeTab === "grupo_analitico" && (
                    <>
                      <th className="px-6 py-3">Código</th>
                      <th className="px-6 py-3">Nombre Grupo</th>
                      <th className="px-6 py-3">Categoría</th>
                      <th className="px-6 py-3">Cuenta Contable</th>
                      <th className="px-6 py-3">Estado</th>
                    </>
                  )}
                  {activeTab === "productos" && (
                    <>
                      <th className="px-6 py-3">Código</th>
                      <th className="px-6 py-3">Descripción Producto</th>
                      <th className="px-6 py-3">Marca</th>
                      <th className="px-6 py-3 text-center">UM</th>
                      <th className="px-6 py-3 text-right">Stock</th>
                      <th className="px-6 py-3 text-right">Precio Unit.</th>
                      <th className="px-6 py-3">Estado</th>
                    </>
                  )}
                  {activeTab === "centros_costo" && (
                    <>
                      <th className="px-6 py-3">Código</th>
                      <th className="px-6 py-3">Nombre Centro Costo</th>
                      <th className="px-6 py-3">Cód. Presupuestal</th>
                      <th className="px-6 py-3">Estado</th>
                    </>
                  )}
                  {activeTab === "documentos" && (
                    <>
                      <th className="px-6 py-3">Cód. Doc</th>
                      <th className="px-6 py-3">Tipo Documento</th>
                      <th className="px-6 py-3">Serie</th>
                      <th className="px-6 py-3 text-right">Correlativo Actual</th>
                      <th className="px-6 py-3">Estado</th>
                    </>
                  )}
                  <th className="px-6 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                {getFilteredData().map((item, idx) => {
                  const isItemActive = item.estado === "ACTIVO";
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      {activeTab === "proveedores" && (
                        <>
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">{item.codigo}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{item.nombre}</td>
                          <td className="px-6 py-4 font-medium">{item.ruc}</td>
                          <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate">{item.direccion}</td>
                          <td className="px-6 py-4 text-gray-600">{item.representante_legal || "-"}</td>
                          <td className="px-6 py-4 text-gray-500 max-w-[150px] truncate">{item.pagina_web || "-"}</td>
                        </>
                      )}
                      {activeTab === "almacenes" && (
                        <>
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">{item.idalmacen}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{item.nombre}</td>
                          <td className="px-6 py-4 text-gray-500">{item.direccion}</td>
                          <td className="px-6 py-4"><span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded font-bold text-[10px]">{item.tipo}</span></td>
                          <td className="px-6 py-4 text-gray-600 font-bold">{item.responsable}</td>
                        </>
                      )}
                      {activeTab === "grupo_analitico" && (
                        <>
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">{item.codigo}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{item.nombre}</td>
                          <td className="px-6 py-4 text-gray-500">{item.categoria}</td>
                          <td className="px-6 py-4 font-mono text-gray-600">{item.cuenta_contable}</td>
                        </>
                      )}
                      {activeTab === "productos" && (
                        <>
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">{item.codigo}</td>
                          <td className="px-6 py-4 font-bold text-slate-800 max-w-[280px] truncate" title={item.descripcion}>{item.descripcion}</td>
                          <td className="px-6 py-4 text-gray-500">{item.marca}</td>
                          <td className="px-6 py-4 font-mono text-center">{item.umed}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-indigo-600">{item.stock}</td>
                          <td className="px-6 py-4 text-right font-mono">S/. {Number(item.precio).toFixed(2)}</td>
                        </>
                      )}
                      {activeTab === "centros_costo" && (
                        <>
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">{item.codigo}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{item.nombre}</td>
                          <td className="px-6 py-4 font-mono text-gray-600">{item.codigo_presupuestal}</td>
                        </>
                      )}
                      {activeTab === "documentos" && (
                        <>
                          <td className="px-6 py-4 font-mono font-bold text-gray-900">{item.codigo_doc}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{item.tipo_documento}</td>
                          <td className="px-6 py-4 font-mono">{item.serie}</td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">{item.correlativo}</td>
                        </>
                      )}
                      
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider ${
                          isItemActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                        }`}>
                          {item.estado}
                        </span>
                      </td>

                      {/* Botones de Acción */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-all"
                            title="Editar Registro"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleState(item)}
                            className={`p-1.5 hover:bg-slate-100 rounded-lg transition-all ${
                              isItemActive ? "text-slate-400 hover:text-rose-500" : "text-emerald-500 hover:text-emerald-600"
                            }`}
                            title={isItemActive ? "Desactivar Registro" : "Activar Registro"}
                          >
                            {isItemActive ? <X size={14} /> : <Check size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Agregar / Editar Dinámico */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                {isEditMode ? "Editar Registro" : "Nuevo Registro"} - {TABS.find(t => t.id === activeTab)?.label}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {activeTab === "proveedores" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Código</label>
                      <input 
                        type="text" 
                        required
                        disabled={true}
                        value={isEditMode ? (formData.codigo || "") : "Auto-generado"}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 disabled:opacity-70 font-mono" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">RUC</label>
                      <input 
                        type="text" 
                        required
                        maxLength={11}
                        pattern="\d{11}"
                        value={formData.ruc || ""} 
                        onChange={e => setFormData({ ...formData, ruc: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Razón Social / Nombre</label>
                    <input 
                      type="text" 
                      required
                      value={formData.nombre || ""} 
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Dirección Fiscal</label>
                    <input 
                      type="text" 
                      value={formData.direccion || ""} 
                      onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Representante Legal</label>
                      <input 
                        type="text" 
                        value={formData.representante_legal || ""} 
                        onChange={e => setFormData({ ...formData, representante_legal: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Página Web</label>
                      <input 
                        type="text" 
                        value={formData.pagina_web || ""} 
                        onChange={e => setFormData({ ...formData, pagina_web: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "almacenes" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Código Almacén</label>
                      <input 
                        type="text" 
                        required
                        disabled={isEditMode}
                        value={formData.idalmacen || ""} 
                        onChange={e => setFormData({ ...formData, idalmacen: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-gray-50" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Tipo</label>
                      <select 
                        value={formData.tipo || ""} 
                        onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-white"
                      >
                        <option value="Materia Prima / Suministros">Materia Prima / Suministros</option>
                        <option value="Producto Terminado">Producto Terminado</option>
                        <option value="Repuestos">Repuestos</option>
                        <option value="Tránsito">Tránsito</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Nombre Almacén</label>
                    <input 
                      type="text" 
                      required
                      value={formData.nombre || ""} 
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Ubicación / Dirección</label>
                    <input 
                      type="text" 
                      value={formData.direccion || ""} 
                      onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Responsable / Supervisor</label>
                    <input 
                      type="text" 
                      value={formData.responsable || ""} 
                      onChange={e => setFormData({ ...formData, responsable: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                    />
                  </div>
                </>
              )}

              {activeTab === "grupo_analitico" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Código Grupo</label>
                      <input 
                        type="text" 
                        required
                        disabled={isEditMode}
                        value={formData.codigo || ""} 
                        onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-gray-50" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Cuenta Contable</label>
                      <input 
                        type="text" 
                        required
                        value={formData.cuenta_contable || ""} 
                        onChange={e => setFormData({ ...formData, cuenta_contable: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Nombre Grupo</label>
                    <input 
                      type="text" 
                      required
                      value={formData.nombre || ""} 
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Categoría General</label>
                    <input 
                      type="text" 
                      value={formData.categoria || ""} 
                      onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                    />
                  </div>
                </>
              )}

              {activeTab === "productos" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Código Item</label>
                      <input 
                        type="text" 
                        required
                        disabled={isEditMode}
                        value={formData.codigo || ""} 
                        onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-gray-50" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Unidad Medida</label>
                      <input 
                        type="text" 
                        required
                        value={formData.umed || ""} 
                        onChange={e => setFormData({ ...formData, umed: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Descripción del Producto</label>
                    <input 
                      type="text" 
                      required
                      value={formData.descripcion || ""} 
                      onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Marca</label>
                      <input 
                        type="text" 
                        value={formData.marca || ""} 
                        onChange={e => setFormData({ ...formData, marca: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Stock Inicial</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.stock || 0} 
                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                      />
                    </div>
                    <div className="space-y-1 col-span-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Precio Ref.</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        value={formData.precio || 0} 
                        onChange={e => setFormData({ ...formData, precio: Number(e.target.value) })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "centros_costo" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Código Centro Costo</label>
                      <input 
                        type="text" 
                        required
                        disabled={isEditMode}
                        value={formData.codigo || ""} 
                        onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-gray-50" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Cód. Presupuestal</label>
                      <input 
                        type="text" 
                        required
                        value={formData.codigo_presupuestal || ""} 
                        onChange={e => setFormData({ ...formData, codigo_presupuestal: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Nombre Centro Costo</label>
                    <input 
                      type="text" 
                      required
                      value={formData.nombre || ""} 
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                    />
                  </div>
                </>
              )}

              {activeTab === "documentos" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Cód. Documento</label>
                      <input 
                        type="text" 
                        required
                        disabled={isEditMode}
                        maxLength={5}
                        placeholder="Ej. NI"
                        value={formData.codigo_doc || ""} 
                        onChange={e => setFormData({ ...formData, codigo_doc: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-gray-50" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-500 uppercase">Serie</label>
                      <input 
                        type="text" 
                        required
                        maxLength={4}
                        placeholder="Ej. F001"
                        value={formData.serie || ""} 
                        onChange={e => setFormData({ ...formData, serie: e.target.value })}
                        className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Tipo Documento / Descripción</label>
                    <input 
                      type="text" 
                      required
                      value={formData.tipo_documento || ""} 
                      onChange={e => setFormData({ ...formData, tipo_documento: e.target.value })}
                      className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase">Correlativo Actual</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={formData.correlativo || 1} 
                      onChange={e => setFormData({ ...formData, correlativo: Number(e.target.value) })}
                      className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2" 
                    />
                  </div>
                </>
              )}

              {/* Selector de Estado */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Estado Registro</label>
                <select 
                  value={formData.estado || ""} 
                  onChange={e => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full text-xs font-semibold border border-gray-200 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="ACTIVO">Activo / Operativo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>

              {/* Botones de Formulario */}
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
