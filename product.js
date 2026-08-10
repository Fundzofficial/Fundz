import { supabase } from "./supabase.js";

/*
|--------------------------------------------------------------------------
| FUNDZ PRODUCT PAGE
|--------------------------------------------------------------------------
| URL:
| product.html?id=PRODUCT_ID
|
| Supabase tables used:
| products
| categories
| collections
| reviews
| wishlist
| cart_items
|
| Expected product columns can include:
| id
| name
| price
| description
| stock
| image_url
| image_urls
| images
| category_id
| collection_id
| is_active
| sizes
| colors
| sku
|--------------------------------------------------------------------------
*/


/* =========================================================
   STATE
========================================================= */

let product = null;

let productImages = [];

let currentImageIndex = 0;

let selectedSize = null;

let selectedColor = null;

let quantity = 1;

let wishlistActive = false;

let reviewRating = 0;

let reviews = [];

let relatedProducts = [];


/* =========================================================
   DOM
========================================================= */

const $ = (selector) =>
  document.querySelector(selector);

const $$ = (selector) =>
  document.querySelectorAll(selector);


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    setupStaticEvents();

    await loadProduct();

  }
);


/* =========================================================
   GET PRODUCT ID
========================================================= */

function getProductId() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  return params.get("id");

}


/* =========================================================
   LOAD PRODUCT
========================================================= */

async function loadProduct() {

  const productId =
    getProductId();


  if (!productId) {

    showProductError();

    console.error(
      "No product ID was found in the URL."
    );

    return;

  }


  showLoading();


  try {

    /*
     * First attempt:
     * Load the product together with
     * category and collection.
     */

    let result =
      await supabase
        .from("products")
        .select(`
          *,
          categories (
            id,
            name
          ),
          collections (
            id,
            name
          )
        `)
        .eq(
          "id",
          productId
        )
        .maybeSingle();


    /*
     * If relationships don't exist,
     * retry with only products.
     */

    if (
      result.error
    ) {

      console.warn(
        "Relationship query failed. Retrying basic product query.",
        result.error
      );


      result =
        await supabase
          .from("products")
          .select("*")
          .eq(
            "id",
            productId
          )
          .maybeSingle();

    }


    if (
      result.error
    ) {

      throw result.error;

    }


    if (
      !result.data
    ) {

      showProductError();

      return;

    }


    product =
      result.data;


    console.log(
      "FUNDZ product loaded:",
      product
    );


    await initializeProduct();

  } catch (error) {

    console.error(
      "Product loading error:",
      error
    );

    showProductError();

  }

}


/* =========================================================
   INITIALIZE PRODUCT
========================================================= */

async function initializeProduct() {

  productImages =
    getProductImages(product);


  if (!productImages.length) {

    productImages = [
      "https://placehold.co/1200x1200/111111/FFFFFF?text=FUNDZ"
    ];

  }


  currentImageIndex = 0;

  quantity = 1;


  renderProduct();


  await Promise.allSettled([

    loadReviews(),

    loadRelatedProducts(),

    loadWishlistState()

  ]);


  hideLoading();

}


/* =========================================================
   RENDER PRODUCT
========================================================= */

function renderProduct() {

  const category =
    getCategoryName(product);


  const price =
    Number(
      product.price || 0
    );


  const stock =
    Number(
      product.stock ?? 0
    );


  setText(
    "productName",
    product.name || "FUNDZ Product"
  );


  setText(
    "productCategory",
    category || "FUNDZ"
  );


  setText(
    "breadcrumbCategory",
    category || "Product"
  );


  setText(
    "productDescription",
    product.description ||
    "Premium FUNDZ apparel."
  );


  setText(
    "productPrice",
    formatCurrency(price)
  );


  updateStock(stock);


  renderImages();


  renderOptions();


  updateQuantity();


  updateMainImage();


  updateAddToCartButton();

}


/* =========================================================
   PRODUCT IMAGES
========================================================= */

function getProductImages(product) {

  let images = [];


  /*
   * image_urls
   */

  if (
    Array.isArray(
      product.image_urls
    )
  ) {

    images.push(
      ...product.image_urls
    );

  }


  /*
   * images
   */

  if (
    Array.isArray(
      product.images
    )
  ) {

    product.images.forEach(
      image => {

        if (
          typeof image === "string"
        ) {

          images.push(image);

        } else if (
          image?.url
        ) {

          images.push(
            image.url
          );

        }

      }
    );

  }


  /*
   * image_url
   */

  if (
    product.image_url
  ) {

    images.push(
      product.image_url
    );

  }


  /*
   * Remove duplicates
   */

  return [
    ...new Set(
      images
        .filter(Boolean)
        .map(
          image =>
            String(image)
        )
    )
  ];

}


