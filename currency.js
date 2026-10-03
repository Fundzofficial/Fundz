import { supabase } from "./supabase.js";

const NGN_TO_ZAR_RATE = 340 / 27000;

export async function getPriceCurrency() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return "NGN";
  }

  const profileCountry = data.user.user_metadata?.country;
  if (profileCountry) {
    return isSouthAfrica(profileCountry) ? "ZAR" : "NGN";
  }

  const { data: address, error: addressError } = await supabase
    .from("addresses")
    .select("country")
    .eq("user_id", data.user.id)
    .eq("is_default", true)
    .limit(1)
    .maybeSingle();

  return !addressError && address && isSouthAfrica(address.country)
    ? "ZAR"
    : "NGN";
}

export function formatPrice(amount, currency = "NGN") {
  const displayCurrency = currency === "ZAR" ? "ZAR" : "NGN";
  const numericAmount = Number(amount) || 0;
  const displayAmount = displayCurrency === "ZAR"
    ? numericAmount * NGN_TO_ZAR_RATE
    : numericAmount;

  return new Intl.NumberFormat(
    displayCurrency === "ZAR" ? "en-ZA" : "en-NG",
    {
      style: "currency",
      currency: displayCurrency,
      maximumFractionDigits: 0
    }
  ).format(displayAmount);
}

function isSouthAfrica(country) {
  return String(country || "").trim().toLowerCase() === "south africa";
}