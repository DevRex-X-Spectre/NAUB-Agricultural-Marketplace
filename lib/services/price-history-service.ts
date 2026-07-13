import {
  categoryRepository,
  priceHistoryRepository,
  productRepository,
} from "@/lib/repositories";
import type { PriceHistory, ServiceResult } from "@/lib/types";
import { todayIsoDate } from "@/lib/utils/format";

export type CategoryTrend = {
  category_id: number;
  category_name: string;
  avg_price: number;
  sample_count: number;
  history: PriceHistory[];
};

export class PriceHistoryService {
  /** Snapshot current active listing averages per category into price_history */
  async recordSnapshots(
    recordedOn = todayIsoDate()
  ): Promise<ServiceResult<PriceHistory[]>> {
    const [categories, products] = await Promise.all([
      categoryRepository.findAll(),
      productRepository.findActive(),
    ]);

    const created: PriceHistory[] = [];
    for (const cat of categories) {
      const inCat = products.filter((p) => p.category_id === cat.id);
      if (inCat.length === 0) continue;
      const avg =
        inCat.reduce((s, p) => s + p.price, 0) / inCat.length;
      const row = await priceHistoryRepository.create({
        category_id: cat.id,
        avg_price: Math.round(avg * 100) / 100,
        recorded_on: recordedOn,
      });
      created.push(row);
    }

    return { success: true, data: created };
  }

  /**
   * FR-10: top traded categories by sample volume + historical average.
   */
  async getTopCategoryTrends(
    limit = 10
  ): Promise<ServiceResult<CategoryTrend[]>> {
    const [categories, products, history] = await Promise.all([
      categoryRepository.findAll(),
      productRepository.findAll(),
      priceHistoryRepository.findAll(),
    ]);

    const trends: CategoryTrend[] = categories.map((cat) => {
      const inCat = products.filter((p) => p.category_id === cat.id);
      const hist = history
        .filter((h) => h.category_id === cat.id)
        .sort((a, b) => a.recorded_on.localeCompare(b.recorded_on));
      const avgFromListings =
        inCat.length === 0
          ? 0
          : inCat.reduce((s, p) => s + p.price, 0) / inCat.length;
      const avgFromHistory =
        hist.length === 0
          ? 0
          : hist.reduce((s, h) => s + h.avg_price, 0) / hist.length;

      return {
        category_id: cat.id,
        category_name: cat.name,
        avg_price:
          Math.round(
            (hist.length ? avgFromHistory : avgFromListings) * 100
          ) / 100,
        sample_count: inCat.length,
        history: hist,
      };
    });

    trends.sort((a, b) => b.sample_count - a.sample_count);
    return { success: true, data: trends.slice(0, limit) };
  }

  async listHistory(
    categoryId?: number
  ): Promise<ServiceResult<PriceHistory[]>> {
    if (categoryId != null) {
      const rows = await priceHistoryRepository.findByCategoryId(categoryId);
      rows.sort((a, b) => a.recorded_on.localeCompare(b.recorded_on));
      return { success: true, data: rows };
    }
    const rows = await priceHistoryRepository.findRecent(200);
    return { success: true, data: rows };
  }
}

export const priceHistoryService = new PriceHistoryService();
