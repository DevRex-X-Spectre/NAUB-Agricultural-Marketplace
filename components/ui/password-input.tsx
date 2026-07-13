"use client";

import {
  getPasswordHints,
  passwordStrengthLabel,
} from "@/lib/utils/password-hints";
import { Check, Circle, Eye, EyeOff } from "lucide-react";
import {
  useId,
  useState,
  type InputHTMLAttributes,
} from "react";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
  error?: string;
  hint?: string;
  /** Show live password rules under the field while typing */
  showLiveHints?: boolean;
};

/** Password field with show/hide toggle and optional live hints. */
export function PasswordInput({
  label,
  error,
  hint,
  showLiveHints = false,
  className = "",
  id,
  value,
  onChange,
  ...props
}: PasswordInputProps) {
  const autoId = useId();
  const inputId = id ?? props.name ?? autoId;
  const [visible, setVisible] = useState(false);
  const password = typeof value === "string" ? value : "";
  const hints = showLiveHints ? getPasswordHints(password) : [];
  const strength =
    showLiveHints && password.length > 0
      ? passwordStrengthLabel(password)
      : null;

  return (
    <div className="flex w-full flex-col gap-2 text-forest-canopy">
      <label className="flex w-full flex-col gap-2">
        {label ? (
          <span className="text-body-sm font-medium">{label}</span>
        ) : null}
        <span className="relative block">
          <input
            id={inputId}
            type={visible ? "text" : "password"}
            value={value}
            onChange={onChange}
            className={[
              "w-full min-h-11 rounded-lg bg-warm-parchment",
              "border py-3 pl-4 pr-12",
              "text-body text-forest-canopy",
              "placeholder:text-soft-sage",
              "disabled:bg-pale-stone disabled:text-quiet-gray",
              error
                ? "border-red-500 focus-visible:outline-red-500"
                : "border-forest-canopy/30",
              className,
            ].join(" ")}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-forest-canopy/60 hover:bg-pale-stone hover:text-forest-canopy"
            aria-label={visible ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            {visible ? (
              <EyeOff className="h-5 w-5" aria-hidden />
            ) : (
              <Eye className="h-5 w-5" aria-hidden />
            )}
          </button>
        </span>
      </label>

      {error ? (
        <span className="text-body-sm text-red-600" role="alert">
          {error}
        </span>
      ) : null}

      {showLiveHints && password.length > 0 ? (
        <div className="rounded-xl bg-pale-stone/80 px-3 py-2.5" aria-live="polite">
          {strength ? (
            <p className="mb-2 text-[12px] font-medium text-forest-canopy/80">
              Strength:{" "}
              <span
                className={
                  strength.score <= 1
                    ? "text-red-600"
                    : strength.score === 2
                      ? "text-forest-canopy"
                      : "text-forest-canopy"
                }
              >
                {strength.label}
              </span>
            </p>
          ) : null}
          <ul className="flex flex-col gap-1.5">
            {hints.map((h) => (
              <li
                key={h.id}
                className={[
                  "flex items-center gap-2 text-[13px]",
                  h.met ? "text-forest-canopy" : "text-forest-canopy/50",
                ].join(" ")}
              >
                {h.met ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-forest-canopy" aria-hidden />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
                {h.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hint && !error && !(showLiveHints && password.length > 0) ? (
        <span className="text-body-sm text-forest-canopy/60">{hint}</span>
      ) : null}
    </div>
  );
}
