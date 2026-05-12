import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/InputField";
import { UserSearch, Search, MousePointer2 } from "lucide-react";
import api from "@/services/api";

export default function TipoPersonalModal({ open, onClose, onSelect, areaSeleccionada }) {
  const [buscar, setBuscar] = useState("");
  const [registros, setRegistros] = useState([]);
  const [datosOriginales, setDatosOriginales] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==========================
  // CARGAR TIPOS DE PERSONAL
  // ==========================
    useEffect(() => {
        if (!open) return;

        const fetchTipoPersonal = async () => {
        setLoading(true);
        try {
            const res = await api.get("/cotizaciones/categorias/"); // endpoint original
            const data = Array.isArray(res.data) ? res.data : [];

            // Filtrar por área seleccionada si hay
            const filtradosPorArea = areaSeleccionada
            ? data.filter((r) => r.cod_area.toString() === areaSeleccionada.toString())
            : data;

            setRegistros(filtradosPorArea);
            setDatosOriginales(filtradosPorArea);
        } catch (error) {
            console.error("Error cargando tipos de personal", error);
            setRegistros([]);
            setDatosOriginales([]);
        } finally {
            setLoading(false);
        }
        };

        fetchTipoPersonal();
    }, [open, areaSeleccionada]);

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
  const handleSeleccionar = (registro, costo) => {
    onSelect(registro, costo);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-white rounded-2xl shadow-2xl border-none p-0 overflow-hidden font-sans">
        
        {/* HEADER MODERNO */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-[#0d767e] rounded-lg">
              <UserSearch size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Buscar Tipo Personal
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Seleccione el perfil y el rango de costo correspondiente
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
                  label="Ingrese dato:"
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Código o nombre del perfil..."
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

          {/* TABLA ESTILIZADA */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100/50 border-b border-slate-100">
                    <th className="px-4 py-3 text-left font-black text-slate-700 uppercase tracking-tighter w-24">Código</th>
                    <th className="px-4 py-3 text-left font-black text-slate-700 uppercase tracking-tighter">Nombre del Perfil</th>
                    <th className="px-4 py-3 text-center font-black text-[#0d767e] uppercase tracking-tighter">Costo Mín.</th>
                    <th className="px-4 py-3 text-center font-black text-[#0d767e] uppercase tracking-tighter">Costo Máx.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {registros.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10">
                        <div className="flex flex-col items-center opacity-40">
                          <UserSearch size={32} className="mb-2 text-slate-400" />
                          <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">
                            {loading ? "Cargando perfiles..." : "No se encontraron registros"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    registros.map((r) => (
                      <tr key={r.codigo} className="group hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-500">{r.codigo}</td>
                        <td className="px-4 py-2.5 font-black text-slate-700 uppercase">{r.nombre}</td>

                        {/* COSTO MIN */}
                        <td className="px-2 py-1 text-center">
                          <button
                            onClick={() => handleSeleccionar(r, r.cos_min)}
                            className="w-full py-1.5 px-3 rounded-lg font-black text-teal-700 hover:bg-teal-100 hover:shadow-sm border border-transparent hover:border-teal-200 transition-all flex items-center justify-center gap-1 group/btn"
                          >
                            {parseFloat(r.cos_min).toFixed(2)}
                            <MousePointer2 size={10} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                          </button>
                        </td>

                        {/* COSTO MAX */}
                        <td className="px-2 py-1 text-center">
                          <button
                            onClick={() => handleSeleccionar(r, r.cos_max)}
                            className="w-full py-1.5 px-3 rounded-lg font-black text-teal-700 hover:bg-teal-600 hover:text-white hover:shadow-md border border-transparent transition-all flex items-center justify-center gap-1 group/btn"
                          >
                            {parseFloat(r.cos_max).toFixed(2)}
                            <MousePointer2 size={10} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* INDICADOR DE AYUDA SUTIL */}
        <div className="px-6 py-2 bg-slate-50/50 border-t border-slate-100 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Haga clic en el monto deseado para seleccionar el perfil
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
}
