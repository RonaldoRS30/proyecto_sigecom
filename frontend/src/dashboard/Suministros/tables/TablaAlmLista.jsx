export default function TablaAlmLista({
  registros,
  loading,
  tcamb,
  cantidad,
  proveedor,
  onSelect,
}) {
  const toNumber = (v) => Number(v) || 0;

  // -----------------------------
  // Precio lista según datos del registro
  // -----------------------------
  const resolverPrecioLista = (r) => {
    if (r.precio_d) return toNumber(r.precio_d);          // Precio directo
    if (r.precio_s && tcamb) return toNumber(r.precio_s) / tcamb; // Precio dividiendo por tcamb
    return 0;
  };

  // -----------------------------
  // Precio de venta según regla de negocio
  // -----------------------------
  const resolverPrecioVenta = (r) => {
    const lista = resolverPrecioLista(r); // precio_s / tcamb
    if (!lista) return 0;

    let venta = lista;

    // LS y Schneider: usar solo precio_s / tcamb y factor histórico
    if (r.proveedor === "LS Industrial Systems" || r.proveedor === "Schneider") {
      const precioListaProveedor = toNumber(r.precio_s) / tcamb;
      const factorHistorico = 0.65; // coincide con Sistema Empresa
      venta = precioListaProveedor * factorHistorico;
    } else {
      // Para otros proveedores, aplicamos descuento normalmente
      const descuento = r.descuento ? toNumber(r.descuento) / tcamb : 0;
      const base = lista - descuento;
      venta = base;
    }

    return parseFloat(venta.toFixed(2));
  };

  if (loading) {
    return (
      <div className="text-center py-6 text-sm text-neutral-500">
        Cargando...
      </div>
    );
  }

  if (!registros.length) {
    return (
      <div className="text-center py-6 text-sm text-neutral-500">
        No hay registros
      </div>
    );
  }

  return (
    <table className="w-full text-xs border-collapse">
      <thead className="sticky top-0 bg-neutral-300">
        <tr>
          <th className="px-2 py-1 border-r border-gray-400 text-center w-[130px]">Código</th>
          <th className="px-2 py-1 border-r border-gray-400 text-center">Nombre</th>
          <th className="px-2 py-1 border-r border-gray-400 text-center w-[90px]">Precio Lista</th>
          <th className="px-2 py-1 border-r border-gray-400 text-center w-[90px]">Precio Venta</th>
        </tr>
      </thead>

      <tbody>
        {registros.map((r) => {
          const precioLista = resolverPrecioLista(r);
          const precioVenta = resolverPrecioVenta(r);
          const utilidad = precioLista - precioVenta;
          const costoTotal = precioVenta * cantidad;
          const ventaTotal = precioLista * cantidad;
          const utilidadTotal = utilidad * cantidad;
          const porcentaje = costoTotal ? (utilidad / costoTotal) * 100 : 0;

          return (
            <tr
              key={r.codigo}
              onClick={() =>
                onSelect({
                  proveedor: proveedor,
                  codigo: r.codigo,
                  descripcion: r.nombre ?? "",
                  marca: r.proveedor ?? "", // puedes usar "Schneider"/"LS"
                  unidad: r.um ?? "UNI",
                  cantidad: cantidad,
                  costoPrecio: Number(precioVenta.toFixed(2)) ?? 0.00,
                  ventaPrecio: Number(precioLista.toFixed(2)) ?? 0.00,
                  utilidad: Number(utilidad.toFixed(2)) ?? 0.00,
                  porcentaje: Number(porcentaje.toFixed(2)) ?? 0.00,
                  costoTotal: Number(costoTotal.toFixed(2)) ?? 0.00,
                  ventaTotal: Number(ventaTotal.toFixed(2)) ?? 0.00,
                  utilidadTotal: Number(utilidadTotal.toFixed(2)) ?? 0.00,
                })
              }
              className="cursor-pointer hover:bg-blue-50 transition"
            >
              <td className="px-2 py-1 font-mono">{r.codigo}</td>
              <td className="px-2 py-1 font-mono">{r.nombre}</td>
              <td className="px-2 py-1 text-center font-mono">
                {precioLista.toFixed(2)}
              </td>
              <td className="px-2 py-1 text-center font-mono">
                {precioVenta.toFixed(2)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
