import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapCategory } from "@/lib/supabase/mappers";
import type { Category } from "@/lib/types";
import type { Repository } from "../types";

export class SupabaseCategoryRepository implements Repository<Category> {
  private client() {
    return getSupabaseBrowserClient();
  }

  async findAll(): Promise<Category[]> {
    const { data, error } = await this.client()
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapCategory);
  }

  async findById(id: number): Promise<Category | null> {
    const { data, error } = await this.client()
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapCategory(data) : null;
  }

  async create(
    data: Omit<Category, "id"> & { id?: number }
  ): Promise<Category> {
    const { data: row, error } = await this.client()
      .from("categories")
      .insert({
        name: data.name,
        icon: data.icon,
        slug: data.slug,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapCategory(row);
  }

  async update(id: number, patch: Partial<Category>): Promise<Category | null> {
    const { data, error } = await this.client()
      .from("categories")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapCategory(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await this.client()
      .from("categories")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await this.client()
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapCategory(data) : null;
  }
}
