"use client";

import { authService } from "@/lib/services";
import {
  isRateLimitError,
  isUnconfirmedEmailError,
  translateAuthError,
} from "@/lib/utils/auth-errors";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

type AuthErrorProps = {
  /** Raw error message returned from the auth service */
  error: string;
  /** Email entered by the user (used for the "Resend confirmation" button) */
  email?: string;
};

/**
 * Auth error renderer.
 *
 * - Translates raw Supabase Auth errors into human-friendly copy.
 * - When the error indicates an unconfirmed email and an `email` is
 *   provided, shows a one-click "Resend confirmation email" button.
 * - Surfaces a checkmark on success of the resend action.
 */
export function AuthError({ error, email }: AuthErrorProps) {
  const [resending, setResending] = useState(false);
  const [resendState, setResendState] = useState<
    "idle" | "sent" | "error"
  >("idle");
  const [resendError, setResendError] = useState<string | null>(null);

  const advice = translateAuthError(error);
  const isRate = isRateLimitError(error);
  const isUnconfirmed = isUnconfirmedEmailError(error);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setResendError(null);
    const res = await authService.resendConfirmation(email);
    setResending(false);
    if (res.success) {
      setResendState("sent");
    } else {
      setResendState("error");
      setResendError(res.error ?? "Could not resend confirmation");
    }
  }

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-700"
    >
      <div className="flex items-start gap-2">
        <AlertCircle
          className="mt-0.5 h-4 w-4 shrink-0"
          aria-hidden
        />
        <p className="leading-snug">{advice.message}</p>
      </div>

      {isUnconfirmed && email ? (
        <div className="flex flex-col gap-2 border-t border-red-200/70 pt-3">
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={resending || resendState === "sent"}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-red-300 bg-white px-3 py-1.5 text-body-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : resendState === "sent" ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            ) : null}
            {resendState === "sent"
              ? "Confirmation email sent"
              : "Resend confirmation email"}
          </button>
          {resendError ? (
            <p className="text-body-sm text-red-700">{resendError}</p>
          ) : null}
          {isRate && resendState !== "sent" ? (
            <p className="text-[12px] text-red-700/80">
              If resends keep failing, turn email confirmation OFF in Supabase
              → Authentication → Providers → Email.
            </p>
          ) : null}
        </div>
      ) : null}

      {isRate && !isUnconfirmed ? (
        <p className="text-[12px] text-red-700/80">
          If this keeps happening, turn email confirmation OFF in Supabase
          → Authentication → Providers → Email.
        </p>
      ) : null}
    </div>
  );
}
