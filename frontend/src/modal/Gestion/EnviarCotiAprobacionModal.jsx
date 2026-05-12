import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Send, TriangleAlert, X, ShieldCheck } from "lucide-react";

export default function EnviarCotiAprobacionModal({
  open,
  onClose,
  onAceptar,
  loading = false,
}) {

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-white rounded-2xl shadow-2xl border-none p-0 overflow-hidden font-sans">
        
        {/* HEADER IDENTICO AL RESTO DEL MODULO GESTIÓN */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Send size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Flujo de Aprobación
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Envío de propuesta a revisión
              </p>
            </div>
          </div>
        </div>

        {/* CUERPO - PANEL CENTRAL */}
        <div className="p-2">
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 shadow-inner flex gap-4">
            
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-indigo-100 text-indigo-500 shadow-sm shrink-0">
              <TriangleAlert size={24} />
            </div>

            <div className="space-y-2">
              <p className="text-[12px] font-black text-slate-800 leading-tight uppercase tracking-tight">
                ¿Desea enviar esta cotización para revisión?
              </p>
              <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                Una vez enviada llegará el encargado para su aprobación.
              </p>
            </div>

          </div>
        </div>

        {/* FOOTER CON VARIANT GHOST */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-[11px] font-black uppercase tracking-widest text-red-700 hover:bg-red-100 border border-transparent hover:border-red-200 rounded-xl h-9 px-8 transition-all"
          >
            Cancelar
          </Button>
          
          <Button
            variant="ghost"
            onClick={onAceptar}
            disabled={loading}
            className="text-[11px] font-black uppercase tracking-widest text-indigo-700 hover:bg-indigo-100 border border-transparent hover:border-indigo-200 rounded-xl h-9 px-8 transition-all"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Enviando...</span>
              </div>
            ) : (
              "Confirmar Envío"
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
