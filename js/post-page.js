// js/post-page.js
import { db } from "./firebase-config.js";
import {
  doc, getDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function paragraphsToHtml(text) {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

async function loadPost() {
  const contentEl = document.getElementById("post-content");

  if (!slug) {
    contentEl.innerHTML = `<p>No se especificó ningún artículo. <a href="/blog/">Volver al blog</a>.</p>`;
    return;
  }

  try {
    const snap = await getDoc(doc(db, "posts", slug));
    if (!snap.exists() || snap.data().status !== "published") {
      contentEl.innerHTML = `<p>No encontramos este artículo, puede que ya no esté disponible. <a href="/blog/">Volver al blog</a>.</p>`;
      document.getElementById("post-title").textContent = "Artículo no encontrado";
      return;
    }

    const post = snap.data();

    document.title = `${post.title} | Estudio Jurídico Kruger Johana`;
    document.getElementById("page-title").textContent = `${post.title} | Estudio Jurídico Kruger Johana`;
    if (post.excerpt) {
      document.getElementById("page-description").setAttribute("content", post.excerpt);
    }
    document.getElementById("post-title").textContent = post.title;
    document.getElementById("crumb-title").textContent = post.title;

    let coverHtml = "";
    if (post.coverUrl) {
      coverHtml = post.coverType === "video"
        ? `<video class="post-cover" src="${post.coverUrl}" autoplay muted loop playsinline></video>`
        : `<img class="post-cover" src="${post.coverUrl}" alt="${escapeHtml(post.title)}">`;
    }

    const metaHtml = `<div class="post-meta">${post.area ? `<span class="tag">${escapeHtml(post.area)}</span>` : ""}</div>`;

    contentEl.innerHTML = coverHtml + metaHtml + `<div class="post-body">${paragraphsToHtml(post.body || "")}</div>`;

    loadComments();
  } catch (err) {
    contentEl.innerHTML = `<p>Ocurrió un error al cargar el artículo. Probá recargar la página.</p>`;
    console.error(err);
  }
}

async function loadComments() {
  const list = document.getElementById("comments-list");
  try {
    const q = query(collection(db, "posts", slug, "comments"), orderBy("createdAtMs", "asc"));
    const snap = await getDocs(q);
    if (snap.empty) {
      list.innerHTML = `<p style="color:var(--text-muted);font-size:0.9rem;">Todavía no hay comentarios. ¡Sé el primero en escribir!</p>`;
      return;
    }
    list.innerHTML = "";
    snap.forEach(d => {
      const c = d.data();
      const when = c.createdAtMs ? new Date(c.createdAtMs).toLocaleDateString("es-AR") : "";
      const item = document.createElement("div");
      item.className = "comment-item";
      item.innerHTML = `<span class="who">${escapeHtml(c.name || "Anónimo")}</span><span class="when">${when}</span><p>${escapeHtml(c.message || "")}</p>`;
      list.appendChild(item);
    });
  } catch (err) {
    list.innerHTML = `<p style="color:var(--text-muted);font-size:0.9rem;">No se pudieron cargar los comentarios.</p>`;
  }
}

document.getElementById("comment-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("comment-msg");
  const name = document.getElementById("comment-name").value.trim();
  const message = document.getElementById("comment-message").value.trim();
  if (!slug || !name || !message) return;

  try {
    await addDoc(collection(db, "posts", slug, "comments"), {
      name, message,
      createdAtMs: Date.now(),
      createdAt: serverTimestamp(),
    });
    document.getElementById("comment-form").reset();
    msg.textContent = "¡Gracias por tu comentario!";
    loadComments();
  } catch (err) {
    msg.textContent = "No se pudo publicar el comentario. Probá de nuevo.";
  }
});

loadPost();
