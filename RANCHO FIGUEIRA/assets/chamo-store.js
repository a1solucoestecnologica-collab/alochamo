(function () {
  const config = window.CHAMO_STORE_CONFIG || {};
  const storePathMatch = location.pathname.match(/^\/loja\/([^/]+)/);
  const storeSlug = config.slug || (storePathMatch ? decodeURIComponent(storePathMatch[1]) : "rancho-figueira");
  const storeBasePath = storePathMatch ? `/loja/${encodeURIComponent(storeSlug)}` : "";
  const endpoint = config.endpoint || `/api/chamo/store?slug=${encodeURIComponent(storeSlug)}`;
  const assetBasePath = storeBasePath || "";

  const fallbackImages = {
    carne: `${assetBasePath}/assets/product-picanha-DGhvMPMe.jpg`,
    frango: `${assetBasePath}/assets/product-frango-_nsaDnXr.jpg`,
    peixe: `${assetBasePath}/assets/product-tilapia-Bjfr4k0U.jpg`,
    porcao: `${assetBasePath}/assets/product-bolinhos-BozvSXZ8.jpg`,
    acompanhamento: `${assetBasePath}/assets/product-mandioca-CHuRj9Ce.jpg`,
    default: `${assetBasePath}/assets/product-picanha-DGhvMPMe.jpg`,
  };

  const categoryIcons = [
    ["picanha", "🥩"],
    ["alcatra", "🥩"],
    ["carne", "🥩"],
    ["frango", "🍗"],
    ["tilapia", "🐟"],
    ["peixe", "🐟"],
    ["porcao", "🍽️"],
    ["bolinho", "🥟"],
    ["batata", "🍟"],
    ["mandioca", "🍠"],
    ["arroz", "🍚"],
    ["bebida", "🥤"],
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
    return found ? found[1] : "🍽️";
  }

  function imageFor(item, store) {
    const raw = item?.imageUrl || item?.image || "";
    if (raw.startsWith("http") || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/assets/")) return `${assetBasePath}${raw}`;
    if (raw.startsWith("/") && store.assetsBaseUrl) return `${store.assetsBaseUrl}${raw}`;

    const label = slugify(`${item?.name || ""} ${item?.categoryName || ""}`);
    if (label.includes("frango")) return fallbackImages.frango;
    if (label.includes("tilapia") || label.includes("peixe") || label.includes("ceviche")) return fallbackImages.peixe;
    if (label.includes("batata") || label.includes("mandioca") || label.includes("polenta") || label.includes("arroz")) return fallbackImages.acompanhamento;
    if (label.includes("bolinho") || label.includes("porcao") || label.includes("petisco")) return fallbackImages.porcao;
    if (label.includes("alcatra") || label.includes("picanha") || label.includes("carne") || label.includes("porco")) return fallbackImages.carne;
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
    const imageFit = theme.cardImageFit === "contain" ? "contain" : "cover";
    const badges = item.isFeatured ? '<span class="badge-chip bg-primary text-primary-foreground">Destaque</span>' : "";

    return `
      <a href="${storeBasePath}/produto/${encodeURIComponent(item.id)}" data-chamo-product-card data-chamo-name="${escapeHtml(item.name)}" class="chamo-product-card group">
        <div class="chamo-product-badges">${badges}</div>
        <div class="chamo-product-image">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" loading="lazy" width="480" height="480" style="object-fit:${imageFit}"/>
        </div>
        <div class="chamo-product-info">
          <div class="chamo-product-category">${escapeHtml(category)}</div>
          <div class="chamo-product-name">${escapeHtml(item.name)}</div>
        </div>
        <div class="chamo-product-price-row">
          <span class="chamo-product-price">${price(item.price)}</span>
        </div>
      </a>`;
  }

  function section(title, items, store, options = {}) {
    if (!items.length) return "";

    const sectionSlug = options.slug ? slugify(options.slug) : slugify(title);
    const hiddenStyle = options.hidden ? ' style="display:none"' : "";

    return `
      <section class="chamo-menu-section" data-chamo-dynamic-section id="categoria-${escapeHtml(sectionSlug)}" data-chamo-category-section="${escapeHtml(sectionSlug)}"${hiddenStyle}>
        <h3>${escapeHtml(title)}</h3>
        <div class="chamo-menu-grid">
          ${items.map((item) => card(item, store)).join("")}
        </div>
      </section>`;
  }

  function defaultCategorySlug(store) {
    const sections = (store.sections || []).filter((category) => Array.isArray(category.items) && category.items.length);
    const preferred = sections.find((category) => {
      const slug = slugify(category.name);
      return slug.includes("combo") || slug.includes("executivo") || slug.includes("prato");
    });
    return slugify((preferred || sections[0] || {}).name || "");
  }

  function renderCategories(store) {
    const wrapper = document.querySelector(".border-b.border-border.bg-surface .flex.gap-4");
    if (!wrapper) return;

    const initialSlug = defaultCategorySlug(store);

    wrapper.innerHTML = (store.categories || []).map((category) => `
      <a href="#categoria-${escapeHtml(slugify(category.name))}" data-chamo-category-link="${escapeHtml(slugify(category.name))}" class="group flex flex-col items-center gap-1.5 w-20 shrink-0${slugify(category.name) === initialSlug ? " is-active" : ""}">
        <div class="grid h-14 w-14 place-items-center rounded-2xl bg-background text-2xl shadow-[var(--shadow-card)] group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-glow)] transition">${iconFor(category.name)}</div>
        <span class="text-xs font-medium text-foreground/80 text-center leading-tight">${escapeHtml(category.name)}</span>
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

  function staticProductSections() {
    return Array.from(document.querySelectorAll("section")).filter((sectionElement) => (
      !sectionElement.closest("[data-chamo-specialties-top]") &&
      !sectionElement.matches("[data-chamo-promo-banner]") &&
      sectionElement.querySelector('a[href^="/produto/"]')
    ));
  }

  function hideStaticProductSections() {
    document.querySelectorAll("section").forEach((sectionElement) => {
      if (sectionElement.closest("[data-chamo-specialties-top]")) return;
      if (sectionElement.matches("[data-chamo-promo-banner]")) return;

      if (sectionElement.querySelector('a[href^="/produto/"], a[href^="produto/"], a[href*="/produto/"]')) {
        sectionElement.setAttribute("data-chamo-static-hidden", "true");
      }
    });
  }

  function findSpecialtiesSection() {
    const existing = document.querySelector("[data-chamo-specialties-top]");
    if (existing) return existing;

    const title = Array.from(document.querySelectorAll("h1,h2,h3")).find((element) => {
      return /especialidades da casa/i.test(element.textContent || "");
    });
    if (!title) return null;

    const list = title.nextElementSibling;
    const wrapper = document.createElement("section");
    wrapper.className = "chamo-specialties-strip";
    title.insertAdjacentElement("beforebegin", wrapper);
    wrapper.appendChild(title);

    if (list) {
      wrapper.appendChild(list);
    }

    return wrapper;
  }

  function moveSpecialtiesToTop() {
    const specialties = findSpecialtiesSection();
    const anchor = document.querySelector("[data-chamo-promo-banner]") || document.querySelector("[data-chamo-category-menu-top]") || document.querySelector("header");
    if (!specialties || !anchor) return;

    specialties.setAttribute("data-chamo-specialties-top", "true");
    anchor.insertAdjacentElement("afterend", specialties);
  }

  function findCategoryMenu() {
    const existing = document.querySelector("[data-chamo-category-menu-top]");
    if (existing) return existing;

    return document.querySelector("div.sticky.top-16");
  }

  function moveCategoryMenuToTop() {
    const menu = findCategoryMenu();
    const header = document.querySelector("header");
    if (!menu || !header) return;

    menu.setAttribute("data-chamo-category-menu-top", "true");
    header.insertAdjacentElement("afterend", menu);
  }

  function createPromoBanner(store, theme) {
    const existing = document.querySelector("[data-chamo-promo-banner]");
    if (existing) return existing;

    const promoSection = (store.sections || []).find((sectionItem) => {
      const slug = slugify(sectionItem.name);
      return slug.includes("destaque") || slug.includes("promoc") || slug.includes("combo") || slug.includes("carne");
    });
    const href = promoSection ? `#categoria-${slugify(promoSection.name)}` : "#";
    const accent = theme.accentColor || theme.primaryColor || "#c2410c";
    const title = theme.promoTitle || "ATE 30% OFF NOS PRATOS DO RANCHO";
    const subtitle = theme.promoSubtitle || "Preco especial nos pedidos mais queridos da casa. So hoje.";

    const banner = document.createElement("section");
    banner.setAttribute("data-chamo-promo-banner", "true");
    banner.innerHTML = `
      <div class="chamo-promo-card" style="--chamo-promo-accent:${escapeHtml(accent)}">
        <div class="chamo-promo-content">
          <span>Missao da semana</span>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
          <a href="${escapeHtml(href)}">Aproveitar <span aria-hidden="true">-&gt;</span></a>
        </div>
        <i class="chamo-promo-plus chamo-promo-plus-vertical" aria-hidden="true"></i>
        <i class="chamo-promo-plus chamo-promo-plus-horizontal" aria-hidden="true"></i>
      </div>`;

    return banner;
  }

  function movePromoBannerBelowCategory(store, theme) {
    const banner = createPromoBanner(store, theme);
    const anchor = document.querySelector("[data-chamo-category-menu-top]") || document.querySelector("header");
    if (!banner || !anchor) return;

    anchor.insertAdjacentElement("afterend", banner);
  }

  function renderMenu(store) {
    const theme = themeFor(store);
    moveCategoryMenuToTop();
    movePromoBannerBelowCategory(store, theme);
    moveSpecialtiesToTop();

    const staticSections = staticProductSections();
    const specialtiesTop = document.querySelector("[data-chamo-specialties-top]");
    const categoryMenuTop = document.querySelector("[data-chamo-category-menu-top]");
    const promoBanner = document.querySelector("[data-chamo-promo-banner]");
    const marker = staticSections[0] || specialtiesTop || promoBanner || categoryMenuTop || document.querySelector(".border-b.border-border.bg-surface") || document.querySelector("header");
    if (!marker) return;

    document.querySelectorAll("[data-chamo-dynamic-section]").forEach((element) => element.remove());
    hideStaticProductSections();

    const featured = (store.featuredItems || []).length ? store.featuredItems : (store.items || []).slice(0, 8);
    const initialSlug = defaultCategorySlug(store);
    const categorySections = (store.sections || [])
      .filter((category) => Array.isArray(category.items) && category.items.length)
      .map((category) => section(category.name, category.items, store, {
        slug: category.name,
        hidden: slugify(category.name) !== initialSlug,
      }))
      .join("");

    const html = [
      section(theme.featuredTitle || "Destaques do Rancho", featured, store),
      categorySections,
    ].join("");

    marker.insertAdjacentHTML(staticSections.length ? "beforebegin" : "afterend", html);
    bindCategoryNavigation();
  }

  function renderProductPage(store) {
    const match = location.pathname.match(/^\/(?:loja\/[^/]+\/)?produto\/([^/]+)/);
    if (!match) return false;

    const requestedId = decodeURIComponent(match[1]);
    const items = store.items || [];
    const item = items.find((candidate) => String(candidate.id) === requestedId) || items[0];
    const main = document.querySelector(".container-app.py-6") || document.querySelector("main");

    if (!item || !main) return true;

    const category = categoryName(item, store.categories || []);
    const image = imageFor({ ...item, categoryName: category }, store);
    const theme = themeFor(store);
    const imageFit = theme.cardImageFit === "contain" ? "object-contain" : "object-cover";
    const related = items.filter((candidate) => candidate.id !== item.id).slice(0, 6);

    document.title = `${item.name} - ${store.restaurant.name}`;
    main.innerHTML = `
      <nav class="text-xs text-muted-foreground flex gap-1.5">
        <a href="${storeBasePath || "/"}" class="hover:text-foreground">Pagina Inicial</a><span>›</span>
        <a href="${storeBasePath}/catalogo" class="hover:text-foreground">Cardapio</a><span>›</span>
        <span class="text-foreground">${escapeHtml(item.name)}</span>
      </nav>
      <a href="${storeBasePath}/catalogo" class="mt-4 inline-flex items-center gap-1.5 text-primary text-sm font-semibold">← VOLTAR</a>
      <div class="mt-6 grid lg:grid-cols-2 gap-8">
        <div>
          <div class="relative rounded-3xl bg-surface p-6 shadow-[var(--shadow-card)]">
            ${item.isFeatured ? '<span class="absolute top-6 left-6 badge-chip bg-primary text-primary-foreground">Destaque</span>' : ""}
            <div class="aspect-square grid place-items-center overflow-hidden rounded-2xl">
              <img src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" width="800" height="800" class="h-full w-full ${imageFit}"/>
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
          <div class="mt-8">
            <h3 class="text-xl">Sobre o produto</h3>
            <p class="mt-2 text-sm text-muted-foreground">${escapeHtml(item.description || "Item cadastrado no cardapio do Chamo.")}</p>
          </div>
        </div>
      </div>
      ${related.length ? `<section class="chamo-menu-section"><h3>Voce tambem vai curtir</h3><div class="chamo-menu-grid">${related.map((relatedItem) => card(relatedItem, store)).join("")}</div></section>` : ""}`;

    return true;
  }

  function updateBrand(store) {
    const restaurant = store.restaurant;
    if (!restaurant) return;
    const theme = themeFor(store);

    document.title = document.title.replace(/Rancho Figueira|elivery/g, restaurant.name);
    document.documentElement.style.setProperty("--primary", theme.accentColor || restaurant.primaryColor || "#7c2d12");
    if (theme.darkColor) document.documentElement.style.setProperty("--chamo-dark", theme.darkColor);
    if (theme.surfaceColor) document.documentElement.style.setProperty("--chamo-surface", theme.surfaceColor);

    if (restaurant.logoUrl) {
      document.querySelectorAll('img[src*="rancho-logo"], img[src*="logo"]').forEach((image) => {
        image.setAttribute("src", imageFor({ imageUrl: restaurant.logoUrl }, store));
        image.setAttribute("alt", restaurant.name);
      });
    }

    document.querySelectorAll(".font-display").forEach((element) => {
      if (/RANCHO|FIGUEIRA/i.test(element.textContent || "")) {
        element.textContent = restaurant.name.toUpperCase();
      }
    });

    document.querySelectorAll('a[href="/catalogo"]').forEach((link) => {
      link.setAttribute("href", `${storeBasePath}/catalogo`);
    });

    document.querySelectorAll('a[href="/"]').forEach((link) => {
      if (storeBasePath) link.setAttribute("href", storeBasePath);
    });
  }

  function attachSearch() {
    const input = document.querySelector('input[placeholder*="Busque"], input[placeholder*="busque"], input[placeholder*="Buscar"]');
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

      const current = JSON.parse(localStorage.getItem("chamo_rancho_cart") || "[]");
      current.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
      localStorage.setItem("chamo_rancho_cart", JSON.stringify(current));

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
  style.textContent = `
    body.chamo-store-ready [data-chamo-static-hidden="true"]{display:none!important}
    body.chamo-store-ready [data-chamo-promo-banner="true"]{width:100%!important;padding:28px max(16px,calc((100vw - 1120px)/2)) 20px!important;margin:0!important;background:hsl(var(--background))}
    body.chamo-store-ready .chamo-promo-card{position:relative;min-height:250px;overflow:hidden;border-radius:30px;padding:38px 44px;color:#fff;background:linear-gradient(125deg,#7c2d12,var(--chamo-promo-accent,#c2410c) 48%,#f97316);box-shadow:0 20px 50px -36px rgba(0,0,0,.45)}
    body.chamo-store-ready .chamo-promo-content{position:relative;z-index:1;max-width:590px}
    body.chamo-store-ready .chamo-promo-content span{display:inline-flex;border-radius:999px;background:rgba(255,255,255,.2);padding:8px 14px;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
    body.chamo-store-ready .chamo-promo-content h2{margin:18px 0 0;font-family:var(--font-display,inherit);font-size:clamp(2.25rem,5vw,4.1rem);line-height:.92;text-transform:uppercase;color:#fff}
    body.chamo-store-ready .chamo-promo-content p{max-width:430px;margin:18px 0 0;font-size:16px;font-weight:700;line-height:1.55;color:rgba(255,255,255,.9)}
    body.chamo-store-ready .chamo-promo-content a{display:inline-flex;align-items:center;gap:8px;margin-top:26px;border-radius:999px;background:#071a10;color:#fff;padding:13px 24px;font-weight:900;text-decoration:none}
    body.chamo-store-ready .chamo-promo-plus{position:absolute;display:block;border-radius:999px;background:rgba(255,255,255,.22)}
    body.chamo-store-ready .chamo-promo-plus-vertical{right:72px;top:50%;width:32px;height:150px;transform:translateY(-50%)}
    body.chamo-store-ready .chamo-promo-plus-horizontal{right:26px;top:50%;width:180px;height:28px;transform:translateY(-50%)}
    body.chamo-store-ready [data-chamo-specialties-top="true"]{width:100%!important;padding:24px max(16px,calc((100vw - 1120px)/2)) 20px!important;margin:0!important;border-bottom:1px solid hsl(var(--border, 32 20% 88%));background:hsl(var(--background))}
    body.chamo-store-ready [data-chamo-specialties-top="true"] h2{margin:0 0 14px!important;font-size:clamp(1.1rem,1.6vw,1.45rem)!important}
    body.chamo-store-ready [data-chamo-specialties-top="true"] .scrollbar-none{margin-top:0!important;padding-bottom:4px!important}
    body.chamo-store-ready [data-chamo-category-menu-top="true"]{top:64px!important;z-index:35!important;margin:0!important;border-top:0!important;box-shadow:0 12px 26px -24px rgba(0,0,0,.5)}
    body.chamo-store-ready [data-chamo-category-menu-top="true"] + [data-chamo-specialties-top="true"]{padding-top:24px!important}
    body.chamo-store-ready [data-chamo-specialties-top="true"] + .chamo-menu-section{padding-top:34px}
    .chamo-menu-section{width:min(1120px,calc(100% - 32px));margin:0 auto;padding:48px 0 0}
    .chamo-menu-section h3{margin:0 0 18px;font-family:var(--font-display,inherit);font-size:clamp(1.65rem,2.4vw,2.35rem);line-height:.95;letter-spacing:0;color:hsl(var(--foreground))}
    .chamo-menu-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
    .chamo-product-card{position:relative;display:flex;min-width:0;height:100%;min-height:292px;flex-direction:column;overflow:hidden;border-radius:22px;background:hsl(var(--card));box-shadow:var(--shadow-card);color:hsl(var(--foreground));text-decoration:none;transition:transform .18s ease,box-shadow .18s ease}
    .chamo-product-card:hover{transform:translateY(-3px);box-shadow:var(--shadow-glow)}
    .chamo-product-badges{position:absolute;z-index:2;left:12px;top:12px;display:flex;gap:6px}
    .chamo-product-badges:empty{display:none}
    .chamo-product-badges .badge-chip{display:inline-flex;border-radius:999px;padding:5px 9px;background:hsl(var(--primary));color:hsl(var(--primary-foreground));font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
    .chamo-product-image{aspect-ratio:1/1;width:100%;height:auto;max-height:180px;overflow:hidden;background:hsl(var(--muted));display:grid;place-items:center}
    .chamo-product-image img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .18s ease}
    .chamo-product-card:hover .chamo-product-image img{transform:scale(1.04)}
    .chamo-product-info{padding:13px 14px 0;min-height:72px}
    .chamo-product-category{font-size:10px;font-weight:800;line-height:1.15;text-transform:uppercase;letter-spacing:.06em;color:hsl(var(--muted-foreground))}
    .chamo-product-name{margin-top:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:16px;font-weight:800;line-height:1.12;color:hsl(var(--foreground))}
    .chamo-product-price-row{margin-top:auto;padding:10px 14px 15px}
    .chamo-product-price{font-family:var(--font-display,inherit);font-size:26px;line-height:1;color:hsl(var(--primary))}
    @media (max-width: 980px){.chamo-menu-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.chamo-product-card{min-height:270px}.chamo-product-image{max-height:160px}}
    @media (max-width: 680px){body.chamo-store-ready [data-chamo-promo-banner="true"]{padding:18px 12px 14px!important}body.chamo-store-ready .chamo-promo-card{min-height:210px;border-radius:24px;padding:28px 24px}body.chamo-store-ready .chamo-promo-content h2{font-size:2.2rem}body.chamo-store-ready .chamo-promo-plus{display:none}.chamo-menu-section{width:min(100% - 24px,420px);padding-top:34px}.chamo-menu-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.chamo-product-card{border-radius:18px;min-height:228px}.chamo-product-image{max-height:132px}.chamo-product-info{padding:10px 11px 0;min-height:62px}.chamo-product-name{font-size:14px}.chamo-product-price-row{padding:8px 11px 12px}.chamo-product-price{font-size:22px}}
  `;
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
