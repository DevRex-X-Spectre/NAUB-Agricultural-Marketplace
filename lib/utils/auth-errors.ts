/**
 * Translate raw Supabase Auth error messages / codes into friendly,
 * actionable messages for end users.
 *
 * Why this exists: Supabase's free tier rate-limits outbound email
 * (confirmation / password-reset / OTP). When email confirmation is
 * enabled, every sign-up tries to send a confirmation email — and after
 * a few attempts the project returns `email_rate_limit_exceeded`. This
 * app is designed to work with email confirmation OFF (phone-first,
 * synthetic `<digits>@phone.naub-agri.local` addresses), so the most
 * common cause of a broken sign-up is that the Supabase Dashboard still
 * has "Confirm email" turned on.
 */

export type AuthErrorAdvice = {
  /** One-line, user-facing message */
  message: string;
  /** Whether the user can retry right now (vs. must wait / fix config) */
  retryable: boolean;
};

const MAP: Array<{ test: RegExp; advice: AuthErrorAdvice }> = [
  {
    test: /rate.?limit|over_email_send_rate_limit|email_rate_limit/i,
    advice: {
      message:
        "The auth provider is rate-limiting emails right now. Wait a few minutes and try again — or, if you run this project, turn OFF email confirmation in Supabase (Authentication → Providers → Email → Confirm email). This app is built to work without it.",
      retryable: true,
    },
  },
  {
    test: /email_not_confirmed|not.?confirmed/i,
    advice: {
      message:
        "Your email address has not been confirmed yet. Check your inbox (and spam folder) for a confirmation link, or resend it below.",
      retryable: true,
    },
  },
  {
    test: /user_already_registered|already.?registered/i,
    advice: {
      message: "An account already exists with this email or phone. Try signing in instead.",
      retryable: false,
    },
  },
  {
    test: /weak.?password|password/i,
    advice: {
      message: "That password is too weak. Use at least 6 characters with a mix of letters and numbers.",
      retryable: true,
    },
  },
  {
    test: /signup.?disabled|allow_signup/i,
    advice: {
      message:
        "New sign-ups are currently disabled on the auth provider. If you run this project, enable email sign-ups in Supabase (Authentication → Providers → Email → Sign-up enabled).",
      retryable: false,
    },
  },
  {
    test: /invalid.?credentials|invalid login|wrong password|no such user/i,
    advice: {
      message: "Email/phone or password is incorrect. Please check and try again.",
      retryable: true,
    },
  },
];

/** Returns true if the raw error string indicates an unconfirmed email. */
export function isUnconfirmedEmailError(raw: string): boolean {
  return /email_not_confirmed|not.?confirmed/i.test(raw);
}

/** Returns true if the raw error string indicates email rate-limiting. */
export function isRateLimitError(raw: string): boolean {
  return /rate.?limit|over_email_send_rate_limit|email_rate_limit/i.test(raw);
}

/** Translate a raw Supabase Auth error into friendly advice. */
export function translateAuthError(raw: string | undefined | null): AuthErrorAdvice {
  if (!raw) {
    return { message: "Something went wrong. Please try again.", retryable: true };
  }
  for (const { test, advice } of MAP) {
    if (test.test(raw)) return advice;
  }
  return { message: raw, retryable: true };
}
