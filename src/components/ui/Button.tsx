import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm",
  secondary: "bg-accent-500 text-white hover:bg-accent-600 shadow-sm",
  outline: "border border-[var(--color-border)] text-slate-700 hover:bg-slate-50 bg-white",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-danger-500 text-white hover:bg-danger-600 shadow-sm",
};

const sizeClasses: Record<Size, string> = {
  // "sm" is the only size short enough (~28px) to risk a mis-tap on a phone,
  // so it gets a mobile-only touch-target floor (max-sm: — inert at sm: and
  // up) instead of the desktop-affecting padding bump this would otherwise
  // take everywhere it's used.
  sm: "text-xs px-3 py-1.5 max-sm:min-h-11 max-sm:px-3.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-base px-6 py-3 gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", fullWidth, className, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-medium transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
