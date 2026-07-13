import {
  DATA_SOURCE,
  SESSION_KEY,
  isConfiguredAdminPhone,
  isSupabase,
  normalizePhone,
  type DataSource,
} from "@/lib/config";
import { userRepository } from "@/lib/repositories";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  CreateUserInput,
  PublicUser,
  ServiceResult,
  Session,
  User,
  UserRole,
} from "@/lib/types";
import { nowIso } from "@/lib/utils/format";
import { hashPassword, verifyPassword } from "@/lib/utils/password";
import {
  SESSION_TTL_MS,
  createSessionToken,
} from "@/lib/utils/session-token";
import { validationService } from "./validation-service";

function toPublicUser(user: User): PublicUser {
  const { password_hash: _h, password_salt: _s, ...rest } = user;
  return rest;
}

/** Role for signup: env admin phone → admin; else farmer/buyer from form */
function resolveRole(phone: string, requested: UserRole): UserRole {
  if (isConfiguredAdminPhone(phone)) return "admin";
  return requested === "admin" ? "buyer" : requested;
}

/**
 * If phone matches NEXT_PUBLIC_ADMIN_PHONE, ensure profile is admin + verified.
 * Applied on login so env changes take effect without re-registering.
 */
async function ensureEnvAdminRole(user: User): Promise<User> {
  if (!isConfiguredAdminPhone(user.phone)) return user;
  if (user.role === "admin" && user.verification_status === "verified") {
    return user;
  }
  const updated = await userRepository.update(user.id, {
    role: "admin",
    verification_status: "verified",
  });
  return updated ?? { ...user, role: "admin", verification_status: "verified" };
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readLocalSession(): Session | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function writeLocalSession(session: Session | null): void {
  if (!isBrowser()) return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

/** Synthetic email for phone-first Supabase Auth */
export function phoneToAuthEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@phone.naub-agri.local`;
}

function gateVerification(
  status: User["verification_status"]
): string | null {
  if (status === "suspended") {
    return "Your account has been suspended. Contact the marketplace administrator.";
  }
  if (status === "banned") {
    return "Your account has been banned and cannot sign in. Contact the marketplace administrator if you believe this is an error.";
  }
  return null;
}

export class AuthService {
  async register(input: CreateUserInput): Promise<ServiceResult<PublicUser>> {
    const v = validationService.validateRegistration({
      full_name: input.full_name,
      phone: input.phone,
      password: input.password,
      lga: input.lga,
      email: input.email,
    });
    if (!v.success) return { success: false, error: v.error };

    if (isSupabase) {
      return this.registerSupabase(input);
    }
    return this.registerLocal(input);
  }

  private async registerLocal(
    input: CreateUserInput
  ): Promise<ServiceResult<PublicUser>> {
    const existing = await userRepository.findByPhone(input.phone);
    if (existing) {
      return {
        success: false,
        error: "An account with this phone number already exists",
      };
    }

    // SWAP FOR SERVER-SIDE bcrypt ON BACKEND MIGRATION — local prototype only
    const { hash, salt } = await hashPassword(input.password);
    const phone = normalizePhone(input.phone) || input.phone.replace(/[\s-]/g, "");
    const role = resolveRole(phone, input.role);
    const now = nowIso();
    const user = await userRepository.create({
      full_name: validationService.sanitizeText(input.full_name),
      phone,
      email: input.email?.trim() || null,
      lga: validationService.sanitizeText(input.lga),
      role,
      // Farmers/admins verified on signup so they can act immediately.
      verification_status: "verified",
      password_hash: hash,
      password_salt: salt,
      average_rating: 0,
      review_count: 0,
      created_at: now,
      last_login: null,
    });

    return { success: true, data: toPublicUser(user) };
  }

  private async registerSupabase(
    input: CreateUserInput
  ): Promise<ServiceResult<PublicUser>> {
    const phone = normalizePhone(input.phone) || input.phone.replace(/[\s-]/g, "");
    const role = resolveRole(phone, input.role);
    const existing = await userRepository.findByPhone(phone);
    if (existing) {
      return {
        success: false,
        error: "An account with this phone number already exists",
      };
    }

    const supabase = getSupabaseBrowserClient();
    const email = input.email?.trim() || phoneToAuthEmail(phone);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          full_name: validationService.sanitizeText(input.full_name),
          phone,
          lga: validationService.sanitizeText(input.lga),
          role,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data.user) {
      return { success: false, error: "Registration failed — no user returned" };
    }

    // Wait briefly for trigger; then fetch / patch profile
    let profile = await userRepository.findById(data.user.id);
    if (!profile) {
      // Trigger may lag — create profile row explicitly
      try {
        profile = await userRepository.create({
          id: data.user.id,
          full_name: validationService.sanitizeText(input.full_name),
          phone,
          email: input.email?.trim() || null,
          lga: validationService.sanitizeText(input.lga),
          role,
          verification_status: "verified",
          password_hash: "",
          password_salt: "",
          average_rating: 0,
          review_count: 0,
          created_at: nowIso(),
          last_login: null,
        });
      } catch {
        // Profile may already exist from trigger race
        profile = await userRepository.findById(data.user.id);
      }
    } else {
      // Ensure phone/role/verification match signup intent (incl. env admin)
      profile =
        (await userRepository.update(data.user.id, {
          full_name: validationService.sanitizeText(input.full_name),
          phone,
          lga: validationService.sanitizeText(input.lga),
          role,
          verification_status: "verified",
        })) ?? profile;
    }

    if (!profile) {
      return {
        success: false,
        error: "Account created but profile is missing — try signing in",
      };
    }

    profile = await ensureEnvAdminRole(profile);
    return { success: true, data: toPublicUser(profile) };
  }

  async login(
    phone: string,
    password: string
  ): Promise<ServiceResult<{ user: PublicUser; session: Session }>> {
    if (!phone?.trim() || !password) {
      return { success: false, error: "Phone and password are required" };
    }

    if (isSupabase) {
      return this.loginSupabase(phone, password);
    }
    return this.loginLocal(phone, password);
  }

  private async loginLocal(
    phone: string,
    password: string
  ): Promise<ServiceResult<{ user: PublicUser; session: Session }>> {
    let user = await userRepository.findByPhone(phone);
    if (!user) {
      return { success: false, error: "Invalid phone or password" };
    }

    const ok = await verifyPassword(
      password,
      user.password_salt,
      user.password_hash
    );
    if (!ok) {
      return { success: false, error: "Invalid phone or password" };
    }

    user = await ensureEnvAdminRole(user);

    const gate = gateVerification(user.verification_status);
    if (gate) return { success: false, error: gate };

    const issued = Date.now();
    const session: Session = {
      token: createSessionToken(),
      user_id: user.id,
      role: user.role,
      issued_at: new Date(issued).toISOString(),
      expires_at: new Date(issued + SESSION_TTL_MS).toISOString(),
    };
    writeLocalSession(session);

    const updated = await userRepository.update(user.id, {
      last_login: nowIso(),
    });

    return {
      success: true,
      data: {
        user: toPublicUser(updated ?? user),
        session,
      },
    };
  }

  private async loginSupabase(
    phone: string,
    password: string
  ): Promise<ServiceResult<{ user: PublicUser; session: Session }>> {
    let profile = await userRepository.findByPhone(phone);
    if (!profile) {
      return { success: false, error: "Invalid phone or password" };
    }

    profile = await ensureEnvAdminRole(profile);

    const gate = gateVerification(profile.verification_status);
    if (gate) return { success: false, error: gate };

    const email = profile.email?.trim() || phoneToAuthEmail(profile.phone);
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return {
        success: false,
        error: error?.message ?? "Invalid phone or password",
      };
    }

    await userRepository.update(profile.id, { last_login: nowIso() });
    const refreshed =
      (await userRepository.findById(profile.id)) ?? profile;

    const session: Session = {
      token: data.session.access_token,
      user_id: refreshed.id,
      role: refreshed.role,
      issued_at: new Date().toISOString(),
      expires_at: new Date(
        (data.session.expires_at ?? Date.now() / 1000 + 3600) * 1000
      ).toISOString(),
    };

    return {
      success: true,
      data: { user: toPublicUser(refreshed), session },
    };
  }

  async logout(): Promise<ServiceResult<true>> {
    if (isSupabase) {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    }
    writeLocalSession(null);
    return { success: true, data: true };
  }

  async getSession(): Promise<ServiceResult<Session | null>> {
    if (isSupabase) {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) return { success: true, data: null };
      const profile = await userRepository.findById(data.session.user.id);
      if (!profile) return { success: true, data: null };
      return {
        success: true,
        data: {
          token: data.session.access_token,
          user_id: profile.id,
          role: profile.role,
          issued_at: new Date().toISOString(),
          expires_at: new Date(
            (data.session.expires_at ?? Date.now() / 1000 + 3600) * 1000
          ).toISOString(),
        },
      };
    }

    const session = readLocalSession();
    if (!session) return { success: true, data: null };
    if (new Date(session.expires_at).getTime() < Date.now()) {
      writeLocalSession(null);
      return { success: true, data: null };
    }
    return { success: true, data: session };
  }

  async getCurrentUser(): Promise<ServiceResult<PublicUser | null>> {
    if (isSupabase) {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) return { success: true, data: null };
      const user = await userRepository.findById(data.user.id);
      if (!user) return { success: true, data: null };
      const gate = gateVerification(user.verification_status);
      if (gate) {
        await supabase.auth.signOut();
        return { success: false, error: gate };
      }
      return { success: true, data: toPublicUser(user) };
    }

    const sessionResult = await this.getSession();
    if (!sessionResult.success || !sessionResult.data) {
      return { success: true, data: null };
    }
    const user = await userRepository.findById(sessionResult.data.user_id);
    if (!user) {
      writeLocalSession(null);
      return { success: true, data: null };
    }
    const gate = gateVerification(user.verification_status);
    if (gate) {
      writeLocalSession(null);
      return { success: false, error: gate };
    }
    return { success: true, data: toPublicUser(user) };
  }

  async requireRole(roles: UserRole[]): Promise<ServiceResult<PublicUser>> {
    const result = await this.getCurrentUser();
    if (!result.success) return { success: false, error: result.error };
    if (!result.data) {
      return { success: false, error: "You must be signed in" };
    }
    if (!roles.includes(result.data.role)) {
      return {
        success: false,
        error: "You do not have permission for this action",
      };
    }
    return { success: true, data: result.data };
  }

  /** Expose mode for UI banners / dev tools */
  get mode(): DataSource {
    return DATA_SOURCE;
  }
}

export const authService = new AuthService();
