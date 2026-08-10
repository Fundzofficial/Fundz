import { supabase } from "./supabase.js";

/* =========================================================
   FUNDZ HOMEPAGE
   SUPABASE CONNECTED VERSION
========================================================= */

let products = [];
let wishlistItems = [];
let cartItems = [];


/* =========================================================
   DOM
========================================================= */

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  document.querySelectorAll(selector);


/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  setupMobileMenu();
  setupNavigation();
  setupNewsletter();
  setupCartButton();
  setupWishlistButton();

  await loadHomepage();
  await loadCustomerState();

});


/* =========================================================
   HOMEPAGE
========================================================= */

async function loadHomepage() {

  await Promise.allSettled([

    loadBrandStory(),
    loadFeaturedProducts(),
    loadBestSellers(),
    loadNewArrivals(),
    loadCommunity(),
    loadWorld(),
    loadLiveStats()

  ]);

}


/* =========================================================
   BRAND STORY
========================================================= */

async function loadBrandStory() {

  const element = $("#brandStory");

  if (!element) return;

  try {

    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "brand_story")
      .maybeSingle();

    if (error) {
      console.log("Brand story:", error.message);
      return;
    }

    if (data?.value) {

      element.textContent =
        typeof data.value === "string"
          ? data.value
          : data.value.text || "";

    }

  } catch (error) {

    console.error("Brand story error:", error);

  }

}


/* =========================================================
   LOAD FEATURED
========================================================= */

async function loadFeaturedProducts() {

  const grid = $("#featuredGrid");

  if (!grid) return;

  grid.innerHTML = loadingHTML();

  try {

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", {
        ascending: false
      })
      .limit(8);

    if (error) throw error;

    products = mergeProducts(products, data);

    renderProductGrid(
      grid,
      data || [],
      "No featured products yet."
    );

  } catch (error) {

    console.error(
      "Featured products error:",
      error
    );

    grid.innerHTML = errorHTML(
      "Unable to load featured products."
    );

  }

}


/* =========================================================
   LOAD BEST SELLERS
========================================================= */

async function loadBestSellers() {

  const grid = $("#bestGrid");

  if (!grid) return;

  grid.innerHTML = loadingHTML();

  try {

    /*
     * Do NOT depend on sales_count.
     *
     * This version works with your basic
     * products table.
     */

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", {
        ascending: false
      })
      .limit(8);

    if (error) throw error;

    products = mergeProducts(
      products,
      data
    );

    renderProductGrid(
      grid,
      data || [],
      "No products available yet."
    );

  } catch (error) {

    console.error(
      "Best sellers error:",
      error
    );

    grid.innerHTML = errorHTML(
      "Unable to load products."
    );

  }

}


/* =========================================================
   LOAD NEW ARRIVALS
========================================================= */

async function loadNewArrivals() {

  const grid = $("#newGrid");

  if (!grid) return;

  grid.innerHTML = loadingHTML();

  try {

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", {
        ascending: false
      })
      .limit(8);

    if (error) throw error;

    products = mergeProducts(
      products,
      data
    );

    renderProductGrid(
      grid,
      data || [],
      "No new arrivals yet."
    );

  } catch (error) {

    console.error(
      "New arrivals error:",
      error
    );

    grid.innerHTML = errorHTML(
      "Unable to load new arrivals."
    );

  }

}


/* =========================================================
   PRODUCT GRID
========================================================= */

