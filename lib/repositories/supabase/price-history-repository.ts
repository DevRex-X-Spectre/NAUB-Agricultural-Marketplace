import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapPriceHistory } from "@/lib/supabase/mappers";
import type { PriceHistory } from "@/lib/types";
import type { Repository } from "../types";

export class SupabasePriceHistoryRepository
  implements Repository<PriceHistory>
{
  private client() {
    return getSupabaseBrowserClient();
  }

  async findAll(): Promise<PriceHistory[]> {
    const { data, error } = await this.client()
      .from("price_history")
      .select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPriceHistory);
  }

  async findById(id: number): Promise<PriceHistory | null> {
    const { data, error } = await this.client()
      .from("price_history")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapPriceHistory(data) : null;
  }

  async create(
    data: Omit<PriceHistory, "id"> & { id?: number }
  ): Promise<PriceHistory> {
    const { data: row, error } = await this.client()
      .from("price_history")
      .insert({
        category_id: data.category_id,
        avg_price: data.avg_price,
        recorded_on: data.recorded_on,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapPriceHistory(row);
  }

  async update(
    id: number,
    patch: Partial<PriceHistory>
  ): Promise<PriceHistory | null> {
    const { data, error } = await this.client()
      .from("price_history")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapPriceHistory(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await this.client()
      .from("price_history")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }

  async findByCategoryId(categoryId: number): Promise<PriceHistory[]> {
    const { data, error } = await this.client()
      .from("price_history")
      .select("*")
      .eq("category_id", categoryId)
      .order("recorded_on");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPriceHistory);
  }

  async findRecent(limit = 100): Promise<PriceHistory[]> {
    const { data, error } = await this.client()
      .from("price_history")
      .select("*")
      .order("recorded_on", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPriceHistory);
  }
}
