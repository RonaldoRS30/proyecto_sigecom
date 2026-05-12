export function CardERP({ title, value, accent = "gray" }) {
  const accents = {
    gray: "bg-gray-50 border-gray-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
  };

  return (
    <div className={`
      p-3
      rounded-xl
      shadow
      border
      ${accents[accent]}
      flex
      flex-col
      items-start
    `}>
      <p className="uppercase text-[10px] font-semibold text-gray-500">
        {title}
      </p>
      <p className="font-bold text-gray-800 text-sm">
        {value}
      </p>
    </div>
  );
}
