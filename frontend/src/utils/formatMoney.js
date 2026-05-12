const formatMoney = (value) => {
  if (value === null || value === undefined) return "-";

  const simbolo = data?.moneda_simbolo || "S/";

  return `${simbolo} ${new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))}`;
};