/* =========================================================
   RENDER IMAGE GALLERY
========================================================= */

function renderImages() {

  const thumbnails =
    $("#thumbnails");


  if (
    !thumbnails
  ) return;


  thumbnails.innerHTML =
    productImages
      .map(
        (
          image,
          index
        ) => `

          <button
            type="button"
            class="product-thumbnail overflow-hidden rounded-xl border-2 border-transparent opacity-60 transition hover:opacity-100 ${
              index === 0
                ? "thumb-active"
                : ""
            }"
            data-index="${index}"
          >

            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(
                product.name || "FUNDZ"
              )}"
              class="aspect-square w-full object-cover"
              loading="${
                index === 0
                  ? "eager"
                  : "lazy"
              }"
            >

          </button>

        `
      )
      .join("");


  $$(".product-thumbnail")
    .forEach(
      thumbnail => {

        thumbnail.addEventListener(
          "click",
          () => {

            currentImageIndex =
              Number(
                thumbnail.dataset.index
              );

            updateMainImage();

          }
        );

      }
    );


  updateMainImage();

}


/* =========================================================
   UPDATE MAIN IMAGE
========================================================= */

function updateMainImage() {

  const image =
    productImages[
      currentImageIndex
    ];


  const mainImage =
    $("#mainImage");


  if (
    !mainImage ||
    !image
  ) return;


  mainImage.src =
    image;


  mainImage.alt =
    product?.name ||
    "FUNDZ product";


  $$(".product-thumbnail")
    .forEach(
      (
        thumbnail,
        index
      ) => {

        thumbnail.classList.toggle(
          "thumb-active",
          index ===
            currentImageIndex
        );

      }
    );

}


/* =========================================================
   NEXT IMAGE
========================================================= */

function nextImage() {

  if (
    productImages.length <= 1
  ) return;


  currentImageIndex =
    (
      currentImageIndex + 1
    ) %
    productImages.length;


  updateMainImage();

}


/* =========================================================
   PREVIOUS IMAGE
========================================================= */

function previousImage() {

  if (
    productImages.length <= 1
  ) return;


  currentImageIndex =
    (
      currentImageIndex -
      1 +
      productImages.length
    ) %
    productImages.length;


  updateMainImage();

}


/* =========================================================
   PRODUCT OPTIONS
========================================================= */

function renderOptions() {

  renderSizes();

  renderColors();

}


/* =========================================================
   SIZES
========================================================= */

function renderSizes() {

  const container =
    $("#sizes");


  if (!container) return;


  let sizes =
    normalizeArray(
      product.sizes
    );


  /*
   * If no sizes were saved,
   * use the standard FUNDZ sizes.
   */

  if (!sizes.length) {

    sizes = [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "XXL"
    ];

  }


  container.innerHTML =
    sizes
      .map(
        size => `

          <button
            type="button"
            class="size-button rounded-full border border-white/10 px-5 py-3 text-xs transition hover:border-white/40"
            data-size="${escapeHTML(size)}"
          >
            ${escapeHTML(size)}
          </button>

        `
      )
      .join("");


  $$(".size-button")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            selectedSize =
              button.dataset.size;


            $$(".size-button")
              .forEach(
                item =>
                  item.classList.remove(
                    "size-active"
                  )
              );


            button.classList.add(
              "size-active"
            );

          }
        );

      }
    );


  /*
   * Automatically select the first
   * available size.
   */

  const first =
    container.querySelector(
      ".size-button"
    );


  if (first) {

    first.click();

  }

}


/* =========================================================
   COLORS
========================================================= */

function renderColors() {

  const container =
    $("#colors");


  if (!container) return;


  let colors =
    normalizeArray(
      product.colors
    );


  /*
   * If the product doesn't have
   * color data, use standard options.
   */

  if (!colors.length) {

    colors = [
      "Black",
      "White"
    ];

  }


  container.innerHTML =
    colors
      .map(
        color => `

          <button
            type="button"
            class="color-button rounded-full border border-white/10 px-5 py-3 text-xs transition hover:border-white/40"
            data-color="${escapeHTML(color)}"
          >
            ${escapeHTML(color)}
          </button>

        `
      )
      .join("");


  $$(".color-button")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            selectedColor =
              button.dataset.color;


            $$(".color-button")
              .forEach(
                item =>
                  item.classList.remove(
                    "color-active"
                  )
              );


            button.classList.add(
              "color-active"
            );

          }
        );

      }
    );


  const first =
    container.querySelector(
      ".color-button"
    );


  if (first) {

    first.click();

  }

}


