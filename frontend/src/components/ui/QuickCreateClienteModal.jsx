import React, { useState } from "react";
import { X, Save } from "lucide-react";
import SelectField from "./SelectField";
// Asumiendo que usas un componente Dialog de tu UI library o un div fixed centrado
export default function QuickCreateClienteModal({ open, onClose, onSave }) {
  const [formData, setFormData] = useState({
    codigo: "", ruc: "", nombre: "", iniciales: "", tipo: "Cliente",
    direccion: "", ubicacion: "", pagina_web: "", forma_pago: "",
    fecha_registro: new Date().toISOString().split('T')[0], activo: true
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* HEADER COMPACTO */}
        <div className="flex justify-between items-center px-4 py-3 border-b bg-slate-50">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-700">Registro Rápido de Empresa</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full"><X size={14} /></button>
        </div>

        {/* CUERPO EN GRID */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="col-span-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Código</label>
            <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} /></div>
          <div className="col-span-1"><label className="text-[9px] font-bold text-slate-500 uppercase">RUC</label>
            <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} /></div>
          
          <div className="col-span-2"><label className="text-[9px] font-bold text-slate-500 uppercase">Nombre / Razón Social</label>
            <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} /></div>

          <div className="col-span-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Iniciales</label>
            <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.iniciales} onChange={e => setFormData({...formData, iniciales: e.target.value})} /></div>
          <div className="col-span-1">
            <SelectField
              label="Tipo"
              value={formData.tipo}
              onChange={e => setFormData({...formData, tipo: e.target.value})}
              options={[
                { id: "Cliente", nombre: "Cliente" },
                { id: "Proveedor", nombre: "Proveedor" }
              ]}
              className="mt-0.5 [&_label]:text-[9px] [&_label]:font-bold [&_label]:text-slate-500 [&_label]:uppercase [&_label]:ml-0 [&_div]:py-1 [&_div]:rounded-lg [&_div]:px-2.5"
            />
          </div>

          <div className="col-span-2"><label className="text-[9px] font-bold text-slate-500 uppercase">Dirección</label>
            <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} /></div>

          <div className="col-span-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Ubicación</label>
            <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} /></div>
          <div className="col-span-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Página Web</label>
            <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.pagina_web} onChange={e => setFormData({...formData, pagina_web: e.target.value})} /></div>

          <div className="col-span-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Forma Pago</label>
            <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.forma_pago} onChange={e => setFormData({...formData, forma_pago: e.target.value})} /></div>
          <div className="col-span-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Fecha Reg.</label>
            <input type="date" className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.fecha_registro} onChange={e => setFormData({...formData, fecha_registro: e.target.value})} /></div>
            
          <div className="col-span-2 flex items-center gap-2 mt-1">
             <input type="checkbox" checked={formData.activo} onChange={e => setFormData({...formData, activo: e.target.checked})} />
             <label className="text-[10px] font-bold text-slate-600 uppercase">Cliente Activo</label>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-3 border-t flex justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button onClick={() => onSave(formData)} className="px-3 py-1.5 text-[10px] font-bold text-white bg-teal-600 uppercase hover:bg-teal-700 rounded-lg flex items-center gap-1.5">
                <Save size={12} /> Guardar
            </button>
        </div>
      </div>
    </div>
  );
}