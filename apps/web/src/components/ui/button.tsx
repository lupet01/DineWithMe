import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white shadow-soft hover:bg-primary-600 disabled:bg-primary-200",
  secondary:
    "border-2 border-primary-500 bg-white text-primary-500 hover:bg-primary-50 disabled:border-primary-200 disabled:text-primary-200",
  ghost:
    "border-2 border-primary-200 bg-primary-50 text-primary-600 hover:bg-primary-100 disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "py-2.5 text-[13px]",
  md: "py-3.5 text-sm",
  lg: "py-4 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "lg", className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full font-semibold transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
