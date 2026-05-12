import { useEffect } from "react";

export default function useKeyboardShortcuts({
  enabled = true,

  onNuevoGrupo,
  onNuevoItem,
  onEditarItem,
  onEliminarItem,
  onClose,

  hasItemSelected = false,
  hasGrupoActivo = false,
}) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {

      // 🔒 No disparar dentro de inputs
      const tag = e.target.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.target.isContentEditable) return;

      // ESC
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }

      // CTRL + N → nuevo item
      if (e.ctrlKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (hasGrupoActivo) onNuevoItem?.();
      }

      // CTRL + G → nuevo grupo
      if (e.ctrlKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        onNuevoGrupo?.();
      }

      // CTRL + E → editar item
      if (e.ctrlKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        if (hasItemSelected) onEditarItem?.();
      }

      // DELETE → eliminar
      if (e.key === "Delete") {
        e.preventDefault();
        if (hasItemSelected) onEliminarItem?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);

  }, [
    enabled,
    onNuevoGrupo,
    onNuevoItem,
    onEditarItem,
    onEliminarItem,
    onClose,
    hasItemSelected,
    hasGrupoActivo,
  ]);
}
