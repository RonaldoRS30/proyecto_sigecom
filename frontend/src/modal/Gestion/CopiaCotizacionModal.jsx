import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Copy, FilePlus, RefreshCcw } from "lucide-react";

export default function CopiaCotizacionModal({
  open,
  onClose,
  onAceptar,
  loading = false,
}) {

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-white rounded-2xl shadow-2xl border-none p-0 overflow-hidden font-sans">
        
        {/* HEADER IDENTICO AL SISTEMA GESTIÓN */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 text-cyan-600 rounded-lg">
              <Copy size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Copia de la Cotización
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Generar nuevo registro base
              </p>
            </div>
          </div>
        </div>

        {/* CUERPO - PANEL CENTRAL (p-2 externo, p-5 interno) */}
        <div className="p-2">
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 shadow-inner flex gap-4">
            
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-cyan-100 text-cyan-500 shadow-sm shrink-0">
              <FilePlus size={24} />
            </div>

            <div className="space-y-2">
              <p className="text-[12px] font-black text-slate-800 leading-tight uppercase tracking-tight">
                ¿Desea crear una copia de esta cotización?
              </p>
              <div className="flex items-start gap-1.5">
                <RefreshCcw size={12} className="text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                  Se asignará un <span className="text-cyan-600 font-black tracking-tight">NUEVO NÚMERO</span> en estado pendiente para edición libre.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER CON VARIANT GHOST Y HOVER CYAN */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[11px] font-black uppercase tracking-widest text-red-700 hover:bg-red-100 border border-transparent hover:border-red-200 rounded-xl h-9 px-8 transition-all"
          >
            Cancelar
          </Button>
          
          <Button
            variant="ghost"
            onClick={onAceptar}
            className="text-[11px] font-black uppercase tracking-widest text-cyan-700 hover:bg-cyan-100 border border-transparent hover:border-cyan-200 rounded-xl h-9 px-8 transition-all"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                <span>Copiando...</span>
              </div>
            ) : (
              "Generar Copia"
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
