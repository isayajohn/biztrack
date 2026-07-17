import type { Promotion } from "../services/promotionApi";

export type SaleTotals = {
  promotionDiscount: number;
  taxAmount: number;
  netTotal: number;
};

// Mirrors the backend's createPosSale/createSale total calculation
// (backend-laravel/app/Http/Controllers/Api/SaleController.php) so the
// preview shown while checking out always matches what gets charged.
export function computeSaleTotals(
  subtotal: number,
  discount: number,
  promotion: Promotion | undefined,
  taxRate: number,
): SaleTotals {
  const promotionBase = Math.max(0, subtotal - discount);
  const rawPromotionDiscount = promotion
    ? promotion.type === "PERCENTAGE"
      ? (promotionBase * promotion.value) / 100
      : promotion.value
    : 0;
  const promotionDiscount = promotion
    ? Math.min(
        promotionBase,
        promotion.maximumDiscount ? Math.min(rawPromotionDiscount, promotion.maximumDiscount) : rawPromotionDiscount,
      )
    : 0;
  const taxAmount = Math.max(0, subtotal - discount - promotionDiscount) * (taxRate / 100);
  const netTotal = Math.max(0, subtotal - discount - promotionDiscount + taxAmount);

  return { promotionDiscount, taxAmount, netTotal };
}