function renderProductGrid(
  grid,
  productList,
  emptyMessage
) {

  if (!productList.length) {

    grid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <p class="text-sm text-white/40">
          ${escapeHTML(emptyMessage)}
        </p>
      </div>
    `;

    return;

  }

  grid.innerHTML =
    productList
      .map(productCard)
      .join("");

  attachProductEvents();

  updateWishlistButtons();

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function productCard(product) {

  const image =
    getProductImage(product);

  const price =
    Number(product.price || 0);

  const category =
    product.category ||
    product.category_name ||
    "";

  const soldOut =
    Number(product.stock || 0) <= 0;

  return `

    <article
      class="group relative overflow-hidden rounded-2xl"
      data-product-card="${escapeHTML(product.id)}"
    >

      <div class="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white/[.04]">

        <a
          href="product.html?id=${encodeURIComponent(product.id)}"
          class="block h-full w-full"
        >

          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(product.name)}"
            loading="lazy"
            class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            onerror="this.src='https://placehold.co/800x1000/111111/FFFFFF?text=FUNDZ'"
          >

        </a>


        ${
          product.is_new
            ? `
              <span class="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-black">
                New
              </span>
            `
            : ""
        }


        ${
          soldOut
            ? `
              <span class="absolute right-3 top-3 rounded-full bg-black/80 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white">
                Sold Out
              </span>
            `
            : ""
        }


        <button
          type="button"
          class="wishlist-product absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/60 text-xl backdrop-blur"
          data-wishlist-id="${escapeHTML(product.id)}"
        >
          ♡
        </button>

      </div>


      <a
        href="product.html?id=${encodeURIComponent(product.id)}"
        class="block px-1 pt-4"
      >

        <div class="flex items-start justify-between gap-3">

          <div>

            <h3 class="text-sm font-bold">
              ${escapeHTML(product.name)}
            </h3>

            ${
              category
                ? `
                  <p class="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                    ${escapeHTML(category)}
                  </p>
                `
                : ""
            }

          </div>


          <p class="whitespace-nowrap text-sm font-bold">
            ${formatMoney(price)}
          </p>

        </div>

      </a>

      <button
        type="button"
        class="add-to-bag mt-4 w-full rounded-full border border-white/15 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        data-add-to-cart-id="${escapeHTML(product.id)}"
        ${soldOut ? "disabled" : ""}
      >
        ${soldOut ? "Sold Out" : "Add to Bag"}
      </button>

    </article>

  `;

}


/* =========================================================
   PRODUCT IMAGE
========================================================= */

function getProductImage(product) {

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

    const image =
      product.images[0];

    if (
      typeof image === "string"
    ) {

      return image;

    }

    if (image?.url) {

      return image.url;

    }

  }

  if (product.image_url) {

    return product.image_url;

  }

  return "https://placehold.co/800x1000/111111/FFFFFF?text=FUNDZ";

}


/* =========================================================
   MERGE PRODUCTS
========================================================= */

function mergeProducts(
  current,
  incoming
) {

  const map = new Map();

  [...current, ...(incoming || [])]
    .forEach(product => {

      map.set(
        String(product.id),
        product
      );

    });

  return Array.from(
    map.values()
  );

}


/* =========================================================
   PRODUCT EVENTS
========================================================= */

function attachProductEvents() {

  $$(".wishlist-product")
    .forEach(button => {

      button.addEventListener(
        "click",
        async event => {

          event.preventDefault();
          event.stopPropagation();

          await toggleWishlist(
            button.dataset.wishlistId
          );

        }
      );

    });

  $$(".add-to-bag")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.preventDefault();
          event.stopPropagation();

          addToCart(
            button.dataset.addToCartId
          );

        }
      );

    });

}


/* =========================================================
   CUSTOMER STATE
========================================================= */

async function loadCustomerState() {

  try {

    const {
      data: {
        user
      }
    } =
      await supabase.auth.getUser();

    wishlistItems =
      user ? getLocalWishlist() : [];

    cartItems =
      getLocalCart();

    updateCounts();
    updateWishlistButtons();

  } catch (error) {

    console.error(
      "Customer state error:",
      error
    );

  }

}


/* =========================================================
   WISHLIST
========================================================= */

async function loadWishlist() {

  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser();

  wishlistItems =
    user ? getLocalWishlist() : [];

  updateWishlistButtons();

}


/* =========================================================
   TOGGLE WISHLIST
========================================================= */

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

  productId =
    String(productId);

  const product =
    products.find(
      item =>
        String(item.id) ===
        productId
    );

  const normalizedProduct = {

    id: productId,
    name:
      product?.name ||
      product?.title ||
      "FUNDZ Product",
    price:
      Number(product?.price || 0),
    image_url:
      getProductImage(product),
    slug:
      product?.slug ||
      productId,
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
    wishlistItems.some(
      item =>
        String(
          item &&
            typeof item === "object"
            ? item.id
            : item
        ) === productId
    );

  if (exists) {

    wishlistItems =
      wishlistItems.filter(
        item =>
          String(
            item &&
              typeof item === "object"
              ? item.id
              : item
          ) !== productId
      );

  } else {

    wishlistItems.push(
      normalizedProduct
    );

  }

  saveLocalWishlist();

  updateCounts();
  updateWishlistButtons();

}


/* =========================================================
   WISHLIST BUTTON STATE
========================================================= */

function updateWishlistButtons() {

  $$(".wishlist-product")
    .forEach(button => {

      const id =
        String(
          button.dataset.wishlistId
        );

      const active =
        wishlistItems.some(
          item =>
            String(
              item &&
                typeof item === "object"
                ? item.id
                : item
            ) === id
        );

      button.textContent =
        active
          ? "♥"
          : "♡";

      button.classList.toggle(
        "bg-red-500",
        active
      );

      button.classList.toggle(
        "text-white",
        active
      );

      button.classList.toggle(
        "shadow-lg",
        active
      );

      button.classList.toggle(
        "border-red-400",
        active
      );

      if (!active) {
        button.classList.remove(
          "bg-red-500",
          "text-white",
          "shadow-lg",
          "border-red-400"
        );
      }

    });

}


/* =========================================================
   CART
========================================================= */

async function loadCart() {

  cartItems =
    getLocalCart();

  updateCounts();

}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function getLocalCart() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "fundz_cart"
      ) || "[]"
    );

  } catch {

    return [];

  }

}


function getLocalWishlist() {

  try {

    const saved =
      JSON.parse(
        localStorage.getItem(
          "fundz_wishlist"
        ) || "[]"
      );

    if (!Array.isArray(saved)) {
      return [];
    }

    return saved
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


function saveLocalCart(cart) {

  localStorage.setItem(
    "fundz_cart",
    JSON.stringify(cart)
  );

}


function saveLocalWishlist() {

  localStorage.setItem(
    "fundz_wishlist",
    JSON.stringify(
      wishlistItems
    )
  );

}


/* =========================================================
   COUNTS
========================================================= */

function updateCounts() {

  const wishlistCount =
    $("#wishlistCount");

  const cartCount =
    $("#cartCount");


  if (wishlistCount) {

    wishlistCount.textContent =
      wishlistItems.length;

  }


  if (cartCount) {

    const count =
      cartItems.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantity || 1
          ),
        0
      );

    cartCount.textContent =
      count;

  }

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(productId) {

  const product =
    products.find(
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
    getLocalCart();

  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );

  if (existing) {

    existing.quantity =
      Number(existing.quantity || 1) + 1;

  } else {

    cart.push({

      id: product.id,
      name: product.name || product.title || "FUNDZ Product",
      price: Number(product.price || 0),
      image_url: getProductImage(product),
      quantity: 1,
      slug: product.slug || product.id

    });

  }

  saveLocalCart(cart);

  cartItems = cart;

  updateCounts();

  showToast(
    `${product.name || product.title || "Product"} added to your bag.`
  );

}


/* =========================================================
   CART BUTTON
========================================================= */

function setupCartButton() {

  const button =
    $("#cartBtn");

  if (!button) return;

  button.addEventListener(
    "click",
    () => {

      window.location.href =
        "cart.html";

    }
  );

}


/* =========================================================
   WISHLIST BUTTON
========================================================= */

function setupWishlistButton() {

  const button =
    $("#wishlistBtn");

  if (!button) return;

  button.addEventListener(
    "click",
    () => {

      window.location.href =
        "wishlist.html";

    }
  );

}


/* =========================================================
   COMMUNITY
========================================================= */

async function loadCommunity() {

  const grid =
    $("#communityGrid");

  if (!grid) return;

  try {

    const {
      data,
      error
    } = await supabase
      .from("community_posts")
      .select(
        "id,image_url,caption,likes_count,created_at"
      )
      .eq(
        "status",
        "approved"
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(6);

    if (error) throw error;


    if (!data?.length) {

      grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <p class="text-sm text-white/40">
            The FUNDZ family gallery is coming soon.
          </p>
        </div>
      `;

      return;

    }


    grid.innerHTML =
      data
        .map(post => `

          <article
            class="group relative aspect-square overflow-hidden rounded-2xl bg-white/[.04]"
          >

            <img
              src="${escapeHTML(post.image_url)}"
              alt="${escapeHTML(post.caption || "FUNDZ community")}"
              loading="lazy"
              class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            >

            <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-16">

              ${
                post.caption
                  ? `
                    <p class="text-xs">
                      ${escapeHTML(post.caption)}
                    </p>
                  `
                  : ""
              }

              <p class="mt-2 text-[10px] text-white/50">
                ♥ ${Number(post.likes_count || 0).toLocaleString()}
              </p>

            </div>

          </article>

        `)
        .join("");

  } catch (error) {

    console.error(
      "Community error:",
      error
    );

    grid.innerHTML = errorHTML(
      "Community photos are unavailable."
    );

  }

}


