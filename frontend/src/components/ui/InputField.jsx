import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function InputField({
  label,
  icon,
  inline = false,
  value,
  onChange,
  readOnly = false,
  type = "text",
  error = null,
  className,
  trailingIcon,
  ...props
}) {
  return (
    <div
      className={cn(
        inline
          ? "flex items-center gap-2 w-full"
          : "flex flex-col gap-1 w-full",
        className
      )}
    >
      {label && (
        <label
          className={cn(
            "text-xs font-medium text-gray-700 flex items-center gap-1",
            inline ? "w-22 shrink-0 mb-0" : "mb-1"
          )}
        >
          {icon && <span className="flex items-center">{icon}</span>}
          {label}
        </label>
      )}

      {/* INPUT + ICONO */}
      <div className="relative w-full">
        <Input
          type={type}
          value={value || ""}
          onChange={onChange}
          readOnly={readOnly}
          className={cn(
            "h-6 px-2 text-xs leading-tight", // 🔥 altura compacta real
            trailingIcon && "pr-8",
            readOnly && "bg-gray-100 cursor-not-allowed",
            error && "border-red-500 bg-red-50 focus-visible:ring-red-500 focus:bg-red-50"
          )}
          {...props}
        />

        {trailingIcon && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {trailingIcon}
          </div>
        )}
      </div>

      {!inline && error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}
    </div>
  );
}
