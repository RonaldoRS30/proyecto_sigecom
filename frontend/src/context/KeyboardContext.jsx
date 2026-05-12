import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";

/**
 * ============================================================
 * KEYBOARD CONTEXT — PMInsight (v2)
 * ============================================================
 * Sistema global de shortcuts:
 *  - Dashboards
 *  - Modales
 *  - Sub-modales
 *  - Tablas
 *
 * Soporta:
 *  - Ctrl / Cmd
 *  - prioridades
 *  - stack de scopes
 *  - bloqueo en inputs
 *  - listeners múltiples
 * ============================================================
 */

const KeyboardContext = createContext(null);

export function KeyboardProvider({ children }) {
  const handlersRef = useRef([]);

  /** Stack de scopes activos */
  const scopeStackRef = useRef(["global"]);
  const [, forceRender] = useState(0);

    useEffect(() => {
    console.log("⌨️ KeyboardProvider activo");
    }, []);

  /* =====================================================
     MANEJO DE SCOPES
  ====================================================== */
  const pushScope = useCallback((scope) => {
    scopeStackRef.current.push(scope);
    forceRender((n) => n + 1);
  }, []);

  const popScope = useCallback(() => {
    scopeStackRef.current.pop();
    forceRender((n) => n + 1);
  }, []);

  const getActiveScope = useCallback(
    () => scopeStackRef.current[scopeStackRef.current.length - 1],
    []
  );

  /* =====================================================
     REGISTRAR ATAJO
  ====================================================== */
  const registerShortcut = useCallback(
    (combo, callback, options = {}) => {
      const {
        priority = 0,
        preventDefault = true,
        allowInInputs = false,
        scope = "global",
        description,
      } = options;

      const entry = {
        combo: combo.toLowerCase(),
        callback,
        priority,
        preventDefault,
        allowInInputs,
        scope,
        description,
      };

      handlersRef.current.push(entry);

      handlersRef.current.sort((a, b) => b.priority - a.priority);

      return () => {
        handlersRef.current = handlersRef.current.filter(
          (h) => h !== entry
        );
      };
    },
    []
  );

  /* =====================================================
     LISTENER GLOBAL
  ====================================================== */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // console.log("KEY:", {
      //     key: e.key,
      //     ctrl: e.ctrlKey,
      //     shift: e.shiftKey,
      //     alt: e.altKey,
      //     target: e.target.tagName,
      // });

      const tag = e.target.tagName;

      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(tag) ||
        e.target.isContentEditable
      ) {
        const anyAllows = handlersRef.current.some(
          (h) => h.allowInInputs
        );
        if (!anyAllows) return;
      }

      const combo = [
        e.ctrlKey || e.metaKey ? "ctrl" : "",
        e.shiftKey ? "shift" : "",
        e.altKey ? "alt" : "",
        e.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join("+");

      const activeScope = getActiveScope();

      // console.log("HANDLERS:", handlersRef.current);

      for (const h of handlersRef.current) {
        if (
          h.combo === combo &&
          (h.scope === activeScope || h.scope === "global")
        ) {
          if (h.preventDefault) e.preventDefault();
          h.callback(e);
          break;
        }
      }
        // console.log("COMBO:", combo);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [getActiveScope]);

  /* =====================================================
     ATAJOS GLOBALES BASE
  ====================================================== */
  useEffect(() => {
    console.log("Registrando atajos globales base...");
    const cleanups = [];

    cleanups.push(
    registerShortcut(
        "ctrl+b",
        () => {
        console.log("🔥 CTRL+B disparado");
        window.dispatchEvent(new CustomEvent("pm:open-search"));
        },
        { description: "Buscador global" }
    )
    );


    cleanups.push(
      registerShortcut("ctrl+n", () => {
        window.dispatchEvent(new CustomEvent("pm:new-record"));
      }, { description: "Nuevo" })
    );

    cleanups.push(
      registerShortcut("ctrl+s", () => {
        window.dispatchEvent(new CustomEvent("pm:save"));
      }, { description: "Guardar" })
    );

    cleanups.push(
      registerShortcut("escape", () => {
        window.dispatchEvent(new CustomEvent("pm:close-modal"));
      }, { priority: 50 })
    );

    cleanups.push(
      registerShortcut("delete", () => {
        window.dispatchEvent(new CustomEvent("pm:delete"));
      }, { priority: 30 })
    );

    return () => cleanups.forEach((fn) => fn());
  }, [registerShortcut]);

  return (
    <KeyboardContext.Provider
      value={{
        registerShortcut,
        pushScope,
        popScope,
        getActiveScope,
      }}
    >
      {children}
    </KeyboardContext.Provider>
  );
}

/* =====================================================
   HOOK
===================================================== */
export function useKeyboard() {
  const ctx = useContext(KeyboardContext);

  if (!ctx) {
    throw new Error(
      "useKeyboard debe usarse dentro de KeyboardProvider"
    );
  }

  return ctx;
}

