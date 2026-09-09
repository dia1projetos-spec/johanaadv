// js/hero-slider.js
// Reads siteContent/home.heroSlides ([{type:'image'|'video', url}]) and
// turns the hero into an auto-playing, full-bleed slideshow. If there's no
// data (or Firestore fails), the static fallback slide already in the HTML
// stays exactly as-is — good for SEO and for a broken-JS scenario.

import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const AUTOPLAY_MS = 6000;

async function initHeroSlider(){
  const track = document.getElementById("hero-slides");
  const dotsWrap = document.getElementById("hero-dots");
  if (!track) return;

  let slides = [];
  try{
    const snap = await getDoc(doc(db, "siteContent", "home"));
    if (snap.exists() && Array.isArray(snap.data().heroSlides) && snap.data().heroSlides.length){
      slides = snap.data().heroSlides;
    }
  }catch(err){
    console.warn("hero-slider: usando slide estático (fallback).", err);
  }

  if (!slides.length) return; // keep the static fallback slide

  track.innerHTML = "";
  slides.forEach((slide, i) => {
    const el = document.createElement("div");
    el.className = "hero-slide" + (i === 0 ? " active" : "");
    if (slide.type === "video"){
      el.innerHTML = `<video src="${slide.url}" autoplay muted loop playsinline></video>`;
    } else {
      el.innerHTML = `<img src="${slide.url}" alt="" loading="${i === 0 ? "eager" : "lazy"}">`;
    }
    track.appendChild(el);
  });

  if (slides.length < 2) return;

  const slideEls = Array.from(track.children);
  let current = 0;

  if (dotsWrap){
    dotsWrap.innerHTML = "";
    slideEls.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "hero-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Ir a la imagen ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  function goTo(index){
    slideEls[current].classList.remove("active");
    if (dotsWrap && dotsWrap.children[current]) dotsWrap.children[current].classList.remove("active");
    current = index;
    slideEls[current].classList.add("active");
    if (dotsWrap && dotsWrap.children[current]) dotsWrap.children[current].classList.add("active");
  }

  let timer = setInterval(() => goTo((current + 1) % slideEls.length), AUTOPLAY_MS);

  document.addEventListener("visibilitychange", () => {
    clearInterval(timer);
    if (!document.hidden){
      timer = setInterval(() => goTo((current + 1) % slideEls.length), AUTOPLAY_MS);
    }
  });
}

initHeroSlider();
