const existingHeader = document.querySelector("body > header");
const logoutButton = existingHeader?.querySelector("#logoutTopButton");
const legacyActions = {
  cart: existingHeader?.querySelector("#cartBtn"),
  cartCount: existingHeader?.querySelector("#cartCount"),
  wishlist: existingHeader?.querySelector("#wishlistBtn"),
  wishlistCount: existingHeader?.querySelector("#wishlistCount")
};

existingHeader?.remove();
document.getElementById("mobileMenu")?.remove();
document.getElementById("mobileMenuOverlay")?.remove();

const header = document.createElement("header");
header.className = "border-b border-white/10 bg-[#080908]";
header.innerHTML = `
  <section class="mx-auto max-w-7xl px-4 py-4 md:px-8">
    <div class="flex items-center justify-between gap-3">
      <button
        id="mobileMenuButton"
        type="button"
        class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-xl text-white/90 hover:bg-white/10"
        aria-label="Open navigation menu"
        aria-controls="mobileMenu"
        aria-expanded="false"
      >☰</button>

      <a href="index.html" class="text-2xl font-black tracking-[-0.06em] text-[#a5ff9b]">FUNDZ</a>

      <div id="headerActions" class="flex items-center gap-1 sm:gap-3">
        <a href="shop.html" aria-label="Search products" class="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path>
          </svg>
        </a>
        <a href="wishlist.html" id="wishlistBtn" aria-label="Wishlist" class="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M20.8 8.7c0 5.5-8.8 10.2-8.8 10.2S3.2 14.2 3.2 8.7A4.7 4.7 0 0 1 12 6a4.7 4.7 0 0 1 8.8 2.7Z"></path>
          </svg>
          <span id="wishlistCount" class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#a5ff9b] px-1 text-[10px] font-black text-black">0</span>
        </a>
        <a href="cart.html" id="cartBtn" aria-label="Shopping bag" class="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <path d="M6 8h12l1 13H5L6 8Z"></path><path d="M9 8a3 3 0 0 1 6 0"></path>
          </svg>
          <span id="cartCount" class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#a5ff9b] px-1 text-[10px] font-black text-black">0</span>
        </a>
      </div>
    </div>

    <a href="addresses.html" id="deliveryLocationBtn" class="mt-4 flex w-full items-center justify-between rounded-xl border border-[#a5ff9b]/40 bg-[#0d100e] px-4 py-3 text-left">
      <span class="flex items-center gap-3">
        <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#a5ff9b" stroke-width="1.8" aria-hidden="true">
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="2.5"></circle>
        </svg>
        <span>
          <span class="block text-xs text-white/40">Delivering to</span>
          <span id="deliveryLocation" class="block text-sm font-bold">Set your delivery address</span>
        </span>
      </span>
      <span class="text-xl text-[#a5ff9b]" aria-hidden="true">⌄</span>
    </a>
  </section>
`;

function preserveAction(actionId, counterId, legacyAction, legacyCounter) {
  const replacement = header.querySelector(`#${actionId}`);
  const icon = replacement.querySelector("svg").cloneNode(true);
  const counter = legacyCounter || replacement.querySelector(`#${counterId}`);

  if (legacyAction) {
    legacyAction.className = replacement.className;
    legacyAction.setAttribute("aria-label", replacement.getAttribute("aria-label"));
    if (legacyAction instanceof HTMLButtonElement) {
      legacyAction.type = "button";
    }
    legacyAction.replaceChildren(...(counter ? [icon, counter] : [icon]));
    replacement.replaceWith(legacyAction);
  } else if (legacyCounter) {
    replacement.querySelector(`#${counterId}`).replaceWith(legacyCounter);
  }
}

preserveAction("cartBtn", "cartCount", legacyActions.cart, legacyActions.cartCount);
preserveAction("wishlistBtn", "wishlistCount", legacyActions.wishlist, legacyActions.wishlistCount);

