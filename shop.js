import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://yzpgidujkkdyovdktgxr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cGdpZHVqa2tkeW92ZGt0Z3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NDUwMjIsImV4cCI6MjEwMTQyMTAyMn0.-42vUhpATy5apXZ_xVfvBKy-tLR7AAuOQZm2m9S16bk";

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// =====================================================
// FUNDZ SHOP
// Supabase-powered shop page
// =====================================================

// -----------------------------------------------------
// STATE
// -----------------------------------------------------

let allProducts = [];
let filteredProducts = [];

let selectedCategory = "all";
let searchTerm = "";
let sortOption = "newest";

let wishlist = [];

// -----------------------------------------------------
// DOM
// -----------------------------------------------------

const productGrid = document.getElementById("productGrid");
const emptyState = document.getElementById("emptyState");
const resultCount = document.getElementById("resultCount");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const categoryContainer =
  document.getElementById("categoryContainer");

const cartCount =
  document.getElementById("cartCount");

const wishlistCount =
  document.getElementById("wishlistCount");

const clearFilters =
  document.getElementById("clearFilters");

const year =
  document.getElementById("year");


// =====================================================
// INITIALIZE
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  setupSearch();
  setupSorting();
  setupClearFilters();
  setupNavigation();
  setupMobileMenu();

  await loadWishlist();

  await loadProducts();

  updateCartCount();
  updateWishlistCount();
  updateWishlistButtons();

  subscribeToProductChanges();

});


// =====================================================
// LOAD PRODUCTS FROM SUPABASE
// =====================================================

async function loadProducts() {

  if (!productGrid) return;

  showLoading();

  try {

    const query = supabase
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    allProducts = Array.isArray(data)
      ? data.map(normalizeProduct)
      : [];

    /*
     * If your products table has is_active,
     * only show active products.
     */

    if (
      allProducts.some(
        product =>
          product.is_active !== undefined &&
          product.is_active !== null
      )
    ) {

      allProducts =
        allProducts.filter(
          product =>
            product.is_active === true
        );

    }

    createCategories();

    applyFilters();

  } catch (error) {

    console.error(
      "FUNDZ Supabase products error:",
      error
    );

    allProducts = [];

    productGrid.innerHTML = `
      <div class="col-span-full py-24 text-center">

        <div class="text-4xl">
          ⚠
        </div>

        <h2 class="mt-5 text-xl font-bold">
          Unable to load products
        </h2>

        <p class="mt-2 text-sm text-white/40">
          ${escapeHtml(error.message || "Please try again later.")}
        </p>

        <button
          id="retryProducts"
          class="mt-6 rounded-full bg-white px-6 py-3 text-sm font-bold text-black"
        >
          Try Again
        </button>

      </div>
    `;

    if (resultCount) {
      resultCount.textContent = "Unable to load products";
    }

    document
      .getElementById("retryProducts")
      ?.addEventListener(
        "click",
        loadProducts
      );

  }

}


// =====================================================
// PRODUCT CATEGORY
// =====================================================

function getProductCategory(product) {

  return (
    product.category ||
    product.category_name ||
    product.collection ||
    product.collection_name ||
    product.collections?.name ||
    ""
  );

}


// =====================================================
// NORMALIZE PRODUCT
// =====================================================

function normalizeProduct(product) {

  const title =
    product.title ||
    product.name ||
    "FUNDZ Product";

  const price =
    product.price ??
    (
      product.price_cents != null
        ? Number(product.price_cents) / 100
        : 0
    );

  const priceCents =
    product.price_cents ??
    Math.round(Number(price) * 100);

  const slug =
    product.slug ||
    slugify(title) ||
    product.id;

  const image =
    getProductImage(product);

  return {

    ...product,

    id: product.id,

    title,

    price: Number(price) || 0,

    price_cents: Number(priceCents) || 0,

    slug,

    image_url: image,

    category:
      getProductCategory(product),

    stock:
      Number(product.stock ?? 0)

  };

}


// =====================================================
// PRODUCT IMAGE
// =====================================================

function getProductImage(product) {

  if (product.image_url) {
    return product.image_url;
  }

  if (
    Array.isArray(product.image_urls) &&
    product.image_urls.length
  ) {
    return product.image_urls[0];
  }

  if (
    Array.isArray(product.images) &&
    product.images.length
  ) {

    const first =
      product.images[0];

    if (typeof first === "string") {
      return first;
    }

    if (first?.url) {
      return first.url;
    }

  }

  return "https://placehold.co/900x1100/111111/FFFFFF?text=FUNDZ";

}


