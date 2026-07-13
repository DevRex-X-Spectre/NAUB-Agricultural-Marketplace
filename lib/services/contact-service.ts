import {
  contactRequestRepository,
  productRepository,
  userRepository,
} from "@/lib/repositories";
import type {
  ContactMethod,
  ContactRequest,
  CreateContactRequestInput,
  ServiceResult,
  UserId,
} from "@/lib/types";
import { sameId } from "@/lib/types";
import { formatPhoneDisplay, nowIso } from "@/lib/utils/format";
import {
  buildTelLink,
  buildWhatsAppLink,
  buyerToFarmerMessage,
  farmerToBuyerMessage,
} from "@/lib/utils/whatsapp";

export type ContactLinks = {
  request: ContactRequest;
  /** Opens chat with the farmer's registered WhatsApp number */
  whatsapp_url: string;
  tel_url: string;
  farmer_phone: string;
  buyer_phone: string;
};

export class ContactService {
  /**
   * FR-05: log contact, then return WhatsApp/tel links to the farmer's
   * registered phone (their WhatsApp number on the listing).
   */
  async logAndGetLinks(
    input: CreateContactRequestInput,
    buyerName?: string
  ): Promise<ServiceResult<ContactLinks>> {
    const product = await productRepository.findById(input.product_id);
    if (!product) return { success: false, error: "Product not found" };
    if (product.status !== "active") {
      return { success: false, error: "This listing is no longer active" };
    }
    if (!sameId(product.farmer_id, input.farmer_id)) {
      return { success: false, error: "Farmer does not match this listing" };
    }

    const farmer = await userRepository.findById(input.farmer_id);
    if (!farmer) return { success: false, error: "Farmer not found" };
    if (!farmer.phone?.trim()) {
      return {
        success: false,
        error: "This seller has no WhatsApp number on their account",
      };
    }

    const buyer = await userRepository.findById(input.buyer_id);
    if (!buyer || buyer.role !== "buyer") {
      return { success: false, error: "Only buyers can contact sellers" };
    }
    if (!buyer.phone?.trim()) {
      return {
        success: false,
        error: "Add a WhatsApp phone number on your account before contacting",
      };
    }

    const request = await contactRequestRepository.create({
      buyer_id: input.buyer_id,
      farmer_id: input.farmer_id,
      product_id: input.product_id,
      method: input.method,
      status: "sent",
      created_at: nowIso(),
    });

    const message = buyerToFarmerMessage(
      product.name,
      buyerName || buyer.full_name,
      formatPhoneDisplay(buyer.phone)
    );

    return {
      success: true,
      data: {
        request,
        whatsapp_url: buildWhatsAppLink(farmer.phone, message),
        tel_url: buildTelLink(farmer.phone),
        farmer_phone: farmer.phone,
        buyer_phone: buyer.phone,
      },
    };
  }

  async markCompleted(
    requestId: number,
    actorUserId: UserId
  ): Promise<ServiceResult<ContactRequest>> {
    const request = await contactRequestRepository.findById(requestId);
    if (!request) return { success: false, error: "Contact request not found" };
    if (
      !sameId(request.buyer_id, actorUserId) &&
      !sameId(request.farmer_id, actorUserId)
    ) {
      return { success: false, error: "Not authorized to update this request" };
    }
    const updated = await contactRequestRepository.update(requestId, {
      status: "completed",
    });
    if (!updated) return { success: false, error: "Update failed" };
    return { success: true, data: updated };
  }

  async listForFarmer(
    farmerId: UserId
  ): Promise<ServiceResult<ContactRequest[]>> {
    const rows = await contactRequestRepository.findByFarmerId(farmerId);
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { success: true, data: rows };
  }

  async listForBuyer(
    buyerId: UserId
  ): Promise<ServiceResult<ContactRequest[]>> {
    const rows = await contactRequestRepository.findByBuyerId(buyerId);
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { success: true, data: rows };
  }

  /**
   * Open WhatsApp or call for a logged contact.
   * - Buyer opens the farmer's registered WhatsApp
   * - Farmer opens the buyer's registered WhatsApp
   */
  async openChannel(
    requestId: number,
    method: ContactMethod,
    actorUserId: UserId
  ): Promise<ServiceResult<{ url: string; counterparty_phone: string }>> {
    const request = await contactRequestRepository.findById(requestId);
    if (!request) return { success: false, error: "Contact request not found" };

    const isBuyer = sameId(request.buyer_id, actorUserId);
    const isFarmer = sameId(request.farmer_id, actorUserId);
    if (!isBuyer && !isFarmer) {
      return { success: false, error: "Not authorized" };
    }

    const farmer = await userRepository.findById(request.farmer_id);
    const product = await productRepository.findById(request.product_id);
    const buyer = await userRepository.findById(request.buyer_id);
    if (!farmer || !product || !buyer) {
      return { success: false, error: "Related records missing" };
    }

    if (isBuyer) {
      // Contact farmer WhatsApp (seller phone on listing)
      const message = buyerToFarmerMessage(
        product.name,
        buyer.full_name,
        formatPhoneDisplay(buyer.phone)
      );
      const url =
        method === "whatsapp"
          ? buildWhatsAppLink(farmer.phone, message)
          : buildTelLink(farmer.phone);
      return {
        success: true,
        data: { url, counterparty_phone: farmer.phone },
      };
    }

    // Farmer contacts buyer WhatsApp
    const message = farmerToBuyerMessage(
      product.name,
      farmer.full_name,
      formatPhoneDisplay(farmer.phone)
    );
    const url =
      method === "whatsapp"
        ? buildWhatsAppLink(buyer.phone, message)
        : buildTelLink(buyer.phone);
    return {
      success: true,
      data: { url, counterparty_phone: buyer.phone },
    };
  }
}

export const contactService = new ContactService();
