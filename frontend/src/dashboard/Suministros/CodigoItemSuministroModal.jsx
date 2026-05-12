import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InputField from "@/components/ui/InputField";
import api from "@/services/api";
import { Search, Hash, Loader2, PackageX } from "lucide-react";

// Tablas
import TablaRittal from "./tables/TablaRittal";
import TablaPhoenix from "./tables/TablaPhoenix";
import TablaOtros from "./tables/TablaOtros";
import TablaAlmLista from "./tables/TablaAlmLista";

export default function CodigoItemSuministroModal({
  open,
  onClose,
  onSelect,
  endpoint,
  tcamb,
  proveedor,
}) {
  const [buscar, setBuscar] = useState("");
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==========================
  // LÓGICA DE BÚSQUEDA (CON DEBOUNCE MANUAL)
  // ==========================
  const fetchItems = useCallback(async (texto = "") => {
    if (!endpoint) return;

    setLoading(true);
    try {
      const searchStr = texto.trim().toUpperCase();
      const res = await api.get(endpoint, {
        params: searchStr ? { search: searchStr } : { limit: 20 },
      });
      setRegistros(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("❌ Error cargando items", error);
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // Efecto para búsqueda con retraso (Debounce)
  useEffect(() => {
    if (!open) return;
    
    const delayDebounceFn = setTimeout(() => {
      fetchItems(buscar);
    }, 400); // Espera 400ms después de que el usuario deja de escribir

    return () => clearTimeout(delayDebounceFn);
  }, [buscar, open, fetchItems]);

  // Reset al abrir
  useEffect(() => {
    if (open) setBuscar("");
  }, [open]);

  // Manejador único de selección
  const handleSelect = (item) => {
    onSelect(item);
    onClose();
  };

  const commonProps = {
    registros,
    loading,
    tcamb,
    proveedor,
    onSelect: handleSelect,
  };

  const renderContenidoTabla = () => {
    if (loading && registros.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-2" />
          <span className="text-xs font-bold uppercase tracking-widest">Buscando suministros...</span>
        </div>
      );
    }

    if (!loading && registros.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <PackageX className="w-8 h-8 mb-2 opacity-20" />
          <span className="text-xs font-bold uppercase tracking-widest">No se encontraron resultados</span>
        </div>
      );
    }

    switch (proveedor) {
      case "03": return <TablaRittal {...commonProps} />;
      case "05": return <TablaPhoenix {...commonProps} />;
      case "06":
      case "07": return <TablaAlmLista {...commonProps} />;
      case "99": return <TablaOtros {...commonProps} />;
      default:
        return (
          <div className="text-center text-[10px] font-bold text-slate-400 py-10 uppercase tracking-tighter">
            Configuración de marca no disponible
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-2xl shadow-2xl border-none p-0 overflow-hidden font-sans">
        
        {/* HEADER */}
        <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-[#0d767e] rounded-lg shadow-sm">
              <Hash size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Catálogo de Artículos
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Filtrando por código o descripción técnica
              </p>
            </div>
          </div>
        </div>

        <div className="p-2 space-y-2">
          {/* BUSCADOR */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 shadow-inner">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <InputField
                  inline
                  size="sm"
                  label="Buscar:"
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Ej: Contactor, 100-C09, Borna..."
                  className="text-xs font-semibold focus:ring-teal-500/20 bg-white pr-10"
                />
                {loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={onClose}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl px-4"
              >
                Cerrar
              </Button>
            </div>
          </div>

          {/* ÁREA DE TABLA - Con Scroll Suave */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              {renderContenidoTabla()}
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}