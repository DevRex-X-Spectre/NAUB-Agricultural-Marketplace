import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
};

export function Select({
  label,
  error,
  options,
  placeholder,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-2 text-forest-canopy">
      {label ? (
        <span className="text-body-sm font-medium tracking-[-0.42px]">
          {label}
        </span>
      ) : null}
      <select
        id={selectId}
        className={[
          "w-full min-h-11 rounded-lg bg-warm-parchment",
          "border border-forest-canopy/30 px-4 py-3",
          "text-body tracking-[-0.4px] text-forest-canopy",
          "disabled:bg-pale-stone disabled:text-quiet-gray",
          className,
        ].join(" ")}
        {...props}
      >
        {placeholder ? (
          <option value="">{placeholder}</option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <span className="text-body-sm text-forest-canopy/80">{error}</span>
      ) : null}
    </label>
  );
}
