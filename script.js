/*
  كرزات ما شاء الله
  المنتجات تُجلب مباشرة من API قاعدة البيانات.
*/

const API_BASE = window.KARZAT_API_BASE || "https://ofz.pythonanywhere.com/";
const NEW_PRODUCT_DAYS = 7;

const state = {
  products: [],
  category: "all",
  search: ""
};

const $ = (selector) => document.querySelector(selector);

const productsEl = $("#products");
const searchInput = $("#search");
const noResults = $("#no-results");
const emptyProducts = $("#empty-products");
const apiError = $("#api-error");
const loadingProducts = $("#loading-products");
const productCount = $("#product-count");
const activeFilter = $("#active-filter");

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function isNewProduct(createdAt) {
  if (!createdAt) return false;

  const created = new Date(createdAt).getTime();

  if (Number.isNaN(created)) return false;

  return (
    Date.now() - created >= 0 &&
    Date.now() - created <= NEW_PRODUCT_DAYS * 86400000
  );
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString("ar-IQ") + " د.ع";
}

function getFilteredProducts() {
  const term = state.search.trim().toLocaleLowerCase("ar");

  return state.products.filter((product) => {
    const categoryOK =
      state.category === "all" ||
      product.category === state.category;

    const text = `
      ${product.name || ""}
      ${product.desc || ""}
    `.toLocaleLowerCase("ar");

    return categoryOK && (!term || text.includes(term));
  });
}

function hideStates() {
  noResults.hidden = true;
  emptyProducts.hidden = true;
  apiError.hidden = true;
}

function renderProducts() {
  const products = getFilteredProducts();

  productsEl.innerHTML = "";

  loadingProducts.hidden = true;

  hideStates();

  productCount.textContent = `${products.length} منتج`;

  activeFilter.textContent =
    state.category === "all"
      ? "كل المنتجات"
      : state.category;

  // لا توجد منتجات نهائياً
  if (state.products.length === 0) {
    emptyProducts.hidden = false;
    productCount.textContent = "0 منتج";
    return;
  }

  // توجد منتجات ولكن البحث أو القسم لم يجد نتيجة
  if (products.length === 0) {
    noResults.hidden = false;
    return;
  }

  products.forEach((product, index) => {
    const card = document.createElement("article");

    card.className = "card";

    card.style.setProperty(
      "--delay",
      `${Math.min(index * 45, 350)}ms`
    );

    const badge = isNewProduct(product.created_at)
      ? `<span class="new-badge">جديد</span>`
      : "";

    card.innerHTML = `
      <div class="card-media">

        ${badge}

        <img
          src="${escapeHTML(product.img || "")}"
          alt="${escapeHTML(product.name || "")}"
          loading="lazy"
          onerror="this.style.opacity='0.15';"
        >

      </div>

      <div class="card-body">

        <span class="card-category">
          ${escapeHTML(product.category || "")}
        </span>

        <h3>
          ${escapeHTML(product.name || "")}
        </h3>

        <p>
          ${escapeHTML(
            product.desc || "منتج طازج ومختار بعناية"
          )}
        </p>

        <div class="card-footer">

          <strong>
            ${formatPrice(product.price)}
          </strong>

          <span class="price-label">
            السعر
          </span>

        </div>

      </div>
    `;

    productsEl.appendChild(card);
  });
}

async function loadProducts() {
  loadingProducts.hidden = false;

  productsEl.innerHTML = "";

  hideStates();

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

    console.error(
      "Products API error:",
      error
    );

    loadingProducts.hidden = true;

    productsEl.innerHTML = "";

    apiError.hidden = false;

    productCount.textContent = "—";
  }
}

function setCategory(category) {
  state.category = category;

  document.querySelectorAll(".tab").forEach((tab) => {

    tab.classList.toggle(
      "active",
      tab.dataset.cat === category
    );

  });

  renderProducts();
}

function initSearch() {

  searchInput.addEventListener(
    "input",
    () => {

      state.search =
        searchInput.value;

      $("#clear-search").classList.toggle(
        "visible",
        Boolean(state.search)
      );

      renderProducts();
    }
  );

  $("#clear-search").addEventListener(
    "click",
    () => {

      searchInput.value = "";

      state.search = "";

      $("#clear-search")
        .classList
        .remove("visible");

      renderProducts();

      searchInput.focus();
    }
  );
}

function initTabs() {

  document.querySelectorAll(".tab")
    .forEach((tab) => {

      tab.addEventListener(
        "click",
        () => {

          setCategory(
            tab.dataset.cat
          );

        }
      );

    });

  $("#reset-filters")
    .addEventListener(
      "click",
      () => {

        state.category = "all";

        state.search = "";

        searchInput.value = "";

        $("#clear-search")
          .classList
          .remove("visible");

        setCategory("all");

      }
    );
}

function startLoader() {

  const loader = $("#loader");

  const bar = $("#load-bar");

  const percent = $("#load-pc");

  let progress = 0;

  const timer = setInterval(() => {

    progress = Math.min(
      progress +
      Math.floor(Math.random() * 14) +
      7,
      100
    );

    bar.style.width =
      `${progress}%`;

    percent.textContent =
      `${progress}%`;

    if (progress >= 100) {

      clearInterval(timer);

      setTimeout(() => {

        loader.classList.add("hidden");

        document.body
          .classList
          .remove("loading");

        document.body.style.overflow = "";

      }, 250);
    }

  }, 90);
}

function initScrollUI() {

  const back =
    $("#backToTop");

  window.addEventListener(
    "scroll",
    () => {

      const max =
        document.documentElement
          .scrollHeight -
        innerHeight;

      $("#scrollBar").style.width =
        `${max > 0
          ? (scrollY / max) * 100
          : 0}%`;

      back.classList.toggle(
        "show",
        scrollY > 500
      );

    },
    {
      passive: true
    }
  );

  back.addEventListener(
    "click",
    () => {

      scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );
}

function openWhatsApp() {

  const phone =
    "9647735514122";

  const message =
    "مرحباً كرزات ما شاء الله، أريد الاستفسار عن المنتجات والأسعار.";

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank",
    "noopener"
  );
}

function openCall() {

  location.href =
    "tel:07735514122";
}

async function initApp() {

  startLoader();

  initSearch();

  initTabs();

  initScrollUI();

  $("#retry-btn")
    .addEventListener(
      "click",
      loadProducts
    );

  /*
    فحص الدولة اختياري.
    إذا ما تحتاجه، تقدر تحذف هذا الجزء بالكامل.
  */

  try {

    const response =
      await fetch(
        "https://ipapi.co/json/",
        {
          cache: "no-store"
        }
      );

    const data =
      await response.json();

    if (
      data.country_code &&
      data.country_code !== "IQ"
    ) {

      document.body.innerHTML = `
        <main class="blocked-page">

          <div>

            <span>🇮🇶</span>

            <h1>
              كرزات ما شاء الله
            </h1>

            <p>
              الخدمة متوفرة حالياً داخل جمهورية العراق.
            </p>

          </div>

        </main>
      `;

      return;
    }

  } catch (error) {

    console.warn(
      "Country check failed:",
      error
    );

  }

  await loadProducts();
}

window.addEventListener(
  "DOMContentLoaded",
  initApp
);
