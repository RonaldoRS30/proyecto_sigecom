import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium rounded-2xl text-xs transition-all duration-300 ease-in-out shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.98] relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 hover:text-gray-900",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        ghost: "bg-transparent hover:bg-gray-100 text-gray-800",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 sm:px-5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-sm",
        icon: "h-10 w-10 sm:h-12 sm:w-12 p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  (
    {
      type = "button",
      className,
      variant,
      size,
      asChild = false,
      fromColor,
      toColor,
      hoverFrom,
      hoverTo,
      loading = false,
      disabled = false,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const [isHover, setIsHover] = React.useState(false);

    const baseGradient =
      fromColor && toColor
        ? `linear-gradient(to right, ${fromColor}, ${toColor})`
        : undefined;

    const hoverGradient =
      hoverFrom && hoverTo
        ? `linear-gradient(to right, ${hoverFrom}, ${hoverTo})`
        : baseGradient;

    const gradientStyle = {
      backgroundImage: isHover ? hoverGradient : baseGradient,
      ...style,
    };

    const contrastColor = getContrastColor(fromColor);

    return (
      <Comp
        ref={ref}
        type={!asChild ? type : undefined}
        disabled={disabled}
        aria-busy={loading}
        aria-disabled={disabled}
        style={gradientStyle}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className={cn(
          buttonVariants({ variant, size }),
          className,
          loading && "cursor-wait"
        )}
        {...props}
      >
        {loading && (
          <span className="absolute left-3 flex items-center">
            <Loader2 className="animate-spin w-4 h-4" style={{ color: contrastColor }} />
          </span>
        )}

        <span
          className={cn(
            "flex items-center justify-center w-full transition-opacity",
            loading && "opacity-50"
          )}
        >
          {children}
        </span>
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };

function getContrastColor(hex) {
  if (!hex) return "white";
  let c = hex.replace("#", "");
  let rgb = parseInt(c, 16);
  let r = (rgb >> 16) & 0xff;
  let g = (rgb >> 8) & 0xff;
  let b = rgb & 0xff;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 186 ? "black" : "white";
}
