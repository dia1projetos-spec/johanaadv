// js/site-content.js
// Reads /siteContent/home from Firestore and swaps in any images or text
// the admin has published. If Firestore is empty or unreachable, the page
// simply keeps the default content that's already written in the HTML —
// this is important for SEO (crawlers see full content even with JS off).

import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

async function applySiteContent(){
  try{
    const snap = await getDoc(doc(db, "siteContent", "home"));
    if(!snap.exists()) return;
    const data = snap.data();

    if(data.heroImageUrl){
      document.querySelectorAll('[data-cms="hero-image"]').forEach(el=>{
        el.src = data.heroImageUrl;
      });
    }
    if(data.aboutImageUrl){
      document.querySelectorAll('[data-cms="about-image"]').forEach(el=>{
        el.src = data.aboutImageUrl;
      });
    }
    if(data.heroHeadline){
      document.querySelectorAll('[data-cms="hero-headline"]').forEach(el=>{
        el.textContent = data.heroHeadline;
      });
    }
    if(data.heroSubheadline){
      document.querySelectorAll('[data-cms="hero-subheadline"]').forEach(el=>{
        el.textContent = data.heroSubheadline;
      });
    }
  }catch(err){
    // Fails silently on purpose — static HTML content remains visible.
    console.warn("site-content: usando conteúdo estático (fallback).", err);
  }
}

applySiteContent();
