import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-btn font-semibold rounded-notion-btn ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#097fe8] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#0075de] text-white hover:bg-[#005bab] active:bg-[#004a8f] shadow-sm hover:shadow-md",
        destructive:
          "bg-[#dd5b00] text-white hover:bg-[#c45000] active:bg-[#a84400]",
        outline:
          "border border-[#a39e98] bg-white text-[#31302e] hover:bg-[#f6f5f4] hover:border-[#615d59]",
        secondary:
          "bg-[#f6f5f4] text-[#31302e] hover:bg-[#eeedec] border border-transparent",
        ghost:
          "text-[#615d59] hover:bg-[#f6f5f4] hover:text-[#31302e]",
        link:
          "text-[#0075de] underline-offset-4 hover:underline",
        notion:
          "border border-[#0075de] text-[#0075de] bg-transparent hover:bg-[#f2f9ff]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-notion-btn px-3",
        lg: "h-11 rounded-notion-btn px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
