(function () {
  const config = window.CHAMO_STORE_CONFIG || {};
  const storePathMatch = location.pathname.match(/^\/loja\/([^/]+)/);
  const storeSlug = config.slug || (storePathMatch ? decodeURIComponent(storePathMatch[1]) : "frango-galactico");
  const storeBasePath = storePathMatch ? `/loja/${encodeURIComponent(storeSlug)}` : "";
  const endpoint = config.endpoint || `/api/chamo/store?slug=${encodeURIComponent(storeSlug)}`;
  const assetBasePath = storeBasePath || "";

  const fallbackImages = {
    combo: `${assetBasePath}/assets/product-combo-DSwPja3F.jpg`,
    burger: `${assetBasePath}/assets/product-burger-DZ0zNbCz.jpg`,
    sobremesa: `${assetBasePath}/assets/product-milkshake-D5aKb9u6.jpg`,
    bebida: `${assetBasePath}/assets/product-milkshake-D5aKb9u6.jpg`,
    default: `${assetBasePath}/assets/product-balde-D5KbkVCK.jpg`,
  };

  const categoryIcons = [
    ["oferta", "&#128293;"],
    ["balde", "&#129699;"],
    ["combo", "&#128640;"],
    ["burger", "&#127828;"],
    ["hamb", "&#127828;"],
    ["frango", "&#127831;"],
    ["nugget", "&#127775;"],
    ["wing", "&#128293;"],
    ["acompan", "&#127839;"],
    ["bebida", "&#129380;"],
    ["sobremesa", "&#127846;"],
    ["kids", "&#129490;"],
    ["molho", "&#129387;"],
    ["veg", "&#129367;"],
  ];

  const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function price(value) {
    return money.format((Number(value) || 0) / 100);
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function iconFor(categoryName) {
    const normalized = slugify(categoryName);
    const found = categoryIcons.find(([key]) => normalized.includes(key));
    return found ? found[1] : "&#10024;";
  }

  function imageFor(item, store) {
    const raw = item?.imageUrl || item?.image || "";
    if (raw.startsWith("http") || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/assets/")) return `${assetBasePath}${raw}`;
    if (raw.startsWith("/") && store.assetsBaseUrl) return `${store.assetsBaseUrl}${raw}`;

    const label = slugify(`${item?.name || ""} ${item?.categoryName || ""}`);
    if (label.includes("combo")) return fallbackImages.combo;
    if (label.includes("burger") || label.includes("hamb")) return fallbackImages.burger;
    if (label.includes("milk") || label.includes("sobremesa") || label.includes("doce")) return fallbackImages.sobremesa;
    if (label.includes("bebida") || label.includes("refri")) return fallbackImages.bebida;
    return fallbackImages.default;
  }

  function themeFor(store) {
    return store.theme || store.restaurant?.theme || {};
  }

  function categoryName(item, categories) {
    return categories.find((category) => category.id === item.categoryId)?.name || "Cardapio";
  }

  function card(item, store) {
    const categories = store.categories || [];
    const category = categoryName(item, categories);
    const image = imageFor({ ...item, categoryName: category }, store);
    const theme = themeFor(store);
    const imageFit = theme.cardImageFit === "cover" ? "object-cover" : "object-contain mix-blend-multiply";
    const badges = item.isFeatured ? '<span class="chamo-ifood-badge">Mais pedido</span>' : "";
    const description = item.description || "Produto preparado pela cozinha do Frango Galactico.";

    return `
      <a href="${storeBasePath}/produto/${encodeURIComponent(item.id)}" data-chamo-product-card data-chamo-name="${escapeHtml(item.name)}" class="chamo-ifood-item group">
        <div class="chamo-ifood-info">
          <div class="chamo-ifood-meta">${escapeHtml(category)}</div>
          <h4>${escapeHtml(item.name)}</h4>
          <p>${escapeHtml(description)}</p>
          <div class="chamo-ifood-price-row">
            <strong>${price(item.price)}</strong>
            ${badges}
          </div>
        </div>
        <div class="chamo-ifood-image">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" loading="lazy" width="800" height="800" class="${imageFit}"/>
        </div>
      </a>`;
  }

  function section(title, items, store, options = {}) {
    if (!items.length) return "";

    const sectionSlug = options.slug ? slugify(options.slug) : "";
    const sectionAttrs = sectionSlug ? ` id="categoria-${escapeHtml(sectionSlug)}" data-chamo-category-section="${escapeHtml(sectionSlug)}"` : "";
    const hiddenStyle = options.hidden ? ' style="display:none"' : "";

    return `
      <section class="container-app pt-10" data-chamo-dynamic-section${sectionAttrs}${hiddenStyle}>
        <h3 class="text-2xl mb-4">${escapeHtml(title)}</h3>
        <div class="chamo-ifood-list">
          ${items.map((item) => card(item, store)).join("")}
        </div>
      </section>`;
  }

  function injectStoreStyles() {
    if (document.getElementById("chamo-store-dynamic-styles")) return;

    const style = document.createElement("style");
    style.id = "chamo-store-dynamic-styles";
    style.textContent = `
      .chamo-category-icon-nav {
        background: rgba(255, 255, 255, 0.96) !important;
        border-top: 1px solid rgba(10, 17, 40, 0.06) !important;
        border-bottom: 1px solid rgba(10, 17, 40, 0.08) !important;
        box-shadow: 0 18px 50px -44px rgba(10, 17, 40, 0.8);
      }
      .chamo-category-icon-nav .container-app {
        padding-top: 1rem !important;
        padding-bottom: 1rem !important;
      }
      .chamo-category-icon-nav .chamo-category-list {
        align-items: center;
        gap: 1rem;
      }
      .chamo-category-icon-nav .chamo-category-link {
        width: 5rem;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.45rem;
        text-align: center;
        color: rgba(10, 17, 40, 0.72);
      }
      .chamo-category-icon-nav .chamo-category-icon {
        display: grid;
        height: 3.5rem;
        width: 3.5rem;
        place-items: center;
        border-radius: 1rem;
        background: #f7f5f1;
        color: #0a1128;
        font-size: 1.55rem;
        box-shadow: 0 12px 26px -22px rgba(10, 17, 40, 0.8);
        transition: background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
      }
      .chamo-category-icon-nav .chamo-category-label {
        font-size: 0.72rem;
        font-weight: 800;
        line-height: 1.1;
        transition: color 160ms ease;
      }
      .chamo-category-icon-nav .chamo-category-link:hover .chamo-category-icon,
      .chamo-category-icon-nav .chamo-category-link.is-active .chamo-category-icon {
        background: #ffc72c;
        color: #0a1128;
        transform: translateY(-2px);
        box-shadow: 0 18px 28px -22px rgba(10, 17, 40, 0.9);
      }
      .chamo-category-icon-nav .chamo-category-link:hover .chamo-category-label,
      .chamo-category-icon-nav .chamo-category-link.is-active .chamo-category-label {
        color: #0a1128;
      }
      body.chamo-store-ready [data-chamo-category-menu-top="true"] {
        position: sticky;
        top: 48px;
        z-index: 35;
        margin: 0 !important;
      }
      .chamo-ifood-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.85rem;
      }
      .chamo-ifood-item {
        min-height: 10.75rem;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 8.75rem;
        gap: 1rem;
        align-items: stretch;
        border: 1px solid rgba(10, 17, 40, 0.08);
        border-radius: 1rem;
        background: #fff;
        padding: 1rem;
        box-shadow: 0 14px 35px -32px rgba(10, 17, 40, 0.55);
        transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
      }
      .chamo-ifood-item:hover {
        border-color: rgba(255, 199, 44, 0.75);
        box-shadow: 0 22px 42px -34px rgba(10, 17, 40, 0.75);
        transform: translateY(-1px);
      }
      .chamo-ifood-info {
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .chamo-ifood-meta {
        color: rgba(10, 17, 40, 0.48);
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .chamo-ifood-info h4 {
        margin-top: 0.25rem;
        color: #0a1128;
        font-size: 1rem;
        font-weight: 900;
        line-height: 1.15;
      }
      .chamo-ifood-info p {
        margin-top: 0.45rem;
        color: rgba(10, 17, 40, 0.62);
        font-size: 0.84rem;
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .chamo-ifood-price-row {
        margin-top: auto;
        padding-top: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .chamo-ifood-price-row strong {
        color: #0a1128;
        font-size: 1.05rem;
        font-weight: 600;
      }
      .chamo-ifood-badge {
        border-radius: 999px;
        background: #0a1128;
        color: #fff;
        padding: 0.24rem 0.5rem;
        font-size: 0.63rem;
        font-weight: 900;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .chamo-ifood-image {
        position: relative;
        min-height: 8.75rem;
        border-radius: 0.9rem;
        background: #f7f5f1;
        overflow: hidden;
      }
      .chamo-ifood-image img {
        height: 100%;
        width: 100%;
        object-position: center;
        transition: transform 180ms ease;
      }
      .chamo-ifood-item:hover .chamo-ifood-image img {
        transform: scale(1.035);
      }
      @media (max-width: 900px) {
        .chamo-ifood-list {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 520px) {
        .chamo-ifood-item {
          min-height: 8.5rem;
          grid-template-columns: minmax(0, 1fr) 6.5rem;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.85rem;
        }
        .chamo-ifood-image {
          min-height: 6.5rem;
          border-radius: 0.75rem;
        }
        .chamo-ifood-meta {
          font-size: 0.6rem;
        }
        .chamo-ifood-info h4 {
          font-size: 0.92rem;
        }
        .chamo-ifood-info p {
          font-size: 0.76rem;
          -webkit-line-clamp: 2;
        }
        .chamo-ifood-price-row strong {
          font-size: 0.95rem;
        }
        .chamo-ifood-badge {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function renderCategories(store) {
    injectStoreStyles();
    const nav = document.querySelector(".border-b.border-border.bg-surface");
    const wrapper = document.querySelector(".border-b.border-border.bg-surface .flex.gap-4");
    if (!wrapper) return;

    if (nav) {
      nav.classList.remove("chamo-category-text-nav");
      nav.classList.add("chamo-category-icon-nav");
    }

    const container = wrapper.parentElement;
    if (container) {
      container.className = "container-app overflow-x-auto";
    }
    wrapper.className = "flex min-w-max chamo-category-list";
    wrapper.innerHTML = (store.categories || []).map((category) => `
      <a href="#categoria-${escapeHtml(slugify(category.name))}" data-chamo-category-link="${escapeHtml(slugify(category.name))}" class="chamo-category-link${slugify(category.name).includes("combo") ? " is-active" : ""}">
        <span class="chamo-category-icon">${iconFor(category.name)}</span>
        <span class="chamo-category-label">${escapeHtml(category.name)}</span>
      </a>`).join("");
  }

  function bindCategoryNavigation() {
    document.querySelectorAll("[data-chamo-category-link]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const slug = link.getAttribute("data-chamo-category-link");
        const sectionElement = document.querySelector(`[data-chamo-category-section="${slug}"]`);
        if (!sectionElement) return;

        event.preventDefault();
        document.querySelectorAll("[data-chamo-category-link]").forEach((item) => item.classList.remove("is-active"));
        link.classList.add("is-active");
        document.querySelectorAll("[data-chamo-category-section]").forEach((item) => {
          item.style.display = item === sectionElement ? "" : "none";
        });
        sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function findSectionContaining(pattern) {
    return Array.from(document.querySelectorAll("section")).find((sectionElement) => {
      return pattern.test(sectionElement.textContent || "");
    });
  }

  function hideStaticProductSections() {
    document.querySelectorAll("section").forEach((sectionElement) => {
      if (sectionElement.querySelector('a[href^="/produto/"], a[href^="produto/"], a[href*="/produto/"]')) {
        sectionElement.setAttribute("data-chamo-static-hidden", "true");
      }
    });
  }

  function hideStatsSection() {
    const statsSection = Array.from(document.querySelectorAll("section")).find((sectionElement) => {
      const text = (sectionElement.textContent || "").toLowerCase();
      return text.includes("pedidos entregues") && text.includes("entrega m") && text.includes("avalia");
    });

    if (statsSection) {
      statsSection.setAttribute("data-chamo-static-hidden", "true");
    }
  }

  function moveCategoryNavToTop() {
    const header = document.querySelector("header");
    const categoryNav = document.querySelector(".border-b.border-border.bg-surface");
    if (!header || !categoryNav) return categoryNav;

    categoryNav.setAttribute("data-chamo-category-menu-top", "true");
    header.insertAdjacentElement("afterend", categoryNav);
    return categoryNav;
  }

  function renderMenu(store) {
    const categoryNav = moveCategoryNavToTop();
    const heroSection = document.querySelector("section.relative.overflow-hidden");
    const signatureSection = findSectionContaining(/nossas receitas assinatura/i);
    const missionSection = findSectionContaining(/miss[aã]o da semana/i);
    const marker = heroSection || missionSection || categoryNav || document.querySelector("header");
    if (!marker) return;

    document.querySelectorAll("[data-chamo-dynamic-section], [data-chamo-dynamic-group]").forEach((element) => element.remove());
    hideStatsSection();
    hideStaticProductSections();

    const items = store.items || [];
    const featuredItems = store.featuredItems || [];
    const promoItems = (featuredItems.length ? featuredItems : items).slice(0, 4);
    const promoIds = new Set(promoItems.map((item) => item.id));
    let mostRequested = (featuredItems.length ? featuredItems : items).filter((item) => !promoIds.has(item.id)).slice(0, 7);
    if (!mostRequested.length) mostRequested = items.slice(0, 7);

    const categorySections = (store.sections || [])
      .filter((category) => Array.isArray(category.items) && category.items.length)
      .map((category) => {
        const categorySlug = slugify(category.name);
        const showInitially = categorySlug.includes("combo");
        return section(category.name, category.items, store, {
          slug: category.name,
          hidden: !showInitially,
        });
      })
      .join("");

    const categoryMarker = categoryNav || marker;

    const highlightsHtml = `
      <div data-chamo-dynamic-group="highlights">
        ${section("Promo\u00e7\u00f5es da Semana", promoItems, store)}
        ${section("Mais Pedidos", mostRequested, store)}
      </div>`;

    const contentMarker = signatureSection || missionSection || categoryMarker;
    contentMarker.insertAdjacentHTML("afterend", highlightsHtml);

    const highlightsGroup = document.querySelector('[data-chamo-dynamic-group="highlights"]');
    if (categorySections) {
      (highlightsGroup || categoryMarker).insertAdjacentHTML("afterend", `<div data-chamo-dynamic-group="categories">${categorySections}</div>`);
    }
    bindCategoryNavigation();
  }

  function renderProductPage(store) {
    const match = location.pathname.match(/^\/(?:loja\/[^/]+\/)?produto\/([^/]+)/);
    if (!match) return false;

    const requestedId = decodeURIComponent(match[1]);
    const items = store.items || [];
    const item = items.find((candidate) => String(candidate.id) === requestedId) || items[0];
    const main = document.querySelector(".container-app.py-6");

    if (!item || !main) return true;

    const category = categoryName(item, store.categories || []);
    const image = imageFor({ ...item, categoryName: category }, store);
    const theme = themeFor(store);
    const imageFit = theme.cardImageFit === "cover" ? "object-cover" : "object-contain mix-blend-multiply";
    const related = items.filter((candidate) => candidate.id !== item.id).slice(0, 6);

    document.title = `${item.name} - ${store.restaurant.name}`;
    main.innerHTML = `
      <nav class="text-xs text-muted-foreground flex gap-1.5">
        <a href="/" class="hover:text-foreground">Pagina Inicial</a><span>â€º</span>
        <a href="${storeBasePath}/catalogo" class="hover:text-foreground">Catalogo</a><span>â€º</span>
        <span class="text-foreground">${escapeHtml(item.name)}</span>
      </nav>
      <a href="${storeBasePath}/catalogo" class="mt-4 inline-flex items-center gap-1.5 text-primary text-sm font-semibold">â† VOLTAR</a>
      <div class="mt-6 grid lg:grid-cols-2 gap-8">
        <div>
          <div class="relative rounded-3xl bg-surface p-6 shadow-[var(--shadow-card)]">
            ${item.isFeatured ? '<span class="absolute top-6 left-6 badge-chip bg-primary/10 text-primary border border-primary/30">Top</span>' : ""}
            <div class="aspect-square grid place-items-center">
              <img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" width="800" height="800" class="max-h-full ${imageFit}"/>
            </div>
          </div>
        </div>
        <div>
          <div class="text-xs uppercase tracking-widest text-primary font-bold">${escapeHtml(category)}</div>
          <h1 class="mt-1 font-display text-4xl md:text-5xl">${escapeHtml(item.name)}</h1>
          <div class="mt-2 text-sm text-muted-foreground">${escapeHtml(store.restaurant.name)}</div>
          <div class="mt-6 flex items-baseline gap-3">
            <span class="font-display text-5xl text-primary">${price(item.price)}</span>
          </div>
          <div class="mt-8 rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)]">
            <button data-chamo-add-cart="${escapeHtml(item.id)}" class="mt-1 w-full rounded-full bg-primary text-primary-foreground font-semibold py-4 flex items-center justify-between px-6 hover:brightness-110 transition">
              <span>${escapeHtml(theme.productCtaLabel || "ADICIONAR")}</span><span>${price(item.price)}</span>
            </button>
          </div>
          <div class="mt-4 grid grid-cols-3 gap-3">
            <div class="rounded-2xl bg-surface p-3 text-center shadow-[var(--shadow-card)]"><div class="mt-1.5 text-xs font-semibold">Entrega em ${escapeHtml(store.restaurant.averagePrepTime || 30)}min</div></div>
            <div class="rounded-2xl bg-surface p-3 text-center shadow-[var(--shadow-card)]"><div class="mt-1.5 text-xs font-semibold">Taxa ${price(store.restaurant.deliveryFee || 0)}</div></div>
            <div class="rounded-2xl bg-surface p-3 text-center shadow-[var(--shadow-card)]"><div class="mt-1.5 text-xs font-semibold">Compra segura</div></div>
          </div>
          <div class="mt-8">
            <h3 class="text-xl">Sobre o produto</h3>
            <p class="mt-2 text-sm text-muted-foreground">${escapeHtml(item.description || "Item cadastrado no cardapio do Chamo.")}</p>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-surface p-3 shadow-[var(--shadow-card)]"><div class="text-[10px] uppercase tracking-widest text-muted-foreground">Loja</div><div class="font-semibold text-sm mt-0.5">${escapeHtml(store.restaurant.name)}</div></div>
              <div class="rounded-xl bg-surface p-3 shadow-[var(--shadow-card)]"><div class="text-[10px] uppercase tracking-widest text-muted-foreground">Categoria</div><div class="font-semibold text-sm mt-0.5">${escapeHtml(category)}</div></div>
            </div>
          </div>
        </div>
      </div>
      ${related.length ? `<section class="mt-16"><h3 class="text-2xl mb-4">Voce tambem vai curtir</h3><div class="chamo-ifood-list chamo-related-list">${related.map((relatedItem) => card(relatedItem, store)).join("")}</div></section>` : ""}`;

    return true;
  }

  function updateBrand(store) {
    const restaurant = store.restaurant;
    if (!restaurant) return;
    const theme = themeFor(store);

    document.title = document.title.replace(/Frango GalÃ¡ctico|Frango Galactico/g, restaurant.name);
    document.documentElement.style.setProperty("--primary", theme.accentColor || restaurant.primaryColor || "#ffc72c");
    if (theme.darkColor) document.documentElement.style.setProperty("--chamo-dark", theme.darkColor);
    if (theme.surfaceColor) document.documentElement.style.setProperty("--chamo-surface", theme.surfaceColor);

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor && (theme.accentColor || restaurant.primaryColor)) themeColor.setAttribute("content", theme.accentColor || restaurant.primaryColor);

    if (restaurant.logoUrl) {
      document.querySelectorAll('img[src*="logo-frango"]').forEach((image) => {
        image.setAttribute("src", imageFor({ imageUrl: restaurant.logoUrl }, store));
        image.setAttribute("alt", restaurant.name);
      });
    }

    document.querySelectorAll(".font-display").forEach((element) => {
      if (/FRANGO|GALÃCTICO|GALACTICO/i.test(element.textContent || "")) {
        element.textContent = restaurant.name.toUpperCase();
      }
    });

    document.querySelectorAll("footer p").forEach((paragraph, index) => {
      if (index === 0 && restaurant.description) paragraph.textContent = restaurant.description;
    });

    document.querySelectorAll('a[href="/catalogo"]').forEach((link) => {
      link.setAttribute("href", `${storeBasePath}/catalogo`);
    });

    document.querySelectorAll('a[href="/"]').forEach((link) => {
      if (storeBasePath) link.setAttribute("href", storeBasePath);
    });
  }

  function attachSearch() {
    const input = document.querySelector('input[placeholder*="Busque"]');
    if (!input) return;

    input.addEventListener("input", () => {
      const query = slugify(input.value);
      document.querySelectorAll("[data-chamo-product-card]").forEach((cardElement) => {
        const name = slugify(cardElement.getAttribute("data-chamo-name"));
        cardElement.style.display = !query || name.includes(query) ? "" : "none";
      });
    });
  }

  function attachCart(store) {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-chamo-add-cart]");
      if (!button) return;

      const id = Number(button.getAttribute("data-chamo-add-cart"));
      const item = (store.items || []).find((candidate) => candidate.id === id);
      if (!item) return;

      const current = JSON.parse(localStorage.getItem("chamo_frango_cart") || "[]");
      current.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
      localStorage.setItem("chamo_frango_cart", JSON.stringify(current));

      document.querySelectorAll(".absolute.-top-1.-right-1").forEach((badge) => {
        badge.textContent = String(current.length);
      });
    });
  }

  function boot(store) {
    if (!store || !store.restaurant) return;

    document.body.classList.add("chamo-store-ready");
    updateBrand(store);
    renderCategories(store);

    if (!renderProductPage(store)) {
      renderMenu(store);
    }

    attachSearch();
    attachCart(store);
  }

  const style = document.createElement("style");
  style.textContent = 'body.chamo-store-ready [data-chamo-static-hidden="true"]{display:none!important}';
  document.head.appendChild(style);

  fetch(endpoint)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(boot)
    .catch((error) => {
      console.warn("[ChamoStore] usando vitrine estatica:", error);
    });
})();
