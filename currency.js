import { supabase } from "./supabase.js";

export async function getPriceCurrency() {
  return "NGN";
}

export function formatPrice(amount, currency = "NGN") {
  const numericAmount = Number(amount) || 0;

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(numericAmount);
}
