function initMobileMenu() {
  const button = document.getElementById("mobileMenuButton");
  const menu = document.getElementById("mobileMenu");
  const closeButton = document.getElementById("mobileMenuClose");

  if (!button || !menu) return;

  const openMenu = () => {
    menu.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
  };

  const closeMenu = () => {
    menu.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  };

  button.addEventListener("click", () => {
    if (menu.classList.contains("hidden")) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  closeButton?.addEventListener("click", closeMenu);

  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  menu.addEventListener("click", event => {
    if (event.target === menu) {
      closeMenu();
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initMobileMenu();
    window.initMobileMenu = initMobileMenu;
  }, { once: true });
} else {
  initMobileMenu();
  window.initMobileMenu = initMobileMenu;
}
