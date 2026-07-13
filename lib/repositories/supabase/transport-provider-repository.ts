import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapTransport } from "@/lib/supabase/mappers";
import type { TransportProvider } from "@/lib/types";
import type { Repository } from "../types";

export class SupabaseTransportProviderRepository
  implements Repository<TransportProvider>
{
  private client() {
    return getSupabaseBrowserClient();
  }

  async findAll(): Promise<TransportProvider[]> {
    const { data, error } = await this.client()
      .from("transport_providers")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTransport);
  }

  async findById(id: number): Promise<TransportProvider | null> {
    const { data, error } = await this.client()
      .from("transport_providers")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapTransport(data) : null;
  }

  async create(
    data: Omit<TransportProvider, "id"> & { id?: number }
  ): Promise<TransportProvider> {
    const { data: row, error } = await this.client()
      .from("transport_providers")
      .insert({
        name: data.name,
        phone: data.phone,
        coverage_lga: data.coverage_lga,
        notes: data.notes,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapTransport(row);
  }

  async update(
    id: number,
    patch: Partial<TransportProvider>
  ): Promise<TransportProvider | null> {
    const { data, error } = await this.client()
      .from("transport_providers")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapTransport(data) : null;
  }

  async delete(id: number): Promise<boolean> {
    const { error } = await this.client()
      .from("transport_providers")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }

  async findByLga(lga: string): Promise<TransportProvider[]> {
    const { data, error } = await this.client()
      .from("transport_providers")
      .select("*")
      .ilike("coverage_lga", `%${lga}%`);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapTransport);
  }
}
