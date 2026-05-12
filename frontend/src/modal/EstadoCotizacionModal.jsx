import axios from "axios";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { RefreshCcw, ChevronDown, Info, Loader2, Lock } from "lucide-react";

export default function EstadoCotizacionModal({ open, onClose, num_reg }) {
  const [loading, setLoading] = useState(false);
  const [numero, setNumero] = useState("");
  const [estadoInicial, setEstadoInicial] = useState("");
  const [estadoCodigo, setEstadoCodigo] = useState("");
  const [estados, setEstados] = useState([]);

  const cargarDatosCotizacion = async () => {
    if (!num_reg) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const res = await axios.get(`/api/cotizaciones/modal/${num_reg}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setNumero(res.data.numero || "");
      setEstadoCodigo(res.data.estado_codigo || "");
      setEstadoInicial(res.data.estado_codigo || "");
    } catch (err) {
      console.error("Error cargando cotización", err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar lista de estados
  const cargarEstados = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get("/api/cotizaciones/estados/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const estadosFiltrados = res.data.filter(
        item => item.activo && Number(item.cot) === 1
      );

      setEstados(estadosFiltrados);
    } catch (err) {
      console.error("Error cargando estados", err);
    }
  };

  const handleAceptar = async () => {
    if (!estadoCodigo || estadoCodigo === estadoInicial) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      await axios.patch(
        `/api/cotizaciones/${num_reg}/cambiar-estado/`,
        { estado_codigo: estadoCodigo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Estado actualizado correctamente");
      onClose(true); // permite refrescar listado
    } catch (err) {
      console.error("Error cambiando estado", err);
      toast.error("No se pudo actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      cargarDatosCotizacion();
      cargarEstados();
    }
  }, [open, num_reg]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-[2rem] shadow-2xl border-none p-0 overflow-hidden">
        
        {/* HEADER MODERNO - SKY STYLE */}
        <div className="bg-sky-50/80 px-6 py-5 border-b border-sky-100">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-sky-500 text-white rounded-2xl shadow-lg shadow-sky-200">
              <RefreshCcw size={20} strokeWidth={2.5} className={loading ? "animate-spin" : ""} />
            </div>
            <div>
              <h3 className="text-sm font-[1000] text-slate-800 uppercase tracking-[0.1em]">
                Estado de la Cotización
              </h3>
              <p className="text-[10px] text-sky-600 font-black uppercase tracking-[0.15em] mt-0.5">
                Gestión de ciclo de vida comercial
              </p>
            </div>
          </div>
        </div>

        {/* CONTENIDO DEL FORMULARIO */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 space-y-5 shadow-inner">
            
            {/* CAMPO: NRO COTIZACIÓN (READ ONLY) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Cotización Referencia
              </label>
              <div className="relative">
                <input
                  value={numero}
                  disabled
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock size={14} className="text-slate-300" />
                </div>
              </div>
            </div>

            {/* CAMPO: SELECTOR DE ESTADO */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-sky-600 ml-1">
                Nuevo Estado Operativo
              </label>
              <div className="relative">
                <select
                  value={estadoCodigo}
                  onChange={(e) => setEstadoCodigo(e.target.value)}
                  className="w-full bg-white border-2 border-sky-100 focus:border-sky-500 rounded-xl px-4 py-2.5 text-xs font-[900] text-slate-800 appearance-none outline-none transition-all focus:ring-4 focus:ring-sky-500/10 cursor-pointer"
                >
                  <option value="">Seleccione un estado...</option>
                  {estados.map(e => (
                    <option key={e.codigo} value={e.codigo} className="font-semibold">
                      {e.nombre}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={16} className="text-sky-500" />
                </div>
              </div>
            </div>
          </div>

          {/* NOTA INFORMATIVA */}
          <div className="flex items-center gap-2 px-2">
            <Info size={14} className="text-sky-400" />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
              Este cambio afectará la trazabilidad en los reportes mensuales.
            </p>
          </div>
        </div>

        {/* FOOTER ACCIONES */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[11px] font-[1000] uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all"
          >
            Cancelar
          </Button>
          
          <Button
            disabled={loading || !estadoCodigo || estadoCodigo === estadoInicial}
            onClick={handleAceptar}
            className={`
              text-[11px] font-[1000] uppercase tracking-widest rounded-xl px-8 h-10 transition-all shadow-lg
              ${loading || !estadoCodigo || estadoCodigo === estadoInicial
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-sky-500 text-white hover:bg-sky-600 shadow-sky-200 active:scale-95"}
            `}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Guardando</span>
              </div>
            ) : (
              "Confirmar Cambio"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
