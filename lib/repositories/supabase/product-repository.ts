import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapProduct } from "@/lib/supabase/mappers";
import type { ListingStatus, Product, UserId } from "@/lib/types";
import type { Repository } from "../types";

export class SupabaseProductRepository implements Repository<Product> {
  private client() {
    return getSupabaseBrowserClient();
  }

  async findAll(): Promise<Product[]> {
    const { data, error } = await this.client().from("products").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapProduct);
  }

  async findById(id: number): Promise<Product | null> {
    const { data, error } = await this.client()
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProduct(data) : null;
  }

  async create(
    data: Omit<Product, "id"> & { id?: number }
  ): Promise<Product> {
    const { data: row, error } = await this.client()
      .from("products")
      .insert({
        farmer_id: String(data.farmer_id),
        category_id: data.category_id,
        name: data.name,
        description: data.description,
        price: data.price,
        unit: data.unit,
        quantity: data.quantity,
        expiry_date: data.expiry_date,
        status: data.status,
        image_path: data.image_path,
        lga: data.lga,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapProduct(row);
  }

  async update(id: number, patch: Partial<Product>): Promise<Product | null> {
    const payload: Record<string, unknown> = { ...patch };
    delete payload.id;
    if (payload.farmer_id != null) {
      payload.farmer_id = String(payload.farmer_id);
    }
    const { data, error } = await this.client()
      .from("products")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProduct(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await this.client()
      .from("products")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }

  async findByFarmerId(farmerId: UserId): Promise<Product[]> {
    const { data, error } = await this.client()
      .from("products")
      .select("*")
      .eq("farmer_id", String(farmerId));
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapProduct);
  }

  async findActiveByCategory(categoryId: number): Promise<Product[]> {
    const { data, error } = await this.client()
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .eq("status", "active");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapProduct);
  }

  async findByStatus(status: ListingStatus): Promise<Product[]> {
    const { data, error } = await this.client()
      .from("products")
      .select("*")
      .eq("status", status);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapProduct);
  }

  async findActive(): Promise<Product[]> {
    return this.findByStatus("active");
  }

  async findExpiredActive(todayIsoDate: string): Promise<Product[]> {
    const { data, error } = await this.client()
      .from("products")
      .select("*")
      .eq("status", "active")
      .lt("expiry_date", todayIsoDate);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapProduct);
  }
}
