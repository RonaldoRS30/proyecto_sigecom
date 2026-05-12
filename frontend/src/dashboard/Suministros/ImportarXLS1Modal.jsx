import React, { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import importarXlsImg from "@/assets/importar-xls.png";
import importarXlsGif from "@/assets/importar-xls.gif";
import plantillaXLS from "@/assets/PlantillasXLS/Plantilla001.xls";
import * as XLSX from "xlsx";
import { FileUp } from "lucide-react";

export default function ImportarXLS1Modal({ open, onClose, onSelectFile }) {
  const fileInputRef = useRef(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const handleDescargarPlantilla = () => {
    const link = document.createElement("a");
    link.href = plantillaXLS;
    link.download = "Plantilla_Suministros_001.xls";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportarExcel = (file) => {
    if (!(file instanceof File)) {
      console.error("❌ No es un archivo válido", file);
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target.result;

      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      console.log("📥 Filas crudas desde Excel:", rows);

      onSelectFile?.(rows); // 🔥 SOLO DATOS, no File
      onClose();
    };

    // ✅ USAR ESTO (más moderno y estable)
    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (!open) {
      setArchivoSeleccionado(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl border-none p-0 overflow-hidden font-sans">
        
        {/* HEADER MODERNO */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-[#0d767e] rounded-lg">
              <FileUp size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Importar Datos
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Carga masiva desde archivo Excel
              </p>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL (p-2 para consistencia) */}
        <div className="p-2">
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 shadow-inner">
            
            <div className="grid grid-cols-2 gap-6 items-center">
              
              {/* IMAGEN / ESTADO DE CARGA */}
              <div className="flex flex-col items-center justify-center bg-white rounded-xl p-2 border border-slate-200 shadow-sm group">
                <img
                  src={archivoSeleccionado ? importarXlsGif : importarXlsImg}
                  alt="Importar XLS"
                  className={`
                    max-h-32 object-contain transition-all duration-300
                    ${!archivoSeleccionado ? "cursor-pointer group-hover:scale-110" : "scale-95"}
                  `}
                  onClick={() => {
                    if (!archivoSeleccionado) handleDescargarPlantilla();
                  }}
                />
                {!archivoSeleccionado && (
                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-2">Descargar Plantilla</span>
                )}
              </div>

              {/* INPUT OCULTO */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setArchivoSeleccionado(file);
                  handleImportarExcel(file);
                }}
              />

              {/* COLUMNA DE BOTONES */}
              <div className="flex flex-col gap-3">
                <Button
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-black uppercase tracking-widest text-cyan-700 bg-cyan-50/50 hover:bg-cyan-100 border border-cyan-200 rounded-xl py-6 transition-all shadow-sm"
                >
                  Seleccionar
                  <br /> Archivo
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  Salir
                </Button>
              </div>

            </div>

            {/* INDICADOR DE ARCHIVO SELECCIONADO */}
            {archivoSeleccionado && (
              <div className="mt-4 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 truncate uppercase tracking-tight">
                  Cargando: {archivoSeleccionado.name}
                </span>
              </div>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