// =====================================================
// CREATE CATEGORIES FROM SUPABASE PRODUCTS
// =====================================================

function createCategories() {

  if (!categoryContainer) return;

  const categories = [
    ...new Set(
      allProducts
        .map(product => product.category)
        .filter(Boolean)
    )
  ].sort();

  categoryContainer.innerHTML = "";

  const allButton =
    document.createElement("button");

  allButton.type = "button";

  allButton.dataset.category = "all";

  allButton.className =
    "category-btn active-filter whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm";

  allButton.textContent = "All";

  categoryContainer.appendChild(
    allButton
  );

  categories.forEach(category => {

    const button =
      document.createElement("button");

    button.type = "button";

    button.dataset.category =
      category;

    button.className =
      "category-btn whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm";

    button.textContent =
      category;

    categoryContainer.appendChild(
      button
    );

  });

  attachCategoryEvents();

}


// =====================================================
// CATEGORY EVENTS
// =====================================================

function attachCategoryEvents() {

  document
    .querySelectorAll(".category-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectedCategory =
            button.dataset.category;

          document
            .querySelectorAll(
              ".category-btn"
            )
            .forEach(btn => {

              btn.classList.remove(
                "active-filter"
              );

            });

          button.classList.add(
            "active-filter"
          );

          applyFilters();

        }
      );

    });

}


// =====================================================
// FILTER PRODUCTS
// =====================================================

function applyFilters() {

  filteredProducts =
    [...allProducts];

  // CATEGORY

  if (
    selectedCategory !== "all"
  ) {

    filteredProducts =
      filteredProducts.filter(
        product =>
          String(
            product.category
          ).toLowerCase() ===
          String(
            selectedCategory
          ).toLowerCase()
      );

  }

  // SEARCH

  if (searchTerm) {

    const query =
      searchTerm.toLowerCase();

    filteredProducts =
      filteredProducts.filter(
        product => {

          const title =
            String(
              product.title || ""
            ).toLowerCase();

          const category =
            String(
              product.category || ""
            ).toLowerCase();

          const description =
            String(
              product.description || ""
            ).toLowerCase();

          return (
            title.includes(query) ||
            category.includes(query) ||
            description.includes(query)
          );

        }
      );

  }

  // SORT

  switch (sortOption) {

    case "price-low":

      filteredProducts.sort(
        (a, b) =>
          Number(a.price) -
          Number(b.price)
      );

      break;


    case "price-high":

      filteredProducts.sort(
        (a, b) =>
          Number(b.price) -
          Number(a.price)
      );

      break;


    case "name":

      filteredProducts.sort(
        (a, b) =>
          String(a.title)
            .localeCompare(
              String(b.title)
            )
      );

      break;


    case "newest":

    default:

      filteredProducts.sort(
        (a, b) =>
          new Date(
            b.created_at || 0
          ) -
          new Date(
            a.created_at || 0
          )
      );

      break;

  }

  renderProducts();

}


// =====================================================
// RENDER PRODUCTS
// =====================================================

function renderProducts() {

  if (!productGrid) return;

  if (resultCount) {

    resultCount.textContent =
      `${filteredProducts.length} ${
        filteredProducts.length === 1
          ? "product"
          : "products"
      }`;

  }

  if (!filteredProducts.length) {

    productGrid.innerHTML = "";

    emptyState?.classList.remove(
      "hidden"
    );

    return;

  }

  emptyState?.classList.add(
    "hidden"
  );

  productGrid.innerHTML =
    filteredProducts
      .map(createProductCard)
      .join("");

}


// =====================================================
// PRODUCT CARD
// =====================================================

