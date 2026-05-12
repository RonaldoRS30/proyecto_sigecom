import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-md bg-gray-100 p-1 text-gray-600 shadow-sm",
      "gap-1", // más compacto entre tabs
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md",
      "px-2.5 py-1 text-xs sm:text-xs font-medium", // más compacto
      "transition-all",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
      "data-[state=inactive]:text-gray-600",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      // 1. Quitamos fondo, bordes y sombras para que sea un contenedor invisible
      "mt-0 ", 
      
      // 2. Mantenemos un padding consistente para que el contenido no toque los bordes del modal
      "p-0", 

      // 3. Comportamiento base
      "w-full min-h-0",

      className
    )}
    {...props}
  />
))

TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
