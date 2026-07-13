import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({
  label,
  error,
  className = "",
  id,
  ...props
}: Props) {
  const areaId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-2 text-forest-canopy">
      {label ? (
        <span className="text-body-sm font-medium tracking-[-0.42px]">
          {label}
        </span>
      ) : null}
      <textarea
        id={areaId}
        className={[
          "w-full min-h-28 rounded-lg bg-warm-parchment",
          "border border-forest-canopy/30 px-4 py-3",
          "text-body tracking-[-0.4px] text-forest-canopy",
          "placeholder:text-soft-sage",
          className,
        ].join(" ")}
        {...props}
      />
      {error ? (
        <span className="text-body-sm text-forest-canopy/80">{error}</span>
      ) : null}
    </label>
  );
}
