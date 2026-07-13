import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapReview } from "@/lib/supabase/mappers";
import type { Review, UserId } from "@/lib/types";
import type { Repository } from "../types";

export class SupabaseReviewRepository implements Repository<Review> {
  private client() {
    return getSupabaseBrowserClient();
  }

  async findAll(): Promise<Review[]> {
    const { data, error } = await this.client().from("reviews").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapReview);
  }

  async findById(id: number): Promise<Review | null> {
    const { data, error } = await this.client()
      .from("reviews")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapReview(data) : null;
  }

  async create(data: Omit<Review, "id"> & { id?: number }): Promise<Review> {
    const { data: row, error } = await this.client()
      .from("reviews")
      .insert({
        buyer_id: String(data.buyer_id),
        farmer_id: String(data.farmer_id),
        product_id: data.product_id,
        rating: data.rating,
        comment: data.comment,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapReview(row);
  }

  async update(id: number, patch: Partial<Review>): Promise<Review | null> {
    const payload: Record<string, unknown> = { ...patch };
    delete payload.id;
    const { data, error } = await this.client()
      .from("reviews")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapReview(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await this.client()
      .from("reviews")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }

  async findByFarmerId(farmerId: UserId): Promise<Review[]> {
    const { data, error } = await this.client()
      .from("reviews")
      .select("*")
      .eq("farmer_id", String(farmerId));
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapReview);
  }

  async findByProductId(productId: number): Promise<Review[]> {
    const { data, error } = await this.client()
      .from("reviews")
      .select("*")
      .eq("product_id", productId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapReview);
  }

  async findByBuyerAndProduct(
    buyerId: UserId,
    productId: number
  ): Promise<Review | null> {
    const { data, error } = await this.client()
      .from("reviews")
      .select("*")
      .eq("buyer_id", String(buyerId))
      .eq("product_id", productId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapReview(data) : null;
  }
}
