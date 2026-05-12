import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Hash, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function GenerarCodigoModal({
  open,
  onClose,
  numReg,
  codigoExistente,
  onGuardado,
}) {
  const [codigo, setCodigo] = useState("");
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(false);

  // =========================
  // AL ABRIR → PREVIEW
  // =========================
  useEffect(() => {
    if (!open) return;

    if (codigoExistente) {
      setCodigo(codigoExistente);
      setExists(true);
      return;
    }

    const fetchCodigo = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `/api/cotizaciones/generar_codigo/${numReg}/`
        );

        setCodigo(res.data.codigo);
        setExists(res.data.exists);
      } catch (err) {
        console.error("Error generando código", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCodigo();
  }, [open, numReg, codigoExistente]);

  // =========================
  // GUARDAR (DENTRO DE GenerarCodigoModal)
  // =========================
  const handleAceptar = async () => { // 1. Agregamos async
    if (codigoExistente) {
      onClose();
      return;
    }

    if (onGuardado) {
      try {
        setLoading(true); // 2. Activamos el loading local
        await onGuardado(); // 3. Esperamos a que la mutación del padre termine
        onClose(); // 4. Recién cerramos cuando el SUCCESS del padre ocurra
      } catch (error) {
        // No necesitas hacer nada aquí, el onError del padre ya lanza el toast
        console.error("Error al guardar:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl border-none p-0 overflow-hidden font-sans">
        
        {/* HEADER MODERNO */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Hash size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Código de Cotización
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Identificador único del documento
              </p>
            </div>
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="p-2">
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 shadow-inner space-y-4">
            
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Código Generado
              </label>
              
              <div className="relative group">
                <input
                  type="text"
                  value={codigo}
                  readOnly
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-mono font-black text-[#0d767e] tracking-[0.2em] shadow-sm focus:outline-none transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-emerald-500 transition-colors">
                  <CheckCircle2 size={18} />
                </div>
              </div>

              {exists && (
                <div className="flex items-center gap-2 mt-3 px-2 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                  <AlertCircle size={14} className="text-amber-600" />
                  <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">
                    Este código ya fue generado previamente
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[11px] font-black uppercase tracking-widest text-red-700 hover:bg-red-100 border border-transparent hover:border-red-200 rounded-xl h-9 px-8 transition-all"
          >
            Salir
          </Button>

          {!exists && (
            <Button
              variant="ghost"
              onClick={handleAceptar}
              disabled={loading}
              className="text-[11px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 border border-transparent hover:border-emerald-200 rounded-xl h-9 px-8 transition-all"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </div>
              ) : (
                "Guardar Código"
              )}
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
