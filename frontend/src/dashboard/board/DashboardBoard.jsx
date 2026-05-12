import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

import WidgetRenderer from "./WidgetRenderer";
import AddWidgetModal from "./AddWidgetModal";

export default function DashboardBoard({ module }) {
  const [widgets, setWidgets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

  // Detecta tamaño del contenedor
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Ajuste automático: escala widgets si se reduce el ancho
  useEffect(() => {
    setWidgets((prev) =>
      prev.map((w) => {
        let scaleX = 1;
        let scaleY = 1;

        // Si el widget se sale a la derecha
        if (w.x + w.w > containerSize.width) {
          scaleX = (containerSize.width - w.x - 20) / w.w;
        }

        // Si el widget se sale abajo
        if (w.y + w.h > containerSize.height) {
          scaleY = (containerSize.height - w.y - 20) / w.h;
        }

        const scale = Math.min(scaleX, scaleY, 1);

        return {
          ...w,
          w: Math.max(150, w.w * scale),
          h: Math.max(100, w.h * scale),
        };
      })
    );
  }, [containerSize]);

  const handleAddWidget = (widget) => {
    // Coloca widgets de manera ordenada en filas y columnas según el contenedor
    const padding = 20;
    let x = padding;
    let y = padding;

    // Encuentra la primera posición libre
    widgets.forEach((w) => {
      if (x + w.w + padding > containerSize.width) {
        x = padding;
        y += w.h + padding;
      } else {
        x += w.w + padding;
      }
    });

    setWidgets((prev) => [
      ...prev,
      {
        ...widget,
        id: widget.id,
        x,
        y,
        w: Math.min(300, containerSize.width / 2),
        h: Math.min(200, containerSize.height / 2),
      },
    ]);
  };

  const handleRemove = (id) => setWidgets((prev) => prev.filter((w) => w.id !== id));
  const updatePosition = (id, x, y) =>
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  const updateSize = (id, w, h) =>
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, w, h } : w)));

  return (
    <div
      className="space-y-4 w-full h-screen flex flex-col p-4 bg-gray-50"
      ref={containerRef}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-lg">Dashboard Dinámico</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm shadow transition"
        >
          + Agregar gráfico
        </button>
      </div>

      {/* TABLERO */}
      <div className="flex-1 relative w-full bg-gray-50 rounded-2xl border border-gray-200">
        {widgets.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 italic select-none">
            No hay widgets. Agrega uno para empezar.
          </div>
        )}

        {widgets.map((w) => (
          <Draggable
            key={w.id}
            bounds="parent"
            position={{ x: w.x, y: w.y }}
            handle=".widget-drag"
            onStop={(e, data) => updatePosition(w.id, data.x, data.y)}
          >
            <ResizableBox
              width={w.w}
              height={w.h}
              minConstraints={[150, 100]}
              maxConstraints={[
                containerSize.width - w.x - 10,
                containerSize.height - w.y - 10,
              ]}
              onResizeStop={(e, { size }) => updateSize(w.id, size.width, size.height)}
            >
              <div className="bg-white rounded-2xl shadow-md p-3 flex flex-col h-full w-full absolute">
                {/* HEADER WIDGET */}
                <div className="flex justify-between items-center mb-2 cursor-move widget-drag select-none">
                  <span className="font-medium text-sm truncate">{w.title}</span>
                  <button
                    onClick={() => handleRemove(w.id)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    ✕
                  </button>
                </div>
                {/* CONTENIDO */}
                <div className="flex-1 overflow-hidden">
                  <WidgetRenderer widget={w} />
                </div>
              </div>
            </ResizableBox>
          </Draggable>
        ))}
      </div>

      {/* MODAL */}
      <AddWidgetModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddWidget}
      />
    </div>
  );
}
