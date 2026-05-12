import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Loader, Search, MoreHorizontal, ChartSpline, Plus, UserCheck 
} from "lucide-react";
import api from "@/services/api";
import { toast } from "react-toastify";

import Table from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RepresentanteModal from "../Modal/RepresentanteModal";

const fetchRepresentantes = async () => {
  const { data } = await api.get("cotizaciones/representantes/");
  // Filtramos: que el nombre del representante no sea nulo o vacío
  return data.filter(r => r.representante !== null && r.representante.trim() !== "");
};

export default function TablaRepresentantes() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  
  // ESTADOS PARA EL MODAL
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRep, setSelectedRep] = useState(null);

  const { data: representantes = [], isLoading, isFetching } = useQuery({
    queryKey: ["maestra-representantes"],
    queryFn: fetchRepresentantes,
  });

  // MUTACIÓN PARA GUARDAR/ACTUALIZAR
  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      const esEdicion = !!selectedRep; 
      if (esEdicion) {
        return await api.put(`cotizaciones/representantes/`, formData);
      } else {
        return await api.post("cotizaciones/representantes/", formData);
      }
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(["maestra-representantes"]);
      
      const mensaje = response.data?.message || "Operación exitosa";
      toast.success(mensaje, {
        description: `El representante se ${selectedRep ? 'actualizó' : 'registró'} correctamente.`
      });

      setModalOpen(false);
      setSelectedRep(null);
    },
    onError: (error) => {
      const errorData = error.response?.data;
      const mensajeError = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
      
      toast.error("Error al guardar", {
        description: mensajeError || "No se pudo conectar con el servidor"
      });
    }
  });

  // MUTACIÓN PARA ELIMINAR
  const deleteMutation = useMutation({
    mutationFn: async (codigo) => {
      return await api.delete(`cotizaciones/representantes/`, { 
        data: { codigo: codigo } 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["maestra-representantes"]);
      toast.success("Representante eliminado correctamente");
      setModalOpen(false);
      setSelectedRep(null);
    },
    onError: (error) => {
      const msg = error.response?.data?.error || "Error al eliminar";
      toast.error("No se pudo eliminar", {
        description: msg
      });
    }
  });

  const handleEdit = (rep) => {
    setSelectedRep(rep);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedRep(null);
    setModalOpen(true);
  };

  // FILTRO MULTICAMPO: Nombre, Cargo, Empresa o Código
  const repsFiltrados = representantes.filter(r => 
    r.representante?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.codigo).includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full p-6">
      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre, cargo o empresa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-all h-9 text-sm rounded-md shadow-sm"
            />
          </div>

          <Button 
            onClick={handleNew}
            className="bg-cyan-600 hover:bg-cyan-700 text-white h-9 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-cyan-100 flex gap-2 items-center"
          >
            <Plus size={16} strokeWidth={3} />
            Nuevo Representante
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
            <ChartSpline className="w-4 h-4 text-slate-500" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg">
            <MoreHorizontal className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      </div>

      {/* TABLA */}
      <div className="flex-1 overflow-auto relative rounded-xl border border-slate-200 bg-white shadow-sm">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader className="w-8 h-8 animate-spin text-cyan-600" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sincronizando</span>
            </div>
          </div>
        )}

        <Table
          headers={[
            "Código", "Representante", "Cargo", "Contacto", "Email", "Empresa", "Estado"
          ].map((h) => (
            <span key={h} className="text-xs font-black py-2 uppercase tracking-widest text-slate-700 text-center block">
              {h}
            </span>
          ))}
          
          data={repsFiltrados}
          onRowClick={(rep) => handleEdit(rep)} 

          renderRow={(rep) => [
            // Código con ceros a la izquierda si el backend no lo envía así
            <span className="text-xs font-bold text-slate-600 text-center block">
              {String(rep.codigo).padStart(5, '0')}
            </span>,

            // Representante
            <span className="text-xs font-semibold text-slate-800 text-left block px-4">
              {rep.representante}
            </span>,

            // Cargo
            <span className="text-[11px] font-medium text-slate-500 text-center block italic">
              {rep.cargo || "-"}
            </span>,

            // Teléfono / Móvil
            <div className="flex flex-col text-center">
              <span className="text-xs font-mono font-bold text-slate-700">{rep.telefono || rep.movil || "-"}</span>
              {rep.telefono && rep.movil && <span className="text-[9px] text-slate-400">{rep.movil}</span>}
            </div>,

            // Email
            <span className="text-xs text-blue-600 text-center block underline decoration-blue-200 underline-offset-2">
              {rep.email || "-"}
            </span>,

            // Empresa
            <span className="text-[10px] font-bold text-slate-600 text-center block uppercase bg-slate-100 rounded py-0.5 px-1 mx-2 truncate">
              {rep.empresa}
            </span>,

            // Estado
            <div className="flex justify-center">
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                rep.activo === "1" || rep.activo === true
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                  : "bg-slate-50 text-slate-500 border-slate-100"
              }`}>
                {(rep.activo === "1" || rep.activo === true) ? "Activo" : "Inactivo"}
              </span>
            </div>
          ]}
        />
      </div>

      {/* MODAL */}
      {modalOpen && (
        <RepresentanteModal 
            open={modalOpen}
            onClose={() => {
            setModalOpen(false);
            setSelectedRep(null);
            }}
            repData={selectedRep}
            representantes={representantes} // <--- ESTO ES LO QUE FALTABA
            onGuardar={(data) => saveMutation.mutate(data)}
            onEliminar={(codigo) => deleteMutation.mutate(codigo)}
        />
      )}
    </div>
  );
}