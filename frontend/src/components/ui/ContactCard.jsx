import AutocompleteField from "./AutocompleteInput";

export default function ContactCard({
  label,
  query,
  data,
  onChangeQuery,
  onSelect,
  results = [],
  loading = false,
  isReadOnly = false,
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 space-y-2 text-xs">
      <h4 className="text-xs font-semibold border-b pb-1">{label}</h4>

      <AutocompleteField
        label={label}
        value={query || data[`nomb${label[0].toLowerCase()}`] || ""}
        onChange={onChangeQuery}
        onSelect={onSelect}
        data={results}
        loading={loading}
        disabled={isReadOnly}
        placeholder={`Buscar ${label.toLowerCase()}...`}
      />

      {/* Campos de contacto */}
      <div className="grid grid-cols-1 gap-2">
        <input
          value={data[`tele${label[0].toLowerCase()}`] || ""}
          readOnly
          placeholder="Teléfono"
          className="w-full border rounded-md px-2 py-1 text-xs bg-gray-100"
        />
        <input
          value={data[`mov1${label[0].toLowerCase()}`] || ""}
          readOnly
          placeholder="Móvil 01"
          className="w-full border rounded-md px-2 py-1 text-xs bg-gray-100"
        />
        <input
          value={data[`mov2${label[0].toLowerCase()}`] || ""}
          readOnly
          placeholder="Móvil 02"
          className="w-full border rounded-md px-2 py-1 text-xs bg-gray-100"
        />
        <input
          value={data[`mov3${label[0].toLowerCase()}`] || ""}
          readOnly
          placeholder="Móvil 03"
          className="w-full border rounded-md px-2 py-1 text-xs bg-gray-100"
        />
        <input
          value={data[`mail${label[0].toLowerCase()}`] || ""}
          readOnly
          placeholder="Email"
          className="w-full border rounded-md px-2 py-1 text-xs bg-gray-100"
        />
      </div>
    </div>
  );
}
