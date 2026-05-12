import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";

const Table = ({
  headers,
  data,
  renderRow,
  emptyMessage = "No hay datos disponibles.",
  activeRow = null,
  rowsPerPage = 10,
  onRowClick,
  fetchData,
  titulo,
  compact = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(data.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    if (fetchData) handleReload({ index: page });
  };

  const handleReload = async (params = {}) => {
    if (!fetchData) return;
    setLoading(true);
    try {
      await fetchData(params);
    } catch (err) {
      console.error("Error recargando tabla:", err);
    } finally {
      setLoading(false);
    }
  };

  // Solo resetea si la cantidad de datos cambia (ej: filtrado), 
  // no si solo cambia el contenido de un registro (ej: edición).
  useEffect(() => {
    if (data.length <= (currentPage - 1) * rowsPerPage) {
      setCurrentPage(1);
    }
  }, [data.length]);

  const cellPaddingClass = compact
    ? "px-[6px] py-[1px] leading-none"
    : "px-3 py-1.5";
  const cardPaddingClass = compact ? "p-2" : "p-3 md:p-4";

  return (
    <div className="relative w-full flex flex-col overflow-hidden">
      {/* TITULO */}
      {titulo && (
        <div className="w-full px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-sm flex items-center justify-between rounded-t-2xl shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-xs truncate">
            {titulo}
          </h3>
        </div>
      )}

      {/* DESKTOP */}
      <div className="hidden md:block w-full flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-blue-400/50 scrollbar-track-gray-100 dark:scrollbar-thumb-blue-600/50 dark:scrollbar-track-gray-800">
        <table className="w-full border-collapse min-w-[720px] text-gray-800 dark:text-gray-100 rounded-2xl text-xs">
          <thead className="sticky top-0 z-10 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-[0_2px_6px_rgba(0,0,0,0.05)] border-b border-gray-200 dark:border-gray-700">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className={`${cellPaddingClass} text-center align-middle font-semibold uppercase tracking-wide
                    ${idx === 0 ? "rounded-tl-2xl" : ""} 
                    ${idx === headers.length - 1 ? "rounded-tr-2xl" : ""}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 text-xs">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIndex) => {
                const rowData = Array.isArray(renderRow(item)) ? renderRow(item) : [renderRow(item)];
                return (
                  <tr
                    key={rowIndex}
                    className={`transition-colors duration-200 ease-out cursor-pointer select-none text-center
                      ${activeRow === (item.id || rowIndex)
                        ? "bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-400 dark:ring-blue-600"
                        : "hover:bg-blue-100/90 dark:hover:bg-blue-700/40"
                      }`}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    {rowData.map((cell, i) => {
                      const isLastRow = rowIndex === paginatedData.length - 1;
                      return (
                        <td
                          key={i}
                          className={`${cellPaddingClass} align-middle break-words max-w-[220px] text-center
                            ${isLastRow && i === 0 ? "rounded-bl-2xl" : ""} 
                            ${isLastRow && i === headers.length - 1 ? "rounded-br-2xl" : ""}`}
                        >
                          {typeof cell === "string" || typeof cell === "number" ? (
                            <Tippy content={cell}>
                              <span
                                className="block truncate cursor-text select-text w-full h-full"
                                // ELIMINADO: onClick={(e) => e.stopPropagation()} 
                                // Para que el click pase al TR
                                onDoubleClick={(e) => e.stopPropagation()} 
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {cell}
                              </span>
                            </Tippy>
                          ) : (
                            <div
                              // ELIMINADO: onClick={(e) => e.stopPropagation()}
                              className="w-full h-full flex items-center justify-center"
                            >
                              {cell}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE */}
      <div className="flex flex-col gap-3 md:hidden">
        {paginatedData.length === 0 ? (
          <div className="px-4 py-5 text-center text-gray-500 italic bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md">
            {emptyMessage}
          </div>
        ) : (
          paginatedData.map((item, index) => {
            const rowData = Array.isArray(renderRow(item)) ? renderRow(item) : [renderRow(item)];
            return (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 ${cardPaddingClass} shadow-lg hover:shadow-xl transition-all duration-300 ease-out cursor-pointer
                  ${activeRow === (item.id || index)
                    ? "ring-2 ring-blue-500 dark:ring-blue-600 bg-blue-100/70 dark:bg-blue-900/40"
                    : "hover:bg-blue-100/90 dark:hover:bg-blue-900/30"
                  }`}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {/* HEADER */}
                <div className="pb-2 mb-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h5 className="text-gray-800 dark:text-gray-100 font-semibold text-xs truncate">
                    {titulo || `Registro ${index + 1}`}
                  </h5>
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {index + 1} / {data.length}
                  </span>
                </div>

                {/* CONTENT */}
                {headers.map((header, i) => {
                  const cell = rowData[i] ?? "-";
                  const isActionButton = typeof cell === "object" && cell?.type?.name === "Button";

                  return (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="font-semibold text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wide w-[42%]">
                        {header}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 text-xs text-center break-words w-[58%]">
                        {!isActionButton ? (
                          typeof cell === "string" || typeof cell === "number" ? (
                            <Tippy content={cell}>
                              <span
                                className="block truncate cursor-text select-text"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {cell}
                              </span>
                            </Tippy>
                          ) : (
                            cell
                          )
                        ) : null}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            );
          })
        )}
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 px-2 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-sm rounded-b-2xl">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/30"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
          >
            {"<<"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/30"
            onClick={() => goToPage(currentPage - 1)} // <--- Antes tenías solo (- 1)
            disabled={currentPage === 1}
          >
            {"<"}
          </Button>
          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/30"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            {">"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/30"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            {">>"}
          </Button>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl z-20">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full"></span>
            <span className="font-medium text-xs">Cargando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
