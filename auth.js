import { supabase } from "./supabase.js";


// =====================================================
// HELPERS
// =====================================================

export function showMessage(element, message, type = "error") {

  if (!element) return;

  element.textContent = message;

  element.classList.remove(
    "hidden",
    "text-red-400",
    "text-green-400",
    "text-white/50"
  );

  if (type === "success") {

    element.classList.add(
      "text-green-400"
    );

  } else {

    element.classList.add(
      "text-red-400"
    );

  }

}


export function getRedirectUrl() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  return (
    params.get("redirect") ||
    "index.html"
  );

}


export function getSafeRedirect(url) {

  const allowedPages = [
    "index.html",
    "shop.html",
    "cart.html",
    "checkout.html",
    "account.html",
    "wishlist.html",
    "orders.html"
  ];

  try {

    const parsed =
      new URL(
        url,
        window.location.origin
      );

    if (
      parsed.origin !==
      window.location.origin
    ) {

      return "Fundz/account.html";

    }

    const filename =
      parsed.pathname
        .split("/")
        .pop();

    if (
      allowedPages.includes(filename)
    ) {

      return (
        parsed.pathname +
        parsed.search
      );

    }

  } catch {

    return "Fundz/account.html";

  }

  return "Fundz/account.html";

}


// =====================================================
// SIGN UP
// =====================================================

export async function signUp(
  email,
  password,
  fullName
) {

  email =
    email.trim().toLowerCase();

  fullName =
    fullName.trim();


  if (!fullName) {

    return {
      success: false,
      message: "Please enter your full name."
    };

  }


  if (!email) {

    return {
      success: false,
      message: "Please enter your email address."
    };

  }


  if (password.length < 8) {

    return {
      success: false,
      message:
        "Password must be at least 8 characters."
    };

  }


  const {
    data,
    error
  } =
    await supabase.auth.signUp({

      email,

      password,

      options: {

        data: {
          full_name: fullName
        },

        emailRedirectTo:
          `${window.location.origin}/login.html`

      }

    });


  if (error) {

    console.error(
      "Signup error:",
      error
    );

    return {
      success: false,
      message: error.message
    };

  }


  return {
    success: true,
    data,
    message:
      "Account created. Redirecting..."
  };

}


// =====================================================
// LOGIN
// =====================================================

export async function login(
  email,
  password
) {

  email =
    email.trim().toLowerCase();


  const {
    data,
    error
  } =
    await supabase.auth.signInWithPassword({

      email,

      password

    });


  if (error) {

    console.error(
      "Login error:",
      error
    );

    return {
      success: false,
      message: error.message
    };

  }


  return {
    success: true,
    data
  };

}


// =====================================================
// LOGOUT
// =====================================================

export async function logout() {

  const {
    error
  } =
    await supabase.auth.signOut();


  if (error) {

    console.error(
      "Logout error:",
      error
    );

    return {
      success: false,
      message: error.message
    };

  }


  return {
    success: true
  };

}


// =====================================================
// FORGOT PASSWORD
// =====================================================

export async function resetPassword(
  email
) {

  email =
    email.trim().toLowerCase();


  if (!email) {

    return {
      success: false,
      message: "Enter your email address."
    };

  }


  const {
    error
  } =
    await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          `${window.location.origin}/reset-password.html`
      }
    );


  if (error) {

    console.error(
      "Password reset error:",
      error
    );

    return {
      success: false,
      message: error.message
    };

  }


  return {
    success: true,
    message:
      "Password reset instructions have been sent to your email."
  };

}


// =====================================================
// GET CURRENT USER
// =====================================================

export async function getCurrentUser() {

  const {
    data,
    error
  } =
    await supabase.auth.getUser();


  if (error) {

    return null;

  }


  return data.user;

}


// =====================================================
// REQUIRE LOGIN
// =====================================================

export async function requireAuth(
  redirect = "login.html"
) {

  const {
    data
  } =
    await supabase.auth.getSession();


  if (!data.session) {

    window.location.href =
      redirect;

    return null;

  }


  return data.session;

}
