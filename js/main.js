// js/main.js
document.addEventListener("DOMContentLoaded", () => {
  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // WhatsApp CTAs: build wa.me links from data-whatsapp-msg attribute
  const WHATSAPP_NUMBER = "5493329330625"; // +54 9 3329 33-0625
  document.querySelectorAll("[data-whatsapp]").forEach(el => {
    const msg = el.getAttribute("data-whatsapp-msg") || "Hola, quisiera hacer una consulta legal.";
    el.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    el.target = "_blank";
    el.rel = "noopener";
  });

  // Scroll-reveal animations: auto-tag common content blocks so pages
  // animate in as the user scrolls, without needing per-page markup.
  const revealSelectors = [
    ".eyebrow", ".section h2", ".about-text p", ".why-text p",
    ".area-card", ".why-feature", ".post-card", ".contact-card",
    ".content-block h2", ".content-block > p", ".sidebar-card",
    ".trust-item", ".comment-item", ".faq-item"
  ];
  const revealEls = document.querySelectorAll(revealSelectors.join(","));
  revealEls.forEach((el, i) => {
    el.classList.add("reveal");
    if (el.matches(".area-card, .why-feature, .trust-item")) {
      el.classList.add(`reveal-${(i % 4) + 1}`);
    }
  });

  if ("IntersectionObserver" in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("in-view"));
  }

  // Elegant preloader (only present on pages that include #preloader)
  const preloader = document.getElementById("preloader");
  if (preloader) {
    const hide = () => preloader.classList.add("hide");
    window.addEventListener("load", () => setTimeout(hide, 900));
    setTimeout(hide, 2600); // safety net so it never blocks the page
  }
});
