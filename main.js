function storeGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
}
function storeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {  }
}
(function () {
  const saved = storeGet("storynest-theme", null);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));
})();

document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initNavToggle();
  initLikes();
  initSynopsisToggle();
  initProgressBar();
  initLibrary();
  initDialog();
  initSlideshow();
});

function initTheme() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const paint = () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    btn.innerHTML = dark ? "&#9728;&#65039; Light" : "&#127769; Dark";
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
  };
  paint();
  btn.addEventListener("click", function () {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    storeSet("storynest-theme", next);
    paint();
  });
}

function initNavToggle() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", function () {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

function getLikes() {
  try { return JSON.parse(storeGet("storynest-likes", "[]")); } catch (e) { return []; }
}
function initLikes() {
  const buttons = document.querySelectorAll("[data-like]");
  if (!buttons.length) return;
  let likes = getLikes();

  const paint = (btn) => {
    const liked = likes.includes(btn.dataset.like);
    btn.setAttribute("aria-pressed", liked ? "true" : "false");
    const icon = btn.querySelector(".like-icon");
    const text = btn.querySelector(".like-text");
    if (icon) icon.innerHTML = liked ? "&#9829;" : "&#9825;";
    if (text) text.textContent = liked ? "Liked" : "Like";
    if (btn.classList.contains("like-mini")) btn.innerHTML = liked ? "&#9829;" : "&#9825;";
  };

  buttons.forEach(function (btn) {
    paint(btn);
    btn.addEventListener("click", function () {
      const id = btn.dataset.like;
      likes = likes.includes(id) ? likes.filter((x) => x !== id) : likes.concat(id);
      storeSet("storynest-likes", JSON.stringify(likes));
      document.querySelectorAll('[data-like="' + id + '"]').forEach(paint);
      btn.classList.remove("like-pop");
      void btn.offsetWidth;
      btn.classList.add("like-pop");
      if (document.body.dataset.likedOnly === "true") applyFilters();
    });
  });
}

function initSynopsisToggle() {
  const btn = document.getElementById("synopsisToggle");
  const box = document.getElementById("synopsisBox");
  if (!btn || !box) return;
  btn.addEventListener("click", function () {
    const hide = !box.hidden;
    box.hidden = hide;
    btn.textContent = hide ? "Show synopsis" : "Hide synopsis";
    btn.setAttribute("aria-expanded", hide ? "false" : "true");
  });
}

function initProgressBar() {
  const bar = document.getElementById("progressBar");
  const reader = document.getElementById("reader");
  if (!bar || !reader) return;
  const update = function () {
    const rect = reader.getBoundingClientRect();
    const total = rect.height - window.innerHeight * 0.6;
    const done = Math.min(Math.max(-rect.top + window.innerHeight * 0.3, 0), total);
    const pct = total > 0 ? (done / total) * 100 : 100;
    bar.style.width = Math.min(pct, 100).toFixed(1) + "%";
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

let applyFilters = function () {};
function initLibrary() {
  const grid = document.getElementById("bookGrid");
  if (!grid) return;
  const search = document.getElementById("searchInput");
  const select = document.getElementById("genreFilter");
  const likedBtn = document.getElementById("showLiked");
  const count = document.getElementById("resultCount");
  const empty = document.getElementById("emptyState");
  const cards = Array.from(grid.querySelectorAll(".book-card"));

  applyFilters = function () {
    const q = search.value.trim().toLowerCase();
    const genre = select.value;
    const likedOnly = likedBtn.getAttribute("aria-pressed") === "true";
    const likes = getLikes();
    let shown = 0;
    cards.forEach(function (card) {
      const matchText = !q || card.dataset.title.includes(q) || card.dataset.author.includes(q) || card.dataset.genre.toLowerCase().includes(q);
      const matchGenre = genre === "all" || card.dataset.genre === genre;
      const matchLike = !likedOnly || likes.includes(card.dataset.id);
      const visible = matchText && matchGenre && matchLike;
      card.hidden = !visible;
      if (visible) shown++;
    });
    count.textContent = "Showing " + shown + " of " + cards.length + " stories";
    empty.hidden = shown !== 0;
  };

  search.addEventListener("input", applyFilters);
  select.addEventListener("change", applyFilters);
  likedBtn.addEventListener("click", function () {
    const on = likedBtn.getAttribute("aria-pressed") !== "true";
    likedBtn.setAttribute("aria-pressed", on ? "true" : "false");
    document.body.dataset.likedOnly = on ? "true" : "false";
    applyFilters();
  });

  const wanted = new URLSearchParams(window.location.search).get("genre");
  if (wanted) {
    const option = Array.from(select.options).find((o) => o.value === wanted);
    if (option) select.value = wanted;
  }
  applyFilters();
}

function initDialog() {
  const dialog = document.getElementById("bookDialog");
  if (!dialog) return;
  const fill = function (card) {
    document.getElementById("dlgCover").src = card.dataset.cover;
    document.getElementById("dlgCover").alt = "Cover of " + card.dataset.name;
    document.getElementById("dlgGenre").textContent = card.dataset.genreLabel;
    document.getElementById("dlgTitle").textContent = card.dataset.name;
    document.getElementById("dlgAuthor").textContent = "by " + card.dataset.by;
    document.getElementById("dlgChapter").textContent = card.dataset.chapter;
    document.getElementById("dlgSynopsis").textContent = card.dataset.synopsis;
    document.getElementById("dlgRead").href = card.dataset.href;
  };
  document.querySelectorAll(".details-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      fill(btn.closest(".book-card"));
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });
  });
  const close = function () { if (dialog.open) dialog.close(); };
  document.getElementById("dialogClose").addEventListener("click", close);
  dialog.addEventListener("click", function (e) { if (e.target === dialog) close(); });
}

function initSlideshow() {
  const root = document.getElementById("slideshow");
  if (!root) return;
  const slides = Array.from(root.querySelectorAll(".slide"));
  const dotsBox = document.getElementById("slideDots");
  let index = 0;
  let timer = null;

  const dots = slides.map(function (_, i) {
    const d = document.createElement("button");
    d.type = "button";
    d.setAttribute("aria-label", "Go to slide " + (i + 1));
    d.addEventListener("click", function () { show(i); restart(); });
    dotsBox.appendChild(d);
    return d;
  });

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("is-active", k === index));
    dots.forEach((d, k) => d.classList.toggle("is-active", k === index));
  }
  function restart() {
    clearInterval(timer);
    timer = setInterval(function () { show(index + 1); }, 4500);
  }
  document.getElementById("slidePrev").addEventListener("click", function () { show(index - 1); restart(); });
  document.getElementById("slideNext").addEventListener("click", function () { show(index + 1); restart(); });
  root.addEventListener("mouseenter", function () { clearInterval(timer); });
  root.addEventListener("mouseleave", restart);
  show(0);
  restart();
}
