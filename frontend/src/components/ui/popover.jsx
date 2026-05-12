import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export const JiraPopover = ({ trigger, children, isOpen, setIsOpen }) => {
  const popoverRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Evitar scroll del body cuando el popover está abierto (opcional)
      // document.body.style.overflow = 'hidden'; 
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // document.body.style.overflow = 'unset';
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* TRIGGER */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ zIndex: 999 }}
            /* ANCHO: Cambiado de 600px a 750px para hacerlo más largo.
               Puedes usar w-[800px] si quieres aún más largo.
            */
            className="absolute left-0 mt-3 w-[900px] bg-white rounded-[1.25rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.18)] border border-slate-200/80 overflow-hidden"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50/60 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-teal-400 animate-ping opacity-75" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/90">
                  Panel de Filtros Avanzados
                </span>
              </div>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-200/60 rounded-full transition-all text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CONTENIDO COMPACTO: 
                - He reducido el padding vertical (py-2) para eliminar espacios en blanco.
                - Si tus filtros internos tienen márgenes (ej. mb-4), deberás quitarlos 
                  en el componente que le pasas como 'children'.
            */}
            <div className="px-6 py-1.5 max-h-[70vh] overflow-y-auto custom-scrollbar bg-white">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};