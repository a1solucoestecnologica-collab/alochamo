(function () {
  return;

  const endpoint = "/api/chamo/stores";
  let assetsBaseUrl = "";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function price(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format((Number(value) || 0) / 100);
  }

  function imageUrl(store, field) {
    const raw = store[field] || store.logoUrl || "/assets/logo-frango-ktDjBhpo.png";
    if (raw.startsWith("http") || raw.startsWith("/assets/")) return raw;
    if (raw.startsWith("/") && assetsBaseUrl) return `${assetsBaseUrl}${raw}`;
    if (raw.startsWith("/")) return raw;
    return "/assets/logo-frango-ktDjBhpo.png";
  }

  function rating(store) {
    if (!store.rating) return "Nova loja";
    return `${(store.rating / 100).toFixed(1)} (${store.totalReviews || 0})`;
  }

  function storeCard(store) {
    const href = `/loja/${encodeURIComponent(store.slug)}`;
    return `
      <a href="${href}" data-chamo-store-card data-chamo-store-name="${escapeHtml(store.name)}" class="group rounded-2xl bg-surface border border-border shadow-[var(--shadow-card)] overflow-hidden hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 transition">
        <div class="relative h-40 bg-background overflow-hidden">
          <img src="${escapeHtml(imageUrl(store, "coverUrl"))}" alt="${escapeHtml(store.name)}" class="h-full w-full object-cover group-hover:scale-105 transition"/>
          <div class="absolute inset-0 bg-[#0A1128]/35"></div>
          <div class="absolute left-4 bottom-4 flex items-center gap-3">
            <img src="${escapeHtml(imageUrl(store, "logoUrl"))}" alt="${escapeHtml(store.name)}" class="h-14 w-14 rounded-full border-2 border-white bg-white object-cover"/>
            <div>
              <div class="font-display text-2xl text-white leading-none">${escapeHtml(store.name)}</div>
              <div class="text-xs text-white/80">/${escapeHtml(store.slug)}</div>
            </div>
          </div>
        </div>
        <div class="p-4">
          <p class="text-sm text-muted-foreground line-clamp-2">${escapeHtml(store.description || "Loja disponivel no Chamo.")}</p>
          <div class="mt-4 flex flex-wrap gap-2 text-xs">
            <span class="badge-chip bg-primary text-primary-foreground">${escapeHtml(store.averagePrepTime || 30)} min</span>
            <span class="badge-chip bg-background text-foreground border border-border">${price(store.deliveryFee || 0)} entrega</span>
            <span class="badge-chip bg-background text-foreground border border-border">${escapeHtml(rating(store))}</span>
          </div>
          <div class="mt-4 flex items-center justify-between text-sm">
            <span class="text-muted-foreground">${escapeHtml(store.neighborhood || "")}${store.city ? `, ${escapeHtml(store.city)}` : ""}</span>
            <span class="font-semibold text-primary">Abrir loja</span>
          </div>
        </div>
      </a>`;
  }

  function renderDirectory(stores) {
    document.title = "Catalogo de lojas - Chamo";
    document.body.classList.add("chamo-directory-ready");

    document.querySelectorAll("section, .border-b.border-border.bg-surface").forEach((element) => {
      element.setAttribute("data-chamo-directory-hidden", "true");
    });

    const header = document.querySelector("header");
    const html = `
      <main class="container-app py-10" data-chamo-directory>
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div class="text-xs uppercase tracking-widest text-secondary font-bold">Chamo</div>
            <h1 class="mt-2 font-display text-4xl md:text-6xl leading-none">Catalogo de lojas</h1>
            <p class="mt-2 text-muted-foreground max-w-xl">Escolha uma loja para abrir o site proprio dela, com identidade visual, cardapio e slug separados.</p>
          </div>
          <div class="relative md:w-80">
            <input data-chamo-store-search class="w-full rounded-full bg-white text-black h-11 px-4 text-sm placeholder:text-black/50 focus:outline-none focus:ring-2 focus:ring-primary border border-border" placeholder="Buscar loja"/>
          </div>
        </div>
        <div class="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${stores.length ? stores.map(storeCard).join("") : '<div class="rounded-2xl bg-surface p-6 shadow-[var(--shadow-card)]">Nenhuma loja aprovada encontrada.</div>'}
        </div>
      </main>`;

    if (header) {
      header.insertAdjacentHTML("afterend", html);
    } else {
      document.body.insertAdjacentHTML("afterbegin", html);
    }

    const input = document.querySelector("[data-chamo-store-search]");
    if (input) {
      input.addEventListener("input", () => {
        const query = input.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        document.querySelectorAll("[data-chamo-store-card]").forEach((card) => {
          const name = (card.getAttribute("data-chamo-store-name") || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          card.style.display = !query || name.includes(query) ? "" : "none";
        });
      });
    }
  }

  const style = document.createElement("style");
  style.textContent = 'body.chamo-directory-ready [data-chamo-directory-hidden="true"]{display:none!important}';
  document.head.appendChild(style);

  fetch(endpoint)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((payload) => {
      assetsBaseUrl = payload.assetsBaseUrl || "";
      renderDirectory(payload.stores || []);
    })
    .catch((error) => {
      console.warn("[ChamoDirectory] nao foi possivel carregar lojas:", error);
    });
})();