/* =========================================================
   FUNDZ WORLD
========================================================= */

async function loadWorld() {

  const grid =
    $("#worldGrid");

  if (!grid) return;

  try {

    const {
      data,
      error
    } = await supabase
      .from("fundz_world")
      .select(
        "id,title,category,excerpt,image_url,created_at"
      )
      .eq(
        "published",
        true
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(6);

    if (error) throw error;


    if (!data?.length) {

      grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <p class="text-sm text-white/40">
            FUNDZ World is coming soon.
          </p>
        </div>
      `;

      return;

    }


    grid.innerHTML =
      data
        .map(item => `

          <article class="overflow-hidden rounded-2xl border border-white/10">

            ${
              item.image_url
                ? `
                  <div class="aspect-[16/10] overflow-hidden">

                    <img
                      src="${escapeHTML(item.image_url)}"
                      alt="${escapeHTML(item.title)}"
                      loading="lazy"
                      class="h-full w-full object-cover"
                    >

                  </div>
                `
                : ""
            }

            <div class="p-6">

              <p class="text-[10px] uppercase tracking-widest text-white/40">
                ${escapeHTML(item.category || "FUNDZ")}
              </p>

              <h3 class="mt-3 text-xl font-bold">
                ${escapeHTML(item.title)}
              </h3>

              ${
                item.excerpt
                  ? `
                    <p class="mt-3 text-sm leading-6 text-white/50">
                      ${escapeHTML(item.excerpt)}
                    </p>
                  `
                  : ""
              }

            </div>

          </article>

        `)
        .join("");

  } catch (error) {

    console.error(
      "FUNDZ World error:",
      error
    );

  }

}


/* =========================================================
   LIVE STATISTICS
========================================================= */

async function loadLiveStats() {

  try {

    const [

      members,
      productsSold,
      orders,
      reviews

    ] = await Promise.all([

      supabase
        .from("profiles")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        ),

      supabase
        .from("order_items")
        .select(
          "quantity"
        ),

      supabase
        .from("orders")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )
        .eq(
          "status",
          "delivered"
        ),

      supabase
        .from("reviews")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )

    ]);


    if (
      members.error
    ) {

      console.error(
        "Members:",
        members.error
      );

    } else {

      setText(
        "registeredMembers",
        members.count || 0
      );

      setText(
        "registeredCustomers",
        members.count || 0
      );

    }


    if (
      orders.error
    ) {

      console.error(
        "Orders:",
        orders.error
      );

    } else {

      setText(
        "ordersCompleted",
        orders.count || 0
      );

    }


    if (
      reviews.error
    ) {

      console.error(
        "Reviews:",
        reviews.error
      );

    } else {

      setText(
        "customerReviews",
        reviews.count || 0
      );

    }


    if (
      productsSold.error
    ) {

      console.error(
        "Products sold:",
        productsSold.error
      );

    } else {

      const total =
        (productsSold.data || [])
          .reduce(
            (
              sum,
              item
            ) =>
              sum +
              Number(
                item.quantity || 0
              ),
            0
          );

      setText(
        "productsSold",
        total
      );

    }


    /*
     * Nigeria is the launch country.
     */

    setText(
      "countriesServed",
      1
    );

  } catch (error) {

    console.error(
      "Live stats error:",
      error
    );

  }

}


/* =========================================================
   NEWSLETTER
========================================================= */

function setupNewsletter() {

  const form =
    $("#newsletterForm");

  const input =
    $("#newsletterEmail");

  if (!form || !input) return;


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const email =
        input.value
          .trim()
          .toLowerCase();

      if (!email) return;


      const button =
        form.querySelector(
          "button"
        );

      const original =
        button?.textContent ||
        "Subscribe";


      if (button) {

        button.disabled =
          true;

        button.textContent =
          "Joining...";

      }


      try {

        const {
          error
        } = await supabase
          .from(
            "newsletter_subscribers"
          )
          .insert({
            email
          });


        if (error) {

          if (
            error.code ===
            "23505"
          ) {

            showToast(
              "You're already part of the family."
            );

          } else {

            throw error;

          }

        } else {

          input.value = "";

          showToast(
            "Welcome to the FUNDZ family."
          );

        }

      } catch (error) {

        console.error(
          "Newsletter:",
          error
        );

        showToast(
          "Unable to subscribe right now."
        );

      } finally {

        if (button) {

          button.disabled =
            false;

          button.textContent =
            original;

        }

      }

    }
  );

}


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


/* =========================================================
   MOBILE MENU CREATOR
========================================================= */

function createMobileMenu() {

  const menu =
    document.createElement(
      "aside"
    );

  menu.id =
    "mobileMenu";

  menu.className =
    "fixed inset-y-0 left-0 z-[999] hidden w-[85%] max-w-sm border-r border-white/10 bg-black p-6";

  menu.innerHTML = `

    <div class="flex items-center justify-between">

      <a
        href="index.html"
        class="text-2xl font-black tracking-[0.22em]"
      >
        FUNDZ
      </a>

      <button
        id="closeMobileMenu"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20"
      >
        ×
      </button>

    </div>

    <nav class="mt-10 flex flex-col gap-5 text-lg uppercase">

      <a href="index.html">
        Home
      </a>

      <a href="shop.html">
        Shop
      </a>

      <a href="index.html#story">
        Our Story
      </a>

      <a href="index.html#community">
        Community
      </a>

      <a href="index.html#world">
        FUNDZ World
      </a>

      <a href="account.html">
        Account
      </a>

    </nav>

  `;

  document.body.appendChild(
    menu
  );


  $("#closeMobileMenu")
    ?.addEventListener(
      "click",
      () => {

        menu.classList.add(
          "hidden"
        );

      }
    );


  return menu;

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

  $$('a[href^="#"]')
    .forEach(link => {

      link.addEventListener(
        "click",
        event => {

          const href =
            link.getAttribute(
              "href"
            );

          if (
            !href ||
            href === "#"
          ) return;


          const target =
            document.querySelector(
              href
            );

          if (!target) return;


          event.preventDefault();

          target.scrollIntoView({
            behavior: "smooth"
          });

        }
      );

    });

}


/* =========================================================
   AUTH STATE
========================================================= */

supabase.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    if (
      event === "SIGNED_IN"
    ) {

      await loadCustomerState();

    }


    if (
      event === "SIGNED_OUT"
    ) {

      wishlistItems = [];
      localStorage.removeItem("fundz_wishlist");
      cartItems =
        getLocalCart();

      updateCounts();
      updateWishlistButtons();

    }

  }
);


/* =========================================================
   HELPERS
========================================================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );

  if (!element) return;

  element.textContent =
    Number(
      value || 0
    ).toLocaleString(
      "en-NG"
    );

}


function loadingHTML() {

  return `
    <div class="col-span-full py-16 text-center">
      <p class="text-xs uppercase tracking-[0.3em] text-white/30">
        Loading FUNDZ...
      </p>
    </div>
  `;

}


function errorHTML(
  message
) {

  return `
    <div class="col-span-full py-16 text-center">
      <p class="text-sm text-white/40">
        ${escapeHTML(message)}
      </p>
    </div>
  `;

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message
) {

  let toast =
    $("#fundzToast");

  if (!toast) {

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "fundzToast";

    toast.className =
      "fixed bottom-6 left-1/2 z-[9999] hidden -translate-x-1/2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black shadow-2xl";

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


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   MONEY
========================================================= */

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