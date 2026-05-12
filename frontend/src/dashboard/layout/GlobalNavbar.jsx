import React, { useState } from "react";
import {
  Search,
  Plus,
  Bell,
  HelpCircle,
  Settings,
  PanelLeftOpen,
  ChevronDown,
  LogOut,
  User
} from "lucide-react";
import logo from "@/assets/logo.png";
import NotificationDropdown from "../../components/notificaciones/NotificationDropdown";

export default function GlobalNavbar({ sidebarOpen, setSidebarOpen, user }) {
  const [openUser, setOpenUser] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);

  const [notificaciones, setNotificaciones] = useState([]); 
  const [loading, setLoading] = useState(false);

  return (
    <header className="h-11 flex items-center justify-between px-3 glass border-b border-white/20 z-[100] shrink-0 sticky top-0">

      {/* IZQUIERDA */}
      <div className="flex items-center gap-1">
        {!sidebarOpen && (
          <div className="flex items-center">

            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition"
            >
              <PanelLeftOpen size={17} />
            </button>

            <div className="flex items-center gap-2 px-2 border-l border-slate-200 ml-2">
              <img
                src={logo}
                alt="V&C"
                className="h-7 w-auto object-contain"
              />
            </div>
          </div>
        )}
      </div>


      {/* CENTRO */}
      <div className="flex-1 flex items-center justify-center px-4 gap-3">

        {/* BUSCADOR */}
        <div className="relative w-full max-w-[460px] group">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600"
          />

          <input
            type="text"
            placeholder="Buscar..."
            className="
              w-full pl-9 pr-3 py-1.5
              bg-slate-50
              border border-slate-200
              rounded-md
              text-xs
              transition-all
              focus:bg-white
              focus:border-cyan-600
              focus:ring-1 focus:ring-cyan-500/20
              outline-none
            "
          />
        </div>


        {/* NUEVO */}
        <button className="
          hidden sm:flex
          items-center gap-1
          px-3 py-1.5
          bg-cyan-600
          text-white
          text-xs font-medium
          rounded-md
          hover:bg-cyan-700
          transition
          active:scale-95
        ">
          <Plus size={14} />
          Nuevo
        </button>
      </div>


      {/* DERECHA */}
      <div className="flex items-center gap-1">

        {/* ICONOS */}
        <div className="hidden md:flex items-center gap-1 border-r border-slate-200 pr-2 mr-2">

          {/* CONTENEDOR ANCLA: Aquí es donde sucede la magia del posicionamiento */}
          <div className="relative inline-block">
            
            {/* NOTIFICACIONES ERP */}
            <button
              onClick={() => setOpenNotif(!openNotif)}
              className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 rounded-md transition"
            >
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-500 rounded-full" />
            </button>

            {/* DROPDOWN: Ahora es hijo del div 'relative', por lo que 'right-0' se alineará con la campana */}
            {openNotif && (
              <NotificationDropdown 
                  onClose={() => setOpenNotif(false)} 
                  notificaciones={notificaciones} // Asegúrate de pasar estas props
                  loading={loading}
              />
            )}
          </div>

          <button className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 rounded-md transition">
            <HelpCircle size={16} />
          </button>

          <button className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 rounded-md transition">
            <Settings size={16} />
          </button>
        </div>


        {/* USUARIO */}
        <div className="relative">
          <button
            onClick={() => setOpenUser(!openUser)}
            className="flex items-center gap-1"
          >
            <div className="
              w-7 h-7
              bg-gradient-to-br from-cyan-600 to-teal-700
              rounded-full
              flex items-center justify-center
              text-[10px] font-bold text-white
              shadow-sm
            ">
              {user?.usuario
                ? user.usuario
                    .split(/[.\s]/)
                    .map(w => w[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()
                : "VC"}
            </div>

            <ChevronDown size={14} className="text-slate-400" />
          </button>


          {/* DROPDOWN ERP */}
          {openUser && (
            <div className="
              absolute right-0 mt-2 w-44
              bg-white border border-slate-200
              rounded-lg shadow-lg
              py-1 text-xs
              animate-in fade-in zoom-in-95
            ">
              <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50">
                <User size={14} />
                Mi perfil
              </button>

              <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50">
                <Settings size={14} />
                Configuración
              </button>

              <div className="border-t my-1" />

              <button className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50">
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
