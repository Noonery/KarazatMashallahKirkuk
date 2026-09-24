/*
  لا توجد بيانات منتجات هنا.
  الموقع يجلب المنتجات مباشرة من API قاعدة البيانات.
*/
const API_BASE = window.KARZAT_API_BASE || "https://ofz.pythonanywhere.com/";
const NEW_PRODUCT_DAYS = 7;

const state = { products: [], category: "all", search: "" };
const $ = (s) => document.querySelector(s);
const productsEl = $("#products");
const searchInput = $("#search");
const noResults = $("#no-results");
const apiError = $("#api-error");
const loadingProducts = $("#loading-products");
const productCount = $("#product-count");
const activeFilter = $("#active-filter");

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function isNewProduct(createdAt) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;

  return Date.now() - created >= 0 &&
         Date.now() - created <= NEW_PRODUCT_DAYS * 86400000;
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString("ar-IQ") + " د.ع";
}

function getFilteredProducts() {
  const term = state.search.trim().toLocaleLowerCase("ar");

  return state.products.filter((p) => {
    const categoryOK =
      state.category === "all" ||
      p.category === state.category;

    const text =
      `${p.name || ""} ${p.desc || ""}`.toLocaleLowerCase("ar");

    return categoryOK && (!term || text.includes(term));
  });
}

function renderProducts() {
  const products = getFilteredProducts();

  productsEl.innerHTML = "";

  noResults.hidden = products.length !== 0;
  loadingProducts.hidden = true;
  apiError.hidden = true;

  productCount.textContent = `${products.length} منتج`;

  activeFilter.textContent =
    state.category === "all"
      ? "كل المنتجات"
      : state.category;

  products.forEach((p, i) => {
    const card = document.createElement("article");

    card.className = "card";

    card.style.setProperty(
      "--delay",
      `${Math.min(i * 45, 350)}ms`
    );

    const badge = isNewProduct(p.created_at)
      ? `<span class="new-badge">جديد</span>`
      : "";

    card.innerHTML = `
      <div class="card-media">
        ${badge}

        <img
          src="${escapeHTML(p.img || "")}"
          alt="${escapeHTML(p.name || "")}"
          loading="lazy"
          onerror="this.style.opacity='0.15';"
        >
      </div>

      <div class="card-body">
        <span class="card-category">
          ${escapeHTML(p.category || "")}
        </span>

        <h3>${escapeHTML(p.name || "")}</h3>

        <p>
          ${escapeHTML(
            p.desc || "منتج طازج ومختار بعناية"
          )}
        </p>

        <div class="card-footer">
          <strong>${formatPrice(p.price)}</strong>
          <span class="price-label">السعر</span>
        </div>
      </div>
    `;

    productsEl.appendChild(card);
  });
}

async function loadProducts() {
  loadingProducts.hidden = false;
  productsEl.innerHTML = "";
  noResults.hidden = true;
  apiError.hidden = true;

  try {
    const response = await fetch(
      `${API_BASE}/api/products`,
      {
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (
      !data.ok ||
      !Array.isArray(data.products)
    ) {
      throw new Error("Invalid API response");
    }

    state.products = data.products;

    renderProducts();

  } catch (error) {
    console.error("Products API error:", error);

    loadingProducts.hidden = true;
    apiError.hidden = false;
    productCount.textContent = "—";
  }
}

function setCategory(category) {
  state.category = category;

  document
    .querySelectorAll(".tab")
    .forEach((tab) => {
      tab.classList.toggle(
        "active",
        tab.dataset.cat === category
      );
    });

  renderProducts();
}

function initSearch() {
  searchInput.addEventListener("input", () => {
    state.search = searchInput.value;

    $("#clear-search").classList.toggle(
      "visible",
      Boolean(state.search)
    );

    renderProducts();
  });

  $("#clear-search").addEventListener("click", () => {
    searchInput.value = "";
    state.search = "";

    $("#clear-search").classList.remove("visible");

    renderProducts();

    searchInput.focus();
  });
}

function initTabs() {
  document
    .querySelectorAll(".tab")
    .forEach((tab) => {
      tab.addEventListener(
        "click",
        () => setCategory(tab.dataset.cat)
      );
    });

  $("#reset-filters").addEventListener("click", () => {
    state.category = "all";
    state.search = "";
    searchInput.value = "";

    $("#clear-search").classList.remove("visible");

    setCategory("all");
  });
}

function startLoader() {
  const loader = $("#loader");
  const bar = $("#load-bar");
  const percent = $("#load-pc");

  let progress = 0;

  const timer = setInterval(() => {
    progress = Math.min(
      progress + Math.floor(Math.random() * 14) + 7,
      100
    );

    bar.style.width = `${progress}%`;
    percent.textContent = `${progress}%`;

    if (progress >= 100) {
      clearInterval(timer);

      setTimeout(() => {
        loader.classList.add("hidden");
        document.body.classList.remove("loading");
      }, 250);
    }
  }, 90);
}

function initScrollUI() {
  const back = $("#backToTop");

  window.addEventListener(
    "scroll",
    () => {
      const max =
        document.documentElement.scrollHeight -
        innerHeight;

      $("#scrollBar").style.width =
        `${max > 0 ? (scrollY / max) * 100 : 0}%`;

      back.classList.toggle(
        "show",
        scrollY > 500
      );
    },
    { passive: true }
  );

  back.addEventListener(
    "click",
    () =>
      scrollTo({
        top: 0,
        behavior: "smooth"
      })
  );
}

function openWhatsApp() {
  const phone = "9647735514122";

  const msg =
    "مرحباً كرزات ما شاء الله، أريد الاستفسار عن المنتجات والأسعار.";

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
    "_blank",
    "noopener"
  );
}

function openCall() {
  location.href = "tel:07735514122";
}

async function initApp() {
  document.body.style.overflow = "hidden";

  startLoader();
  initSearch();
  initTabs();
  initScrollUI();

  $("#retry-btn").addEventListener(
    "click",
    loadProducts
  );

  try {
    const r = await fetch(
      "https://ipapi.co/json/",
      {
        cache: "no-store"
      }
    );

    const d = await r.json();

    if (
      d.country_code &&
      d.country_code !== "IQ"
    ) {
      document.body.innerHTML = `
        <main class="blocked-page">
          <div>
            <span>🇮🇶</span>
            <h1>كرزات ما شاء الله</h1>
            <p>
              الخدمة متوفرة حالياً داخل جمهورية العراق.
            </p>
          </div>
        </main>
      `;

      return;
    }

  } catch (_) {}

  await loadProducts();
}

window.addEventListener(
  "DOMContentLoaded",
  initApp
);
