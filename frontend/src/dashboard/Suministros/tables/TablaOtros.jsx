export default function TablaOtros({
  registros = [],
  loading,
  tcamb,
  cantidad,
  proveedor,
  onSelect,
}) {
  const toNumber = (v) => Number(v) || 0;

  const resolverPrecioVenta = (r) => {
    if (r.precio_d) {
      return toNumber(r.precio_d);
    }
    if (r.precio_s && tcamb) {
      return toNumber(r.precio_s) / tcamb;
    }
    return null;
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
          <th className="px-2 py-1 border-r border-gray-400 text-center w-[90px]">Precio Costo</th>
          <th className="px-2 py-1 border-r border-gray-400 text-center w-[90px]">Precio Venta</th>
        </tr>
      </thead>

      <tbody>
        {registros.map((r) => {
          const precioVenta = resolverPrecioVenta(r);
          const costoPrecio = precioVenta; // mismo que precio venta
          const utilidad = 0.00;
          const porcentaje = 0.00;

          return (
            <tr
              key={r.codigo}
              onClick={() =>
              onSelect({
                ...r,
                proveedor: proveedor,
                descripcion: r.nombre ?? "",
                marca: r.proveedor ?? "Otros",
                unidad: r.um ?? "",
                cantidad: cantidad,
                ventaPrecio: Number(precioVenta.toFixed(2)) ?? 0.00,
                utilidad: Number(utilidad.toFixed(2)) ?? 0.00,
                porcentaje: Number(porcentaje.toFixed(2)) ?? 0.00,
                costoTotal: Number((costoPrecio * cantidad).toFixed(2)) ?? 0.00,
                ventaTotal: Number((precioVenta * cantidad).toFixed(2)) ?? 0.00,
                costoPrecio: resolverPrecioVenta(r) ?? 0, // 🔹 clave: mismo nombre que RITTAL
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
        })}
      </tbody>
    </table>
  );
}
