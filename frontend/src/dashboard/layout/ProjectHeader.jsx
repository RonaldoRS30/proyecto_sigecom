import React from 'react';
import { LayoutGrid, ListTodo, Columns3, Code2, Calendar, FileText, Settings2, Share2, Expand } from 'lucide-react';

const tabs = [
  { id: 'resumen', label: 'Resumen', icon: LayoutGrid },
  { id: 'backlog', label: 'Backlog', icon: ListTodo },
  { id: 'tablero', label: 'Tablero', icon: Columns3 },
  { id: 'codigo', label: 'Código', icon: Code2 },
  { id: 'cronograma', label: 'Cronograma', icon: Calendar },
];

export default function ProjectHeader() {
  const [activeTab, setActiveTab] = React.useState('backlog');

  return (
    <div className="bg-white border-b border-slate-200 pt-4 px-8">
      {/* Breadcrumb / Espacio */}
      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
        <span>Espacio</span>
      </div>

      {/* Título y Acciones Superiores */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Logo del proyecto */}
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white text-xs shadow-sm">
            <Settings2 size={16} />
          </div>
          <h1 className="text-xl font-semibold text-[#172B4D]">
            V&C CORPORATION PROYECTO
          </h1>
          <button className="p-1 hover:bg-slate-100 rounded text-slate-500">
            <Share2 size={16} />
          </button>
        </div>

        {/* Botones de vista (Derecha) */}
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 rounded text-slate-600"><Share2 size={18} /></button>
          <button className="p-2 hover:bg-slate-100 rounded text-slate-600"><Expand size={18} /></button>
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-sm transition-all relative
                ${isActive ? "text-blue-600 font-medium" : "text-slate-600 hover:text-slate-900"}`}
            >
              <Icon size={16} />
              {tab.label}
              {/* Línea azul de activo */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}