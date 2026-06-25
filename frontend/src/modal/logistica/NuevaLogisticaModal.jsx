import React, { useState, useEffect } from "react";
import logoImg from "@/assets/logo.png";
import api from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Package, Trash2, Plus, X, Pencil, Ban, Save } from "lucide-react";

const MONEDA_OPTS = [
  { id: "Soles",   nombre: "Soles (S/)" },
  { id: "Dolares", nombre: "Dolares ($)" },
];

const FORM_VACIO = {
  fecha: new Date().toISOString().split("T")[0],
  moneda: "Soles",
  tc: "",
  almacen: "",
  referencia: "",
  razon_social: "",
  cor_id: "",
  orden_compra: "",
  numero_doc: "",
  nro_guia: "",
  responsable: "",
  obs_doc: "",
};

const ITEM_VACIO = { codigo: "", descripcion: "", um: "", cant: "", valor: "" };

function fmtNum(v) {
  return v != null
    ? Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2 })
    : "--";
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-500 uppercase">{label}</label>
      {children}
    </div>
  );
}

function ReadVal({ value }) {
  return (
    <p className="text-xs font-semibold text-slate-800 py-1.5 px-3 bg-slate-50 rounded-lg border border-slate-100 min-h-[32px]">
      {value || "--"}
    </p>
  );
}

