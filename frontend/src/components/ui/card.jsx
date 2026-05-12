import * as React from "react";

const Card = React.forwardRef(({ className = "", compact = false, ...props }, ref) => {
  const paddingClass = compact ? "p-[clamp(8px,1.5vw,12px)]" : "p-4";
  return <div ref={ref} className={`w-full rounded-2xl border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-700 ${paddingClass} ${className}`} {...props} />;
});
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className = "", compact = false, ...props }, ref) => {
  const paddingClass = compact ? "p-[clamp(6px,1vw,10px)]" : "p-4";
  return <div ref={ref} className={`w-full border-b border-gray-200 dark:border-gray-700 ${paddingClass} ${className}`} {...props} />;
});
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className = "", ...props }, ref) => (
  <h3 ref={ref} className={`text-lg font-semibold leading-none tracking-tight text-gray-800 dark:text-gray-100 ${className}`} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className = "", ...props }, ref) => (
  <p ref={ref} className={`text-xs text-gray-500 dark:text-gray-400 ${className}`} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className = "", compact = false, ...props }, ref) => {
  const paddingClass = compact ? "p-[clamp(6px,1vw,10px)]" : "p-4";
  return <div ref={ref} className={`w-full space-y-2 ${paddingClass} ${className}`} {...props} />;
});
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className = "", align = "end", compact = false, ...props }, ref) => {
  const paddingClass = compact ? "p-[clamp(6px,1vw,10px)]" : "p-4";
  const alignment = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" }[align];
  return <div ref={ref} className={`w-full flex items-center gap-2 ${paddingClass} border-t border-gray-200 dark:border-gray-700 ${alignment} ${className}`} {...props} />;
});
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
