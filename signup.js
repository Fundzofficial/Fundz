import { supabase } from "./supabase.js";
import {
  signUp,
  syncSignupDetails
} from "./auth.js";

const statesByCountry = {
  Nigeria: [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
    "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
    "Enugu", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
    "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun",
    "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
    "Yobe", "Zamfara", "FCT"
  ],
  "South Africa": [
    "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
    "Mpumalanga", "Northern Cape", "North West", "Western Cape"
  ]
};

const countrySelect = document.getElementById("country");
const countryFlag = document.getElementById("countryFlag");
const stateSelect = document.getElementById("state");
const passwordInput = document.getElementById("password");
const passwordToggle = document.getElementById("passwordToggle");
const mapButton = document.getElementById("mapButton");
const locationStatus = document.getElementById("locationStatus");
let deliveryCoordinates = null;

function updateStates() {
  const states = statesByCountry[countrySelect.value] || [];
  stateSelect.replaceChildren(new Option("Select state", ""));
  states.forEach(state => stateSelect.add(new Option(state, state)));
}

function setMessage(text, type = "error") {
  message.textContent = text;
  message.classList.remove("error", "success");
  message.classList.add(type);
}

countrySelect.addEventListener("change", () => {
  const option = countrySelect.selectedOptions[0];
  countryFlag.textContent = option.dataset.flag;
  updateStates();
});

updateStates();

passwordToggle.addEventListener("click", () => {
  const showingPassword = passwordInput.type === "password";
  passwordInput.type = showingPassword ? "text" : "password";
  passwordToggle.setAttribute(
    "aria-label",
    showingPassword ? "Hide password" : "Show password"
  );
});

mapButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    locationStatus.textContent = "Location is unavailable in this browser. Enter your address below.";
    return;
  }

  mapButton.disabled = true;
  locationStatus.textContent = "Finding your location...";
  navigator.geolocation.getCurrentPosition(
    position => {
      deliveryCoordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      locationStatus.textContent = `Location captured: ${deliveryCoordinates.latitude.toFixed(5)}, ${deliveryCoordinates.longitude.toFixed(5)}`;
      mapButton.disabled = false;
    },
    error => {
      deliveryCoordinates = null;
      locationStatus.textContent = error.code === error.PERMISSION_DENIED
        ? "Location permission was denied. Enter your address below."
        : "Unable to get your location. Enter your address below.";
      mapButton.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

async function redirectIfLoggedIn() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Auth session check failed:", error);
    return;
  }

  if (data?.session) {
    window.location.href = "account.html";
  }
}

redirectIfLoggedIn();


const form =
  document.getElementById(
    "signupForm"
  );

const message =
  document.getElementById(
    "message"
  );

const button = document.getElementById("signupButton");
const buttonText = document.getElementById("buttonText");
const loader = document.getElementById("loader");


form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;


    if (
      password !==
      confirmPassword
    ) {

      setMessage("Passwords do not match.");

      return;

    }


    button.disabled = true;
    buttonText.textContent = "Creating Account...";
    loader.classList.remove("hidden");

    try {
      const result = await signUp(email, password, fullName, {
        phone,
        country: countrySelect.value,
        state: stateSelect.value,
        city: document.getElementById("city").value.trim(),
        address: document.getElementById("address").value.trim(),
        delivery_coordinates: deliveryCoordinates,
        signup_details_pending: true
      });

      if (!result.success) {
        setMessage(result.message === "Failed to fetch"
          ? "Unable to connect to the signup service. Check your connection and try again."
          : result.message);
        return;
      }

      if (result.data?.session) {
        const syncResult = await syncSignupDetails(result.data.user);
        if (!syncResult.success) {
          setMessage("Your account was created, but we could not save your delivery details. Please try again from your account page.");
          return;
        }
        window.location.href = "account.html";
        return;
      }

      setMessage(
        "Account created. Check your email to confirm your account before logging in.",
        "success"
      );
      form.reset();
      countryFlag.textContent = countrySelect.selectedOptions[0].dataset.flag;
      updateStates();
    } catch (error) {
      console.error("Signup request failed:", error);
      setMessage("Unable to create your account right now. Please try again.");
    } finally {
      button.disabled = false;
      buttonText.textContent = "Create Account";
      loader.classList.add("hidden");
    }

  }
)