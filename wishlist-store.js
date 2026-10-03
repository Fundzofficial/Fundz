import { supabase } from "./supabase.js";

const migrationsInProgress = new Map();

function getLegacyWishlist() {
  try {
    const saved = JSON.parse(localStorage.getItem("fundz_wishlist") || "[]");
    if (!Array.isArray(saved)) return [];

    return saved
      .map(item => {
        if (typeof item === "string" || typeof item === "number") {
          return { id: String(item) };
        }

        if (item && typeof item === "object") {
          return {
            id: String(item.product_id ?? item.productId ?? item.id ?? ""),
            slug: String(item.slug ?? "")
          };
        }

        return { id: "", slug: "" };
      })
      .filter(item => item.id || item.slug);
  } catch {
    return [];
  }
}

export function migrateLegacyWishlist(userId) {
  if (migrationsInProgress.has(userId)) {
    return migrationsInProgress.get(userId);
  }

  const migration = migrateLegacyWishlistOnce(userId)
    .finally(() => migrationsInProgress.delete(userId));

  migrationsInProgress.set(userId, migration);
  return migration;
}

async function migrateLegacyWishlistOnce(userId) {
  const legacyItems = getLegacyWishlist();
  if (!legacyItems.length) return;

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,slug");

  if (productsError) throw productsError;

  const productIdsByKey = new Map();
  (products || []).forEach(product => {
    productIdsByKey.set(String(product.id), product.id);
    if (product.slug) productIdsByKey.set(String(product.slug), product.id);
  });

  const validIds = new Set();
  legacyItems.forEach(item => {
    const productId = productIdsByKey.get(item.id) || productIdsByKey.get(item.slug);
    if (productId) validIds.add(String(productId));
  });

  const { data: existingRows, error: existingError } = await supabase
    .from("wishlist")
    .select("product_id")
    .eq("user_id", userId);

  if (existingError) throw existingError;

  const existingIds = new Set((existingRows || []).map(row => String(row.product_id)));
  const missingIds = [...validIds].filter(id => !existingIds.has(id));

  if (missingIds.length) {
    const { error } = await supabase.from("wishlist").insert(
      missingIds.map(productId => ({ user_id: userId, product_id: productId }))
    );

    if (error) {
      if (error.code !== "23505") throw error;

      const { data: persistedRows, error: verifyError } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", userId);

      if (verifyError) throw verifyError;

      const persistedIds = new Set(
        (persistedRows || []).map(row => String(row.product_id))
      );

      if (missingIds.some(id => !persistedIds.has(id))) {
        throw error;
      }
    }
  }

  localStorage.removeItem("fundz_wishlist");
}

export async function getWishlistProductIds(userId) {
  await migrateLegacyWishlist(userId);

  const { data, error } = await supabase
    .from("wishlist")
    .select("product_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data || []).map(row => String(row.product_id));
}

export async function setWishlistItem(userId, productId, shouldSave) {
  const query = supabase
    .from("wishlist");

  if (shouldSave) {
    const { error } = await query.insert({
      user_id: userId,
      product_id: productId
    });

    if (error) {
      if (error.code !== "23505") throw error;

      const { data, error: verifyError } = await query
        .select("product_id")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .maybeSingle();

      if (verifyError) throw verifyError;
      if (!data) throw error;
    }

    window.dispatchEvent(new Event("fundz:wishlist-updated"));
    return;
  }

  const { error } = await query
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) throw error;
  window.dispatchEvent(new Event("fundz:wishlist-updated"));
}