function createProductCard(product) {

  const stock =
    Number(product.stock || 0);

  const soldOut =
    stock <= 0;

  const isNew =
    product.is_new === true;

  const isWishlisted =
    wishlist.includes(
      String(product.id)
    );

  const image =
    product.image_url;

  const slug =
    product.slug ||
    product.id;

  return `

    <article
      class="group relative"
      data-product-card="${escapeHtml(product.id)}"
    >

      <div class="relative">

        <a
          href="product.html?id=${encodeURIComponent(product.id)}"
          class="block"
        >

          <div
            class="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white/[.04]"
          >

            <img
              src="${escapeHtml(image)}"
              alt="${escapeHtml(product.title)}"
              loading="lazy"
              class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            >

            ${
              isNew
                ? `
                  <span
                    class="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black"
                  >
                    New
                  </span>
                `
                : ""
            }

            ${
              soldOut
                ? `
                  <div
                    class="absolute inset-0 flex items-center justify-center bg-black/60"
                  >

                    <span
                      class="rounded-full bg-black px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
                    >
                      Sold Out
                    </span>

                  </div>
                `
                : ""
            }

          </div>

        </a>


        <button
          type="button"
          class="wishlist-product absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/70${
            isWishlisted
              ? "bg-red-500 text-white shadow-lg"
              : "hover:bg-white hover:text-black"
          }"
          data-product-id="${escapeHtml(product.id)}"
          aria-label="Add ${escapeHtml(product.title)} to wishlist"
        >
          ${
            isWishlisted
              ? "♥"
              : "♡"
          }
        </button>

      </div>


      <div class="pt-4">

        <div
          class="flex items-start justify-between gap-3"
        >

          <div>

            <a
              href="product.html?id=${encodeURIComponent(product.id)}"
            >

              <h3
                class="text-sm font-bold"
              >
                ${escapeHtml(product.title)}
              </h3>

            </a>

            ${
              product.category
                ? `
                  <p
                    class="mt-1 text-xs text-white/40"
                  >
                    ${escapeHtml(product.category)}
                  </p>
                `
                : ""
            }

          </div>


          <div class="text-right">

            <p class="whitespace-nowrap text-sm font-bold">
              ${formatMoney(product.price)}
            </p>

            ${
              product.compare_at_price &&
              Number(product.compare_at_price) >
              Number(product.price)
                ? `
                  <p
                    class="text-xs text-white/30 line-through"
                  >
                    ${formatMoney(
                      product.compare_at_price
                    )}
                  </p>
                `
                : ""
            }

          </div>

        </div>


        <button
          type="button"
          class="add-to-cart mt-4 w-full rounded-full border border-white/15 py-3 text-xs font-bold uppercase tracking-wider transition hover:bg-white hover:text-black ${
            soldOut
              ? "cursor-not-allowed opacity-40"
              : ""
          }"
          data-product-id="${escapeHtml(product.id)}"
          ${soldOut ? "disabled" : ""}
        >

          ${
            soldOut
              ? "Sold Out"
              : "Add to Bag"
          }

        </button>

      </div>

    </article>

  `;

}


// =====================================================
// SEARCH
// =====================================================

function setupSearch() {

  if (!searchInput) return;

  searchInput.addEventListener(
    "input",
    event => {

      searchTerm =
        event.target.value
          .trim();

      applyFilters();

    }
  );

}


// =====================================================
// SORT
// =====================================================

function setupSorting() {

  if (!sortSelect) return;

  sortSelect.addEventListener(
    "change",
    event => {

      sortOption =
        event.target.value;

      applyFilters();

    }
  );

}


// =====================================================
// CLEAR FILTERS
// =====================================================

function setupClearFilters() {

  clearFilters?.addEventListener(
    "click",
    () => {

      selectedCategory =
        "all";

      searchTerm =
        "";

      sortOption =
        "newest";

      if (searchInput) {
        searchInput.value = "";
      }

      if (sortSelect) {
        sortSelect.value =
          "newest";
      }

      document
        .querySelectorAll(
          ".category-btn"
        )
        .forEach(button => {

          button.classList.remove(
            "active-filter"
          );

        });

      document
        .querySelector(
          '[data-category="all"]'
        )
        ?.classList.add(
          "active-filter"
        );

      applyFilters();

    }
  );

}


// =====================================================
// PRODUCT GRID EVENTS
// =====================================================

productGrid?.addEventListener(
  "click",
  async event => {

    const cartButton =
      event.target.closest(
        ".add-to-cart"
      );

    if (cartButton) {

      event.preventDefault();

      const productId =
        cartButton.dataset.productId;

      addToCart(productId);

      return;

    }


    const wishlistButton =
      event.target.closest(
        ".wishlist-product"
      );

    if (wishlistButton) {

      event.preventDefault();

      event.stopPropagation();

      const productId =
        wishlistButton.dataset.productId;

      await toggleWishlist(
        productId
      );

    }

  }
);


