import React from "react";

export default function ClienteFormFields({ formData, setFormData }) {
  // Función helper para no repetir la lógica de actualización
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Código */}
      <div className="col-span-1">
        <label className="text-[9px] font-bold text-slate-500 uppercase">Código</label>
        <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.codigo} onChange={e => updateField('codigo', e.target.value)} />
      </div>
      {/* RUC */}
      <div className="col-span-1">
        <label className="text-[9px] font-bold text-slate-500 uppercase">RUC</label>
        <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.ruc} onChange={e => updateField('ruc', e.target.value)} />
      </div>
      
      {/* Nombre */}
      <div className="col-span-2">
        <label className="text-[9px] font-bold text-slate-500 uppercase">Nombre / Razón Social</label>
        <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.nombre} onChange={e => updateField('nombre', e.target.value)} />
      </div>

      {/* Iniciales y Tipo */}
      <div className="col-span-1">
        <label className="text-[9px] font-bold text-slate-500 uppercase">Iniciales</label>
        <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.iniciales} onChange={e => updateField('iniciales', e.target.value)} />
      </div>
      <div className="col-span-1">
        <label className="text-[9px] font-bold text-slate-500 uppercase">Tipo</label>
        <select className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.tipo} onChange={e => updateField('tipo', e.target.value)}>
          <option value="Cliente">Cliente</option>
          <option value="Proveedor">Proveedor</option>
        </select>
      </div>

      {/* Dirección */}
      <div className="col-span-2">
        <label className="text-[9px] font-bold text-slate-500 uppercase">Dirección</label>
        <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.direccion} onChange={e => updateField('direccion', e.target.value)} />
      </div>

      {/* Ubicación y Web */}
      <div className="col-span-1">
        <label className="text-[9px] font-bold text-slate-500 uppercase">Ubicación</label>
        <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.ubicacion} onChange={e => updateField('ubicacion', e.target.value)} />
      </div>
      <div className="col-span-1">
        <label className="text-[9px] font-bold text-slate-500 uppercase">Página Web</label>
        <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.pagina_web} onChange={e => updateField('pagina_web', e.target.value)} />
      </div>

      {/* Forma Pago y Fecha */}
      <div className="col-span-1">
        <label className="text-[9px] font-bold text-slate-500 uppercase">Forma Pago</label>
        <input className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.forma_pago} onChange={e => updateField('forma_pago', e.target.value)} />
      </div>
      <div className="col-span-1">
        <label className="text-[9px] font-bold text-slate-500 uppercase">Fecha Reg.</label>
        <input type="date" className="w-full border rounded text-xs p-1.5 mt-0.5" value={formData.fecha_registro} onChange={e => updateField('fecha_registro', e.target.value)} />
      </div>
      
      {/* Activo */}
      <div className="col-span-2 flex items-center gap-2 mt-1">
        <input type="checkbox" checked={formData.activo} onChange={e => updateField('activo', e.target.checked)} />
        <label className="text-[10px] font-bold text-slate-600 uppercase">
          {formData.activo ? "Cliente Activo" : "Cliente Inactivo"}
        </label>
      </div>
    </div>
  );
}