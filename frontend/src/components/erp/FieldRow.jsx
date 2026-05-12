export function FieldRow({ label, children }) {
  return (
    <div className="flex items-center gap-2">
      <label className="w-28 text-gray-700">
        {label}
      </label>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
