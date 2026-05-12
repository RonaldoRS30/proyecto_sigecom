import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/InputField";
import { LayoutGrid, Save, X } from "lucide-react";

export default function AreaModal({ open, onClose, onGuardar, areaData }) {
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    responsable: "",
    telefono: "",
    correlativo: "",
    activo: true,
  });

  useEffect(() => {
    if (areaData) {
      setFormData({
        codigo: areaData.codigo !== undefined && areaData.codigo !== null 
              ? String(areaData.codigo) 
              : "",
        nombre: areaData.nombre ?? "",
        responsable: areaData.responsable ?? "",
        telefono: areaData.telefono ?? "",
        correlativo: (areaData.correlativo ?? "").toString().padStart(3, '0'),
        activo: areaData.activo ?? true,
      });
    } else {
      setFormData({
        codigo: "Auto",
        nombre: "",
        responsable: "",
        telefono: "",
        correlativo: "001",
        activo: true,
      });
    }
  }, [open, areaData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    onGuardar(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl border-none p-0 overflow-hidden font-sans">
        
        {/* HEADER LIMPIO */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 text-cyan-700 rounded-lg">
              <LayoutGrid size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                {areaData ? "Editar Área" : "Nueva Área Maestría"}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Información del departamento
              </p>
            </div>
          </div>
        </div>

        {/* CUERPO - UNA SOLA COLUMNA */}
        <div className="p-6">
          <div className="space-y-4">
            
            <InputField
              label="Código:"
              name="codigo"
              value={formData.codigo}
              readOnly
              inline
              size="sm"
              className="bg-transparent border-none font-mono font-bold text-slate-500"
            />

            <InputField
              label="Nombre:"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Nombre del área..."
              inline
              size="sm"
              className="font-bold text-slate-800"
            />

            <InputField
              label="Responsable:"
              name="responsable"
              value={formData.responsable}
              onChange={handleChange}
              placeholder="Nombre del encargado..."
              inline
              size="sm"
              className="font-semibold text-slate-700"
            />

            <InputField
              label="Correlativo:"
              name="correlativo"
              value={formData.correlativo}
              onChange={handleChange}
              inline
              size="sm"
              className="font-mono font-bold text-slate-700"
            />

            <div className="flex items-center gap-4 py-2 px-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase min-w-[100px]">
                Estado:
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                <span className={`ml-2 text-[10px] font-black uppercase ${formData.activo ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {formData.activo ? 'Activo' : 'Inactivo'}
                </span>
              </label>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleSubmit}
            className="text-[10px] font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl h-9 px-8 shadow-lg shadow-cyan-100 transition-all flex items-center gap-2"
          >
            <Save size={14} />
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}