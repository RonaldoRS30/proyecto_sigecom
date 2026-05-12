import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Undo2, TriangleAlert, LockOpen } from "lucide-react";


export default function RetornarCotizacionModal({
  open,
  onClose,
  onAceptar,
  loading = false,
  envio = 0,
}) {

  const isDisabled = loading || envio === "0" || envio === 0;

  const mensaje = envio === "0"
    ? "No se puede retornar la cotización porque se encuentra en su estado inicial."
    : "¿Desea retornar esta cotización al estado Pendiente de Envio para Revisión?";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-white rounded-2xl shadow-2xl border-none p-0 overflow-hidden font-sans">
        
        {/* HEADER IDENTICO AL SISTEMA GESTIÓN (Color Rose) */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <Undo2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Retornar Cotización
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Reapertura de documento para edición
              </p>
            </div>
          </div>
        </div>

        {/* CUERPO - PANEL CENTRAL (p-2 externo, p-5 interno) */}
        <div className="p-2">
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 shadow-inner flex gap-4">
            
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-rose-100 text-rose-500 shadow-sm shrink-0">
              <TriangleAlert size={24} />
            </div>

            <div className="space-y-2">
              <p className="text-[12px] font-black text-slate-800 leading-tight uppercase tracking-tight">
                {mensaje || "¿Desea retornar esta cotización?"}
              </p>
              
              {envio !== "0" && envio !== 0 && (
                <div className="flex items-start gap-1.5">
                  <LockOpen size={12} className="text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                    Esta acción permitirá <span className="text-rose-600 font-black tracking-tight">VOLVER A EDITAR</span> los importes y datos de la cotización.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* FOOTER CON VARIANT GHOST Y HOVER ROSE */}
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
            disabled={isDisabled}
            className={`text-[11px] font-black uppercase tracking-widest transition-all h-9 px-6 rounded-xl
              ${isDisabled 
                ? "text-slate-300 cursor-not-allowed" 
                : "text-[11px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 border border-transparent hover:border-rose-200 rounded-xl h-9 px-8 transition-all"}
            `}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                <span>Procesando...</span>
              </div>
            ) : (
              "Retornar cotización"
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
