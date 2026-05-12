import { cn } from "@/lib/utils";

export const CompactField = ({ label, value, children, color = "text-gray-900", className = "" }) => (
  <div className={cn("flex flex-col space-y-0.5", className)}>
    <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-tighter">
      {label}
    </span>

    {children ? (
      children
    ) : (
      <span className={cn("text-[10.5px] font-black truncate", color)}>
        {value || '---'}
      </span>
    )}
  </div>
);