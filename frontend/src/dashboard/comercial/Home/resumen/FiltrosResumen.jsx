import React, { useState, useRef, useEffect } from "react";
import { 
  Calendar, Filter, ChevronDown, X, Plus, User, Briefcase, 
  Search, BarChart3, Truck, Activity, CheckCircle2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ==========================================================================
   HOOKS & UTILS
   ========================================================================== */
function useOutsideClick(ref, callback) {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) callback();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
}

export default function FiltrosResumen({ filtros = {}, setFiltros = () => {} }) {
  const [activeMenu, setActiveMenu] = useState(null);
  const containerRef = useRef(null);
  useOutsideClick(containerRef, () => setActiveMenu(null));

  const actualizar = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    // No cerramos automáticamente en fechas para permitir elegir inicio y fin
    if (campo !== 'fecha_inicio' && campo !== 'fecha_fin') setActiveMenu(null);
  };

  const eliminarFiltro = (campo) => {
    const nuevosFiltros = { ...filtros };
    delete nuevosFiltros[campo];
    setFiltros(nuevosFiltros);
  };

  /* =========================
     DATA DE OPCIONES
     ========================= */
  const opciones = {
    areas: [
      { id: "IND", label: "Industria" },
      { id: "MIN", label: "Minería" },
      { id: "OIL", label: "Oil & Gas" },
      { id: "SFY", label: "Safety" }
    ],
    metricas: [
      { id: "CANTIDAD", label: "Ver por Cantidad", desc: "Número de registros" },
      { id: "MONTO", label: "Ver por Montos", desc: "Valor monetario (S/.)" }
    ],
    envio: [
      { id: "PENDIENTE", label: "Pendiente" },
      { id: "EN_CAMINO", label: "En Camino" },
      { id: "ENTREGADO", label: "Entregado" }
    ],
    estados: [
      { id: "BORRADOR", label: "Borrador" },
      { id: "APROBADO", label: "Aprobado" },
      { id: "RECHAZADO", label: "Rechazado" }
    ]
  };

  return (
    <div className="flex items-center gap-3 mb-8 relative" ref={containerRef}>
      
      <div className="relative">
        {/* BOTÓN DISPARADOR */}
        <button 
          onClick={() => setActiveMenu(activeMenu === 'main' ? null : 'main')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold shadow-sm ${
            activeMenu ? "bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-100" : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
          }`}
        >
          <Filter size={16} className={activeMenu ? "text-blue-600" : "text-slate-400"} />
          <span>Añadir Filtro</span>
          <ChevronDown size={14} className={activeMenu ? "rotate-180" : "opacity-40"} />
        </button>

        <AnimatePresence>
          {/* MENU NIVEL 1: CATEGORÍAS */}
          {activeMenu === 'main' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 12 }} exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 z-[100] w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2"
            >
              <div className="space-y-0.5">
                <MenuOption label="Área" icon={<Briefcase size={14}/>} onClick={() => setActiveMenu('area')} />
                <MenuOption label="Rango de Fechas" icon={<Calendar size={14}/>} onClick={() => setActiveMenu('fecha')} />
                <MenuOption label="Métrica (S/. o Und)" icon={<BarChart3 size={14}/>} onClick={() => setActiveMenu('metrica')} />
                <MenuOption label="Estado de Envío" icon={<Truck size={14}/>} onClick={() => setActiveMenu('envio')} />
                <MenuOption label="Estado Registro" icon={<CheckCircle2 size={14}/>} onClick={() => setActiveMenu('estado')} />
              </div>
            </motion.div>
          )}

          {/* MENÚS NIVEL 2: SUB-OPCIONES (Se abren a la derecha) */}
          {activeMenu === 'area' && (
            <FloatingMenu title="Seleccionar Área" onClose={() => setActiveMenu('main')}>
              {opciones.areas.map(a => (
                <button key={a.id} onClick={() => actualizar('area', a.id)} className="sub-menu-item">{a.label}</button>
              ))}
            </FloatingMenu>
          )}

          {activeMenu === 'metrica' && (
            <FloatingMenu title="Tipo de Visualización" onClose={() => setActiveMenu('main')}>
              {opciones.metricas.map(m => (
                <button key={m.id} onClick={() => actualizar('metrica', m.id)} className="sub-menu-item flex flex-col items-start px-3 py-2">
                  <span className="font-bold">{m.label}</span>
                  <span className="text-[10px] opacity-60 font-medium">{m.desc}</span>
                </button>
              ))}
            </FloatingMenu>
          )}

          {activeMenu === 'envio' && (
            <FloatingMenu title="Estado de Envío" onClose={() => setActiveMenu('main')}>
              {opciones.envio.map(e => (
                <button key={e.id} onClick={() => actualizar('estado_envio', e.id)} className="sub-menu-item">{e.label}</button>
              ))}
            </FloatingMenu>
          )}

          {activeMenu === 'estado' && (
            <FloatingMenu title="Estado del Registro" onClose={() => setActiveMenu('main')}>
              {opciones.estados.map(es => (
                <button key={es.id} onClick={() => actualizar('estado', es.id)} className="sub-menu-item">{es.label}</button>
              ))}
            </FloatingMenu>
          )}

          {activeMenu === 'fecha' && (
            <FloatingMenu title="Rango de Fechas" onClose={() => setActiveMenu('main')}>
              <div className="p-3 space-y-4">
                 <div className="flex flex-col gap-3">
                    <DateInput label="Desde" onChange={(v) => actualizar('fecha_inicio', v)} value={filtros.fecha_inicio} />
                    <DateInput label="Hasta" onChange={(v) => actualizar('fecha_fin', v)} value={filtros.fecha_fin} />
                 </div>
                 <button 
                  onClick={() => setActiveMenu(null)}
                  className="w-full bg-blue-600 text-white text-[11px] font-black py-2 rounded-lg hover:bg-blue-700 transition-colors"
                 >
                   APLICAR RANGO
                 </button>
              </div>
            </FloatingMenu>
          )}
        </AnimatePresence>
      </div>

      {/* ÁREA DE FILTROS ACTIVOS (BADGES) */}
      <div className="flex flex-wrap items-center gap-2">
        <AnimatePresence>
          {filtros.area && <FilterBadge label={`Área: ${filtros.area}`} onRemove={() => eliminarFiltro('area')} icon={<Briefcase size={12}/>} />}
          {filtros.metrica && <FilterBadge label={filtros.metrica} onRemove={() => eliminarFiltro('metrica')} icon={<BarChart3 size={12}/>} color="bg-amber-50 border-amber-100 text-amber-700" />}
          {filtros.estado_envio && <FilterBadge label={filtros.estado_envio} onRemove={() => eliminarFiltro('estado_envio')} icon={<Truck size={12}/>} color="bg-purple-50 border-purple-100 text-purple-700" />}
          {filtros.estado && <FilterBadge label={filtros.estado} onRemove={() => eliminarFiltro('estado')} icon={<CheckCircle2 size={12}/>} color="bg-emerald-50 border-emerald-100 text-emerald-700" />}
          {(filtros.fecha_inicio || filtros.fecha_fin) && (
            <FilterBadge label={`${filtros.fecha_inicio || '?'} / ${filtros.fecha_fin || '?'}`} onRemove={() => { eliminarFiltro('fecha_inicio'); eliminarFiltro('fecha_fin'); }} icon={<Calendar size={12}/>} />
          )}
        </AnimatePresence>
        
        {Object.keys(filtros).length > 1 && (
          <button 
            onClick={() => setFiltros({})}
            className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-tighter ml-2 transition-colors"
          >
            Limpiar todo
          </button>
        )}
      </div>
      
      {/* ESTILOS CSS ADICIONALES (Para limpieza de código) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .sub-menu-item {
          width: 100%;
          text-align: left;
          padding: 0.6rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          border-radius: 0.75rem;
          transition: all 0.2s;
        }
        .sub-menu-item:hover {
          background-color: #f0f7ff;
          color: #2563eb;
        }
      `}} />
    </div>
  );
}

/* =========================
   SUB-COMPONENTES REUTILIZABLES
   ========================= */

const DateInput = ({ label, onChange, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <input 
      type="date" 
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
    />
  </div>
);

const FilterBadge = ({ label, onRemove, icon, color = "bg-blue-50 border-blue-100 text-blue-700" }) => (
  <motion.div 
    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
    className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-[11px] font-black shadow-sm ${color}`}
  >
    <span className="opacity-60">{icon}</span>
    {label}
    <button onClick={onRemove} className="hover:bg-black/5 rounded-full p-0.5"><X size={12} /></button>
  </motion.div>
);

const MenuOption = ({ label, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 group transition-all"
  >
    <div className="flex items-center gap-3">
      <span className="text-slate-400 group-hover:text-blue-500 transition-colors">{icon}</span>
      {label}
    </div>
    <Plus size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
  </button>
);

const FloatingMenu = ({ title, children, onClose }) => (
  <motion.div 
    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
    className="absolute left-[265px] top-0 z-[110] w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
  >
    <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
      <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{title}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
    </div>
    <div className="p-1.5">{children}</div>
  </motion.div>
);