import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapContact } from "@/lib/supabase/mappers";
import type { ContactRequest, UserId } from "@/lib/types";
import type { Repository } from "../types";

export class SupabaseContactRequestRepository
  implements Repository<ContactRequest>
{
  private client() {
    return getSupabaseBrowserClient();
  }

  async findAll(): Promise<ContactRequest[]> {
    const { data, error } = await this.client()
      .from("contact_requests")
      .select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapContact);
  }

  async findById(id: number): Promise<ContactRequest | null> {
    const { data, error } = await this.client()
      .from("contact_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapContact(data) : null;
  }

  async create(
    data: Omit<ContactRequest, "id"> & { id?: number }
  ): Promise<ContactRequest> {
    const { data: row, error } = await this.client()
      .from("contact_requests")
      .insert({
        buyer_id: String(data.buyer_id),
        farmer_id: String(data.farmer_id),
        product_id: data.product_id,
        method: data.method,
        status: data.status,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapContact(row);
  }

  async update(
    id: number,
    patch: Partial<ContactRequest>
  ): Promise<ContactRequest | null> {
    const payload: Record<string, unknown> = { ...patch };
    delete payload.id;
    if (payload.buyer_id != null) payload.buyer_id = String(payload.buyer_id);
    if (payload.farmer_id != null) {
      payload.farmer_id = String(payload.farmer_id);
    }
    const { data, error } = await this.client()
      .from("contact_requests")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapContact(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await this.client()
      .from("contact_requests")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }

  async findByBuyerId(buyerId: UserId): Promise<ContactRequest[]> {
    const { data, error } = await this.client()
      .from("contact_requests")
      .select("*")
      .eq("buyer_id", String(buyerId))
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapContact);
  }

  async findByFarmerId(farmerId: UserId): Promise<ContactRequest[]> {
    const { data, error } = await this.client()
      .from("contact_requests")
      .select("*")
      .eq("farmer_id", String(farmerId))
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapContact);
  }

  async findByProductId(productId: number): Promise<ContactRequest[]> {
    const { data, error } = await this.client()
      .from("contact_requests")
      .select("*")
      .eq("product_id", productId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapContact);
  }

  async findCompletedForBuyerProduct(
    buyerId: UserId,
    productId: number
  ): Promise<ContactRequest | null> {
    const { data, error } = await this.client()
      .from("contact_requests")
      .select("*")
      .eq("buyer_id", String(buyerId))
      .eq("product_id", productId)
      .eq("status", "completed")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapContact(data) : null;
  }
}
