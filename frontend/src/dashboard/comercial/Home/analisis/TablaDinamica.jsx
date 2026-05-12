import React from "react";

export default function TablaDinamica({ dimension, metrica }) {

  const data = [
    { name: "Ene", value: 12000 },
    { name: "Feb", value: 15000 },
    { name: "Mar", value: 9000 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">

      <h3 className="text-sm font-semibold mb-4">
        Tabla dinámica ({dimension} - {metrica})
      </h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Grupo</th>
            <th className="text-right py-2">Valor</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b">
              <td>{row.name}</td>
              <td className="text-right">{row.value.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}