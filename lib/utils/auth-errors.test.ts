import { describe, expect, it } from "vitest";
import { translateAuthError } from "./auth-errors";

describe("translateAuthError", () => {
  it("translates invalid login errors as incorrect credentials", () => {
    expect(
      translateAuthError("Invalid email/phone or password").message
    ).toBe("Email/phone or password is incorrect. Please check and try again.");

    expect(translateAuthError("Invalid login credentials").message).toBe(
      "Email/phone or password is incorrect. Please check and try again."
    );
  });

  it("reserves password-strength advice for actual policy failures", () => {
    expect(translateAuthError("Weak password").message).toContain("too weak");
    expect(
      translateAuthError("Password should be at least 6 characters").message
    ).toContain("too weak");
  });
});
