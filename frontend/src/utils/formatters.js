export const formatDate = (dateString) => {
  if (!dateString) return "---";
  
  const date = new Date(dateString);
  
  // Verificamos si la fecha es válida para evitar errores de renderizado
  if (isNaN(date.getTime())) return "Fecha inválida";

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(date)
    .replace(/\//g, '-'); // Reemplaza las barras / por guiones -
};