// =====================================================
// CART
// =====================================================

function getCart() {

  try {

    const cart =
      JSON.parse(
        localStorage.getItem(
          "fundz_cart"
        ) || "[]"
      );

    return Array.isArray(cart)
      ? cart
      : [];

  } catch {

    return [];

  }

}


function saveCart(cart) {

  localStorage.setItem(
    "fundz_cart",
    JSON.stringify(cart)
  );

}


function addToCart(productId) {

  const product =
    allProducts.find(
      item =>
        String(item.id) ===
        String(productId)
    );

  if (!product) {

    showToast(
      "Product not found."
    );

    return;

  }


  const stock =
    Number(product.stock || 0);


  if (stock <= 0) {

    showToast(
      "This product is sold out."
    );

    return;

  }


  const cart =
    getCart();


  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(productId)
    );


  if (existing) {

    if (
      Number(existing.quantity) >=
      stock
    ) {

      showToast(
        "You have reached the available stock."
      );

      return;

    }

    existing.quantity += 1;

  } else {

    cart.push({

      id: product.id,

      title: product.title,

      price: Number(
        product.price
      ),

      image_url:
        product.image_url,

      slug:
        product.slug,

      quantity: 1

    });

  }


  saveCart(cart);

  updateCartCount();

  showToast(
    `${product.title} added to your bag.`
  );

}


// =====================================================
// CART COUNT
// =====================================================

function updateCartCount() {

  if (!cartCount) return;

  const cart =
    getCart();

  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 1
        ),
      0
    );

  cartCount.textContent =
    total;

}


// =====================================================
// WISHLIST FROM LOCAL STORAGE
// =====================================================

async function loadWishlist() {

  try {

    const {
      data: {
        user
      }
    } =
      await supabase.auth.getUser();

    wishlist =
      user ? getLocalWishlist() : [];

    updateWishlistCount();

  } catch (error) {

    console.error(
      "Wishlist loading error:",
      error
    );

    wishlist =
      getLocalWishlist();

  }

}


// =====================================================
// TOGGLE WISHLIST
// =====================================================

async function toggleWishlist(
  productId
) {

  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser();

  if (!user) {

    showToast(
      "Login to add to wishlist."
    );

    return;

  }

  const id =
    String(productId);

  const product =
    allProducts.find(
      item =>
        String(item.id) === id
    );

  const normalizedProduct = {

    id,
    name:
      product?.title ||
      product?.name ||
      "FUNDZ Product",
    price:
      Number(product?.price || 0),
    image_url:
      product?.image ||
      product?.image_url ||
      "",
    slug:
      product?.slug || id,
    category:
      product?.category ||
      product?.collection ||
      "",
    collection:
      product?.collection ||
      "",
    stock:
      Number(product?.stock || 0)

  };

  const exists =
    wishlist.some(
      item =>
        String(
          item &&
            typeof item === "object"
            ? item.id
            : item
        ) === id
    );


  if (exists) {

    wishlist =
      wishlist.filter(
        item =>
          String(
            item &&
              typeof item === "object"
              ? item.id
              : item
          ) !== id
      );

    showToast(
      "Removed from wishlist."
    );

  } else {

    wishlist.push(
      normalizedProduct
    );

    showToast(
      "Added to wishlist."
    );

  }

  saveLocalWishlist();
  updateWishlistCount();
  renderProducts();
  updateWishlistButtons();

}


// =====================================================
// WISHLIST COUNT
// =====================================================

function updateWishlistCount() {

  if (!wishlistCount) return;

  wishlistCount.textContent =
    wishlist.length;

}


/* =========================================================
   WISHLIST BUTTON STATE
========================================================= */

function updateWishlistButtons() {

  document
    .querySelectorAll(".wishlist-product")
    .forEach(button => {

      const id = String(button.dataset.productId || "");

      const active =
        wishlist.some(item =>
          String(
            item && typeof item === "object"
              ? item.id
              : item
          ) === id
        );

      button.textContent = active ? "♥" : "♡";

      button.classList.toggle("bg-red-500", active);
      button.classList.toggle("text-white", active);
      button.classList.toggle("shadow-lg", active);
      button.classList.toggle("border-red-400", active);

      if (!active) {
        button.classList.remove(
          "bg-red-500",
          "text-white",
          "shadow-lg",
          "border-red-400"
        );
        button.classList.add("bg-white", "text-black");
      }

    });

}


