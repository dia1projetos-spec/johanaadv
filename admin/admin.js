// admin/admin.js
import { auth, db, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_FOLDER } from "/js/firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  doc, getDoc, setDoc, collection, getDocs, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

/* ---------------- Auth guard ---------------- */
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = "/admin/login.html";
});
document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/admin/login.html";
});

/* ---------------- Sidebar navigation ---------------- */
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.panel).classList.add("active");
  });
});

/* ---------------- Cloudinary upload (image or video, auto-detected) ---------------- */
async function uploadToCloudinary(file, subfolder) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", `${CLOUDINARY_FOLDER}/${subfolder}`);

  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || "Error al subir el archivo a Cloudinary.");
  }
  const data = await res.json();
  return { url: data.secure_url, type: data.resource_type === "video" ? "video" : "image" };
}

function slugify(text) {
  return text
    .toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ================================================================
   HERO SLIDES
   ================================================================ */
const contentRef = doc(db, "siteContent", "home");
let heroSlides = [];

async function loadHeroPanel() {
  const snap = await getDoc(contentRef);
  const data = snap.exists() ? snap.data() : {};
  heroSlides = Array.isArray(data.heroSlides) ? data.heroSlides : [];
  document.getElementById("headline").value = data.heroHeadline || "";
  document.getElementById("subheadline").value = data.heroSubheadline || "";
  document.getElementById("about-preview").src = data.aboutImageUrl || "/assets/estatua-justicia.jpg";
  renderSlideList();
}

function renderSlideList() {
  const wrap = document.getElementById("slide-list");
  if (!heroSlides.length) {
    wrap.innerHTML = `<p class="empty-state">Todavía no hay slides publicados — se muestra la imagen estática por defecto.</p>`;
    return;
  }
  wrap.innerHTML = "";
  heroSlides.forEach((slide, i) => {
    const row = document.createElement("div");
    row.className = "slide-row";
    const media = slide.type === "video"
      ? `<video src="${slide.url}" muted></video>`
      : `<img src="${slide.url}" alt="">`;
    row.innerHTML = `
      <div class="thumb">${media}</div>
      <div class="meta">
        <span class="type-tag">${slide.type === "video" ? "Video" : "Imagen"}</span>
        <div class="url">${slide.url}</div>
      </div>
      <div class="actions">
        <button type="button" data-act="up" title="Subir">↑</button>
        <button type="button" data-act="down" title="Bajar">↓</button>
        <button type="button" data-act="del" class="danger" title="Eliminar">✕</button>
      </div>`;
    row.querySelector('[data-act="up"]').addEventListener("click", () => moveSlide(i, -1));
    row.querySelector('[data-act="down"]').addEventListener("click", () => moveSlide(i, 1));
    row.querySelector('[data-act="del"]').addEventListener("click", () => deleteSlide(i));
    wrap.appendChild(row);
  });
}

async function saveHeroSlides() {
  await setDoc(contentRef, { heroSlides }, { merge: true });
}

async function moveSlide(index, dir) {
  const newIndex = index + dir;
  if (newIndex < 0 || newIndex >= heroSlides.length) return;
  [heroSlides[index], heroSlides[newIndex]] = [heroSlides[newIndex], heroSlides[index]];
  renderSlideList();
  await saveHeroSlides();
}

async function deleteSlide(index) {
  if (!confirm("¿Eliminar este slide del hero?")) return;
  heroSlides.splice(index, 1);
  renderSlideList();
  await saveHeroSlides();
}

document.getElementById("slide-upload-btn").addEventListener("click", async () => {
  const fileInput = document.getElementById("slide-file");
  const msg = document.getElementById("slide-upload-msg");
  const file = fileInput.files[0];
  if (!file) { msg.textContent = "Elegí un archivo primero."; return; }
  msg.textContent = "Subiendo…";
  try {
    const { url, type } = await uploadToCloudinary(file, "hero");
    heroSlides.push({ url, type });
    renderSlideList();
    await saveHeroSlides();
    fileInput.value = "";
    msg.textContent = "Slide agregado y publicado ✓";
  } catch (err) {
    msg.textContent = err.message || "Error al subir el archivo.";
  }
});

document.getElementById("text-save-btn").addEventListener("click", async () => {
  const msg = document.getElementById("text-msg");
  const headline = document.getElementById("headline").value.trim();
  const subheadline = document.getElementById("subheadline").value.trim();
  try {
    await setDoc(contentRef, { heroHeadline: headline, heroSubheadline: subheadline }, { merge: true });
    msg.className = "admin-msg ok";
    msg.textContent = "Textos guardados.";
  } catch (err) {
    msg.className = "admin-msg error";
    msg.textContent = "No se pudieron guardar los textos.";
  }
});

/* ================================================================
   ABOUT IMAGE
   ================================================================ */
document.getElementById("about-upload-btn").addEventListener("click", async () => {
  const fileInput = document.getElementById("about-file");
  const msg = document.getElementById("about-msg");
  const file = fileInput.files[0];
  if (!file) { msg.className = "admin-msg error"; msg.textContent = "Elegí una imagen primero."; return; }
  msg.className = "admin-msg";
  msg.textContent = "Subiendo…";
  try {
    const { url } = await uploadToCloudinary(file, "about");
    document.getElementById("about-preview").src = url;
    await setDoc(contentRef, { aboutImageUrl: url }, { merge: true });
    msg.className = "admin-msg ok";
    msg.textContent = "Imagen publicada.";
  } catch (err) {
    msg.className = "admin-msg error";
    msg.textContent = err.message || "Error al publicar la imagen.";
  }
});

/* ================================================================
   BLOG / POSTS
   ================================================================ */
const postsCol = collection(db, "posts");
let postsCache = [];
let editingSlug = null;
let coverData = null; // {url, type}

async function loadPosts() {
  const tbody = document.getElementById("posts-tbody");
  tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Cargando…</td></tr>`;
  const snap = await getDocs(postsCol);
  postsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  postsCache.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
  renderPostsTable();
}

function renderPostsTable() {
  const tbody = document.getElementById("posts-tbody");
  if (!postsCache.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Todavía no creaste ningún artículo.</td></tr>`;
    return;
  }
  tbody.innerHTML = "";
  postsCache.forEach(post => {
    const tr = document.createElement("tr");
    const date = post.updatedAtMs ? new Date(post.updatedAtMs).toLocaleDateString("es-AR") : "—";
    tr.innerHTML = `
      <td><strong>${post.title || "(sin título)"}</strong><br><span style="color:var(--a-muted);font-size:0.78rem;">/blog/post.html?slug=${post.id}</span></td>
      <td>${post.area || "—"}</td>
      <td><span class="status-pill ${post.status === "published" ? "published" : "draft"}">${post.status === "published" ? "Publicado" : "Borrador"}</span></td>
      <td>${date}</td>
      <td class="table-actions">
        <button data-act="edit">Editar</button>
        <button data-act="del" class="danger">Eliminar</button>
      </td>`;
    tr.querySelector('[data-act="edit"]').addEventListener("click", () => openEditor(post));
    tr.querySelector('[data-act="del"]').addEventListener("click", () => deletePost(post.id));
    tbody.appendChild(tr);
  });
}

