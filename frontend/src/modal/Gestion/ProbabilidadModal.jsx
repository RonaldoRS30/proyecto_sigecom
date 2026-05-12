import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { Target, TrendingUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import muyAltoImg from "@/assets/probabilidad/muyAlto.png";
import altoImg from "@/assets/probabilidad/alto.png";
import medioImg from "@/assets/probabilidad/medio.png";
import bajoImg from "@/assets/probabilidad/bajo.png";

const PROBABILIDAD_MAP = {
  3: {
    label: "Muy Alto",
    img: muyAltoImg,
    color: "bg-green-500",
  },
  2: {
    label: "Alto",
    img: altoImg,
    color: "bg-sky-500",
  },
  1: {
    label: "Medio",
    img: medioImg,
    color: "bg-yellow-500",
  },
  0: {
    label: "Bajo",
    img: bajoImg,
    color: "bg-red-500",
  },
};

const OPCIONES = [
  { label: "Muy Alto", value: "3", color: "bg-green-500" },
  { label: "Alto", value: "2", color: "bg-sky-500" },
  { label: "Medio", value: "1", color: "bg-yellow-500" },
  { label: "Bajo", value: "0", color: "bg-red-500" },
];

const IMAGEN_PROBABILIDAD = {
  muy_alto: muyAltoImg,
  alto: altoImg,
  medio: medioImg,
  bajo: bajoImg,
};

export default function ProbabilidadModal({ open, onClose, probActual, num_reg, onGuardar }) {
    const [selected, setSelected] = useState(
    probActual !== null && probActual !== undefined
        ? Number(probActual)
        : null
    );

    const handleGuardar = async () => {
    if (selected === null || !num_reg) return;

    try {
        const token = localStorage.getItem("access_token");

        if (!token) {
        alert("Sesión expirada. Vuelve a iniciar sesión.");
        return;
        }

        await axios.post(
        "/api/cotizaciones/guardar/",
        {
            num_reg,
            prob: selected, // 👈 este campo ya existe en tu modelo
        },
        {
            headers: {
            Authorization: `Bearer ${token}`,
            },
        }
        );

        // callback opcional para refrescar data en el padre
        if (onGuardar) onGuardar(selected);

        onClose();

    } catch (err) {
        console.error("Error guardando probabilidad", err);
        alert("No se pudo guardar la probabilidad");
    }
    };

    useEffect(() => {
    if (open) {
        setSelected(
        probActual !== null && probActual !== undefined
            ? Number(probActual)
            : null
        );
    }
    }, [open, probActual]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-2xl shadow-2xl border-none p-0 overflow-hidden font-sans">
        
        {/* HEADER IDENTICO (Paleta Teal) */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
              <Target size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Probabilidad de Cierre
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Pronóstico y expectativas de éxito comercial
              </p>
            </div>
          </div>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-6">

            {/* PANEL VISUAL (PREVIEW) */}
            <div className="relative flex items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-inner p-6 min-h-[280px]">
              {selected !== null ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <img
                    src={PROBABILIDAD_MAP[selected].img}
                    alt="Indicador"
                    className="max-h-56 object-contain drop-shadow-xl"
                  />
                  <div className="absolute bottom-4 inset-x-0 text-center">
                     <span className="px-3 py-1 rounded-full bg-teal-600 text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-teal-200">
                        Nivel {selected}%
                     </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-300">
                  <TrendingUp size={48} strokeWidth={1} />
                  <span className="text-[11px] font-bold uppercase tracking-tighter">
                    Seleccione una opción
                  </span>
                </div>
              )}
            </div>

            {/* PANEL DE OPCIONES */}
            <div className="flex flex-col justify-center gap-2.5">
              <div className="flex items-center gap-2 mb-2 px-1">
                <Info size={14} className="text-teal-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opciones Disponibles</span>
              </div>

              {Object.entries(PROBABILIDAD_MAP).map(([value, op]) => {
                const activo = selected === Number(value);
                return (
                  <button
                    key={value}
                    onClick={() => setSelected(Number(value))}
                    className={`
                      w-full px-4 py-3 rounded-xl border text-left transition-all duration-200
                      ${activo 
                        ? "bg-white border-teal-500 shadow-md shadow-teal-100 translate-x-1" 
                        : "bg-slate-50/50 border-slate-100 hover:border-slate-300 hover:bg-white text-slate-500"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black uppercase tracking-tight ${activo ? "text-teal-700" : "text-slate-600"}`}>
                        {op.label}
                      </span>
                      {activo && (
                        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* FOOTER PREMIUM */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[11px] font-black uppercase tracking-widest text-red-700 hover:bg-red-100 border border-transparent hover:border-red-200 rounded-xl h-9 px-8 transition-all"
          >
            Cancelar
          </Button>

          <Button
            disabled={selected === null}
            onClick={handleGuardar}
            variant="ghost"
            className="text-[11px] font-black uppercase tracking-widest text-teal-700 hover:bg-teal-50 border border-transparent hover:border-teal-200 rounded-xl h-9 px-8 transition-all"
          >
            Guardar Probabilidad
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