const menu = document.createElement("aside");
menu.id = "mobileMenu";
menu.className = "fixed inset-y-0 left-0 z-[70] hidden w-[85%] max-w-sm border-r border-white/10 bg-[#080908] p-6";
menu.setAttribute("aria-label", "Main navigation");
menu.innerHTML = `
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between">
      <a href="index.html" class="text-2xl font-black tracking-[.22em] text-[#a5ff9b]">FUNDZ</a>
      <button id="mobileMenuClose" type="button" class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-2xl hover:bg-white/10" aria-label="Close navigation menu">×</button>
    </div>
    <nav class="mt-10 flex flex-col gap-5 text-lg uppercase">
      <a href="index.html" class="font-bold text-[#a5ff9b]">Home</a>
      <a href="shop.html" class="text-white/70 hover:text-white">Shop</a>
      <a href="collection.html" class="text-white/70 hover:text-white">Collections</a>
      <a href="addresses.html" class="text-white/70 hover:text-white">Delivery address</a>
    </nav>
    <div class="mt-auto space-y-3">
      <a href="account.html" class="block rounded-full border border-white/20 px-5 py-3 text-center text-sm font-bold hover:bg-white/10">Account</a>
      <a href="wishlist.html" class="block rounded-full border border-white/20 px-5 py-3 text-center text-sm font-bold hover:bg-white/10">Wishlist</a>
      <a href="cart.html" class="block rounded-full border border-white/20 px-5 py-3 text-center text-sm font-bold hover:bg-white/10">Bag</a>
    </div>
  </div>
`;

if (logoutButton) {
  logoutButton.type = "button";
  logoutButton.className = "w-full rounded-full border border-white/20 px-5 py-3 text-center text-sm font-bold hover:bg-white/10";
  menu.querySelector(".mt-auto").append(logoutButton);
}

if (document.getElementById("signupForm")) {
  document.querySelector(".logo-container")?.remove();
}

const overlay = document.createElement("div");
overlay.id = "mobileMenuOverlay";
overlay.className = "fixed inset-0 z-[60] hidden bg-black/70";
overlay.setAttribute("aria-hidden", "true");

document.body.insertBefore(header, document.body.firstChild);
document.body.append(overlay, menu);

document.querySelectorAll("main.pt-36, main.pt-28, main.pt-24").forEach(main => {
  main.classList.remove("pt-36", "pt-28", "pt-24");
  main.classList.add("pt-8");
});

const menuButton = header.querySelector("#mobileMenuButton");
const closeButton = menu.querySelector("#mobileMenuClose");
const deliveryLocation = header.querySelector("#deliveryLocation");

function formatDeliveryAddress(address) {
  const area = [address.city, address.state].filter(Boolean).join(", ");
  const location = [area, address.country].filter(Boolean).join(" • ");

  return location || address.address_line || "Saved delivery address";
}

async function loadSavedDeliveryAddress() {
  try {
    const { supabase } = await import("./supabase.js");
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) return;

    const { data: address, error } = await supabase
      .from("addresses")
      .select("address_line,city,state,country,is_default,created_at")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("Unable to load delivery address:", error.message);
      return;
    }

    if (address) {
      deliveryLocation.textContent = formatDeliveryAddress(address);
    }
  } catch (error) {
    console.warn("Unable to load delivery address:", error);
  }
}

loadSavedDeliveryAddress();
window.addEventListener("fundz:delivery-address-updated", loadSavedDeliveryAddress);

function closeMenu() {
  menu.classList.add("hidden");
  overlay.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  menuButton.setAttribute("aria-expanded", "false");
}

menuButton.addEventListener("click", () => {
  menu.classList.remove("hidden");
  overlay.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  menuButton.setAttribute("aria-expanded", "true");
});

closeButton.addEventListener("click", closeMenu);
overlay.addEventListener("click", closeMenu);
menu.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeMenu();
});