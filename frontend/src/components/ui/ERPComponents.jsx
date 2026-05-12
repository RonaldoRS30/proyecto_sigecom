import React from 'react';
import * as LucideIcons from 'lucide-react';

export const ERPIcon = ({ name, className }) => {
  const iconName = name.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  const LucideIcon = LucideIcons[iconName] || LucideIcons.HelpCircle;
  return <LucideIcon className={className} />;
};

export const StatusBadge = ({ status }) => {
  // 1. Convertimos a String y manejamos casos nulos/indefinidos
  const statusString = status ? String(status) : '';
  const statusLower = statusString.toLowerCase();
  
  if (statusLower.includes('oportunidad')) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">Oportunidad</span>;
  }
  if (statusLower.includes('elaboración') || statusLower.includes('draft')) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">Elaboración</span>;
  }
  if (statusLower.includes('enviada') || statusLower.includes('sent')) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm">Enviada</span>;
  }
  if (statusLower.includes('adjudicada') || statusLower.includes('approved')) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700 border border-green-200 shadow-sm">Adjudicada</span>;
  }
  if (statusLower.includes('perdida')) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 shadow-sm">Perdida</span>;
  }

  // 2. Si no coincide con ninguno, mostramos el valor original (o un string vacío)
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 shadow-sm">{statusString}</span>;
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
        onChange={onChange}
        className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm placeholder:text-gray-400 ${icon ? 'pl-10' : ''}`}
      />
    </div>
  );
};