export default function NuevaLogisticaModal({
  open,
  onClose,
  logistica = null,
  operacion = "E",
  modo: modoProp = "N",
}) {
  const [modo, setModo] = useState(modoProp);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState(ITEM_VACIO);

  const [openBuscador, setOpenBuscador] = useState(false);
  const [busqQuery, setBusqQuery] = useState("");
  const [productosLista, setProductosLista] = useState([]);

  const [openCliente, setOpenCliente] = useState(false);
  const [cliQuery, setCliQuery] = useState("");
  const [clienteLista, setClienteLista] = useState([]);

  const { data: almacenes = [] } = useQuery({
    queryKey: ["almacenes_new"],
    queryFn: () => api.get("logistica/dashboard/almacenes/").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const totalGeneral = items.reduce((acc, it) => acc + Number(it.total || 0), 0);

  useEffect(() => {
    if (!open) return;
    setModo(modoProp);
    if (logistica && logistica.num_reg) {
      cargarDetalle(logistica.num_reg);
    } else {
      setForm({ ...FORM_VACIO });
      setItems([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, logistica && logistica.num_reg, modoProp]);

  async function cargarDetalle(num_reg) {
    setLoading(true);
    try {
      const { data } = await api.get(`logistica/dashboard/modal/${num_reg}/`);
      const cab = data.cabecera || {};
      setForm({
        fecha:        cab.fecha            || new Date().toISOString().split("T")[0],
        moneda:       cab.moneda           || "Soles",
        tc:           cab.tipo_cambio      || "",
        almacen:      cab.almacen != null  ? String(cab.almacen) : "",
        referencia:   cab.referencia       || "",
        razon_social: cab.razon_social     || "",
        cor_id:       cab.proveedor_codigo || "",
        orden_compra: cab.orden_compra     || "",
        numero_doc:   cab.numero_doc       || "",
        nro_guia:     cab.nro_guia         || "",
        responsable:  cab.responsable      || "",
        obs_doc:      cab.obs_doc          || "",
        _num:         cab.numero,
        _est:         cab.estado,
        _anulado:     cab.anulado,
      });
      setItems(
        (data.items || []).map((it, idx) => ({
          id:          idx + 1,
          codigo:      it.codigo           || "",
          descripcion: it.nombre           || "",
          um:          it.unidad           || "",
          cant:        Number(it.cantidad       || 0),
          valor:       Number(it.valor_unitario || 0),
          total:       Number(it.total          || 0),
        }))
      );
    } catch {
      toast.error("Error al cargar el detalle");
    } finally {
      setLoading(false);
    }
  }

  const setF = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  function addItem() {
    if (!newItem.codigo && !newItem.descripcion) return;
    const cant  = Number(newItem.cant  || 0);
    const valor = Number(newItem.valor || 0);
    setItems((prev) => [
      ...prev,
      { id: Date.now(), ...newItem, cant, valor, total: cant * valor },
    ]);
    setNewItem(ITEM_VACIO);
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function updateItem(id, field, value) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        updated.total = Number(updated.cant || 0) * Number(updated.valor || 0);
        return updated;
      })
    );
  }

  async function handleSave() {
    if (items.length === 0) { toast.warning("Agregue al menos un item"); return; }
    setSaving(true);
    try {
      await api.post("logistica/movimiento/", { ...form, ope: operacion, items });
      toast.success((operacion === "E" ? "Entrada" : "Salida") + " guardada correctamente");
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Error al guardar");
    } finally { setSaving(false); }
  }

  async function handleUpdate() {
    if (items.length === 0) { toast.warning("Agregue al menos un item"); return; }
    setSaving(true);
    try {
      await api.put(`logistica/movimiento/${logistica.num_reg}/`, {
        ...form, ope: operacion, items,
      });
      toast.success("Movimiento actualizado correctamente");
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Error al actualizar");
    } finally { setSaving(false); }
  }

  async function handleAnular() {
    if (!window.confirm("Confirma anular este movimiento? Esta accion no se puede deshacer.")) return;
    setSaving(true);
    try {
      await api.patch(`logistica/movimiento/${logistica.num_reg}/anular/`);
      toast.success("Movimiento anulado");
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Error al anular");
    } finally { setSaving(false); }
  }

  useEffect(() => {
    if (!openBuscador) return;
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`logistica/dashboard/productos/?q=${busqQuery}`);
        setProductosLista(data || []);
      } catch { /* ignore */ }
    }, 350);
    return () => clearTimeout(t);
  }, [busqQuery, openBuscador]);

  useEffect(() => {
    if (!openCliente) return;
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("core/clientes/", { params: { q: cliQuery } });
        setClienteLista(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
    }, 350);
    return () => clearTimeout(t);
  }, [cliQuery, openCliente]);

  const esNuevo  = modo === "N";
  const esEditar = modo === "E";
  const esVer    = modo === "V";
  const editable = esNuevo || esEditar;
  const anulado  = form._anulado === "S";

  const colorBtn    = operacion === "E" ? "bg-teal-600 hover:bg-teal-700"   : "bg-rose-600 hover:bg-rose-700";
  const colorHeader = operacion === "E" ? "bg-teal-600"                     : "bg-rose-600";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-white rounded-2xl flex flex-col max-h-[95vh]">

        {/* HEADER */}
        <div className="shrink-0 bg-slate-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${colorHeader} text-white rounded-lg`}>
              <Package size={20} />
            </div>
            <img src={logoImg} alt="Logo" className="h-8 w-auto" />
            <div>
              <h3 className="text-sm font-black text-white uppercase">
                {operacion === "E" ? "Entrada" : "Salida"} de Almacen
                {esNuevo ? " - Nuevo" : esEditar ? " - Editar" : " - Detalle"}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase">SIGECOM Logistica</p>
            </div>
          </div>
          {form._num && (
            <span className={`text-[10px] px-3 py-1 rounded-full font-bold border ${
              anulado
                ? "bg-red-900 text-red-300 border-red-700"
                : "bg-slate-800 text-slate-300 border-slate-700"
            }`}>
              ID: {form._num}{anulado ? " | ANULADO" : ""}
            </span>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex-1 flex items-center justify-center p-16 text-slate-400 text-xs font-bold">
            Cargando...
          </div>
        )}

        {/* BODY */}
        {!loading && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">

            {/* Cabecera */}
            <div className="grid grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

              <div className="col-span-3">
                <Field label="Fecha">
                  {editable
                    ? <input type="date" value={form.fecha || ""} onChange={(e) => setF("fecha", e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5" />
                    : <ReadVal value={form.fecha} />}
                </Field>
              </div>

              <div className="col-span-3">
                <Field label="Almacen">
                  {editable
                    ? <select value={form.almacen || ""} onChange={(e) => setF("almacen", e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
                        <option value="">-- Seleccione --</option>
                        {almacenes.map((a) => (
                          <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>
                        ))}
                      </select>
                    : <ReadVal value={almacenes.find((a) => String(a.idalmacen) === String(form.almacen))?.nombre} />}
                </Field>
              </div>

              <div className="col-span-3">
                <Field label="Moneda">
                  {editable
                    ? <select value={form.moneda || "Soles"} onChange={(e) => setF("moneda", e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
                        {MONEDA_OPTS.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                      </select>
                    : <ReadVal value={form.moneda} />}
                </Field>
              </div>

              <div className="col-span-3">
                <Field label="Tipo de Cambio">
                  {editable
                    ? <input type="number" step="0.01" value={form.tc || ""} onChange={(e) => setF("tc", e.target.value)}
                        placeholder="Auto" className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5" />
                    : <ReadVal value={form.tc ? Number(form.tc).toFixed(3) : "--"} />}
                </Field>
              </div>

              <div className="col-span-4">
                <Field label="Orden de Compra">
                  {editable
                    ? <input type="text" value={form.orden_compra || ""} onChange={(e) => setF("orden_compra", e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5" />
                    : <ReadVal value={form.orden_compra} />}
                </Field>
              </div>

              <div className="col-span-4">
                <Field label="Nro. Factura / Doc.">
                  {editable
                    ? <input type="text" value={form.numero_doc || ""} onChange={(e) => setF("numero_doc", e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5" />
                    : <ReadVal value={form.numero_doc} />}
                </Field>
              </div>

              <div className="col-span-4">
                <Field label="Nro. Guia">
                  {editable
                    ? <input type="text" value={form.nro_guia || ""} onChange={(e) => setF("nro_guia", e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5" />
                    : <ReadVal value={form.nro_guia} />}
                </Field>
              </div>

              <div className="col-span-4">
                <Field label="Responsable">
                  {editable
                    ? <input type="text" value={form.responsable || ""} onChange={(e) => setF("responsable", e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5" />
                    : <ReadVal value={form.responsable} />}
                </Field>
              </div>

              <div className="col-span-8">
                <Field label="Razon Social / Proveedor">
                  {editable
                    ? <div className="relative">
                        <input type="text" value={form.razon_social || ""}
                          onChange={(e) => setF("razon_social", e.target.value)}
                          className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 pr-20" />
                        <button
                          onClick={() => { setCliQuery(""); setOpenCliente(true); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800">
                          Buscar
                        </button>
                      </div>
                    : <ReadVal value={form.razon_social} />}
                </Field>
              </div>

              <div className="col-span-12">
                <Field label="Observacion">
                  {editable
                    ? <input type="text" value={form.obs_doc || ""} onChange={(e) => setF("obs_doc", e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5" />
                    : <ReadVal value={form.obs_doc} />}
                </Field>
              </div>

            </div>

            {/* Tabla de items */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-800 text-[10px] font-black text-slate-300 uppercase">
                    <th className="px-4 py-2 w-10 text-center">N</th>
                    <th className="px-4 py-2 w-32">Codigo</th>
                    <th className="px-4 py-2">Descripcion</th>
                    <th className="px-4 py-2 w-16 text-center">UM</th>
                    <th className="px-4 py-2 w-20 text-center">Cant.</th>
                    <th className="px-4 py-2 w-24 text-right">Valor</th>
                    <th className="px-4 py-2 w-28 text-right">Total</th>
                    {editable && <th className="px-4 py-2 w-10"></th>}
                  </tr>

                  {editable && (
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <td></td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setBusqQuery(""); setOpenBuscador(true); }}
                            className="shrink-0 bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            bus.
                          </button>
                          <input type="text" value={newItem.codigo}
                            onChange={(e) => setNewItem((p) => ({ ...p, codigo: e.target.value }))}
                            className="w-full text-[11px] font-bold border border-slate-300 rounded px-2 py-1" />
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="text" value={newItem.descripcion}
                          onChange={(e) => setNewItem((p) => ({ ...p, descripcion: e.target.value }))}
                          className="w-full text-[11px] border border-slate-300 rounded px-2 py-1 uppercase" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="text" value={newItem.um}
                          onChange={(e) => setNewItem((p) => ({ ...p, um: e.target.value }))}
                          className="w-full text-[11px] text-center border border-slate-300 rounded py-1" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={newItem.cant}
                          onChange={(e) => setNewItem((p) => ({ ...p, cant: e.target.value }))}
                          className="w-full text-[11px] text-center border border-slate-300 rounded py-1" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={newItem.valor}
                          onChange={(e) => setNewItem((p) => ({ ...p, valor: e.target.value }))}
                          className="w-full text-[11px] text-right border border-slate-300 rounded py-1" />
                      </td>
                      <td className="px-4 py-1.5 text-right text-[11px] font-black text-amber-600">
                        {(Number(newItem.cant || 0) * Number(newItem.valor || 0)).toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={addItem} className="p-1 bg-teal-500 hover:bg-teal-600 text-white rounded">
                          <Plus size={14} />
                        </button>
                      </td>
                    </tr>
                  )}
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={it.id} className="hover:bg-slate-50 text-xs">
                      <td className="px-4 py-2 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="px-4 py-2 font-bold text-slate-700">{it.codigo}</td>

                      {editable
                        ? <td className="px-2 py-1">
                            <input type="text" value={it.descripcion}
                              onChange={(e) => updateItem(it.id, "descripcion", e.target.value)}
                              className="w-full text-[11px] border-b border-slate-200 bg-transparent uppercase px-1" />
                          </td>
                        : <td className="px-4 py-2 uppercase text-slate-600">{it.descripcion}</td>}

                      <td className="px-4 py-2 text-center text-slate-500">{it.um}</td>

                      {editable
                        ? <>
                            <td className="px-2 py-1">
                              <input type="number" value={it.cant}
                                onChange={(e) => updateItem(it.id, "cant", e.target.value)}
                                className="w-full text-[11px] text-center border-b border-slate-200 bg-transparent" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="number" value={it.valor}
                                onChange={(e) => updateItem(it.id, "valor", e.target.value)}
                                className="w-full text-[11px] text-right border-b border-slate-200 bg-transparent" />
                            </td>
                          </>
                        : <>
                            <td className="px-4 py-2 text-center font-bold">{it.cant}</td>
                            <td className="px-4 py-2 text-right">{Number(it.valor).toFixed(2)}</td>
                          </>}

                      <td className="px-4 py-2 text-right font-black text-slate-700">
                        {Number(it.total).toFixed(2)}
                      </td>
                      {editable && (
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => removeItem(it.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={editable ? 8 : 7}
                        className="px-4 py-10 text-center text-xs text-slate-400">
                        Sin items
                      </td>
                    </tr>
                  )}
                </tbody>

                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-right text-[10px] font-black uppercase text-slate-500">
                      Total ({form.moneda}):
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-black text-amber-600">
                      {fmtNum(totalGeneral)}
                    </td>
                    {editable && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>
        )}

        {/* FOOTER */}
        {!loading && (
          <div className="shrink-0 px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center gap-3">
            <div>
              {esVer && logistica?.num_reg && !anulado && (
                <Button
                  variant="outline"
                  onClick={handleAnular}
                  disabled={saving}
                  className="text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 gap-2">
                  <Ban size={14} /> Anular
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Cerrar
              </Button>

              {esVer && logistica?.num_reg && !anulado && (
                <Button
                  variant="outline"
                  onClick={() => setModo("E")}
                  className="text-xs font-bold gap-2">
                  <Pencil size={14} /> Editar
                </Button>
              )}

              {esNuevo && (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className={`${colorBtn} text-white text-xs font-bold uppercase tracking-widest px-8 rounded-xl shadow-lg gap-2`}>
                  <Save size={14} />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              )}

              {esEditar && (
                <Button
                  onClick={handleUpdate}
                  disabled={saving}
                  className={`${colorBtn} text-white text-xs font-bold uppercase tracking-widest px-8 rounded-xl shadow-lg gap-2`}>
                  <Save size={14} />
                  {saving ? "Actualizando..." : "Actualizar"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* BUSCADOR DE PRODUCTOS */}
        {openBuscador && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[420px] flex flex-col border border-slate-200">
              <div className="px-4 py-3 bg-slate-800 text-white flex justify-between items-center rounded-t-xl">
                <span className="text-[11px] font-black uppercase">Buscar Producto</span>
                <button onClick={() => setOpenBuscador(false)} className="hover:text-slate-300">
                  <X size={16} />
                </button>
              </div>
              <div className="p-3">
                <input
                  autoFocus
                  type="text"
                  value={busqQuery}
                  onChange={(e) => setBusqQuery(e.target.value)}
                  className="w-full border p-2 text-xs rounded-lg"
                  placeholder="Codigo o nombre del producto..." />
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-3 divide-y divide-slate-100">
                {productosLista.map((p) => (
                  <div
                    key={p.codigo}
                    onClick={() => {
                      setNewItem((prev) => ({
                        ...prev,
                        codigo:      p.codigo,
                        descripcion: p.nombre,
                        um:          p.unidad || "",
                      }));
                      setOpenBuscador(false);
                    }}
                    className="p-2 text-xs hover:bg-teal-50 cursor-pointer flex justify-between gap-4">
                    <span className="font-bold text-slate-700 w-32 shrink-0">{p.codigo}</span>
                    <span className="text-slate-600 truncate flex-1">{p.nombre}</span>
                    <span className="text-slate-400 shrink-0">{p.unidad}</span>
                  </div>
                ))}
                {productosLista.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-6">Sin resultados</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BUSCADOR DE CLIENTES */}
        {openCliente && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[420px] flex flex-col border border-slate-200">
              <div className="px-4 py-3 bg-slate-800 text-white flex justify-between items-center rounded-t-xl">
                <span className="text-[11px] font-black uppercase">Buscar Proveedor / Cliente</span>
                <button onClick={() => setOpenCliente(false)} className="hover:text-slate-300">
                  <X size={16} />
                </button>
              </div>
              <div className="p-3">
                <input
                  autoFocus
                  type="text"
                  value={cliQuery}
                  onChange={(e) => setCliQuery(e.target.value)}
                  className="w-full border p-2 text-xs rounded-lg"
                  placeholder="Nombre o RUC..." />
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-3 divide-y divide-slate-100">
                {clienteLista.map((c) => (
                  <div
                    key={c.id_cliente || c.codigo}
                    onClick={() => {
                      setF("razon_social", c.nombre);
                      setF("cor_id", c.id_cliente || "");
                      setOpenCliente(false);
                    }}
                    className="p-2 text-xs hover:bg-teal-50 cursor-pointer flex justify-between gap-4">
                    <span className="font-bold text-slate-700 w-32 shrink-0">{c.ruc || c.codigo || "--"}</span>
                    <span className="text-slate-600 truncate flex-1">{c.nombre}</span>
                  </div>
                ))}
                {clienteLista.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-6">Sin resultados</p>
                )}
              </div>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
