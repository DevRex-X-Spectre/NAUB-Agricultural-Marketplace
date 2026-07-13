"use client";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  type LucideIcon,
  X,
} from "lucide-react";
import { useEffect } from "react";

export type ToastVariant = "success" | "error" | "info" | "loading";

type ToastProps = {
  open: boolean;
  variant?: ToastVariant;
  title: string;
  description?: string;
  /** Auto-dismiss after N ms. Ignored for the `loading` variant. */
  duration?: number;
  onClose?: () => void;
};

const VARIANT_CONFIG: Record<
  ToastVariant,
  { Icon: LucideIcon; iconWrap: string; iconColor: string }
> = {
  success: {
    Icon: CheckCircle2,
    iconWrap: "bg-lime-sprout/40",
    iconColor: "text-forest-canopy",
  },
  error: {
    Icon: AlertCircle,
    iconWrap: "bg-red-100",
    iconColor: "text-red-600",
  },
  info: {
    Icon: Info,
    iconWrap: "bg-pale-stone",
    iconColor: "text-forest-canopy",
  },
  loading: {
    Icon: Loader2,
    iconWrap: "bg-pale-stone",
    iconColor: "text-forest-canopy",
  },
};

/**
 * Lightweight, presentational toast. Fixed to the bottom-center on mobile
 * and bottom-center (max-width) on desktop. Slide-up entrance animation.
 *
 * Accessibility:
 * - success/info/loading → role="status" (polite)
 * - error → role="alert" (assertive)
 * - loading icon spins; variants use aria-hidden on the icon
 */
export function Toast({
  open,
  variant = "info",
  title,
  description,
  duration = 3500,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!open || variant === "loading" || !onClose) return;
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [open, variant, duration, onClose]);

  if (!open) return null;

  const { Icon, iconWrap, iconColor } = VARIANT_CONFIG[variant];

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:bottom-6"
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
    >
      <div
        className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-forest-canopy/10 bg-warm-parchment p-4 shadow-[0_24px_60px_-20px_rgba(28,58,19,0.25)] animate-[toastIn_220ms_ease-out]"
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconWrap}`}
        >
          <Icon
            className={`h-4 w-4 ${iconColor} ${variant === "loading" ? "animate-spin" : ""}`}
            aria-hidden
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-medium leading-snug text-forest-canopy">
            {title}
          </p>
          {description ? (
            <p className="mt-0.5 text-body-sm leading-snug text-forest-canopy/65">
              {description}
            </p>
          ) : null}
        </div>
        {onClose && variant !== "loading" ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-forest-canopy/50 transition-colors hover:bg-pale-stone hover:text-forest-canopy"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
