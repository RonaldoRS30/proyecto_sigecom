export default function TablaRittal({
  registros,
  loading,
  tcamb,
  cantidad,
  proveedor,
  onSelect,
}) {
  const resolverPrecioVenta = (r) =>
    r.precio_s ? Number(r.precio_s) / tcamb : null;

  return (
    <table className="w-full text-xs border-collapse">
      <thead className="sticky top-0 bg-neutral-300 z-10">
        <tr>
          <th className="px-2 py-1 border-r border-gray-400 text-center w-[130px]">Código</th>
          <th className="px-2 py-1 border-r border-gray-400 text-center">Nombre</th>
          <th className="px-2 py-1 border-r border-gray-400 text-center w-[90px]">Precio Costo</th>
          <th className="px-2 py-1  border-r border-gray-400 text-center w-[90px]">Precio Venta</th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td colSpan={4} className="text-center py-4 text-neutral-500">
              Cargando...
            </td>
          </tr>
        ) : registros.length === 0 ? (
          <tr>
            <td colSpan={4} className="text-center py-4 text-neutral-500">
              No hay registros
            </td>
          </tr>
        ) : (
          registros.map((r) => {
            const precioVenta = resolverPrecioVenta(r);
            const costoPrecio = precioVenta * 0.62;
            const utilidad = precioVenta - costoPrecio;
            const costoTotal = costoPrecio * cantidad;
            const ventaTotal = precioVenta * cantidad;
            const utilidadTotal = utilidad * cantidad;
            const porcentaje = costoTotal ? (utilidad / costoTotal) * 100 : 0;

            return (
              <tr
                key={r.codigo}
                onClick={() =>
                  onSelect({
                    ...r,
                    proveedor: proveedor,
                    descripcion: r.nombre ?? "",
                    marca: r.proveedor ?? "",
                    unidad: r.um ?? "",
                    cantidad: cantidad,
                    costoPrecio: Number(costoPrecio.toFixed(2)) ?? 0.00,
                    utilidad: Number(utilidad.toFixed(2)) ?? 0.00,
                    porcentaje: Number(porcentaje.toFixed(2)) ?? 0.00,
                    costoTotal: Number(costoTotal.toFixed(2)) ?? 0.00,
                    ventaTotal: Number(ventaTotal.toFixed(2)) ?? 0.00,
                    utilidadTotal: Number(utilidadTotal.toFixed(2)) ?? 0.00,
                    ventaPrecio: Number(precioVenta.toFixed(2)) ?? 0.00,
                  })
                }
                className="cursor-pointer hover:bg-blue-50 transition"
              >
                <td className="px-2 py-1 font-mono">{r.codigo}</td>
                <td className="px-2 py-1 font-mono">{r.nombre}</td>
                <td className="px-2 py-1 text-center font-mono">{r.um || "—"}</td>
                <td className="px-2 py-1 text-center font-mono">
                  {precioVenta !== null
                    ? precioVenta.toFixed(2)
                    : "—"}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
