"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type AlertOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "info" | "danger";
};

type AlertRequest = AlertOptions & { mode: "alert" | "confirm" };

type SystemAlertContextValue = {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: AlertOptions) => Promise<boolean>;
};

const SystemAlertContext = createContext<SystemAlertContextValue | null>(null);

export function SystemAlertProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<AlertRequest | null>(null);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const close = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setRequest(null);
    previousFocusRef.current?.focus();
  }, []);

  const open = useCallback(
    (next: AlertRequest) =>
      new Promise<boolean>((resolve) => {
        // Never leave an earlier caller waiting if dialogs are triggered together.
        resolver.current?.(false);
        previousFocusRef.current = document.activeElement as HTMLElement | null;
        resolver.current = resolve;
        setRequest(next);
      }),
    []
  );

  const confirm = useCallback(
    (options: AlertOptions) => open({ ...options, mode: "confirm" }),
    [open]
  );

  const alert = useCallback(
    async (options: AlertOptions) => {
      await open({ ...options, mode: "alert" });
    },
    [open]
  );

  useEffect(() => {
    if (!request) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close(false);
        return;
      }
      if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [request, close]);

  useEffect(
    () => () => {
      resolver.current?.(false);
    },
    []
  );

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);
  const isDanger = request?.variant === "danger";

  return (
    <SystemAlertContext.Provider value={value}>
      {children}
      {request
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-forest-canopy/55 p-4 backdrop-blur-[2px]"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && request.mode === "confirm") {
                  close(false);
                }
              }}
            >
              <div
                ref={dialogRef}
                role={isDanger ? "alertdialog" : "dialog"}
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="w-full max-w-md rounded-3xl border border-forest-canopy/10 bg-warm-parchment p-6 shadow-[0_30px_90px_-30px_rgba(12,42,17,0.65)] animate-[systemAlertIn_180ms_ease-out]"
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                      isDanger ? "bg-red-100 text-red-700" : "bg-lime-sprout/50 text-forest-canopy"
                    }`}
                  >
                    {isDanger ? (
                      <AlertTriangle className="h-5 w-5" aria-hidden />
                    ) : (
                      <Info className="h-5 w-5" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 id={titleId} className="text-subheading font-medium text-forest-canopy">
                      {request.title}
                    </h2>
                    <p id={descriptionId} className="mt-2 text-body-sm leading-relaxed text-forest-canopy/70">
                      {request.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => close(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest-canopy/55 hover:bg-pale-stone hover:text-forest-canopy"
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {request.mode === "confirm" ? (
                    <Button variant="secondary" onClick={() => close(false)}>
                      {request.cancelLabel ?? "Cancel"}
                    </Button>
                  ) : null}
                  <Button
                    ref={confirmButtonRef}
                    variant={isDanger ? "danger" : "primary"}
                    onClick={() => close(true)}
                  >
                    {request.confirmLabel ?? (request.mode === "confirm" ? "Confirm" : "Okay")}
                  </Button>
                </div>
              </div>
              <style>{`
                @keyframes systemAlertIn {
                  from { opacity: 0; transform: translateY(8px) scale(.98); }
                  to { opacity: 1; transform: translateY(0) scale(1); }
                }
              `}</style>
            </div>,
            document.body
          )
        : null}
    </SystemAlertContext.Provider>
  );
}

export function useSystemAlert(): SystemAlertContextValue {
  const context = useContext(SystemAlertContext);
  if (!context) {
    throw new Error("useSystemAlert must be used within SystemAlertProvider");
  }
  return context;
}
