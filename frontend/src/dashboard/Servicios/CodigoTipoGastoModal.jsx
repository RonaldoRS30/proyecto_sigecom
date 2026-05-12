import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchCode, Search, MousePointerClick, X } from "lucide-react";
import InputField from "@/components/ui/InputField";
import api from "@/services/api";

export default function CodigoTipoGastoModal({ open, onClose, onSelect }) {
  const [buscar, setBuscar] = useState("");
  const [registros, setRegistros] = useState([]);
  const [datosOriginales, setDatosOriginales] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==========================
  // CARGAR TIPOS DE GASTO
  // ==========================
  useEffect(() => {
    if (!open) return;

    const fetchTiposGasto = async () => {
      setLoading(true);
      try {
        const res = await api.get("/cotizaciones/tgasto_d/");
        const data = Array.isArray(res.data) ? res.data : [];
        setRegistros(data);
        setDatosOriginales(data);
      } catch (error) {
        console.error("Error cargando tipos de gasto", error);
        setRegistros([]);
        setDatosOriginales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTiposGasto();
  }, [open]);

  // ==========================
  // FILTRO EN TIEMPO REAL
  // ==========================
  useEffect(() => {
    if (!buscar.trim()) {
      setRegistros(datosOriginales);
      return;
    }

    const texto = buscar.toLowerCase();

    const filtrados = datosOriginales.filter(
      (r) =>
        r.codigo?.toLowerCase().includes(texto) ||
        r.nombre?.toLowerCase().includes(texto)
    );

    setRegistros(filtrados);
  }, [buscar, datosOriginales]);

  // ==========================
  // SELECCIONAR REGISTRO
  // ==========================
  const handleSeleccionar = (r) => {
    onSelect(r);
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
              <SearchCode size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Buscar Código Tipo Gasto
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Selección de categorías para gastos y servicios
              </p>
            </div>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="p-2">
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 shadow-inner mb-2">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <InputField
                  inline
                  size="sm"
                  label="Buscar:"
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Escriba código o nombre..."
                  className="text-xs font-semibold focus:ring-teal-500/20 bg-white"
                  trailingIcon={<Search size={14} className="text-slate-400" />}
                />
              </div>

              <Button
                variant="ghost"
                onClick={onClose}
                className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-red-700 hover:bg-red-100 rounded-xl transition-all"
              >
                Salir
              </Button>
            </div>
          </div>

          {/* TABLA DE RESULTADOS */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-[11px] border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-black text-slate-700 uppercase tracking-tighter w-32">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left font-black text-slate-700 uppercase tracking-tighter">
                      Nombre del Gasto
                    </th>
                    <th className="w-10 bg-slate-100"></th> {/* Espacio para el icono de acción */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="text-center py-10">
                        <div className="flex flex-col items-center opacity-40">
                          <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
                          <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Cargando registros...</span>
                        </div>
                      </td>
                    </tr>
                  ) : registros.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-10 opacity-40">
                         <span className="font-bold text-slate-500 uppercase tracking-widest text-[9px]">No se encontraron resultados</span>
                      </td>
                    </tr>
                  ) : (
                    registros.map((r) => (
                      <tr
                        key={r.codigo}
                        onClick={() => handleSeleccionar(r)}
                        className="group cursor-pointer hover:bg-teal-50/50 transition-all duration-200"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-600 tracking-tight">
                          {r.codigo}
                        </td>
                        <td className="px-4 py-3 font-black text-slate-700 uppercase leading-tight">
                          {r.nombre}
                        </td>
                        <td className="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <MousePointerClick size={14} className="text-teal-600" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER / TIP */}
        <div className="px-6 py-2 bg-slate-50/50 border-t border-slate-100 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Seleccione una fila para asignar el código al registro
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
}