// =====================================================
// LOCAL WISHLIST
// =====================================================

function getLocalWishlist() {

  try {

    const data =
      JSON.parse(
        localStorage.getItem(
          "fundz_wishlist"
        ) || "[]"
      );

    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map(item => {

        if (
          typeof item === "string" ||
          typeof item === "number"
        ) {
          return {
            id: String(item)
          };
        }

        if (
          item &&
          typeof item === "object"
        ) {
          return {
            ...item,
            id: String(
              item.id ||
              item.product_id ||
              item.productId ||
              item.slug ||
              ""
            )
          };
        }

        return {
          id: ""
        };

      })
      .filter(item => item.id);

  } catch {

    return [];

  }

}

function saveLocalWishlist() {

  localStorage.setItem(
    "fundz_wishlist",
    JSON.stringify(wishlist)
  );

}


// =====================================================
// NAVIGATION
// =====================================================

function setupNavigation() {

  document
    .getElementById("cartBtn")
    ?.addEventListener(
      "click",
      () => {

        window.location.href =
          "cart.html";

      }
    );


  document
    .getElementById("wishlistBtn")
    ?.addEventListener(
      "click",
      () => {

        window.location.href =
          "wishlist.html";

      }
    );

}


// =====================================================
// MOBILE MENU
// =====================================================

function setupMobileMenu() {

  const button =
    document.getElementById(
      "mobileMenuButton"
    );

  const menu =
    document.getElementById(
      "mobileMenu"
    );

  const close =
    document.getElementById(
      "mobileMenuClose"
    );

  const overlay =
    document.getElementById(
      "mobileMenuOverlay"
    );


  if (!button || !menu) {
    return;
  }


  button.addEventListener(
    "click",
    () => {

      menu.classList.remove(
        "hidden"
      );

      overlay?.classList.remove(
        "hidden"
      );

      document.body.classList.add(
        "overflow-hidden"
      );

    }
  );


  function closeMenu() {

    menu.classList.add(
      "hidden"
    );

    overlay?.classList.add(
      "hidden"
    );

    document.body.classList.remove(
      "overflow-hidden"
    );

  }


  close?.addEventListener(
    "click",
    closeMenu
  );


  overlay?.addEventListener(
    "click",
    closeMenu
  );


  menu
    .querySelectorAll("a")
    .forEach(link => {

      link.addEventListener(
        "click",
        closeMenu
      );

    });

}


// =====================================================
// AUTH STATE
// =====================================================

supabase.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    if (
      event === "SIGNED_IN"
    ) {

      await loadWishlist();

      updateWishlistCount();

      renderProducts();

    }


    if (
      event === "SIGNED_OUT"
    ) {

      wishlist = [];
      localStorage.removeItem("fundz_wishlist");

      updateWishlistCount();

      renderProducts();

    }

  }
);


// =====================================================
// REALTIME PRODUCT UPDATES
// =====================================================

function subscribeToProductChanges() {

  supabase
    .channel(
      "fundz-products-realtime"
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products"
      },
      async () => {

        console.log(
          "FUNDZ products updated."
        );

        await loadProducts();

      }
    )
    .subscribe();

}


// =====================================================
// LOADING
// =====================================================

function showLoading() {

  if (!productGrid) return;

  productGrid.innerHTML = `

    <div
      class="col-span-full flex justify-center py-24"
    >

      <div
        class="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"
      ></div>

    </div>

  `;

}


// =====================================================
// MONEY
// =====================================================

function formatMoney(value) {

  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }
  ).format(
    Number(value || 0)
  );

}


// =====================================================
// SLUG
// =====================================================

function slugify(value) {

  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(
      /[^a-z0-9-]/g,
      ""
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );

}


// =====================================================
// TOAST
// =====================================================

function showToast(message) {

  let toast =
    document.getElementById(
      "fundzToast"
    );


  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "fundzToast";

    toast.className =
      "fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black shadow-2xl";

    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message;


  toast.classList.remove(
    "hidden"
  );


  clearTimeout(
    window.fundzToastTimer
  );


  window.fundzToastTimer =
    setTimeout(
      () => {

        toast.classList.add(
          "hidden"
        );

      },
      3000
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    character => {

      const map = {

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#039;"

      };

      return map[
        character
      ];

    }
  );

}