/* =========================================================
   QUANTITY
========================================================= */

function increaseQuantity() {

  const stock =
    Number(
      product?.stock ?? 0
    );


  if (
    stock <= 0
  ) return;


  if (
    quantity >= stock
  ) {

    showMessage(
      `Only ${stock} item${
        stock === 1
          ? ""
          : "s"
      } available.`
    );

    return;

  }


  quantity++;

  updateQuantity();

}


function decreaseQuantity() {

  if (
    quantity <= 1
  ) return;


  quantity--;

  updateQuantity();

}


function updateQuantity() {

  const element =
    $("#quantity");


  if (element) {

    element.textContent =
      quantity;

  }

}


/* =========================================================
   STOCK
========================================================= */

function updateStock(stock) {

  const element =
    $("#stockText");


  if (!element) return;


  if (
    stock <= 0
  ) {

    element.textContent =
      "Sold Out";


    element.className =
      "text-xs font-bold uppercase tracking-wider text-red-400";

    return;

  }


  if (
    stock <= 5
  ) {

    element.textContent =
      `Only ${stock} left`;


    element.className =
      "text-xs font-bold uppercase tracking-wider text-yellow-400";

    return;

  }


  element.textContent =
    "In Stock";


  element.className =
    "text-xs font-bold uppercase tracking-wider text-green-400";

}


/* =========================================================
   ADD TO CART
========================================================= */

async function addToCart() {

  if (!product) return;


  const stock =
    Number(
      product.stock ?? 0
    );


  if (
    stock <= 0
  ) {

    showMessage(
      "This product is sold out."
    );

    return;

  }


  if (
    quantity > stock
  ) {

    showMessage(
      "Not enough stock available."
    );

    return;

  }


  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser();


  /*
   * Logged-in customers:
   * save cart in Supabase.
   */

  if (user) {

    try {

      /*
       * Check if item already exists.
       */

      const {
        data: existing,
        error: findError
      } =
        await supabase
          .from("cart_items")
          .select(`
            id,
            quantity
          `)
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "product_id",
            product.id
          )
          .maybeSingle();


      if (findError) {

        throw findError;

      }


      if (existing) {

        const newQuantity =
          Number(
            existing.quantity || 0
          ) +
          quantity;


        if (
          newQuantity > stock
        ) {

          showMessage(
            "You cannot add more than the available stock."
          );

          return;

        }


        const {
          error
        } =
          await supabase
            .from("cart_items")
            .update({

              quantity:
                newQuantity

            })
            .eq(
              "id",
              existing.id
            );


        if (error) {

          throw error;

        }

      } else {

        const {
          error
        } =
          await supabase
            .from("cart_items")
            .insert({

              user_id:
                user.id,

              product_id:
                product.id,

              quantity

            });


        if (error) {

          throw error;

        }

      }


      addToLocalCart({
        silent: true
      });

      showMessage(
        "Added to your bag."
      );


      updateCartCount();


      return;

    } catch (error) {

      console.error(
        "Supabase cart error:",
        error
      );


      /*
       * Fall back to local cart.
       */

      addToLocalCart();

      return;

    }

  }


  /*
   * Guest cart.
   */

  addToLocalCart();

}


/* =========================================================
   LOCAL CART
========================================================= */

function addToLocalCart(
  options = {}
) {

  const {
    silent = false
  } = options;

  let cart = [];


  try {

    cart =
      JSON.parse(
        localStorage.getItem(
          "fundz_cart"
        ) || "[]"
      );

  } catch {

    cart = [];

  }


  const existingIndex =
    cart.findIndex(
      item =>
        String(
          item.product_id ||
          item.id
        ) ===
        String(
          product.id
        )
    );


  if (
    existingIndex >= 0
  ) {

    cart[
      existingIndex
    ].quantity =
      Number(
        cart[
          existingIndex
        ].quantity || 0
      ) +
      quantity;

  } else {

    cart.push({

      id:
        product.id,

      product_id:
        product.id,

      name:
        product.name || "",

      price:
        Number(
          product.price || 0
        ),

      image_url:
        product.image_url ||
        product.image ||
        product.imageUrl ||
        "",

      slug:
        product.slug || "",

      quantity,

      size:
        selectedSize,

      color:
        selectedColor

    });

  }


  localStorage.setItem(
    "fundz_cart",
    JSON.stringify(cart)
  );


  if (!silent) {

    showMessage(
      "Added to your bag."
    );

  }


  updateCartCount();

}


