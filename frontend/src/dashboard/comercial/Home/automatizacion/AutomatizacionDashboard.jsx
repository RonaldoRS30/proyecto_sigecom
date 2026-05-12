// src/dashboard/automatizacion/AutomatizacionDashboard.jsx
import React from "react";

export default function AutomatizacionDashboard() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Automatización</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4 shadow rounded">
          <h3 className="font-semibold mb-2">Correos Automáticos</h3>
          <p>Programar envío mensual de reportes de objetivos.</p>
        </div>
        <div className="card p-4 shadow rounded">
          <h3 className="font-semibold mb-2">Recordatorios y Alertas</h3>
          <p>Configurar alertas y notificaciones personalizadas.</p>
        </div>
        <div className="card p-4 shadow rounded">
          <h3 className="font-semibold mb-2">Flujos Automáticos</h3>
          <p>Crear reglas combinadas para procesos repetitivos.</p>
        </div>
      </div>
    </div>
  );
}