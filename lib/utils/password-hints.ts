/**
 * Live password feedback for signup (and optional login).
 */

export type PasswordHint = {
  id: string;
  label: string;
  met: boolean;
};

export function getPasswordHints(password: string): PasswordHint[] {
  return [
    {
      id: "length",
      label: "At least 6 characters",
      met: password.length >= 6,
    },
    {
      id: "letter",
      label: "Contains a letter",
      met: /[a-zA-Z]/.test(password),
    },
    {
      id: "number",
      label: "Contains a number",
      met: /\d/.test(password),
    },
  ];
}

export function passwordStrengthLabel(password: string): {
  label: string;
  score: number;
} {
  if (!password) return { label: "", score: 0 };
  const hints = getPasswordHints(password);
  const score = hints.filter((h) => h.met).length;
  if (score <= 1) return { label: "Weak", score };
  if (score === 2) return { label: "Fair", score };
  if (password.length >= 10 && score === 3) return { label: "Strong", score };
  return { label: "Good", score };
}