/* =========================================================
   BUY NOW
========================================================= */

async function buyNow() {

  if (!product) return;


  await addToCart();


  setTimeout(
    () => {

      window.location.href =
        "checkout.html";

    },
    400
  );

}


/* =========================================================
   UPDATE CART COUNT
========================================================= */

async function updateCartCount() {

  const element =
    $("#cartCount");


  if (!element) return;


  try {

    const {
      data: {
        user
      }
    } =
      await supabase.auth.getUser();


    if (user) {

      const {
        data,
        error
      } =
        await supabase
          .from("cart_items")
          .select(
            "quantity"
          )
          .eq(
            "user_id",
            user.id
          );


      if (error) {

        throw error;

      }


      const count =
        (data || [])
          .reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.quantity || 0
              ),
            0
          );


      displayCartCount(
        element,
        count
      );


      return;

    }


    const cart =
      getLocalCart();


    const count =
      cart.reduce(
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


    displayCartCount(
      element,
      count
    );

  } catch (error) {

    console.error(
      "Cart count error:",
      error
    );

  }

}


/* =========================================================
   WISHLIST COUNT (HEADER)
========================================================= */

async function updateWishlistCount() {

  const el =
    $("#wishlistCount");

  if (!el) return;

  try {

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {

      const { data, error } =
        await supabase
          .from("wishlist")
          .select("id")
          .eq("user_id", user.id);

      if (!error) {
        el.textContent = (data || []).length;
        return;
      }

    }

  } catch (e) {
    // ignore and fall back to local
  }

  const local = getLocalWishlist();
  el.textContent = local.length;

}


function displayCartCount(
  element,
  count
) {

  element.textContent =
    count;


  if (
    count > 0
  ) {

    element.classList.remove(
      "hidden"
    );

  } else {

    element.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   WISHLIST
========================================================= */

async function loadWishlistState() {

  const button =
    $("#wishlistButton");


  if (!button) return;


  try {

    const {
      data: {
        user
      }
    } =
      await supabase.auth.getUser();


    if (!user) {

      wishlistActive = false;

      updateWishlistButton();
      await updateWishlistCount();

      return;

    }


    const {
      data,
      error
    } =
      await supabase
        .from("wishlist")
        .select(
          "id"
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "product_id",
          product.id
        )
        .maybeSingle();


    if (error) {

      throw error;

    }


    wishlistActive =
      !!data;


    updateWishlistButton();
    await updateWishlistCount();

  } catch (error) {

    console.error(
      "Wishlist loading error:",
      error
    );

  }

}


/* =========================================================
   TOGGLE WISHLIST
========================================================= */

async function toggleWishlist() {

  if (!product) return;


  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser();

  if (!user) {

    showMessage(
      "Login to add this product to your wishlist."
    );

    return;

  }


  try {

    if (
      wishlistActive
    ) {

      const {
        error
      } =
        await supabase
          .from("wishlist")
          .delete()
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "product_id",
            product.id
          );


      if (error) {

        throw error;

      }


      wishlistActive =
        false;


      showMessage(
        "Removed from wishlist."
      );

    } else {

      const {
        error
      } =
        await supabase
          .from("wishlist")
          .insert({

            user_id:
              user.id,

            product_id:
              product.id

          });


      if (error) {

        /*
         * Duplicate wishlist item.
         */

        if (
          error.code ===
          "23505"
        ) {

          wishlistActive =
            true;

        } else {

          throw error;

        }

      } else {

        wishlistActive =
          true;

      }


      showMessage(
        "Added to wishlist."
      );

    }


    syncLocalWishlist(
      wishlistActive
    );

    updateWishlistButton();
    await updateWishlistCount();

  } catch (error) {

    console.error(
      "Wishlist error:",
      error
    );


    showMessage(
      error.message ||
      "Unable to update wishlist."
    );

  }

}


/* =========================================================
   WISHLIST BUTTON UI
========================================================= */

function updateWishlistButton() {

  const button =
    $("#wishlistButton");


  if (!button) return;


  const active =
    wishlistActive;


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
    button.classList.add(
      "bg-white",
      "text-black"
    );
  }

}


/* =========================================================
   REVIEWS
========================================================= */

