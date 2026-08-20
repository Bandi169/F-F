"use strict";

const PRODUCTS_URL = "./products.json";
const WHATSAPP_PHONE = "2348102722611";
const CATEGORY_ORDER = [
  "All",
  "Clothing",
  "Shoes",
  "Bags",
  "Home Decor",
  "Kids",
  "Appliances",
];

const state = {
  products: [],
  activeCategory: "All",
  searchTerm: "",
};

const elements = {
  filters: document.querySelector("#category-filters"),
  search: document.querySelector("#product-search"),
  grid: document.querySelector("#product-grid"),
  resultCount: document.querySelector("#result-count"),
  emptyState: document.querySelector("#empty-state"),
  clearFilters: document.querySelector("#clear-filters"),
  cardTemplate: document.querySelector("#product-card-template"),
  currentYear: document.querySelector("#current-year"),
};

const priceFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function formatPrice(price) {
  return priceFormatter.format(price);
}

function createWhatsAppUrl(productName, price) {
  const message = `Hi! I'm interested in buying ${productName} for ${price}.`;
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

function getCategories() {
  return [
    ...new Set([
      ...CATEGORY_ORDER,
      ...state.products.map((product) => product.category),
    ]),
  ];
}

function renderCategoryFilters() {
  const fragment = document.createDocumentFragment();

  getCategories().forEach((category) => {
    const button = document.createElement("button");
    const isActive = category === state.activeCategory;

    button.className = `filter-button${isActive ? " is-active" : ""}`;
    button.type = "button";
    button.dataset.category = category;
    button.textContent = category;
    button.setAttribute("aria-pressed", String(isActive));
    fragment.append(button);
  });

  elements.filters.replaceChildren(fragment);
}

function getVisibleProducts() {
  const normalizedSearch = state.searchTerm.toLocaleLowerCase();

  return state.products.filter((product) => {
    const matchesCategory =
      state.activeCategory === "All" || product.category === state.activeCategory;
    const matchesSearch = product.title.toLocaleLowerCase().includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });
}

function createProductCard(product, index) {
  const card = elements.cardTemplate.content.firstElementChild.cloneNode(true);
  const imageWrap = card.querySelector(".product-card__image-wrap");
  const image = card.querySelector(".product-card__image");
  const category = card.querySelector(".product-card__category");
  const title = card.querySelector(".product-card__title");
  const meta = card.querySelector(".product-card__meta");
  const price = card.querySelector(".product-card__price");
  const orderLink = card.querySelector(".whatsapp-button");
  const formattedPrice = formatPrice(product.price);

  card.style.animationDelay = `${Math.min(index * 45, 270)}ms`;
  image.src = product.image;
  image.alt = product.alt || product.title;
  image.addEventListener(
    "error",
    () => {
      imageWrap.classList.add("image-unavailable");
      image.removeAttribute("src");
    },
    { once: true },
  );

  category.textContent = product.category;
  title.textContent = product.title;
  meta.textContent = [product.condition, product.size].filter(Boolean).join(" · ");
  price.textContent = formattedPrice;
  orderLink.href = createWhatsAppUrl(product.title, formattedPrice);
  orderLink.setAttribute(
    "aria-label",
    `Order ${product.title} for ${formattedPrice} on WhatsApp`,
  );

  return card;
}

function resetEmptyStateCopy() {
  elements.emptyState.querySelector("h3").textContent = "No finds match your search.";
  elements.emptyState.querySelector("p").textContent =
    "Try another keyword or browse all categories.";
  elements.clearFilters.hidden = false;
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();
  const fragment = document.createDocumentFragment();

  resetEmptyStateCopy();
  visibleProducts.forEach((product, index) => {
    fragment.append(createProductCard(product, index));
  });

  elements.grid.replaceChildren(fragment);
  elements.grid.setAttribute("aria-busy", "false");
  elements.emptyState.hidden = visibleProducts.length > 0;
  elements.resultCount.textContent = `${visibleProducts.length} ${
    visibleProducts.length === 1 ? "find" : "finds"
  }`;
}

function showLoadError() {
  elements.grid.replaceChildren();
  elements.grid.setAttribute("aria-busy", "false");
  elements.resultCount.textContent = "Catalog unavailable";
  elements.emptyState.querySelector("h3").textContent = "We couldn't load the collection.";
  elements.emptyState.querySelector("p").textContent =
    "Please refresh the page or try again in a moment.";
  elements.clearFilters.hidden = true;
  elements.emptyState.hidden = false;
}

function isValidProduct(product) {
  return (
    product &&
    typeof product.title === "string" &&
    typeof product.category === "string" &&
    Number.isFinite(product.price) &&
    typeof product.image === "string"
  );
}

async function loadProducts() {
  try {
    const response = await fetch(PRODUCTS_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Product request failed with status ${response.status}`);
    }

    const products = await response.json();

    if (!Array.isArray(products)) {
      throw new TypeError("products.json must contain an array.");
    }

    state.products = products.filter(isValidProduct);

    if (state.products.length === 0) {
      throw new Error("No valid products were found.");
    }

    renderCategoryFilters();
    renderProducts();
  } catch (error) {
    console.error("Unable to load the catalog:", error);
    showLoadError();
  }
}

elements.filters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-category]");

  if (!button || !elements.filters.contains(button)) {
    return;
  }

  state.activeCategory = button.dataset.category;
  renderCategoryFilters();
  renderProducts();
});

elements.search.addEventListener("input", (event) => {
  state.searchTerm = event.target.value.trim();
  renderProducts();
});

elements.search.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.search.value) {
    elements.search.value = "";
    state.searchTerm = "";
    renderProducts();
  }
});

elements.clearFilters.addEventListener("click", () => {
  state.activeCategory = "All";
  state.searchTerm = "";
  elements.search.value = "";
  renderCategoryFilters();
  renderProducts();
  elements.search.focus();
});

elements.currentYear.textContent = new Date().getFullYear();
loadProducts();
