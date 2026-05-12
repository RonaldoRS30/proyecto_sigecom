import { Bell, Check, Settings2, ExternalLink } from "lucide-react";
import NotificationItem from "./NotificationItem";

export default function NotificationDropdown({ notificaciones = [], loading, refresh }) {
  return (
    <div className="absolute right-0 mt-3 w-[450px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header Superior */}
      <div className="px-5 py-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Notificaciones</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-xs font-medium text-slate-500">Solo no leídas</span>
            <button className="w-8 h-4 bg-slate-200 rounded-full relative p-0.5 transition-colors hover:bg-slate-300">
              <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
            </button>
          </div>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <ExternalLink size={18} />
          </button>
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            <Settings2 size={18} />
          </button>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="px-5 border-b border-slate-100 flex gap-6">
        <button className="pb-3 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">
          Directas
        </button>
        <button className="pb-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
          Siguiendo
        </button>
      </div>

      {/* Subtítulo de Sección */}
      <div className="px-5 py-3 bg-slate-50/50">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Más recientes
        </span>
      </div>

      {/* Body con Scroll Personalizado */}
      <div className="max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 animate-pulse">Sincronizando alertas...</p>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <Bell className="text-slate-300" size={32} />
            </div>
            <p className="text-sm font-medium text-slate-600">Estas son todas tus notificaciones</p>
            <p className="text-xs text-slate-400 mt-1">De los últimos 30 días</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notificaciones.map((notif) => (
              <NotificationItem
                key={notif.id}
                notif={notif}
                refresh={refresh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer mejorado */}
      <div className="bg-white border-t border-slate-100 px-5 py-4 flex flex-col gap-3">
         <div className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50">
            <p className="text-[11px] text-slate-500 flex items-center gap-2">
              <span className="flex gap-1 text-slate-700 font-mono">
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-sm">↓</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-sm">↑</kbd>
              </span>
              para desplazarte rápidamente
            </p>
            <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tighter">
              Ver Atajos
            </button>
         </div>
      </div>
    </div>
  );
}