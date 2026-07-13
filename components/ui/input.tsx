import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

/** Form input — 8px radius, Warm Parchment, Forest Canopy border (DESIGN.md) */
export function Input({
  label,
  error,
  hint,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-2 text-forest-canopy">
      {label ? (
        <span className="text-body-sm font-medium tracking-[-0.42px]">
          {label}
        </span>
      ) : null}
      <input
        id={inputId}
        className={[
          "w-full min-h-11 rounded-lg bg-warm-parchment",
          "border border-forest-canopy/30 px-4 py-3",
          "text-body tracking-[-0.4px] text-forest-canopy",
          "placeholder:text-soft-sage",
          "disabled:bg-pale-stone disabled:text-quiet-gray",
          error ? "border-forest-canopy" : "",
          className,
        ].join(" ")}
        {...props}
      />
      {error ? (
        <span className="text-body-sm text-forest-canopy/80">{error}</span>
      ) : null}
      {hint && !error ? (
        <span className="text-body-sm text-forest-canopy/60">{hint}</span>
      ) : null}
    </label>
  );
}
