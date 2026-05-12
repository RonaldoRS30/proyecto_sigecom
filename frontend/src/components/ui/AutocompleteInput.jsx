import { useState, useRef, useEffect } from "react";

export default function AutocompleteField({
  label,
  value,
  onChange,
  onSelect,
  data = [],
  loading = false,
  disabled = false,
  placeholder = "",
  error = false,
  className = "",
}) {
  const [focused, setFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const containerRef = useRef(null);

  // Auto-scroll highlight
  useEffect(() => {
    if (highlightIndex === -1 || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-index='${highlightIndex}']`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  const handleKeyDown = (e) => {
    if (!showDropdown || data.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((p) => (p < data.length - 1 ? p + 1 : 0));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((p) => (p > 0 ? p - 1 : data.length - 1));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0) onSelect(data[highlightIndex]);
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => { setFocused(true); setShowDropdown(true); }}
        onBlur={() => setTimeout(() => { setFocused(false); setShowDropdown(false); }, 150)}
        onChange={(e) => { onChange(e.target.value); setHighlightIndex(-1); }}
        onKeyDown={handleKeyDown}
        className={`
          w-full border rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500
          ${disabled ? "bg-gray-100" : ""}
          ${error ? "border-red-500 ring-1 ring-red-400" : ""}
        `}
      />

      {showDropdown && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto z-40">
          {loading && <div className="p-2 text-xs text-gray-500">Cargando...</div>}
          {!loading && data.length === 0 && <div className="p-2 text-xs text-gray-500">Sin resultados</div>}
          {!loading && data.map((item, index) => (
            <div
              key={item.codigo || index}
              data-index={index}
              onMouseDown={() => onSelect(item)}
              className={`px-3 py-2 cursor-pointer text-xs transition
                ${highlightIndex === index ? "bg-indigo-100 ring-1 ring-indigo-300" : "hover:bg-indigo-50"}`}
            >
              <p className="font-semibold text-gray-800">{item.nombre || item.representante || item.nombre_completo}</p>
              {item.cargo && <p className="text-[10px] text-gray-500">{item.cargo}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
