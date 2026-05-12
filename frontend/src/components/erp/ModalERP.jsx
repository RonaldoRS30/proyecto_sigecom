import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ModalERP({
  open,
  onClose,
  title,
  children,
  onAccept,
  onReset,
  loading = false,
  size = "lg", // sm | md | lg | xl
}) {
  const sizeClass = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={`
          ${sizeClass}
          bg-white
          rounded-xl
          shadow-lg
          transition-all
          duration-200
        `}
      >
        {/* HEADER */}
        <DialogHeader>
          <DialogTitle className="text-sm font-extrabold text-gray-800">
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* BODY */}
        <div className="space-y-3 text-xs min-h-[120px]">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          ) : (
            children
          )}
        </div>

        {/* FOOTER */}
        <DialogFooter className="flex justify-between items-center mt-4">

          {onReset && (
            <button
              onClick={onReset}
              className="
                text-gray-500
                hover:text-gray-700
                text-xs
                flex
                items-center
                gap-1
              "
            >
              Limpiar
            </button>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              Salir
            </Button>

            {onAccept && (
              <Button
                onClick={onAccept}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                Guardar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
