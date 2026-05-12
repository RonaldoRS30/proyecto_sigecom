import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { Loader, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Table from "@/components/ui/table";
import FilterCardKardex from "@/components/ui/FilterCardKardex";

export default function KardexView() {
  const { authUser: user } = useAuth();
  const [kardexRows, setKardexRows] = useState([]);
  const [processingFilters, setProcessingFilters] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [annoActual] = useState(new Date().getFullYear());

  const calcularKardexDesdeMovimientos = (movs, tmo) => {
    let tcan = 0, tval = 0, ttot = 0;
    const rows = [];

    movs.forEach((row) => {
      const esEntrada = row.ope === "E";
      let ecan = 0, evalp = 0, etot = 0;
      let scan = 0, sval = 0, stot = 0;

      if (esEntrada) {
        ecan = Number(row.can || 0);
        if (tmo === "S") {
          evalp = row.tmo === "S" ? Number(row.val || 0) : Number(row.val || 0) * Number(row.tc || 0);
        } else {
          evalp = row.tmo === "D" ? Number(row.val || 0) : Number(row.val || 0) / Number(row.tc || 1);
        }
        etot = ecan * evalp;
        tcan += ecan;
        ttot += etot;
        tval = tcan > 0 ? ttot / tcan : 0;
      } else {
        scan = Number(row.can || 0);
        sval = tval;
        stot = scan * sval;
        tcan -= scan;
        ttot -= stot;
      }

      rows.push({
        fecha: row.fec,
        tipo: row.ope,
        referencia: row.dor,
        ingreso_cant: esEntrada ? ecan : 0,
        ingreso_precio: esEntrada ? evalp : 0,
        ingreso_total: esEntrada ? etot : 0,
        salida_cant: esEntrada ? 0 : scan,
        salida_precio: esEntrada ? 0 : sval,
        salida_total: esEntrada ? 0 : stot,
        saldo_cant: tcan,
        saldo_precio: tval,
        saldo_total: ttot,
      });
    });
    return rows;
  };

  const fetchKardex = async (filtersObj) => {
    try {
      const params = {
        anno: filtersObj.anio || filtersObj.anno,
        mes: filtersObj.mes,
        cod: filtersObj.producto,
        tmo: filtersObj.moneda,
      };

      const { data } = await api.get("logistica/kardex_base/", { params });
      const rows = calcularKardexDesdeMovimientos(data || [], params.tmo);
      setKardexRows(rows);
    } catch (error) {
      console.error("Error fetching kardex:", error);
      toast.error("Error al cargar los datos del Kardex");
    }
  };

  const handleReport = async (filtros) => {
    const producto = filtros?.producto || "";
    if (!producto || producto === "%") {
      toast.warning("Debe seleccionar un producto.");
      return;
    }

    try {
      setReportLoading(true);
      const params = {
        anno: filtros.anio || "%",
        mes: filtros.mes || "%",
        cod: filtros.producto,
        moneda: filtros.moneda || "S"
      };

      const response = await api.get("/cotizaciones/reportes/reporte_kardex_pdf/", {
        params,
        responseType: "blob"
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar el reporte");
    } finally {
      setReportLoading(false);
    }
  };

  const inventarioFinal = kardexRows.length ? kardexRows[kardexRows.length - 1] : null;
  const baseRowClasses = "grid grid-cols-[110px_50px_1fr_repeat(9,minmax(85px,1fr))]";

  return (
    <div className="flex flex-col h-full p-6">
      <div className="w-full mb-4">
        <FilterCardKardex
          onProcess={async (filters) => {
            if (!filters.producto || filters.producto === "%") {
              toast.warning("Seleccione un producto");
              return;
            }
            setProcessingFilters(true);
            await fetchKardex(filters);
            setProcessingFilters(false);
          }}
          onReport={handleReport}
          onClear={() => setKardexRows([])}
          reportLoading={reportLoading}
        />
      </div>

      <div className="flex-1 overflow-auto relative rounded-xl border border-slate-200 bg-white shadow-sm custom-scrollbar">
        {processingFilters && (
          <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        )}

        <div className="min-w-[1100px] flex flex-col">
          <div className={`${baseRowClasses} bg-slate-100 border-b border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-700`}>
            <div className="col-span-3 px-3 py-2 border-r border-slate-200">Datos del Movimiento</div>
            <div className="col-span-3 px-3 py-2 text-center border-r border-slate-200 bg-teal-50/50">Ingreso</div>
            <div className="col-span-3 px-3 py-2 text-center border-r border-slate-200 bg-orange-50/50">Salida</div>
            <div className="col-span-3 px-3 py-2 text-center bg-green-50/50">Saldo Final</div>
          </div>

          <div className={`${baseRowClasses} bg-slate-50 border-b border-slate-300 text-[10px] font-semibold text-slate-600`}>
            <div className="px-3 py-2 border-r border-slate-200">Fecha</div>
            <div className="px-3 py-2 border-r border-slate-200 text-center">Tipo</div>
            <div className="px-3 py-2 border-r border-slate-200">Referencia</div>
            <div className="px-2 py-2 text-center border-r border-slate-200 bg-teal-50/30">Cant.</div>
            <div className="px-2 py-2 text-right border-r border-slate-200 bg-teal-50/30">Precio</div>
            <div className="px-2 py-2 text-right border-r border-slate-200 bg-teal-50/30">Total</div>
            <div className="px-2 py-2 text-center border-r border-slate-200 bg-orange-50/30">Cant.</div>
            <div className="px-2 py-2 text-right border-r border-slate-200 bg-orange-50/30">Precio</div>
            <div className="px-2 py-2 text-right border-r border-slate-200 bg-orange-50/30">Total</div>
            <div className="px-2 py-2 text-center border-r border-slate-200 bg-green-50/30">Cant.</div>
            <div className="px-2 py-2 text-right border-r border-slate-200 bg-green-50/30">Precio</div>
            <div className="px-2 py-2 text-right bg-green-50/30">Total</div>
          </div>

          <div className="overflow-y-auto">
            {kardexRows.length === 0 && !processingFilters && (
              <div className="p-10 text-center text-slate-400 text-sm font-semibold flex flex-col items-center gap-2">
                <Package size={40} className="opacity-20" />
                No hay datos para mostrar
              </div>
            )}
            {kardexRows.map((row, idx) => (
              <div key={idx} className={`${baseRowClasses} hover:bg-teal-50/40 border-b border-slate-200 transition-colors`}>
                <div className="px-3 py-2 text-[11px] tabular-nums text-slate-700 border-r border-slate-100">{row.fecha}</div>
                <div className="px-3 py-2 text-[11px] font-bold text-center border-r border-slate-100">
                  <span className={row.tipo === "E" ? "text-teal-600" : "text-orange-600"}>{row.tipo}</span>
                </div>
                <div className="px-3 py-2 text-[11px] text-slate-600 truncate border-r border-slate-100" title={row.referencia}>{row.referencia}</div>
                <div className="px-2 py-2 text-center text-[11px] tabular-nums font-medium border-r border-slate-100">{row.ingreso_cant || "-"}</div>
                <div className="px-2 py-2 text-right text-[11px] tabular-nums text-slate-500 border-r border-slate-100">{row.ingreso_precio > 0 ? row.ingreso_precio.toFixed(4) : "-"}</div>
                <div className="px-2 py-2 text-right text-[11px] tabular-nums font-semibold text-slate-700 border-r border-slate-100">{row.ingreso_total > 0 ? row.ingreso_total.toFixed(2) : "-"}</div>
                <div className="px-2 py-2 text-center text-[11px] tabular-nums font-medium border-r border-slate-100">{row.salida_cant || "-"}</div>
                <div className="px-2 py-2 text-right text-[11px] tabular-nums text-slate-500 border-r border-slate-100">{row.salida_precio > 0 ? row.salida_precio.toFixed(4) : "-"}</div>
                <div className="px-2 py-2 text-right text-[11px] tabular-nums font-semibold text-slate-700 border-r border-slate-100">{row.salida_total > 0 ? row.salida_total.toFixed(2) : "-"}</div>
                <div className="px-2 py-2 text-center text-[11px] tabular-nums font-bold text-slate-800 border-r border-slate-100 bg-slate-50/30">{row.saldo_cant}</div>
                <div className="px-2 py-2 text-right text-[11px] tabular-nums text-slate-600 border-r border-slate-100 bg-slate-50/30">{row.saldo_precio.toFixed(4)}</div>
                <div className="px-2 py-2 text-right text-[11px] tabular-nums font-black text-amber-600 bg-slate-50/30">{row.saldo_total.toFixed(2)}</div>
              </div>
            ))}
          </div>

          {inventarioFinal && (
            <div className={`${baseRowClasses} bg-slate-800 text-white font-bold border-t-2 border-slate-900 sticky bottom-0`}>
              <div className="col-span-3 px-4 py-3 text-xs uppercase tracking-widest">Inventario Final:</div>
              <div className="col-span-3 border-r border-slate-700" />
              <div className="col-span-3 border-r border-slate-700" />
              <div className="px-2 py-3 text-center text-xs tabular-nums">{inventarioFinal.saldo_cant}</div>
              <div className="px-2 py-3 text-right text-xs tabular-nums text-slate-300">{inventarioFinal.saldo_precio.toFixed(4)}</div>
              <div className="px-2 py-3 text-right text-xs tabular-nums text-amber-400">{inventarioFinal.saldo_total.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
