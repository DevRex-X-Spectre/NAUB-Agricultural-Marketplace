import {
  contactRequestRepository,
  reviewRepository,
  userRepository,
} from "@/lib/repositories";
import type {
  CreateReviewInput,
  Review,
  ServiceResult,
  UserId,
} from "@/lib/types";
import { sameId } from "@/lib/types";
import { nowIso } from "@/lib/utils/format";
import { validationService } from "./validation-service";

export class ReviewService {
  /**
   * FR-06: submit review after completed contact; one review per buyer×product.
   * Recomputes farmer average_rating on the user record.
   */
  async submit(input: CreateReviewInput): Promise<ServiceResult<Review>> {
    const ratingErr = validationService.isRating(input.rating);
    if (ratingErr) return { success: false, error: ratingErr };

    const completed =
      await contactRequestRepository.findCompletedForBuyerProduct(
        input.buyer_id,
        input.product_id
      );
    if (!completed) {
      return {
        success: false,
        error:
          "You can only review after marking a contact with this seller as completed",
      };
    }
    if (!sameId(completed.farmer_id, input.farmer_id)) {
      return { success: false, error: "Farmer does not match the contact record" };
    }

    const existing = await reviewRepository.findByBuyerAndProduct(
      input.buyer_id,
      input.product_id
    );
    if (existing) {
      return {
        success: false,
        error: "You have already reviewed this listing",
      };
    }

    const review = await reviewRepository.create({
      buyer_id: input.buyer_id,
      farmer_id: input.farmer_id,
      product_id: input.product_id,
      rating: input.rating,
      comment: input.comment
        ? validationService.sanitizeText(input.comment)
        : null,
      created_at: nowIso(),
    });

    await this.recomputeFarmerRating(input.farmer_id);
    return { success: true, data: review };
  }

  async recomputeFarmerRating(
    farmerId: UserId
  ): Promise<ServiceResult<{ average_rating: number; review_count: number }>> {
    const reviews = await reviewRepository.findByFarmerId(farmerId);
    const count = reviews.length;
    const average =
      count === 0
        ? 0
        : Math.round(
            (reviews.reduce((s, r) => s + r.rating, 0) / count) * 10
          ) / 10;

    await userRepository.update(farmerId, {
      average_rating: average,
      review_count: count,
    });

    return {
      success: true,
      data: { average_rating: average, review_count: count },
    };
  }

  async listForFarmer(farmerId: UserId): Promise<ServiceResult<Review[]>> {
    const rows = await reviewRepository.findByFarmerId(farmerId);
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { success: true, data: rows };
  }

  async listForProduct(productId: number): Promise<ServiceResult<Review[]>> {
    const rows = await reviewRepository.findByProductId(productId);
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { success: true, data: rows };
  }
}

export const reviewService = new ReviewService();
