import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export default function SelectField({
  label,
  icon,
  inline = false,
  value,
  onChange,
  options = [],
  error,
  className,
  ...props
}) {
  // Encontrar la opción seleccionada
  const selectedOption = options.find(o => String(o.id ?? o.value) === String(value));
  
  // Si no hay valor, mostramos "Selecciona…", de lo contrario el nombre de la opción
  const displayText = selectedOption 
    ? (selectedOption.nombre || selectedOption.label) 
    : "Selecciona…";

  // Determinamos si debemos mostrar la opción de placeholder en el menú
  // Solo aparece si el valor actual está vacío o no coincide con ninguna opción real
  const showPlaceholder = !value || !selectedOption;

  return (
    <div className={cn("flex flex-col gap-1 w-full", inline && "flex-row items-center gap-2", className)}>
      {label && (
        <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}

      <div className={cn(
        "group relative flex items-center px-3 py-1.5 rounded-full transition-all duration-200",
        "bg-transparent hover:bg-gray-100/50",
        error ? "bg-red-50" : "bg-gray-50/50",
        props.disabled && "opacity-50 cursor-not-allowed"
      )}>
        
        {icon && (
          <span className="mr-2 text-teal-500 flex items-center justify-center">
            {icon}
          </span>
        )}

        <span className={cn(
          "text-[10.5px] font-bold tracking-tight truncate",
          value ? "text-gray-800" : "text-gray-400"
        )}>
          {displayText}
        </span>

        <ChevronDown className="h-3 w-3 ml-1.5 text-gray-400 group-hover:text-gray-600 transition-colors" />

        <select
          value={value || ""}
          onChange={onChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          {...props}
        >
          {/* RENDERIZADO CONDICIONAL DEL PLACEHOLDER */}
          {showPlaceholder && (
            <option value="" disabled>
              -- Seleccionar --
            </option>
          )}

          {options.map((o, idx) => (
            <option
              key={`opt-${o.id ?? o.value ?? idx}`}
              value={o.id ?? o.value ?? ""}
            >
              {o.nombre || o.label}
            </option>
          ))}
        </select>
      </div>

      {!inline && error && (
        <p className="text-red-500 text-[10px] mt-0.5 ml-2">{error}</p>
      )}
    </div>
  );
}