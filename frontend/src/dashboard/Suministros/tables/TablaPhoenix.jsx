export default function TablaPhoenix({
  registros,
  loading,
  tcamb,
  cantidad,
  proveedor,
  onSelect,
}) {
  const toNumber = (v) => Number(v) || 0;

  const resolverNombre = (r) =>
    `${r.descripcion ?? ""}${r.proveedor ? ` - ${r.proveedor}` : ""}`;

  const resolverPrecioLista = (r) =>
    r.precio ? toNumber(r.precio) / tcamb : null;

  // ==========================================================
  // Función para calcular Precio Costo, Gran Cliente y Usuario
  // ==========================================================
  const resolverDatosPhoenix = (r) => {
    const precioLista = r.precio ? Number(r.precio) / tcamb : 0;
    if (!precioLista) return { precioCosto: null, granCliente: null, usuario: null };

    // Ajuste según los ejemplos reales
    let factorCosto, factorGranCliente;

    // Aproximamos según rangos de Precio Lista
    if (precioLista <= 4) {
      factorCosto = 0.667;
      factorGranCliente = 0.76;
    } else if (precioLista <= 5) {
      factorCosto = 0.669;
      factorGranCliente = 0.76;
    } else if (precioLista <= 7) {
      factorCosto = 0.670;
      factorGranCliente = 0.758;
    } else if (precioLista <= 8) {
      factorCosto = 0.670;
      factorGranCliente = 0.759;
    } else {
      factorCosto = 0.670;
      factorGranCliente = 0.761;
    }

    const precioCosto = parseFloat((precioLista * factorCosto).toFixed(2));
    const granCliente = parseFloat((precioLista * factorGranCliente).toFixed(2));
    const usuario = precioCosto;

    return { precioCosto, granCliente, usuario };
  };

  return (
    <table className="w-full text-xs border-collapse">
      <thead className="sticky top-0 bg-neutral-300 z-10">
        <tr>
          <th className="px-2 py-1 border-r border-gray-400 text-center w-[130px]">Código</th>
          <th className="px-2 py-1 border-r border-gray-400 text-center">Nombre</th>
          <th className="px-2 py-1 border-r border-gray-400 text-center w-[90px]">Precio Lista</th>
          <th className="px-2 py-1 border-r border-gray-400 text-center w-[90px]">Precio Costo</th>
          <th className="px-2 py-1 border-r border-gray-400 text-center w-[90px]">Gran Cliente</th>
          <th className="px-2 py-1 border-r border-gray-400 text-center w-[80px]">Usuario</th>
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td colSpan={6} className="text-center py-4 text-neutral-500">
              Cargando...
            </td>
          </tr>
        ) : registros.length === 0 ? (
          <tr>
            <td colSpan={6} className="text-center py-4 text-neutral-500">
              No hay registros
            </td>
          </tr>
        ) : (
          registros.map((r) => {
            const nombre = resolverNombre(r);
            const precioLista = resolverPrecioLista(r);
            const { precioCosto, granCliente, usuario } = resolverDatosPhoenix(r);
            const costoPrecio = precioCosto; // mismo que precio venta
            const utilidad = 0.00;
            const porcentaje = 0.00;

            return (
              <tr
                key={r.codigo}
                onClick={() =>
                  onSelect({
                    ...r,
                    proveedor: proveedor,
                    descripcion: r.descripcion ?? "",
                    marca: r.proveedor ?? "",
                    unidad: r.pgc ?? "",
                    cantidad: cantidad,
                    costoPrecio: Number(precioCosto?.toFixed(2)) ?? 0.00,
                    utilidad: Number(utilidad.toFixed(2)) ?? 0.00,
                    porcentaje: Number(porcentaje.toFixed(2)) ?? 0.00,
                    costoTotal: Number((costoPrecio * cantidad).toFixed(2)) ?? 0.00,
                    ventaPrecio: Number(precioCosto.toFixed(2)) ?? 0.00,
                    ventaTotal: Number((precioCosto * cantidad).toFixed(2)) ?? 0.00,
                    precioLista,
                    precioCosto,
                    granCliente,
                    usuario,
                  })
                }
                className="cursor-pointer hover:bg-blue-50 transition"
              >
                <td className="px-2 py-1 font-mono">{r.codigo}</td>
                <td className="px-2 py-1 font-mono">{nombre}</td>
                <td className="px-2 py-1 text-center font-mono">
                  {precioLista?.toFixed(2) ?? "—"}
                </td>
                <td className="px-2 py-1 text-center font-mono">
                  {precioCosto?.toFixed(2) ?? "—"}
                </td>
                <td className="px-2 py-1 text-center font-mono">
                  {granCliente?.toFixed(2) ?? "—"}
                </td>
                <td className="px-2 py-1 text-center font-mono">
                  {usuario?.toFixed(2) ?? "—"}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
