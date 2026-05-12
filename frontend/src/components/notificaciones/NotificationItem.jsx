import api from "../../services/api";

export default function NotificationItem({ notif, refresh }) {

  const getColor = () => {
    switch (notif.tipo) {
      case "urgente":
        return "border-l-4 border-red-500 bg-red-50";
      case "atencion":
        return "border-l-4 border-amber-500 bg-amber-50";
      default:
        return "border-l-4 border-cyan-500 bg-cyan-50";
    }
  };

  const marcarLeido = async () => {
    try {
      await api.post(`/notificaciones/${notif.id}/marcar/`);
      refresh();
    } catch (error) {
      console.error("Error marcando como leída", error);
    }
  };

  return (
    <div
      onClick={marcarLeido}
      className={`px-4 py-3 cursor-pointer hover:bg-slate-100 transition ${getColor()} ${notif.leido ? "opacity-60" : ""}`}
    >
      <div className="flex justify-between items-start">
        <h4 className="text-sm font-semibold text-slate-700">
          {notif.titulo}
        </h4>
        <span className="text-[10px] text-slate-400">
          {new Date(notif.fecha).toLocaleDateString()}
        </span>
      </div>

      <p className="text-xs text-slate-600 mt-1">
        {notif.descripcion}
      </p>

      {notif.cantidad > 0 && (
        <div className="mt-2 text-xs font-semibold text-slate-500">
          {notif.cantidad} registros
        </div>
      )}
    </div>
  );
}

