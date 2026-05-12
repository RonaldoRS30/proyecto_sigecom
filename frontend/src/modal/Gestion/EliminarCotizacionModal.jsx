import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Trash2, TriangleAlert, Lock, XCircle } from "lucide-react";

export default function EliminarCotizacionModal({
  open,
  onClose,
  onAceptar,
  loading = false,
  cotin,
}) {
  const bloqueado = Boolean(cotin);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm bg-white rounded-2xl shadow-2xl border-none p-0 overflow-hidden font-sans">
        
        {/* HEADER IDENTICO AL SISTEMA GESTIÓN */}
        <div className={`px-6 py-4 border-b border-slate-100 ${bloqueado ? 'bg-slate-50/80' : 'bg-rose-50/30'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bloqueado ? 'bg-slate-200 text-slate-600' : 'bg-rose-100 text-rose-700'}`}>
              {bloqueado ? <Lock size={20} strokeWidth={2.5} /> : <Trash2 size={20} strokeWidth={2.5} />}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                {bloqueado ? "Acción Restringida" : "Eliminar Cotización"}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {bloqueado ? "El registro no puede ser alterado" : "Gestión de borrado permanente"}
              </p>
            </div>
          </div>
        </div>

        {/* CUERPO - PANEL CENTRAL (p-2 externo, p-5 interno) */}
        <div className="p-2">
          <div className={`border rounded-2xl p-5 shadow-inner flex gap-4 transition-colors ${bloqueado ? 'bg-slate-50/50 border-slate-100' : 'bg-rose-50/20 border-rose-100'}`}>
            
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm shrink-0 border ${bloqueado ? 'border-slate-200 text-slate-400' : 'border-rose-100 text-rose-500'}`}>
              {bloqueado ? <Lock size={24} /> : <TriangleAlert size={24} />}
            </div>

            <div className="space-y-2">
              <p className={`text-[12px] font-black leading-tight uppercase tracking-tight ${bloqueado ? 'text-slate-600' : 'text-slate-800'}`}>
                {bloqueado ? "Esta cotización está protegida" : "¿Confirmar eliminación permanente?"}
              </p>
              
              <div className="flex items-start gap-1.5">
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                  {bloqueado 
                    ? "Existen versiones activas o registros asociados que impiden el borrado de este documento."
                    : "Esta acción es irreversible. Se perderán todos los datos y el historial asociado a este registro."}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER CON VARIANT GHOST */}
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
            disabled={loading || bloqueado}
            className={`text-[11px] font-black uppercase tracking-widest transition-all h-9 px-6 rounded-xl
              ${bloqueado 
                ? "text-slate-400 bg-slate-100 cursor-not-allowed border-none" 
                : "text-[11px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 border border-transparent hover:border-rose-200 rounded-xl h-9 px-8 transition-all"}
            `}
          >
            {bloqueado ? (
              <div className="flex items-center gap-2">
                <Lock size={14} />
                <span>Bloqueado</span>
              </div>
            ) : loading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                <span>Eliminando...</span>
              </div>
            ) : (
              "Eliminar Registro"
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