async function deletePost(slug) {
  if (!confirm("¿Eliminar este artículo? Esta acción no se puede deshacer.")) return;
  await deleteDoc(doc(db, "posts", slug));
  await loadPosts();
}

document.getElementById("new-post-btn").addEventListener("click", () => openEditor(null));

function openEditor(post) {
  editingSlug = post ? post.id : null;
  coverData = post ? { url: post.coverUrl, type: post.coverType } : null;

  document.getElementById("modal-title").textContent = post ? "Editar artículo" : "Nuevo artículo";
  document.getElementById("post-title").value = post?.title || "";
  document.getElementById("post-slug").value = post?.id || "";
  document.getElementById("post-excerpt").value = post?.excerpt || "";
  document.getElementById("post-body").value = post?.body || "";
  document.getElementById("post-area").value = post?.area || "Derecho Penal";
  document.getElementById("post-status").value = post?.status || "draft";
  document.getElementById("post-save-msg").textContent = "";
  document.getElementById("post-delete-btn").style.display = post ? "inline-block" : "none";

  updateCoverPreview();
  document.getElementById("post-modal").classList.add("open");
}

function closeEditor() {
  document.getElementById("post-modal").classList.remove("open");
}

function updateCoverPreview() {
  const img = document.getElementById("post-cover-preview");
  const video = document.getElementById("post-cover-preview-video");
  img.style.display = "none";
  video.style.display = "none";
  if (coverData?.url) {
    if (coverData.type === "video") { video.src = coverData.url; video.style.display = "block"; }
    else { img.src = coverData.url; img.style.display = "block"; }
  }
}

