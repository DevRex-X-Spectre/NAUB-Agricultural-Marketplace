import type { ServiceResult } from "@/lib/types";

/**
 * Central input validation (NFR-03 client-side analogue).
 * Strips/escapes user text before storage/render as XSS stand-in.
 * Real parameterized queries + server sanitization land in Part B.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Nigerian mobile: 11 digits starting with 0, or +234 / 234 form */
const PHONE_RE = /^(?:\+?234|0)[789][01]\d{8}$/;

export class ValidationService {
  isEmail(value: string): boolean {
    return EMAIL_RE.test(value.trim());
  }

  isPhone(value: string): boolean {
    const compact = value.replace(/[\s-]/g, "");
    return PHONE_RE.test(compact);
  }

  required(value: unknown, fieldName: string): string | null {
    if (value == null) return `${fieldName} is required`;
    if (typeof value === "string" && value.trim() === "") {
      return `${fieldName} is required`;
    }
    return null;
  }

  minLength(value: string, min: number, fieldName: string): string | null {
    if (value.trim().length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  }

  maxLength(value: string, max: number, fieldName: string): string | null {
    if (value.length > max) {
      return `${fieldName} must be at most ${max} characters`;
    }
    return null;
  }

  isPositiveNumber(value: number, fieldName: string): string | null {
    if (!Number.isFinite(value) || value < 0) {
      return `${fieldName} must be a non-negative number`;
    }
    return null;
  }

  isRating(value: number): string | null {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return "Rating must be an integer between 1 and 5";
    }
    return null;
  }

  /**
   * Strip HTML tags and control characters — XSS stand-in for NFR-03.
   * Does NOT replace real server-side escaping in Part B.
   */
  sanitizeText(input: string): string {
    return input
      .replace(/<[^>]*>/g, "")
      .replace(/[<>"'`]/g, "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .trim();
  }

  validateRegistration(input: {
    full_name: string;
    phone: string;
    password: string;
    lga: string;
    email?: string | null;
  }): ServiceResult<true> {
    const errors: string[] = [];
    const nameErr = this.required(input.full_name, "Full name");
    if (nameErr) errors.push(nameErr);
    else {
      const min = this.minLength(input.full_name, 2, "Full name");
      if (min) errors.push(min);
    }

    const phoneErr = this.required(input.phone, "Phone");
    if (phoneErr) errors.push(phoneErr);
    else if (!this.isPhone(input.phone)) {
      errors.push("Phone must be a valid Nigerian mobile number");
    }

    const passErr = this.required(input.password, "Password");
    if (passErr) errors.push(passErr);
    else {
      const min = this.minLength(input.password, 6, "Password");
      if (min) errors.push(min);
    }

    const lgaErr = this.required(input.lga, "LGA");
    if (lgaErr) errors.push(lgaErr);

    if (input.email && input.email.trim() && !this.isEmail(input.email)) {
      errors.push("Email format is invalid");
    }

    if (errors.length) return { success: false, error: errors.join("; ") };
    return { success: true, data: true };
  }

  validateProduct(input: {
    name: string;
    description: string;
    price: number;
    unit: string;
    quantity: number;
    expiry_date: string;
    category_id: number;
  }): ServiceResult<true> {
    const errors: string[] = [];
    if (this.required(input.name, "Product name")) {
      errors.push("Product name is required");
    }
    if (this.required(input.unit, "Unit")) {
      errors.push("Unit is required");
    }
    const priceErr = this.isPositiveNumber(input.price, "Price");
    if (priceErr) errors.push(priceErr);
    if (input.price === 0) errors.push("Price must be greater than zero");
    const qtyErr = this.isPositiveNumber(input.quantity, "Quantity");
    if (qtyErr) errors.push(qtyErr);
    if (input.quantity === 0) errors.push("Quantity must be greater than zero");
    if (!input.category_id) errors.push("Category is required");
    if (!input.expiry_date) errors.push("Expiry date is required");
    if (input.description && input.description.length > 2000) {
      errors.push("Description is too long");
    }
    if (errors.length) return { success: false, error: errors.join("; ") };
    return { success: true, data: true };
  }
}

export const validationService = new ValidationService();
