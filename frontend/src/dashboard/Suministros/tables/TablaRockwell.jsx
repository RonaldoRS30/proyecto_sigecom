export default function TablaRockwell({
  registros = [],
  loading = false,
  tcamb = 1,
  cantidad = 1,
  proveedor,
  onSelect,
}) {
  const toNumber = (v) => Number(v) || 0;

  const resolverNombre = (r) =>
    `${r.descripcion ?? ""}${r.ds ? ` - ${r.ds}` : ""}`;

  const resolverPrecioLista = (r) =>
    r.precio ? toNumber(r.precio) / tcamb : null;

  const resolverCosto = (r) => {
    const precioLista = resolverPrecioLista(r);
    if (!precioLista) return null;

    // 🧠 Regla temporal Rockwell
    return +precioLista.toFixed(2);
  };

  return (
    <table className="w-full text-xs border-collapse">
      <thead className="sticky top-0 bg-neutral-300 z-10">
        <tr>
          <th className="px-2 py-1 border-r border-gray-400 w-[120px]">Código</th>
          <th className="px-2 py-1 border-r border-gray-400">Descripción</th>
          <th className="px-2 py-1 border-r border-gray-400 w-[90px] text-center">
            Precio Lista
          </th>
          <th className="px-2 py-1 border-r border-gray-400 w-[90px] text-center">
            Precio Costo
          </th>
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
            const nombre = resolverNombre(r);
            const precioLista = resolverPrecioLista(r);
            const costoPrecio = resolverCosto(r);

            return (
              <tr
                key={`${r.codigo}-${r.codigo2 ?? ""}`}
                onClick={() =>
                  onSelect({
                    ...r,

                    // Identidad
                    proveedor,
                    codigo: r.codigo ?? "",
                    descripcion: r.descripcion ?? "",
                    marca: r.proveedor ?? "",
                    unidad: r.pgc ?? "UNI",
                    cantidad,

                    // 💰 Valores calculados
                    costoPrecio: costoPrecio ?? 0,
                    utilidad: 0,
                    porcentaje: 0,
                    costoTotal: costoPrecio
                      ? +(costoPrecio * cantidad).toFixed(2)
                      : 0,
                    ventaPrecio: costoPrecio ?? 0,
                    ventaTotal: costoPrecio
                      ? +(costoPrecio * cantidad).toFixed(2)
                      : 0,
                    utilidadTotal: 0,

                    // Referencia
                    precioLista,
                  })
                }
                className="cursor-pointer hover:bg-blue-50 transition"
              >
                <td className="px-2 py-1 font-mono">{r.codigo}</td>
                <td className="px-2 py-1">{nombre}</td>
                <td className="px-2 py-1 text-center font-mono">
                  {precioLista?.toFixed(2) ?? "—"}
                </td>
                <td className="px-2 py-1 text-center font-mono">
                  {costoPrecio?.toFixed(2) ?? "—"}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
