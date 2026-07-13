import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapProfile } from "@/lib/supabase/mappers";
import type { User, UserId, UserRole, VerificationStatus } from "@/lib/types";
import type { Repository } from "../types";

export class SupabaseUserRepository implements Repository<User> {
  private client() {
    return getSupabaseBrowserClient();
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await this.client()
      .from("profiles")
      .select("*")
      .order("full_name");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapProfile);
  }

  async findById(id: UserId): Promise<User | null> {
    const { data, error } = await this.client()
      .from("profiles")
      .select("*")
      .eq("id", String(id))
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProfile(data) : null;
  }

  async create(
    data: Omit<User, "id"> & { id?: UserId }
  ): Promise<User> {
    // Profiles are normally created by auth trigger. Explicit insert for admin tools.
    if (!data.id) {
      throw new Error(
        "Supabase profiles require auth user id — use AuthService.register"
      );
    }
    const { data: row, error } = await this.client()
      .from("profiles")
      .insert({
        id: String(data.id),
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        lga: data.lga,
        role: data.role,
        verification_status: data.verification_status,
        average_rating: data.average_rating,
        review_count: data.review_count,
        last_login: data.last_login,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapProfile(row);
  }

  async update(id: UserId, patch: Partial<User>): Promise<User | null> {
    const payload: Record<string, unknown> = {};
    if (patch.full_name != null) payload.full_name = patch.full_name;
    if (patch.phone != null) payload.phone = patch.phone;
    if (patch.email !== undefined) payload.email = patch.email;
    if (patch.lga != null) payload.lga = patch.lga;
    if (patch.role != null) payload.role = patch.role;
    if (patch.verification_status != null) {
      payload.verification_status = patch.verification_status;
    }
    if (patch.average_rating != null) {
      payload.average_rating = patch.average_rating;
    }
    if (patch.review_count != null) payload.review_count = patch.review_count;
    if (patch.last_login !== undefined) payload.last_login = patch.last_login;

    const { data, error } = await this.client()
      .from("profiles")
      .update(payload)
      .eq("id", String(id))
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProfile(data) : null;
  }

  async delete(id: UserId): Promise<boolean> {
    const { error } = await this.client()
      .from("profiles")
      .delete()
      .eq("id", String(id));
    if (error) throw new Error(error.message);
    return true;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const normalized = phone.replace(/\s+/g, "");
    const { data, error } = await this.client()
      .from("profiles")
      .select("*")
      .eq("phone", normalized)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProfile(data) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    const { data, error } = await this.client()
      .from("profiles")
      .select("*")
      .ilike("email", normalized)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProfile(data) : null;
  }

  async findByPhoneOrEmail(identifier: string): Promise<User | null> {
    const raw = identifier.trim();
    if (!raw) return null;
    if (raw.includes("@")) {
      return this.findByEmail(raw);
    }
    return this.findByPhone(raw);
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const { data, error } = await this.client()
      .from("profiles")
      .select("*")
      .eq("role", role);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapProfile);
  }

  async findByVerificationStatus(
    status: VerificationStatus
  ): Promise<User[]> {
    const { data, error } = await this.client()
      .from("profiles")
      .select("*")
      .eq("verification_status", status);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapProfile);
  }
}