document.getElementById("modal-close-btn").addEventListener("click", closeEditor);
document.getElementById("post-cancel-btn").addEventListener("click", closeEditor);
document.getElementById("post-modal").addEventListener("click", (e) => {
  if (e.target.id === "post-modal") closeEditor();
});

// Auto-slug from title, only while creating a new post (don't clobber an edited slug)
document.getElementById("post-title").addEventListener("input", (e) => {
  if (editingSlug) return;
  document.getElementById("post-slug").value = slugify(e.target.value);
});

document.getElementById("post-cover-upload-btn").addEventListener("click", async () => {
  const fileInput = document.getElementById("post-cover-file");
  const msg = document.getElementById("post-cover-msg");
  const file = fileInput.files[0];
  if (!file) { msg.className = "admin-msg error"; msg.textContent = "Elegí un archivo primero."; return; }
  msg.className = "admin-msg";
  msg.textContent = "Subiendo…";
  try {
    coverData = await uploadToCloudinary(file, "blog");
    updateCoverPreview();
    msg.className = "admin-msg ok";
    msg.textContent = "Portada lista.";
  } catch (err) {
    msg.className = "admin-msg error";
    msg.textContent = err.message || "Error al subir el archivo.";
  }
});

document.getElementById("post-delete-btn").addEventListener("click", async () => {
  if (!editingSlug) return;
  await deletePost(editingSlug);
  closeEditor();
});

document.getElementById("post-save-btn").addEventListener("click", async () => {
  const msg = document.getElementById("post-save-msg");
  const title = document.getElementById("post-title").value.trim();
  let slug = slugify(document.getElementById("post-slug").value.trim());
  const excerpt = document.getElementById("post-excerpt").value.trim();
  const body = document.getElementById("post-body").value.trim();
  const area = document.getElementById("post-area").value;
  const status = document.getElementById("post-status").value;

  if (!title || !slug || !body) {
    msg.className = "admin-msg error";
    msg.textContent = "Completá al menos título, URL y contenido.";
    return;
  }

  // If the slug changed while editing an existing post, remove the old doc
  const oldSlug = editingSlug;

  try {
    await setDoc(doc(db, "posts", slug), {
      title, excerpt, body, area, status,
      coverUrl: coverData?.url || null,
      coverType: coverData?.type || null,
      updatedAtMs: Date.now(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    if (oldSlug && oldSlug !== slug) {
      await deleteDoc(doc(db, "posts", oldSlug));
    }

    closeEditor();
    await loadPosts();
  } catch (err) {
    msg.className = "admin-msg error";
    msg.textContent = err.message || "Error al guardar el artículo.";
  }
});

/* ---------------- Init ---------------- */
loadHeroPanel();
loadPosts();
