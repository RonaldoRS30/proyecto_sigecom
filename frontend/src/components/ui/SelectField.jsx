import React, { useState, useRef, useEffect } from "react";
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
  disabled,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Find selected option
  const selectedOption = options.find(
    (o) => String(o.id ?? o.value) === String(value)
  );

  const displayText = selectedOption
    ? selectedOption.nombre || selectedOption.label
    : "Seleccionar…";

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val) => {
    setIsOpen(false);
    if (onChange) {
      onChange({
        target: {
          value: val,
          id: props.id,
          name: props.name,
        },
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col gap-1 w-full relative",
        inline && "flex-row items-center gap-2",
        className
      )}
    >
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-2 block mb-0.5 shrink-0 select-none">
          {label}
        </label>
      )}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "group relative flex items-center px-4 py-2 rounded-full transition-all duration-200 border border-slate-100/50 shadow-sm cursor-pointer select-none",
          "bg-slate-50/60 hover:bg-slate-100/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/25",
          isOpen ? "bg-white ring-2 ring-teal-500/25 border-teal-200" : "",
          error ? "bg-red-50/60 border-red-300" : "",
          disabled && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
      >
        {icon && (
          <span className="mr-2 text-teal-500 flex items-center justify-center shrink-0">
            {icon}
          </span>
        )}

        <span
          className={cn(
            "text-[11px] font-bold tracking-tight truncate uppercase",
            value ? "text-slate-700" : "text-slate-400"
          )}
        >
          {displayText}
        </span>

        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 ml-auto text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0",
            isOpen && "rotate-180 text-teal-500"
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute top-[102%] left-0 w-full bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl z-[999] py-1.5 max-h-52 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
          {options.length === 0 ? (
            <div className="px-4 py-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
              Sin opciones
            </div>
          ) : (
            options.map((o, idx) => {
              const optVal = o.id ?? o.value ?? "";
              const optLabel = String(o.nombre || o.label).toUpperCase();
              const isSelected = String(value) === String(optVal);

              return (
                <div
                  key={`opt-${optVal}-${idx}`}
                  onClick={() => handleSelect(optVal)}
                  className={cn(
                    "px-4 py-2 text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-colors",
                    isSelected
                      ? "bg-teal-500/10 text-teal-700 font-black border-l-4 border-l-teal-500 pl-3"
                      : "hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-l-4 border-l-transparent"
                  )}
                >
                  {optLabel}
                </div>
              );
            })
          )}
        </div>
      )}

      {!inline && error && (
        <p className="text-red-500 text-[10px] mt-0.5 ml-2">{error}</p>
      )}
    </div>
  );
}