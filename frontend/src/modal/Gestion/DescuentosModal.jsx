import { useState, useEffect } from "react";
import api from "@/services/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InputField from "../../components/ui/InputField";
import SelectField from "../../components/ui/SelectField";
import { Percent, Info, RotateCcw, Calculator, Tag, TrendingUp  } from "lucide-react";

export default function DescuentosModal({ open, onClose, onGuardar, onReset, num_reg }) {
  const [aplicar, setAplicar] = useState(false);
  const [afecto, setAfecto] = useState("t");
  const [porcentaje, setPorcentaje] = useState("");
  const [importe, setImporte] = useState("");
  const [totales, setTotales] = useState({ total: 0, suministros: 0, servicios: 0, des_m: 0 });
  const [loadingTotales, setLoadingTotales] = useState(false);
  const [error, setError] = useState("");

  // Carga datos iniciales al abrir el modal
  useEffect(() => {
    if (!open || !num_reg) return;

    const fetchDatos = async () => {
      setAplicar(false);
      setAfecto("t");
      setPorcentaje("");
      setImporte("");
      setError("");

      try {
        const res = await api.get(`/cotizaciones/${num_reg}/descuento/`);
        setAplicar(res.data.aplicar ?? false);
        setAfecto(res.data.afecto ?? "t");
        setPorcentaje(res.data.porcentaje ?? "");
        setImporte(res.data.importe ?? "");
      } catch {
        console.warn("⚠️ No hay descuento guardado aún");
      }

      setLoadingTotales(true);
      try {
        const resTot = await api.get(`/cotizaciones/${num_reg}/totales-descuento/`);
        setTotales(resTot.data);
      } finally {
        setLoadingTotales(false);
      }
    };

    fetchDatos();
  }, [open, num_reg]);

  const getBaseAfecta = () => {
    if (afecto === "t") return totales.total;
    if (afecto === "su") return totales.suministros;
    if (afecto === "ser") return totales.servicios;
    return 0;
  };

  const handleImporteChange = (value) => {
    const base = getBaseAfecta();
    setImporte(value);
    if (!base || !value) {
      setPorcentaje("");
      setError("");
      return;
    }
    const valNum = Number(value);
    if (valNum > base) setError("El importe no puede superar el total base");
    else setError("");
    setPorcentaje(((valNum / base) * 100).toFixed(2));
  };

  const handlePorcentajeChange = (value) => {
    const base = getBaseAfecta();
    setPorcentaje(value);
    if (!base || !value) {
      setImporte("");
      setError("");
      return;
    }
    const valNum = Number(value);
    if (valNum > 100) setError("El porcentaje no puede superar 100%");
    else setError("");
    setImporte(((base * valNum) / 100).toFixed(2));
  };

  useEffect(() => {
    if (!importe && !porcentaje) return;
    if (importe) handleImporteChange(importe);
    else if (porcentaje) handlePorcentajeChange(porcentaje);
  }, [afecto]);

  const handleAceptar = () => {
    if (error) return;
    if (onGuardar) onGuardar({ aplicar, afecto, porcentaje, importe });
    onClose();
  };

  const totalOriginal = (Number(totales.total || 0) + Number(totales.des_m || 0));
  const totalConDescuento = totalOriginal - Number(importe || 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-2xl shadow-2xl border-none p-0 overflow-hidden font-sans">
        
        {/* HEADER IDENTICO AL SISTEMA */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-[#0d767e] rounded-lg">
              <Percent size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Registrar Descuento
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Ajustes comerciales y promociones sobre la base
              </p>
            </div>
          </div>
        </div>

        {/* CONTENIDO (p-2 para mantener el aire entre paneles) */}
        <div className="p-2 space-y-2">
          
          {/* SECCIÓN 1: CONFIGURACIÓN (Panel superior) */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-4 shadow-inner">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-teal-600" />
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Configuración del Descuento</span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Columna Izquierda: Aplicación y Afecto */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 py-1">
                   <label className="text-[11px] font-bold text-slate-500 uppercase min-w-[110px]">
                    Aplicar Descuento:
                  </label>
                  <input
                    type="checkbox"
                    checked={aplicar}
                    onChange={(e) => setAplicar(e.target.checked)}
                    className="w-5 h-5 text-[#0d767e] border-slate-300 rounded-lg focus:ring-teal-500/20 transition-all cursor-pointer"
                  />
                </div>

                <SelectField
                  inline size="sm" label="Afecto a:" 
                  value={afecto} 
                  onChange={(e) => setAfecto(e.target.value)}
                  options={[
                    { value: 't', label: 'TOTAL GENERAL' },
                    { value: 'su', label: 'SUMINISTROS' },
                    { value: 'ser', label: 'SERVICIOS' }
                  ]}
                  className="text-xs font-semibold focus:ring-teal-500/20"
                />
              </div>

              {/* Columna Derecha: Valores numéricos */}
              <div className="space-y-3">
                <InputField
                  inline size="sm" type="number" label="Porcentaje:" 
                  value={porcentaje} onChange={(e) => handlePorcentajeChange(e.target.value)}
                  trailingIcon={<span className="text-[11px] font-bold text-slate-600 mr-2">%</span>}
                  className="font-mono font-bold text-slate-800"
                />
                <InputField
                  inline size="sm" type="number" label="Importe:" 
                  value={importe} onChange={(e) => handleImporteChange(e.target.value)}
                  trailingIcon={<span className="text-[11px] font-bold text-slate-600 mr-2">$</span>}
                  className="font-mono font-bold text-slate-800"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-[9px] font-black uppercase tracking-tighter bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>}
          </div>

          {/* SECCIÓN 2: DASHBOARD (Panel inferior - Dos columnas) */}
          <div className="grid grid-cols-2 gap-2">
            
            {/* Resumen de Base (Estilo estándar) */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 shadow-inner">
              <div className="flex items-center gap-2">
                <Calculator size={14} className="text-teal-600" />
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">Base de Cálculo</span>
              </div>
              <div className="space-y-1">
                <InputField inline size="sm" label="Total Original:" value={totalOriginal.toLocaleString(undefined, { minimumFractionDigits: 2 })} readOnly className="bg-transparent border-none text-[11px] font-bold" />
                <InputField inline size="sm" label="Suministros:" value={Number(totales.suministros).toLocaleString(undefined, { minimumFractionDigits: 2 })} readOnly className="bg-transparent border-none text-[11px]" />
                <InputField inline size="sm" label="Servicios:" value={Number(totales.servicios).toLocaleString(undefined, { minimumFractionDigits: 2 })} readOnly className="bg-transparent border-none text-[11px]" />
              </div>
            </div>

            {/* Resultado Final (Estilo Teal destacado) */}
            <div className={`rounded-2xl p-4 space-y-3 shadow-inner transition-all duration-300 ${aplicar ? 'bg-[#0d767e]/5 border border-[#0d767e]/20' : 'bg-slate-100/50 border border-slate-200 opacity-50'}`}>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-[#0d767e]" />
                <span className="text-[11px] font-black text-[#0d767e] uppercase tracking-tight">Cálculo de Salida</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Descuento:</span>
                  <span className="text-[11px] font-black text-red-600 italic">
                    {aplicar ? `- ${Number(importe || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '0.00'}
                  </span>
                </div>
                <div className="pt-2 mt-2 border-t border-[#0d767e]/10">
                   <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-[#0d767e] uppercase">Total Aplicado:</span>
                    <span className="text-sm font-black text-[#0d767e] font-mono">
                      {totalConDescuento.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER CON VARIANT GHOST */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={onReset}
            className="group flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-cyan-600 uppercase tracking-widest transition-all"
          >
            <RotateCcw size={14} className="group-hover:rotate-[-45deg] transition-transform" />
            Limpiar Datos
          </button>

          <div className="flex gap-3">
            <Button
              variant="ghost" onClick={onClose}
              className="text-[11px] font-black uppercase tracking-widest text-red-700 hover:bg-red-100 border border-transparent hover:border-red-200 rounded-xl h-9 px-8 transition-all"
            >
              Salir
            </Button>
            <Button
              variant="ghost" onClick={handleAceptar}
                className="text-[11px] font-black uppercase tracking-widest text-teal-700 hover:bg-teal-100 border border-transparent hover:border-teal-200 rounded-xl h-9 px-8 transition-all"
            >
              Aceptar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
