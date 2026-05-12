import React, { useEffect, useState } from "react";
import api from "@/services/api";
import SelectField from "../../components/ui/SelectField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Receipt, Wallet, Calculator, ChevronsRight } from "lucide-react";
import InputField from "../../components/ui/InputField";
import CodigoTipoGastoModal from "./CodigoTipoGastoModal";

function RegistroItemGastosServicioModal({ open, onClose, onConfirm, item }) { // <-- agregamos item
  const [areas, setAreas] = useState([]); // opcional
  const [form, setForm] = useState({
    codigoTipoGasto: "",
    concepto: "",
    hombres: 1,
    dias: 1,
    precio: 0,
    total: 0,
  });
  const [codigoTipoGastoOpen, setCodigoTipoGastoOpen] = useState(false);
  const toNumber = v => Number(v) || 0;

  // ==========================
  // RESET / CARGAR DATOS EXISTENTES
  // ==========================
  useEffect(() => {
    if (!open) return;

    if (item) {
      // ✏️ MODO EDICIÓN
      setForm({
        id: item.id ?? item.num,   // opcional, solo referencia visual
        num: item.num,             // 🔴 ESTA ES LA CLAVE REAL
        codigoTipoGasto: item.cod || "",
        concepto: item.des || "",
        hombres: item.can ?? 1,
        dias: item.tde ?? 1,
        precio: item.puc ?? 0,
        total: item.tot ?? 0,
      });
    } else {
      // ➕ MODO NUEVO
      setForm({
        codigoTipoGasto: "",
        concepto: "",
        hombres: 1,
        dias: 1,
        precio: 0,
        total: 0,
      });
    }
  }, [open, item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ==========================
  // CÁLCULO AUTOMÁTICO DEL TOTAL
  // ==========================
  useEffect(() => {
    const hombres = Number(form.hombres) || 0;
    const dias = Number(form.dias) || 0;
    const precio = Number(form.precio) || 0;
    const total = (hombres * dias * precio).toFixed(2);
    setForm(prev => ({ ...prev, total }));
  }, [form.hombres, form.dias, form.precio]);

  const handleSubmit = () => {
    if (!form.codigoTipoGasto || !form.concepto.trim()) return;
    onConfirm(form);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-white rounded-2xl shadow-2xl border-none p-0 overflow-hidden font-sans">
        
        {/* HEADER MODERNO */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-[#0d767e] rounded-lg">
              <Receipt size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Registro Item - Gastos de Servicios
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Control de viáticos, servicios y gastos operativos
              </p>
            </div>
          </div>
        </div>

        {/* CONTENIDO FORMULARIO */}
        <div className="p-2 space-y-2">
          
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4 shadow-inner">
            <div className="flex items-center gap-2">
              <Wallet size={14} className="text-teal-600" />
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Detalle del Gasto</span>
            </div>

            {/* CÓDIGO TIPO GASTO */}
            <InputField
              inline
              size="sm"
              label="Tipo Gasto:"
              name="codigoTipoGasto"
              value={form.codigoTipoGasto}
              onChange={handleChange}
              className="text-xs font-semibold focus:ring-teal-500/20"
              trailingIcon={
                <button
                  type="button"
                  className="ml-1 text-[#0d767e] hover:scale-110 transition-transform"
                  onClick={() => setCodigoTipoGastoOpen(true)}
                >
                  <ChevronsRight size={16} />
                </button>
              }
            />

            {/* CONCEPTO */}
            <div className="flex items-start gap-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase min-w-[85px] pt-1">
                Concepto:
              </label>
              <textarea
                name="concepto"
                value={form.concepto}
                onChange={handleChange}
                rows={2}
                className="w-full text-xs font-semibold border border-slate-200 rounded-xl px-2 py-1.5 resize-none min-h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all bg-white"
                placeholder="Ingrese concepto del gasto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputField
                inline
                size="sm"
                type="number"
                label="Cantidad Hombres:"
                name="hombres"
                value={form.hombres}
                onChange={handleChange}
                className="text-xs font-bold focus:ring-teal-500/20"
              />
              <InputField
                inline
                size="sm"
                type="number"
                label="Días:"
                name="dias"
                value={form.dias}
                onChange={handleChange}
                className="text-xs font-bold focus:ring-teal-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
              <InputField
                inline
                size="sm"
                type="number"
                label="Precio Unitario:"
                name="precio"
                value={form.precio}
                onChange={handleChange}
                className="text-xs font-bold focus:ring-teal-500/20"
              />
              <div className="flex items-center gap-2 bg-[#0d767e]/5 px-3 py-1 rounded-xl border border-[#0d767e]/10 shadow-inner">
                 <span className="text-[10px] font-black text-[#0d767e] uppercase">Total:</span>
                 <span className="text-sm font-black text-[#0d767e] ml-auto">
                    {Number(form.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                 </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-red-700 hover:bg-red-100 rounded-xl transition-all"
          >
            Salir
          </Button>
          <Button
            variant="ghost"
            onClick={handleSubmit}
            className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-teal-700 hover:bg-teal-100 rounded-xl transition-all"
          >
            Aceptar
          </Button>
        </div>

        {/* MODAL TIPO GASTO (Lógica intacta) */}
        <CodigoTipoGastoModal
          open={codigoTipoGastoOpen}
          onClose={() => setCodigoTipoGastoOpen(false)}
          onSelect={(registro) =>
            setForm(prev => ({
              ...prev,
              codigoTipoGasto: registro.codigo,
              concepto: registro.nombre,
            }))
          }
        />
      </DialogContent>
    </Dialog>
  );
}

export default RegistroItemGastosServicioModal;
