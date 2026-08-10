import { supabase } from "./supabase.js";

const addressForm = document.getElementById("addressForm");
const savedAddress = document.getElementById("savedAddress");
const message = document.getElementById("message");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.remove("hidden");
  message.style.background = isError ? "#ffdddd" : "#ffffff";
  message.style.color = isError ? "#000" : "#000";

  setTimeout(() => {
    message.classList.add("hidden");
  }, 3000);
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("getUser error", error);
    return null;
  }
  return data.user || null;
}

async function loadAddresses() {
  const user = await getUser();
  if (!user) {
    savedAddress.innerHTML = `
      <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p class="text-sm text-white/40">Log in to see your addresses.</p>
      </div>
    `;
    return;
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showMessage("Unable to load addresses.", true);
    return;
  }

  if (!data || data.length === 0) {
    savedAddress.innerHTML = `
      <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p class="text-sm text-white/40">No saved address yet.</p>
      </div>
    `;
    return;
  }

  savedAddress.innerHTML = data
    .map((addr) => {
      return `
      <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-4">
        <div class="flex items-start justify-between gap-5">
          <div>
            <p class="font-bold">${escapeHtml(addr.full_name)}</p>
            <p class="mt-2 text-sm text-white/50">${escapeHtml(addr.address_line)}</p>
            <p class="mt-1 text-sm text-white/50">${escapeHtml(addr.city)}, ${escapeHtml(addr.state)}</p>
            <p class="mt-1 text-sm text-white/50">${escapeHtml(addr.country)}</p>
            <p class="mt-3 text-xs text-white/30">${escapeHtml(addr.phone)}</p>
          </div>
          <div class="flex flex-col items-end gap-2">
            ${addr.is_default ? '<span class="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-black">Default</span>' : ''}
            <div class="flex gap-3">
              <button data-id="${addr.id}" data-action="set-default" class="text-xs font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300">Set default</button>
              <button data-id="${addr.id}" data-action="delete" class="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300">Remove</button>
            </div>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  // Attach handlers
  savedAddress.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");

      if (action === "delete") {
        await deleteAddress(id);
      } else if (action === "set-default") {
        await setDefaultAddress(id);
      }
    });
  });
}

async function setDefaultAddress(id) {
  const user = await getUser();
  if (!user) {
    showMessage("Please log in to set a default address.", true);
    return;
  }

  // Reset other addresses
  const { error: resetError } = await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id);

  if (resetError) {
    console.error(resetError);
    showMessage("Unable to update default status.", true);
    return;
  }

  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    showMessage("Unable to set default.", true);
    return;
  }

  showMessage("Default address updated.");
  await loadAddresses();
}

async function deleteAddress(id) {
  const user = await getUser();
  if (!user) {
    showMessage("Please log in to remove an address.", true);
    return;
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    showMessage("Unable to delete address.", true);
    return;
  }

  showMessage("Address removed.");
  await loadAddresses();
}

addressForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const user = await getUser();

    if (!user) {
      showMessage("Please log in before saving your address.", true);
      return;
    }

    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const addressLine = document.getElementById("address").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const country = document.getElementById("country").value.trim();
    const postalCode = (document.getElementById("postalCode") || { value: "" }).value.trim();
    const isDefault = document.getElementById("isDefault").checked;

    if (isDefault) {
      const { error: resetError } = await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      if (resetError) throw resetError;
    }

    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      full_name: fullName,
      phone: phone,
      address_line: addressLine,
      city: city,
      state: state,
      country: country,
      postal_code: postalCode || null,
      is_default: isDefault
    });

    if (error) throw error;

    showMessage("Address saved successfully.");
    addressForm.reset();
    document.getElementById("country").value = "Nigeria";
    await loadAddresses();

  } catch (error) {
    console.error("Address save error:", error);
    showMessage(error.message || "Unable to save address.", true);
  }
});

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value || "";
  return div.innerHTML;
}

// Initial load
loadAddresses();