async function loadReviews() {

  const container =
    $("#reviews");


  if (!container) return;


  try {

    const {
      data,
      error
    } =
      await supabase
        .from("reviews")
        .select("*")
        .eq(
          "product_id",
          product.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {

      throw error;

    }


    reviews =
      data || [];


    renderReviews();

  } catch (error) {

    console.error(
      "Reviews error:",
      error
    );


    container.innerHTML = `

      <div class="rounded-2xl border border-white/10 p-8 text-center">

        <p class="text-sm text-white/40">
          Reviews are unavailable right now.
        </p>

      </div>

    `;

  }

}


/* =========================================================
   RENDER REVIEWS
========================================================= */

function renderReviews() {

  const container =
    $("#reviews");


  if (!container) return;


  updateReviewSummary();


  if (!reviews.length) {

    container.innerHTML = `

      <div class="col-span-full rounded-2xl border border-white/10 p-10 text-center">

        <p class="text-sm text-white/40">
          No reviews yet.
        </p>

        <p class="mt-2 text-xs text-white/20">
          Be the first to review this product.
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML =
    reviews
      .map(
        review => {

          const rating =
            Number(
              review.rating || 0
            );


          const stars =
            "★".repeat(
              Math.min(
                5,
                rating
              )
            ) +
            "☆".repeat(
              Math.max(
                0,
                5 - rating
              )
            );


          const name =
            review.user_name ||
            review.customer_name ||
            "FUNDZ Customer";


          const text =
            review.comment ||
            review.review ||
            "";


          return `

            <article class="rounded-2xl border border-white/10 bg-white/[.02] p-6">

              <div class="flex items-center justify-between gap-3">

                <p class="text-xs font-bold">
                  ${escapeHTML(name)}
                </p>

                <span class="text-xs text-white/20">
                  ${formatDate(
                    review.created_at
                  )}
                </span>

              </div>


              <div class="mt-3 text-xs tracking-widest">
                ${stars}
              </div>


              ${
                text
                  ? `
                    <p class="mt-4 text-sm leading-6 text-white/50">
                      ${escapeHTML(text)}
                    </p>
                  `
                  : ""
              }

            </article>

          `;

        }
      )
      .join("");

}


/* =========================================================
   REVIEW SUMMARY
========================================================= */

function updateReviewSummary() {

  const count =
    reviews.length;


  const average =
    count
      ? reviews.reduce(
          (
            total,
            review
          ) =>
            total +
            Number(
              review.rating || 0
            ),
          0
        ) /
        count
      : 0;


  const stars =
    $("#stars");


  const reviewCount =
    $("#reviewCount");


  if (stars) {

    const rounded =
      Math.round(
        average
      );


    stars.textContent =
      "★".repeat(
        rounded
      ) +
      "☆".repeat(
        5 - rounded
      );

  }


  if (reviewCount) {

    reviewCount.textContent =
      count === 0
        ? "No reviews"
        : `${count} review${
            count === 1
              ? ""
              : "s"
          }`;

  }

}

function setReviewError(
  message
) {

  const errorElement =
    $("#reviewFormError");

  if (!errorElement) return;

  if (message) {
    errorElement.textContent =
      message;
    errorElement.classList.remove(
      "hidden"
    );
  } else {
    errorElement.classList.add(
      "hidden"
    );
  }

}

function updateReviewRatingUI() {

  const buttons =
    document.querySelectorAll(
      ".review-rating-btn"
    );

  buttons.forEach(button => {

    const value =
      Number(
        button.dataset.rating
      );

    const active =
      reviewRating >= value;

    button.classList.toggle(
      "bg-white",
      active
    );
    button.classList.toggle(
      "text-black",
      active
    );
    button.classList.toggle(
      "border-white",
      active
    );
    button.classList.toggle(
      "text-white",
      !active
    );

  });

  const ratingText =
    $("#reviewFormRatingText");

  if (ratingText) {
    ratingText.textContent =
      reviewRating
        ? `${reviewRating} star${
            reviewRating === 1
              ? ""
              : "s"
          } selected`
        : "Select a rating.";
  }

}

function openReviewForm() {

  const container =
    $("#reviewFormContainer");

  const comment =
    $("#reviewComment");

  if (!container || !comment) return;

  reviewRating = 0;
  updateReviewRatingUI();
  setReviewError("");
  comment.value = "";
  container.classList.remove("hidden");
  comment.focus();

}

function closeReviewForm() {

  const container =
    $("#reviewFormContainer");
  const button =
    $("#reviewButton");

  if (!container) return;

  container.classList.add("hidden");

  if (button) {
    button.focus();
  }

}

async function submitReview(
  event
) {

  event.preventDefault();

  const rating =
    Number(reviewRating);
  const commentInput =
    $("#reviewComment");

  const comment =
    commentInput?.value.trim() || "";

  if (!rating || rating < 1 || rating > 5) {
    setReviewError(
      "Please select a rating from 1 to 5."
    );
    return;
  }

  if (!comment) {
    setReviewError(
      "Please enter your review."
    );
    return;
  }

  try {
    const {
      data: {
        user
      }
    } =
      await supabase.auth.getUser();

    if (!user) {
      window.location.href =
        `login.html?redirect=${encodeURIComponent(
          window.location.href
        )}`;
      return;
    }

    const {
      error
    } =
      await supabase
        .from("reviews")
        .insert({

          product_id:
            product.id,

          user_id:
            user.id,

          rating,

          comment

        });

    if (error) {
      throw error;
    }

    showMessage(
      "Review submitted."
    );
    closeReviewForm();
    await loadReviews();

  } catch (error) {

    console.error(
      "Review submission error:",
      error
    );

    setReviewError(
      error.message ||
      "Unable to submit review."
    );

  }

}

async function writeReview() {

  const {
    data: {
      user
    }
  } =
    await supabase.auth.getUser();


  if (!user) {

    window.location.href =
      `login.html?redirect=${encodeURIComponent(
        window.location.href
      )}`;

    return;

  }


  openReviewForm();

}


/* =========================================================
   RELATED PRODUCTS
========================================================= */

async function loadRelatedProducts() {

  const container =
    $("#relatedProducts");


  if (!container) return;


  try {

    let query =
      supabase
        .from("products")
        .select("*")
        .eq(
          "is_active",
          true
        )
        .neq(
          "id",
          product.id
        )
        .limit(4);


    const categoryId =
      product.category_id;


    if (
      categoryId
    ) {

      query =
        query.eq(
          "category_id",
          categoryId
        );

    }


    let {
      data,
      error
    } =
      await query;


    /*
     * If there are no products in the
     * same category, get newest products.
     */

    if (
      error ||
      !data?.length
    ) {

      const fallback =
        await supabase
          .from("products")
          .select("*")
          .eq(
            "is_active",
            true
          )
          .neq(
            "id",
            product.id
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          )
          .limit(4);


      if (
        fallback.error
      ) {

        throw fallback.error;

      }


      data =
        fallback.data || [];

    }


    relatedProducts =
      data || [];


    renderRelatedProducts();

  } catch (error) {

    console.error(
      "Related products error:",
      error
    );


    container.innerHTML = "";

  }

}


/* =========================================================
   RENDER RELATED PRODUCTS
========================================================= */

function renderRelatedProducts() {

  const container =
    $("#relatedProducts");


  if (
    !container
  ) return;


  if (
    !relatedProducts.length
  ) {

    container.innerHTML = `

      <div class="col-span-full py-10 text-center">

        <p class="text-sm text-white/30">
          No related products yet.
        </p>

      </div>

    `;

    return;

  }


  container.innerHTML =
    relatedProducts
      .map(
        relatedProduct =>
          relatedProductCard(
            relatedProduct
          )
      )
      .join("");

}


/* =========================================================
   RELATED PRODUCT CARD
========================================================= */

function relatedProductCard(
  item
) {

  const image =
    getProductImages(
      item
    )[0] ||
    "https://placehold.co/800x1000/111111/FFFFFF?text=FUNDZ";


  return `

    <article class="group">

      <a
        href="product.html?id=${encodeURIComponent(
          item.id
        )}"
        class="block"
      >

        <div class="aspect-[4/5] overflow-hidden rounded-2xl bg-white/[.03]">

          <img
            src="${escapeHTML(image)}"
            alt="${escapeHTML(
              item.name
            )}"
            loading="lazy"
            class="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          >

        </div>


        <div class="mt-4 flex items-start justify-between gap-3">

          <h3 class="text-sm font-bold">
            ${escapeHTML(
              item.name
            )}
          </h3>

          <p class="text-sm font-bold">
            ${formatCurrency(
              item.price
            )}
          </p>

        </div>

      </a>

    </article>

  `;

}


/* =========================================================
   STATIC EVENTS
========================================================= */

function setupStaticEvents() {

  /*
   * Image navigation
   */

  $("#prevImage")
    ?.addEventListener(
      "click",
      previousImage
    );


  $("#nextImage")
    ?.addEventListener(
      "click",
      nextImage
    );


  /*
   * Zoom
   */

  $("#zoomButton")
    ?.addEventListener(
      "click",
      openZoom
    );


  $("#closeZoom")
    ?.addEventListener(
      "click",
      closeZoom
    );


  $("#zoomModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "zoomModal"
        ) {

          closeZoom();

        }

      }
    );


  /*
   * Quantity
   */

  $("#minusQuantity")
    ?.addEventListener(
      "click",
      decreaseQuantity
    );


  $("#plusQuantity")
    ?.addEventListener(
      "click",
      increaseQuantity
    );


  /*
   * Cart
   */

  $("#addToCart")
    ?.addEventListener(
      "click",
      addToCart
    );


  /*
   * Buy now
   */

  $("#buyNow")
    ?.addEventListener(
      "click",
      buyNow
    );


  /*
   * Wishlist
   */

  $("#wishlistButton")
    ?.addEventListener(
      "click",
      toggleWishlist
    );

  /*
   * Header actions: bag and wishlist buttons
   */

  $("#cartBtn")
    ?.addEventListener(
      "click",
      () => {
        window.location.href = "cart.html";
      }
    );

  $("#wishlistBtn")
    ?.addEventListener(
      "click",
      () => {
        window.location.href = "wishlist.html";
      }
    );


  /*
   * Reviews
   */

  $("#reviewButton")
    ?.addEventListener(
      "click",
      writeReview
    );

  $("#reviewForm")
    ?.addEventListener(
      "submit",
      submitReview
    );

  $("#cancelReview")
    ?.addEventListener(
      "click",
      closeReviewForm
    );

  document
    .querySelectorAll(
      ".review-rating-btn"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {
          reviewRating =
            Number(
              button.dataset.rating
            );
          updateReviewRatingUI();
        }
      );

    });


  /*
   * Back
   */

  $("#backButton")
    ?.addEventListener(
      "click",
      () => {

        if (
          document.referrer &&
          document.referrer.includes(
            window.location.host
          )
        ) {

          window.history.back();

        } else {

          window.location.href =
            "shop.html";

        }

      }
    );


  // Extra delegated handler to ensure the back button works
  document.addEventListener("click", event => {
    const btn = event.target.closest
      ? event.target.closest("#backButton")
      : null;

    if (!btn) return;

    if (
      document.referrer &&
      document.referrer.includes(window.location.host)
    ) {
      window.history.back();
    } else {
      window.location.href = "shop.html";
    }

  });


  /*
   * Keyboard controls
   */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {

        closeZoom();

      }


      if (
        event.key ===
        "ArrowRight"
      ) {

        nextImage();

      }


      if (
        event.key ===
        "ArrowLeft"
      ) {

        previousImage();

      }

    }
  );


  updateCartCount();

}


/* =========================================================
   ZOOM
========================================================= */

function openZoom() {

  const modal =
    $("#zoomModal");


  const image =
    $("#zoomImage");


  const mainImage =
    $("#mainImage");


  if (
    !modal ||
    !image ||
    !mainImage
  ) return;


  image.src =
    mainImage.src;


  image.alt =
    mainImage.alt;


  modal.classList.remove(
    "hidden"
  );


  modal.classList.add(
    "flex"
  );


  document.body.classList.add(
    "overflow-hidden"
  );

}


function closeZoom() {

  const modal =
    $("#zoomModal");


  if (!modal) return;


  modal.classList.add(
    "hidden"
  );


  modal.classList.remove(
    "flex"
  );


  document.body.classList.remove(
    "overflow-hidden"
  );

}


/* =========================================================
   LOADING / ERROR
========================================================= */

function showLoading() {

  const loading =
    $("#loading");


  const page =
    $("#productPage");


  const error =
    $("#errorPage");


  loading?.classList.remove(
    "hidden"
  );


  loading?.classList.add(
    "flex"
  );


  page?.classList.add(
    "hidden"
  );


  error?.classList.add(
    "hidden"
  );


  error?.classList.remove(
    "flex"
  );

}


function hideLoading() {

  const loading =
    $("#loading");


  const page =
    $("#productPage");


  loading?.classList.add(
    "hidden"
  );


  loading?.classList.remove(
    "flex"
  );


  page?.classList.remove(
    "hidden"
  );

}


function showProductError() {

  const loading =
    $("#loading");


  const page =
    $("#productPage");


  const error =
    $("#errorPage");


  loading?.classList.add(
    "hidden"
  );


  loading?.classList.remove(
    "flex"
  );


  page?.classList.add(
    "hidden"
  );


  error?.classList.remove(
    "hidden"
  );


  error?.classList.add(
    "flex"
  );

}


/* =========================================================
   ADD TO CART BUTTON STATE
========================================================= */

function updateAddToCartButton() {

  const button =
    $("#addToCart");


  const buyButton =
    $("#buyNow");


  const stock =
    Number(
      product?.stock ?? 0
    );


  if (
    stock <= 0
  ) {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        "Sold Out";

    }


    if (buyButton) {

      buyButton.disabled =
        true;

      buyButton.classList.add(
        "opacity-30",
        "cursor-not-allowed"
      );

    }

    return;

  }


  if (button) {

    button.disabled =
      false;

    button.textContent =
      "Add to Cart";

  }


  if (buyButton) {

    buyButton.disabled =
      false;

    buyButton.classList.remove(
      "opacity-30",
      "cursor-not-allowed"
    );

  }

}


/* =========================================================
   HELPERS
========================================================= */

function getCategoryName(
  item
) {

  return (
    item?.categories?.name ||
    item?.category_name ||
    item?.category ||
    ""
  );

}


function normalizeArray(
  value
) {

  if (
    Array.isArray(value)
  ) {

    return value
      .map(
        item =>
          typeof item === "string"
            ? item
            : item?.name
      )
      .filter(Boolean);

  }


  if (
    typeof value === "string"
  ) {

    /*
     * JSON array
     */

    try {

      const parsed =
        JSON.parse(value);


      if (
        Array.isArray(parsed)
      ) {

        return normalizeArray(
          parsed
        );

      }

    } catch {
      // Not JSON. Continue.
    }


    /*
     * Comma-separated values
     */

    return value
      .split(",")
      .map(
        item =>
          item.trim()
      )
      .filter(Boolean);

  }


  return [];

}


function getLocalCart() {

  try {

    const data =
      localStorage.getItem(
        "fundz_cart"
      );


    return JSON.parse(
      data || "[]"
    );

  } catch {

    return [];

  }

}


function getLocalWishlist() {

  try {

    const data =
      localStorage.getItem(
        "fundz_wishlist"
      );


    const parsed =
      JSON.parse(
        data || "[]"
      );

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
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
              item.id ??
              item.product_id ??
              item.productId ??
              item.slug ??
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

function syncLocalWishlist(
  active
) {

  try {
    const productId =
      String(product.id);

    let wishlist =
      getLocalWishlist();

    wishlist =
      wishlist.filter(
        item =>
          String(
            item.id ||
            item.product_id ||
            item.slug ||
            item
          ) !==
          productId
      );

    if (active) {
      wishlist.push({
        id: productId,
        product_id: product.id,
        name: product.name || "",
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        image_url:
          product.image_url ||
          product.image ||
          product.imageUrl ||
          "",
        slug: product.slug || "",
        category: getCategoryName(product),
        collection: product.collection || ""
      });
    }

    localStorage.setItem(
      "fundz_wishlist",
      JSON.stringify(wishlist)
    );
  } catch {
    // ignore local wishlist sync failures
  }
}


function formatCurrency(
  value
) {

  return `₦${Number(
    value || 0
  ).toLocaleString(
    "en-NG"
  )}`;

}


function formatDate(
  value
) {

  if (!value) return "";


  try {

    return new Date(
      value
    ).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );

  } catch {

    return "";

  }

}


function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (
    !element
  ) return;


  element.textContent =
    value ?? "";

}


function showMessage(
  text
) {

  const element =
    $("#message");


  if (
    !element
  ) return;


  element.textContent =
    text;


  element.classList.remove(
    "hidden"
  );


  clearTimeout(
    window.fundzMessageTimer
  );


  window.fundzMessageTimer =
    setTimeout(
      () => {

        element.classList.add(
          "hidden"
        );

      },
      3000
    );

}


/* =========================================================
   HTML ESCAPING
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
   AUTH STATE
========================================================= */

supabase.auth.onAuthStateChange(
  async (
    event,
    session
  ) => {

    if (
      event ===
      "SIGNED_IN"
    ) {

      await loadWishlistState();

      await updateCartCount();
      await updateWishlistCount();

    }


    if (
      event ===
      "SIGNED_OUT"
    ) {

      wishlistActive =
        false;


      updateWishlistButton();

      await updateWishlistCount();


      updateCartCount();

    }

  }
);