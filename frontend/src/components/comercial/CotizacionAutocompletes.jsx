import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as LucideIcons from "lucide-react";
import api from "@/services/api";

const Icon = ({ name, className }) => {
  const iconName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const LucideIcon = LucideIcons[iconName] || LucideIcons.HelpCircle;
  return <LucideIcon className={className} />;
};

const normalizeText = (text = "") =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const highlightMatch = (text, query) => {
  if (!text) return "";
  if (!query) return text;

  const normText = normalizeText(text);
  const normQuery = normalizeText(query);

  const parts = [];
  let lastIndex = 0;
  let searchIndex = 0;

  while (searchIndex < text.length) {
    const matchIndex = normText.indexOf(normQuery, searchIndex);
    if (matchIndex === -1) {
      parts.push(text.slice(lastIndex));
      break;
    }

    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    const matchText = text.slice(matchIndex, matchIndex + query.length);
    parts.push(
      <span key={matchIndex} className="bg-teal-500/10 text-teal-700 rounded px-0.5 font-bold">
        {matchText}
      </span>
    );

    lastIndex = matchIndex + query.length;
    searchIndex = lastIndex;
  }

  return parts;
};

export const ClienteAutocomplete = ({ value, onSelect, isReadOnly, initialId, onContextMenu, onOptionsClick, tabIndex }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [width, setWidth] = useState(120);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const containerRef = useRef(null);
  const spanRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync with parent value
  useEffect(() => {
    if (!isFocused) {
      setQuery(value || "");
    }
  }, [value, isFocused]);

  // Trigger onSelect to clear client when query is empty
  useEffect(() => {
    if (query === "" && value && isFocused) {
      onSelect({ id_cliente: null, nombre: "", codigo: "" });
    }
  }, [query, value, onSelect, isFocused]);

  // Measure text width dynamically
  useEffect(() => {
    if (spanRef.current) {
      const measured = spanRef.current.offsetWidth;
      setWidth(Math.max(100, Math.min(380, measured + 12)));
    }
  }, [query]);

  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  // Continuous viewport tracking loop when open (solves modal animation lag/gap)
  useEffect(() => {
    if (!showDropdown) return;
    
    let active = true;
    const tick = () => {
      if (!active) return;
      updateCoords();
      requestAnimationFrame(tick);
    };
    
    requestAnimationFrame(tick);
    return () => {
      active = false;
    };
  }, [showDropdown]);

  // Scroll highlighted item into view automatically (keyboard arrow navigation scroll)
  useEffect(() => {
    if (showDropdown && highlightIndex >= 0 && dropdownRef.current) {
      const container = dropdownRef.current;
      const items = container.querySelectorAll(".cursor-pointer");
      const activeItem = items[highlightIndex];
      if (activeItem) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const elemTop = activeItem.offsetTop;
        const elemBottom = elemTop + activeItem.offsetHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [highlightIndex, showDropdown]);

  const fetchResults = async (searchVal) => {
    if (!searchVal) {
      setResults([]);
      setHighlightIndex(-1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await api.get("core/clientes/buscar/", {
        params: { q: searchVal }
      });
      const dataArray = Array.isArray(res) ? res : [];
      setResults(dataArray);
      if (dataArray.length > 0) {
        setHighlightIndex(0);
      } else {
        setHighlightIndex(-1);
      }
    } catch (err) {
      console.error("❌ Error buscando clientes:", err);
      setResults([]);
      setHighlightIndex(-1);
    } finally {
      setLoading(false);
    }
  };

  // Debounce API call on query change
  useEffect(() => {
    if (!showDropdown) return;

    const t = setTimeout(() => {
      fetchResults(query.trim());
    }, 300);

    return () => clearTimeout(t);
  }, [query, showDropdown]);

  const handleFocus = () => {
    setShowDropdown(true);
    setIsFocused(true);
    fetchResults(query.trim());
  };

  const handleBlur = () => {
    // Delay setting states to allow option clicks to go through
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
      setHighlightIndex(-1);
      if (query !== value) {
        onSelect({ id_cliente: initialId, nombre: query, fromBlur: true });
      }
    }, 150);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && results[highlightIndex]) {
        handleSelectOption(results[highlightIndex]);
      } else {
        setShowDropdown(false);
        setHighlightIndex(-1);
        if (query !== value) {
          onSelect({ id_cliente: null, nombre: query, fromBlur: true });
        }
      }
    } else if (e.key === "Tab" || e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
      if (query !== value) {
        onSelect({ id_cliente: null, nombre: query, fromBlur: true });
      }
    }
  };

  const handleSelectOption = (item) => {
    setQuery(item.nombre);
    setShowDropdown(false);
    setHighlightIndex(-1);
    onSelect(item);
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => {
        setShowDropdown(false);
        if (onContextMenu) onContextMenu(e);
      }}
      className="relative flex items-center px-2 py-1 -ml-2 rounded-lg hover:bg-gray-50 transition-all font-sans"
    >
      <Icon name="briefcase" className="h-3.5 w-3.5 mr-1.5 text-teal-500" />
      {isReadOnly ? (
        <span className="font-bold text-gray-800 uppercase tracking-tight truncate max-w-[200px]">
          {value || "SIN CLIENTE"}
        </span>
      ) : (
        <div className="relative flex items-center">
          {/* Invisible span to measure the exact text width dynamically */}
          <span
            ref={spanRef}
            className="absolute -top-[9999px] -left-[9999px] invisible whitespace-pre font-bold text-xs uppercase px-1"
          >
            {query || "Buscar cliente..."}
          </span>
          <input
            ref={inputRef}
            type="text"
            tabIndex={tabIndex}
            className="bg-transparent hover:bg-white focus:bg-white border-b border-transparent focus:border-teal-300 px-1 font-bold text-gray-800 uppercase outline-none text-xs transition-all"
            style={{ width: `${width}px` }}
            value={query}
            onFocus={(e) => {
              e.target.select();
              handleFocus();
            }}
            onBlur={handleBlur}
            onClick={(e) => {
              e.target.select();
              if (!showDropdown) handleFocus();
            }}
            onMouseDown={(e) => {
              if (e.button === 2) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!showDropdown) {
                setShowDropdown(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar cliente..."
          />
          {showDropdown && (results.length > 0 || loading) && createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: `${coords.top + 2}px`,
                left: `${coords.left}px`,
                width: `${Math.max(280, coords.width)}px`,
                zIndex: 9999,
                pointerEvents: "auto",
              }}
              onMouseDown={(e) => e.preventDefault()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-md border border-slate-100/80 rounded-2xl shadow-xl shadow-slate-200/40 max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2 duration-200 text-left font-sans pointer-events-auto"
            >
              {loading ? (
                <div className="p-3 text-center text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Buscando...</div>
              ) : (
                results.map((c, index) => (
                  <div
                    key={c.id_cliente}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectOption(c);
                    }}
                    className={`px-3 py-2 text-[10px] cursor-pointer rounded-lg mb-0.5 last:mb-0 transition-all duration-150 border-l-2
                      ${highlightIndex === index 
                        ? "bg-teal-50/80 text-teal-950 border-teal-500 font-semibold" 
                        : "hover:bg-slate-50/80 text-slate-700 border-transparent"}`}
                  >
                    <div className="font-black uppercase">{highlightMatch(c.nombre, query)}</div>
                    <div className={`text-[8px] mt-0.5 font-bold transition-colors
                      ${highlightIndex === index ? "text-teal-600/80" : "text-slate-400"}`}>
                      RUC: {c.ruc || "SIN RUC"}
                    </div>
                  </div>
                ))
              )}
            </div>,
            document.body
          )}
        </div>
      )}
      {value && onOptionsClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOptionsClick(e);
          }}
          className="ml-1.5 p-0.5 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer flex items-center justify-center shrink-0"
          title="Opciones Cliente"
        >
          <Icon name="more-vertical" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export const RepresentanteAutocomplete = ({ value, clienteId, onSelect, isReadOnly, initialId, onContextMenu, onOptionsClick, tabIndex }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [width, setWidth] = useState(120);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [isFocused, setIsFocused] = useState(false);

  const containerRef = useRef(null);
  const spanRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const cacheRef = useRef({}); // Keyed by clienteId: { [clienteId]: [...] }

  // Sync with parent value
  useEffect(() => {
    if (!isFocused) {
      setQuery(value || "");
    }
  }, [value, isFocused]);

  // Trigger onSelect to clear representative when query is empty
  useEffect(() => {
    if (query === "" && value && isFocused) {
      onSelect({ id_representante: null, nombre_representante: "", codigo: "" });
    }
  }, [query, value, onSelect, isFocused]);

  // Measure text width dynamically
  useEffect(() => {
    if (spanRef.current) {
      const measured = spanRef.current.offsetWidth;
      setWidth(Math.max(100, Math.min(260, measured + 12)));
    }
  }, [query]);

  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  // Continuous viewport tracking loop when open (solves modal animation lag/gap)
  useEffect(() => {
    if (!showDropdown) return;
    
    let active = true;
    const tick = () => {
      if (!active) return;
      updateCoords();
      requestAnimationFrame(tick);
    };
    
    requestAnimationFrame(tick);
    return () => {
      active = false;
    };
  }, [showDropdown]);

  // Scroll highlighted item into view automatically (keyboard arrow navigation scroll)
  useEffect(() => {
    if (showDropdown && highlightIndex >= 0 && dropdownRef.current) {
      const container = dropdownRef.current;
      const items = container.querySelectorAll(".cursor-pointer");
      const activeItem = items[highlightIndex];
      if (activeItem) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const elemTop = activeItem.offsetTop;
        const elemBottom = elemTop + activeItem.offsetHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [highlightIndex, showDropdown]);

  const fetchResults = async (searchVal) => {
    if (!clienteId) return;
    if (!searchVal && cacheRef.current[clienteId]) {
      const dataArray = cacheRef.current[clienteId];
      setResults(dataArray);
      if (dataArray.length > 0) {
        setHighlightIndex(0);
      } else {
        setHighlightIndex(-1);
      }
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await api.get("core/representantes/buscar/", {
        params: { cliente_id: clienteId, q: searchVal }
      });
      const dataArray = Array.isArray(res) ? res : [];
      setResults(dataArray);
      if (dataArray.length > 0) {
        setHighlightIndex(0);
      } else {
        setHighlightIndex(-1);
      }
      if (!searchVal) {
        cacheRef.current[clienteId] = dataArray;
      }
    } catch (err) {
      console.error("❌ Error buscando encargados:", err);
      setResults([]);
      setHighlightIndex(-1);
    } finally {
      setLoading(false);
    }
  };

  // Debounce API call on query change
  useEffect(() => {
    if (!showDropdown || !clienteId) return;

    const t = setTimeout(() => {
      fetchResults(query.trim());
    }, 300);

    return () => clearTimeout(t);
  }, [query, showDropdown, clienteId]);

  const handleFocus = () => {
    if (!clienteId) return;
    setShowDropdown(true);
    setIsFocused(true);
    fetchResults(query.trim());
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
      setHighlightIndex(-1);
      if (query !== value) {
        onSelect({ id_representante: initialId, nombre_representante: query, fromBlur: true });
      }
    }, 150);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && results[highlightIndex]) {
        handleSelectOption(results[highlightIndex]);
      } else {
        setShowDropdown(false);
        setHighlightIndex(-1);
        if (query !== value) {
          onSelect({ id_representante: null, nombre_representante: query, fromBlur: true });
        }
      }
    } else if (e.key === "Tab" || e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
      if (query !== value) {
        onSelect({ id_representante: null, nombre_representante: query, fromBlur: true });
      }
    }
  };

  const handleSelectOption = (item) => {
    setQuery(item.nombre_representante);
    setShowDropdown(false);
    setHighlightIndex(-1);
    onSelect(item);
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => {
        setShowDropdown(false);
        if (onContextMenu) onContextMenu(e);
      }}
      className="relative flex items-center px-2 py-1 rounded-lg hover:bg-gray-50 transition-all font-sans"
    >
      <Icon name="user" className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
      {isReadOnly ? (
        <span className="font-bold text-gray-800 uppercase tracking-tight truncate max-w-[150px]">
          {value || "SIN NOMBRE"}
        </span>
      ) : (
        <div className="relative flex items-center">
          {/* Invisible span to measure the exact text width dynamically */}
          <span
            ref={spanRef}
            className="absolute -top-[9999px] -left-[9999px] invisible whitespace-pre font-bold text-xs uppercase px-1"
          >
            {query || (clienteId ? "Buscar encargado..." : "Selecciona cliente primero")}
          </span>
          <input
            ref={inputRef}
            type="text"
            tabIndex={tabIndex}
            className="bg-transparent hover:bg-white focus:bg-white border-b border-transparent focus:border-teal-300 px-1 font-bold text-gray-800 uppercase outline-none text-xs transition-all"
            style={{ width: `${width}px` }}
            value={query}
            onFocus={(e) => {
              e.target.select();
              handleFocus();
            }}
            onBlur={handleBlur}
            onClick={(e) => {
              e.target.select();
              if (!showDropdown) handleFocus();
            }}
            onMouseDown={(e) => {
              if (e.button === 2) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!showDropdown) {
                setShowDropdown(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={clienteId ? "Buscar encargado..." : "Selecciona cliente primero"}
            disabled={!clienteId}
          />
          {showDropdown && (results.length > 0 || loading) && createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: `${coords.top + 2}px`,
                left: `${coords.left}px`,
                width: `${Math.max(220, coords.width)}px`,
                zIndex: 9999,
                pointerEvents: "auto",
              }}
              onMouseDown={(e) => e.preventDefault()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-md border border-slate-100/80 rounded-2xl shadow-xl shadow-slate-200/40 max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2 duration-200 text-left font-sans pointer-events-auto"
            >
              {loading ? (
                <div className="p-3 text-center text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Buscando...</div>
              ) : (
                results.map((enc, index) => (
                  <div
                    key={enc.id_representante}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectOption(enc);
                    }}
                    className={`px-3 py-2 text-[10px] cursor-pointer rounded-lg mb-0.5 last:mb-0 transition-all duration-150 border-l-2
                      ${highlightIndex === index 
                        ? "bg-teal-50/80 text-teal-950 border-teal-500 font-semibold" 
                        : "hover:bg-slate-50/80 text-slate-700 border-transparent"}`}
                  >
                    <div className="font-black uppercase">{highlightMatch(enc.nombre_representante, query)}</div>
                    <div className={`text-[8px] mt-0.5 font-bold transition-colors
                      ${highlightIndex === index ? "text-teal-600/80" : "text-slate-400"}`}>
                      {enc.cargo || "SIN CARGO"}
                    </div>
                  </div>
                ))
              )}
            </div>,
            document.body
          )}
        </div>
      )}
      {value && onOptionsClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOptionsClick(e);
          }}
          className="ml-1.5 p-0.5 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer flex items-center justify-center shrink-0"
          title="Opciones Encargado"
        >
          <Icon name="more-vertical" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export const ProductoAutocomplete = ({
  value,
  idMarca,
  onSelect,
  isReadOnly,
  tcamb = 1,
  tipoMoneda = "S",
  placeholder = "Buscar código...",
  tabIndex
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [width, setWidth] = useState(100);
  const [isFocused, setIsFocused] = useState(false);

  const containerRef = useRef(null);
  const spanRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const cacheRef = useRef({});
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Sync with parent value
  useEffect(() => {
    if (!isFocused) {
      setQuery(value || "");
    }
  }, [value, isFocused]);

  // Trigger onSelect to clear product when query is empty
  useEffect(() => {
    if (query === "" && value && isFocused) {
      onSelect({ id_producto: null, codigo: "", nombre: "", isCustom: true });
    }
  }, [query, value, onSelect, isFocused]);

  // Measure text width dynamically
  useEffect(() => {
    if (spanRef.current) {
      const measured = spanRef.current.offsetWidth;
      setWidth(Math.max(100, Math.min(260, measured + 12)));
    }
  }, [query]);

  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  // Continuous viewport tracking loop when open (solves modal animation lag/gap)
  useEffect(() => {
    if (!showDropdown) return;
    
    let active = true;
    const tick = () => {
      if (!active) return;
      updateCoords();
      requestAnimationFrame(tick);
    };
    
    requestAnimationFrame(tick);
    return () => {
      active = false;
    };
  }, [showDropdown]);

  // Scroll highlighted item into view automatically (keyboard arrow navigation scroll)
  useEffect(() => {
    if (showDropdown && highlightIndex >= 0 && dropdownRef.current) {
      const container = dropdownRef.current;
      const items = container.querySelectorAll(".cursor-pointer");
      const activeItem = items[highlightIndex];
      if (activeItem) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const elemTop = activeItem.offsetTop;
        const elemBottom = elemTop + activeItem.offsetHeight;

        if (elemTop < containerTop) {
          container.scrollTop = elemTop;
        } else if (elemBottom > containerBottom) {
          container.scrollTop = elemBottom - container.clientHeight;
        }
      }
    }
  }, [highlightIndex, showDropdown]);

  const fetchResults = async (searchVal) => {
    if (!idMarca) return;
    const cacheKey = `${idMarca}-${searchVal}`;
    if (cacheRef.current[cacheKey]) {
      const dataArray = cacheRef.current[cacheKey];
      setResults(dataArray);
      if (dataArray.length > 0) {
        setHighlightIndex(0);
      } else {
        setHighlightIndex(-1);
      }
      return;
    }
    setLoading(true);
    try {
      const { data: res } = await api.get("core/productos/", {
        params: { id_marca: idMarca, search: searchVal }
      });
      const dataArray = res && res.ok && Array.isArray(res.data) ? res.data : [];
      setResults(dataArray);
      if (dataArray.length > 0) {
        setHighlightIndex(0);
      } else {
        setHighlightIndex(-1);
      }
      cacheRef.current[cacheKey] = dataArray;
    } catch (err) {
      console.error("❌ Error buscando productos:", err);
      setResults([]);
      setHighlightIndex(-1);
    } finally {
      setLoading(false);
    }
  };

  // Debounce API call on query change
  useEffect(() => {
    if (!showDropdown || !idMarca) return;

    const t = setTimeout(() => {
      fetchResults(query.trim());
    }, 300);

    return () => clearTimeout(t);
  }, [query, showDropdown, idMarca]);

  const handleFocus = () => {
    if (!idMarca) return;
    setShowDropdown(true);
    setIsFocused(true);
    fetchResults(query.trim());
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
      setHighlightIndex(-1);
      if (query !== value) {
        onSelect({ codigo: query, isCustom: true });
      }
    }, 150);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && results[highlightIndex]) {
        handleSelectOption(results[highlightIndex]);
      } else {
        setShowDropdown(false);
        setHighlightIndex(-1);
        if (query !== value) {
          onSelect({ codigo: query, isCustom: true });
        }
      }
    } else if (e.key === "Tab" || e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
      if (query !== value) {
        onSelect({ codigo: query, isCustom: true });
      }
    }
  };

  const handleSelectOption = (item) => {
    setQuery(item.codigo);
    setShowDropdown(false);
    setHighlightIndex(-1);
    onSelect(item);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center px-1 py-0.5 rounded transition-all w-full justify-center font-bold text-xs"
    >
      {isReadOnly ? (
        <span className="font-bold text-gray-800 uppercase tracking-tight truncate max-w-[150px]">
          {value || "---"}
        </span>
      ) : (
        <div className="relative flex items-center w-full justify-center">
          <span
            ref={spanRef}
            className="absolute -top-[9999px] -left-[9999px] invisible whitespace-pre font-bold text-xs uppercase px-1"
          >
            {query || (idMarca ? placeholder : "Selecciona marca")}
          </span>
          <input
            ref={inputRef}
            type="text"
            tabIndex={tabIndex}
            className="bg-transparent hover:bg-white focus:bg-white border border-gray-200 rounded px-1 py-0.5 font-bold text-gray-800 uppercase outline-none text-[11px] transition-all text-center w-full focus:ring-1 focus:ring-teal-500"
            value={query}
            onFocus={(e) => {
              e.target.select();
              handleFocus();
            }}
            onBlur={handleBlur}
            onClick={(e) => {
              e.target.select();
              if (!showDropdown) handleFocus();
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!showDropdown) {
                setShowDropdown(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={idMarca ? placeholder : "Marca..."}
            disabled={!idMarca}
          />
          {showDropdown && idMarca && (results.length > 0 || loading) && createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: `${coords.top + 2}px`,
                left: `${coords.left}px`,
                width: `${Math.max(280, coords.width)}px`,
                zIndex: 9999,
                pointerEvents: "auto",
              }}
              onMouseDown={(e) => e.preventDefault()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-md border border-slate-100/80 rounded-2xl shadow-xl shadow-slate-200/40 max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2 duration-200 text-left pointer-events-auto"
            >
              {loading ? (
                <div className="p-3 text-center text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Buscando...</div>
              ) : (
                results.map((prod, index) => (
                  <div
                    key={prod.id_producto}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectOption(prod);
                    }}
                    className={`px-3 py-2 text-[10px] cursor-pointer rounded-lg mb-0.5 last:mb-0 transition-all duration-150 border-l-2
                      ${highlightIndex === index 
                        ? "bg-teal-50/80 text-teal-950 border-teal-500 font-semibold" 
                        : "hover:bg-slate-50/80 text-slate-700 border-transparent"}`}
                  >
                    <div className="font-black uppercase">
                      {highlightMatch(prod.codigo, query)}
                    </div>
                    <div className={`text-[9px] font-semibold mt-0.5 line-clamp-1 transition-colors
                      ${highlightIndex === index ? "text-teal-900" : "text-slate-500"}`}>
                      {prod.nombre}
                    </div>
                    <div className={`text-[8px] mt-0.5 font-bold transition-colors
                      ${highlightIndex === index ? "text-teal-700" : "text-slate-400"}`}>
                      S/. {prod.precio_soles} | $ {prod.precio_dolares}
                    </div>
                  </div>
                ))
              )}
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  );
};

export const TipoPersonalAutocomplete = ({ value, idArea, onSelect, isReadOnly, tabIndex, placeholder = "Buscar personal...", onKeyDown }) => {
  const [query, setQuery] = useState("");
  const [allPersonal, setAllPersonal] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [width, setWidth] = useState(120);
  const [isFocused, setIsFocused] = useState(false);

  const containerRef = useRef(null);
  const spanRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Sync with parent value
  useEffect(() => {
    if (!isFocused) {
      setQuery(value || "");
    }
  }, [value, isFocused]);

  // Load all personal for this area
  useEffect(() => {
    if (!idArea) {
      setAllPersonal([]);
      return;
    }
    const loadPersonal = async () => {
      setLoading(true);
      try {
        const { data: res } = await api.get("core/tipo_personal/");
        const dataArray = res && res.ok && Array.isArray(res.data) ? res.data : [];
        const filteredByArea = dataArray.filter(
          (r) => r.id_area && String(r.id_area) === String(idArea) && r.activo === 1
        );
        setAllPersonal(filteredByArea);
      } catch (err) {
        console.error("❌ Error cargando tipo personal:", err);
        setAllPersonal([]);
      } finally {
        setLoading(false);
      }
    };
    loadPersonal();
  }, [idArea]);

  // Measure text width dynamically
  useEffect(() => {
    if (spanRef.current) {
      const measured = spanRef.current.offsetWidth;
      setWidth(Math.max(120, Math.min(260, measured + 12)));
    }
  }, [query]);

  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (!showDropdown) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      updateCoords();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      active = false;
    };
  }, [showDropdown]);

  useEffect(() => {
    if (showDropdown && highlightIndex >= 0 && dropdownRef.current) {
      const container = dropdownRef.current;
      const items = container.querySelectorAll(".cursor-pointer");
      const activeItem = items[highlightIndex];
      if (activeItem) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const flexOffsetTop = activeItem.offsetTop;
        const flexOffsetHeight = activeItem.offsetHeight;

        if (flexOffsetTop < containerTop) {
          container.scrollTop = flexOffsetTop;
        } else if (flexOffsetTop + flexOffsetHeight > containerBottom) {
          container.scrollTop = flexOffsetTop + flexOffsetHeight - container.clientHeight;
        }
      }
    }
  }, [highlightIndex, showDropdown]);

  const fetchResults = (searchVal) => {
    const queryText = searchVal.toLowerCase().trim();
    const filtered = queryText
      ? allPersonal.filter(
          (r) =>
            r.codigo?.toLowerCase().includes(queryText) ||
            r.nombre?.toLowerCase().includes(queryText)
        )
      : allPersonal;

    const mappedOptions = filtered.map((p) => ({
      ...p,
      id: p.codigo,
      displayName: `${p.codigo}-${p.nombre}`
    }));

    setResults(mappedOptions);
    if (mappedOptions.length > 0) {
      setHighlightIndex(0);
    } else {
      setHighlightIndex(-1);
    }
  };

  useEffect(() => {
    fetchResults(query);
  }, [query, allPersonal]);

  const handleFocus = () => {
    setShowDropdown(true);
    setIsFocused(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
      setHighlightIndex(-1);
    }, 150);
  };

  const handleKeyDownInternal = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      if (showDropdown && highlightIndex >= 0 && results[highlightIndex]) {
        e.preventDefault();
        handleSelectOption(results[highlightIndex]);
      } else {
        setShowDropdown(false);
        setHighlightIndex(-1);
        if (onKeyDown) {
          onKeyDown(e);
        }
      }
    } else if (e.key === "Tab" || e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
    }
  };

  const handleSelectOption = (item) => {
    const codeName = `${item.codigo}-${item.nombre}`;
    setQuery(codeName);
    setShowDropdown(false);
    setHighlightIndex(-1);
    onSelect(item);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center px-1 py-0.5 rounded transition-all w-full justify-start font-bold text-xs"
    >
      {isReadOnly ? (
        <span className="font-bold text-gray-800 uppercase tracking-tight truncate max-w-[150px]">
          {value || "---"}
        </span>
      ) : (
        <div className="relative flex items-center w-full">
          <span
            ref={spanRef}
            className="absolute -top-[9999px] -left-[9999px] invisible whitespace-pre font-bold text-xs uppercase px-1"
          >
            {query || (idArea ? placeholder : "Selecciona área")}
          </span>
          <input
            ref={inputRef}
            type="text"
            tabIndex={tabIndex}
            className="bg-transparent hover:bg-white focus:bg-white border border-gray-200 rounded px-1.5 py-0.5 font-bold text-gray-800 uppercase outline-none text-[11px] transition-all w-full focus:ring-1 focus:ring-indigo-500"
            value={query}
            onFocus={(e) => {
              e.target.select();
              handleFocus();
            }}
            onBlur={handleBlur}
            onClick={(e) => {
              e.target.select();
              if (!showDropdown) handleFocus();
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!showDropdown) {
                setShowDropdown(true);
              }
            }}
            onKeyDown={handleKeyDownInternal}
            placeholder={idArea ? placeholder : "Selecciona área..."}
            disabled={!idArea}
          />
          {showDropdown && idArea && (results.length > 0 || loading) && createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: `${coords.top + 2}px`,
                left: `${coords.left}px`,
                width: `${Math.max(300, coords.width)}px`,
                zIndex: 9999,
                pointerEvents: "auto",
              }}
              onMouseDown={(e) => e.preventDefault()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2 duration-200 text-left pointer-events-auto"
            >
              {loading ? (
                <div className="p-3 text-center text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Cargando...</div>
              ) : (
                results.map((item, index) => (
                  <div
                    key={item.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectOption(item);
                    }}
                    className={`px-3 py-2 cursor-pointer rounded-lg mb-1 last:mb-0 transition-all duration-150 border-l-4 text-left
                      ${highlightIndex === index 
                        ? "bg-indigo-50/70 text-indigo-950 border-indigo-500 font-semibold shadow-sm" 
                        : "hover:bg-slate-50 text-slate-700 border-transparent"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded shrink-0">
                        {item.codigo}
                      </span>
                      <span className="font-extrabold text-[11.5px] uppercase tracking-wide text-slate-800 truncate">
                        {item.nombre}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 pl-0.5 text-[9.5px] font-bold">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 uppercase tracking-tighter text-[9px]">MÍNIMO:</span>
                        <span className="text-indigo-600 font-black bg-indigo-50/50 border border-indigo-100/50 px-1.5 py-0.5 rounded">${parseFloat(item.costo_min || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 uppercase tracking-tighter text-[9px]">MÁXIMO:</span>
                        <span className="text-emerald-600 font-black bg-emerald-50/50 border border-emerald-100/50 px-1.5 py-0.5 rounded">${parseFloat(item.costo_max || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  );
};

export const TipoGastoDetalleAutocomplete = ({ value, codePrefix, onSelect, isReadOnly, tabIndex, placeholder = "Buscar gasto...", onKeyDown }) => {
  const [query, setQuery] = useState("");
  const [allGastos, setAllGastos] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  const containerRef = useRef(null);
  const spanRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Sync with parent value
  useEffect(() => {
    if (!isFocused) {
      setQuery(value || "");
    }
  }, [value, isFocused]);

  // Load all expenses
  useEffect(() => {
    const loadGastos = async () => {
      setLoading(true);
      try {
        const { data: res } = await api.get("core/tipo_gasto_detalle/");
        const dataArray = res && res.ok && Array.isArray(res.data) ? res.data : [];
        const activeGastos = dataArray.filter((r) => r.activo === 1);
        setAllGastos(activeGastos);
      } catch (err) {
        console.error("❌ Error cargando tipo gasto detalle:", err);
        setAllGastos([]);
      } finally {
        setLoading(false);
      }
    };
    loadGastos();
  }, []);

  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (!showDropdown) return;
    let active = true;
    const tick = () => {
      if (!active) return;
      updateCoords();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => {
      active = false;
    };
  }, [showDropdown]);

  useEffect(() => {
    if (showDropdown && highlightIndex >= 0 && dropdownRef.current) {
      const container = dropdownRef.current;
      const items = container.querySelectorAll(".cursor-pointer");
      const activeItem = items[highlightIndex];
      if (activeItem) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const flexOffsetTop = activeItem.offsetTop;
        const flexOffsetHeight = activeItem.offsetHeight;

        if (flexOffsetTop < containerTop) {
          container.scrollTop = flexOffsetTop;
        } else if (flexOffsetTop + flexOffsetHeight > containerBottom) {
          container.scrollTop = flexOffsetTop + flexOffsetHeight - container.clientHeight;
        }
      }
    }
  }, [highlightIndex, showDropdown]);

  const fetchResults = (searchVal) => {
    const queryText = searchVal.toLowerCase().trim();
    let filtered = allGastos;
    if (codePrefix) {
      filtered = filtered.filter((r) => r.codigo && r.codigo.startsWith(codePrefix));
    }
    if (queryText) {
      filtered = filtered.filter(
        (r) =>
          r.codigo?.toLowerCase().includes(queryText) ||
          r.nombre?.toLowerCase().includes(queryText)
      );
    }

    const mappedOptions = filtered.map((g) => ({
      ...g,
      id: g.codigo,
      displayName: `${g.codigo}-${g.nombre}`
    }));

    setResults(mappedOptions);
    if (mappedOptions.length > 0) {
      setHighlightIndex(0);
    } else {
      setHighlightIndex(-1);
    }
  };

  useEffect(() => {
    fetchResults(query);
  }, [query, allGastos, codePrefix]);

  const handleFocus = () => {
    setShowDropdown(true);
    setIsFocused(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowDropdown(false);
      setHighlightIndex(-1);
    }, 150);
  };

  const handleKeyDownInternal = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      if (showDropdown && highlightIndex >= 0 && results[highlightIndex]) {
        e.preventDefault();
        handleSelectOption(results[highlightIndex]);
      } else {
        setShowDropdown(false);
        setHighlightIndex(-1);
        if (onKeyDown) {
          onKeyDown(e);
        }
      }
    } else if (e.key === "Tab" || e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
    }
  };

  const handleSelectOption = (item) => {
    setQuery(item.codigo);
    setShowDropdown(false);
    setHighlightIndex(-1);
    onSelect(item);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center px-1 py-0.5 rounded transition-all w-full justify-start font-bold text-xs"
    >
      {isReadOnly ? (
        <span className="font-bold text-gray-800 uppercase tracking-tight truncate max-w-[150px]">
          {value || "---"}
        </span>
      ) : (
        <div className="relative flex items-center w-full">
          <span
            ref={spanRef}
            className="absolute -top-[9999px] -left-[9999px] invisible whitespace-pre font-bold text-xs uppercase px-1"
          >
            {query || placeholder}
          </span>
          <input
            ref={inputRef}
            type="text"
            tabIndex={tabIndex}
            className="bg-transparent hover:bg-white focus:bg-white border border-gray-200 rounded px-1.5 py-0.5 font-bold text-gray-800 uppercase outline-none text-[11px] transition-all w-full focus:ring-1 focus:ring-indigo-500"
            value={query}
            onFocus={(e) => {
              e.target.select();
              handleFocus();
            }}
            onBlur={handleBlur}
            onClick={(e) => {
              e.target.select();
              if (!showDropdown) handleFocus();
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!showDropdown) {
                setShowDropdown(true);
              }
            }}
            onKeyDown={handleKeyDownInternal}
            placeholder={placeholder}
          />
          {showDropdown && (results.length > 0 || loading) && createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: "fixed",
                top: `${coords.top + 2}px`,
                left: `${coords.left}px`,
                width: `${Math.max(300, coords.width)}px`,
                zIndex: 9999,
                pointerEvents: "auto",
              }}
              onMouseDown={(e) => e.preventDefault()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2 duration-200 text-left pointer-events-auto"
            >
              {loading ? (
                <div className="p-3 text-center text-xs text-slate-400 font-bold uppercase tracking-wider animate-pulse">Cargando...</div>
              ) : (
                results.map((item, index) => (
                  <div
                    key={item.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectOption(item);
                    }}
                    className={`px-3 py-2 cursor-pointer rounded-lg mb-1 last:mb-0 transition-all duration-150 border-l-4 text-left
                      ${highlightIndex === index 
                        ? "bg-teal-50 text-teal-950 border-teal-500 font-semibold shadow-sm" 
                        : "hover:bg-slate-50 text-slate-700 border-transparent"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-black text-teal-650 bg-teal-50 border border-teal-100 rounded shrink-0">
                        {item.codigo}
                      </span>
                      <span className="font-extrabold text-[11.5px] uppercase tracking-wide text-slate-800 truncate">
                        {item.nombre}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  );
};
