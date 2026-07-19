import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "default" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  // Gradient + soft colored glow — matches the Figma Make reference
  // (DineButton.tsx primary variant), not a flat fill.
  primary:
    "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-[0_8px_20px_-4px_rgba(255,107,74,0.3)] hover:shadow-[0_12px_28px_-6px_rgba(255,107,74,0.35)]",
  outline: "border-2 border-gray-200 bg-white text-gray-900 hover:border-primary-200",
  ghost: "bg-transparent text-primary-500 hover:bg-primary-50",
  danger: "bg-red-50 text-red-600 hover:bg-red-100",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "py-3.5 px-6 text-[15px]",
  sm: "py-2 px-4 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", fullWidth, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
