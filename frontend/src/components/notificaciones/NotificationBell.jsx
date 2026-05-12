import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";
import api from "../../services/api";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef();

  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const res = await api.get("/notificaciones/");
      setNotificaciones(res.data);
    } catch (error) {
      console.error("Error cargando notificaciones", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  // cerrar al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const noLeidas = notificaciones.filter(n => !n.leido).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 text-slate-500 hover:bg-slate-100 hover:text-cyan-600 rounded-md transition"
      >
        <Bell size={18} />

        {noLeidas > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
            {noLeidas}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notificaciones={notificaciones}
          loading={loading}
          refresh={fetchNotificaciones}
        />
      )}
    </div>
  );
}