import React from 'react';
import * as LucideIcons from 'lucide-react';

export const ERPIcon = ({ name, className }) => {
  const iconName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  const LucideIcon = LucideIcons[iconName] || LucideIcons.HelpCircle;
  return <LucideIcon className={className} />;
};

export const StatusBadge = ({ status }) => {
  const statusString = status ? String(status).toLowerCase() : '';

  // 1. OPORTUNIDAD (Estado ID 11) - Indigo
  if (statusString.includes('oportunidad')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
        Oportunidad
      </span>
    );
  }

  // 2. PENDIENTE (Estado ID 2) - Ámbar
  if (statusString.includes('pendiente')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-amber-50 text-amber-700 border border-amber-100 shadow-sm">
        Pendiente
      </span>
    );
  }

  // 3. ADJUDICADO (Estado ID 1) - Esmeralda
  if (statusString.includes('adjudicado')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
        Adjudicado
      </span>
    );
  }

  // 4. EN SEGUIMIENTO (Estado ID 7) - Azul
  if (statusString.includes('seguimiento')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-blue-50 text-blue-700 border border-blue-100 shadow-sm">
        En Seguimiento
      </span>
    );
  }

  // 5. POSTERGADA (Estado ID 5) - Violeta/Púrpura suave
  if (statusString.includes('postergada')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-purple-50 text-purple-700 border border-purple-100 shadow-sm">
        Postergada
      </span>
    );
  }

  // 6. ANULADO / PERDIDA (Estados ID 4 y 3) - Gris Neutro
  if (statusString.includes('anulado') || statusString.includes('perdida')) {
    const label = statusString.includes('anulado') ? 'Anulado' : 'Perdida';
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-gray-50 text-gray-500 border border-gray-100">
        {label}
      </span>
    );
  }

  // Fallback para cualquier otro estado (Facturado, Cobrado, etc.)
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter bg-slate-50 text-slate-500 border border-slate-100">
      {status}
    </span>
  );
};

export const ERPTable = ({
  headers,
  children,
  loading,
  onSort,
  sortConfig,
  pagination
}) => {
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full table-auto divide-y divide-gray-200">
          <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  onClick={() => onSort && h.key && onSort(h.key)}
                  className={`px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest ${h.key ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''} ${h.className || ''}`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{h.label || h}</span>
                    {h.key && sortConfig?.key === h.key && (
                      sortConfig.direction === 'asc'
                        ? <LucideIcons.ChevronUp className="h-3 w-3 text-indigo-500" />
                        : <LucideIcons.ChevronDown className="h-3 w-3 text-indigo-500" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 relative">
            {loading ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <LucideIcons.Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <span className="text-sm font-medium animate-pulse">Cargando datos...</span>
                  </div>
                </td>
              </tr>
            ) : children}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="bg-gray-50/50 px-6 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Mostrando {pagination.from} - {pagination.to} de {pagination.total} registros
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
            >
              <LucideIcons.ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-black text-gray-700 min-w-[2rem] text-center">
              {pagination.currentPage}
            </span>
            <button
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
            >
              <LucideIcons.ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ERPButton = ({ children, onClick, variant = 'primary', icon, className = '', disabled = false }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-red-100',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm ${variants[variant]} ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export const ERPInput = ({ placeholder, value, onChange, icon, type = 'text', className = '' }) => {
  
  // Automatización para bloquear números negativos en caliente si el tipo es number
  const handleNumberChange = (e) => {
    if (type === 'number') {
      const val = e.target.value;
      // Si intentan meter un número negativo, lo forzamos a vacío o a su valor absoluto
      if (val && Number(val) < 0) {
        return; // Ignora el cambio si es negativo
      }
    }
    if (onChange) onChange(e);
  };

  return (
    <div className={`relative ${className}`}>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={handleNumberChange}
        // min="0" evita que usen las flechas del teclado hacia abajo
        min={type === 'number' ? "0" : undefined} 
        className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm placeholder:text-gray-400 
          ${icon ? 'pl-10' : ''} 
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />
    </div>
  );
};

export const FilterDropdown = ({ label, value, options, onSelect, icon: Icon, onToggle }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [localSearch, setLocalSearch] = React.useState("");
  const containerRef = React.useRef(null);

  // Cerrar al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        if (onToggle) onToggle(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) {
      setLocalSearch("");
    }
  }, [isOpen]);

  const filteredOptions = React.useMemo(() => {
    return options.filter(opt => 
      opt.n.toLowerCase().includes(localSearch.toLowerCase())
    );
  }, [options, localSearch]);

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            if (onToggle) onToggle(true);
          }
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-[10px] font-black uppercase tracking-tighter cursor-pointer ${isOpen
            ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm"
            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
          }`}
      >
        {Icon && (
          typeof Icon === 'string' 
            ? <ERPIcon name={Icon} className={`h-3.5 w-3.5 ${isOpen ? "text-indigo-600" : "text-gray-400"}`} />
            : <Icon className={`h-3.5 w-3.5 ${isOpen ? "text-indigo-600" : "text-gray-400"}`} />
        )}
        <span className="opacity-60">{label}:</span>
        {isOpen ? (
          <input
            autoFocus
            className="bg-transparent outline-none text-indigo-700 font-black text-[10px] uppercase w-20"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Escribe..."
          />
        ) : (
          <span className="text-gray-900">{value}</span>
        )}
        <LucideIcons.ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 animate-in fade-in zoom-in duration-150">
          <div className="max-h-60 overflow-y-auto no-scrollbar">
            {filteredOptions.map((opt) => (
              <button
                key={opt.v}
                onClick={() => {
                  onSelect(opt.v);
                  setIsOpen(false);
                  if (onToggle) onToggle(false);
                }}
                className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-indigo-50 hover:text-indigo-600 transition-colors ${value === opt.n ? "text-indigo-600 bg-indigo-50/50" : "text-gray-600"
                  }`}
              >
                {opt.n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};