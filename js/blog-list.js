// js/blog-list.js
import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

async function loadPublishedPosts() {
  const grid = document.querySelector(".blog-grid");
  if (!grid) return;
  try {
    const q = query(collection(db, "posts"), where("status", "==", "published"));
    const snap = await getDocs(q);
    if (snap.empty) return; // keep the static seed cards already in the HTML

    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));

    posts.forEach(post => {
      const card = document.createElement("article");
      card.className = "post-card";
      card.innerHTML = `
        <span class="tag">${escapeHtml((post.area || "").toUpperCase())}</span>
        <h3>${escapeHtml(post.title || "")}</h3>
        <p>${escapeHtml(post.excerpt || "")}</p>
        <a href="/blog/post.html?slug=${encodeURIComponent(post.id)}">Leer artículo →</a>`;
      grid.prepend(card);
    });
  } catch (err) {
    console.warn("blog-list: no se pudieron cargar artículos publicados.", err);
  }
}

loadPublishedPosts();
