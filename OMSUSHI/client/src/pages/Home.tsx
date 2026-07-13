import { ArrowLeft, ChevronLeft, ChevronRight, Clock, MapPin, Plus, Search, ShoppingBag, Star } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_SLUG = "om-sushi";

type Restaurant = {
  name: string;
  slug: string;
  description?: string;
  bio?: string;
  logoUrl?: string;
  coverUrl?: string;
  primaryColor?: string;
  averagePrepTime?: number;
  deliveryFee?: number;
  minimumOrder?: number;
  rating?: number;
  totalReviews?: number;
  city?: string;
  state?: string;
  theme?: StoreTheme;
};

type Category = {
  id: number;
  name: string;
};

type MenuItem = {
  id: number | string;
  categoryId?: number;
  categoryName?: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  image?: string;
  isFeatured?: boolean;
};

type StoreTheme = {
  tone?: string;
  publicSiteUrl?: string | null;
  accentColor?: string;
  darkColor?: string;
  surfaceColor?: string;
  textColor?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroHighlight?: string;
  heroSubtitle?: string;
  catalogKicker?: string;
  catalogTitle?: string;
  featuredKicker?: string;
  featuredTitle?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  productCtaLabel?: string;
  cardImageFit?: "cover" | "contain";
};

type StorePayload = {
  restaurant: Restaurant;
  theme?: StoreTheme;
  categories: Category[];
  items: MenuItem[];
  featuredItems?: MenuItem[];
  sections?: Array<Category & { items: MenuItem[] }>;
};

const fallbackTheme: Required<Omit<StoreTheme, "publicSiteUrl">> & { publicSiteUrl: string | null } = {
  tone: "sushi",
  publicSiteUrl: null,
  accentColor: "#DC2626",
  darkColor: "#09090B",
  surfaceColor: "#FAFAFA",
  textColor: "#18181B",
  heroEyebrow: "Sushi premium pelo Chamo",
  heroTitle: "OM Sushi",
  heroHighlight: "no ponto certo.",
  heroSubtitle: "Sushi, sashimi, temakis e combos frescos, com cardapio controlado pelo motor Chamo.",
  catalogKicker: "Cardapio",
  catalogTitle: "Escolha seu combinado",
  featuredKicker: "Destaques",
  featuredTitle: "Mais pedidos da casa",
  primaryCtaLabel: "Ver cardapio",
  secondaryCtaLabel: "Destaques",
  productCtaLabel: "Pedir pelo Chamo",
  cardImageFit: "cover",
};

function storeTheme(store: StorePayload): Required<Omit<StoreTheme, "publicSiteUrl">> & { publicSiteUrl: string | null } {
  return {
    ...fallbackTheme,
    ...(store.restaurant.theme || {}),
    ...(store.theme || {}),
  };
}

function slugFromPath() {
  const match = window.location.pathname.match(/^\/loja\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : DEFAULT_SLUG;
}

function storeBasePath(slug: string) {
  return `/loja/${encodeURIComponent(slug)}`;
}

function productIdFromPath() {
  const match = window.location.pathname.match(/\/produto\/([^/]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((Number(value) || 0) / 100);
}

function rating(value?: number) {
  if (!value) return "4.9";
  return (value / 100).toFixed(1);
}

function categoryName(item: MenuItem, categories: Category[]) {
  return item.categoryName || categories.find((category) => category.id === item.categoryId)?.name || "Sushi";
}

function categorySlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function defaultCatalogCategoryId(categories: Category[]) {
  const preferred = categories.find((category) => {
    const slug = categorySlug(category.name);
    return slug.includes("combo") || slug.includes("combinado") || slug.includes("hot");
  });

  return preferred?.id ?? categories[0]?.id ?? null;
}

function sushiIcon(label: string) {
  const text = label.toLowerCase();
  if (text.includes("temaki")) return "△";
  if (text.includes("hot")) return "火";
  if (text.includes("combo")) return "組";
  if (text.includes("bebida")) return "冷";
  if (text.includes("sobremesa")) return "甘";
  return "寿";
}

function itemImage(item: MenuItem) {
  const image = item.imageUrl || item.image;
  if (!image) return null;
  return image;
}

function storeAssetUrl(url: string | undefined, slug: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/loja/")) return url;
  if (url.startsWith("/assets/")) return `${storeBasePath(slug)}${url}`;
  return url;
}

function restaurantLogo(restaurant: Restaurant | undefined, slug: string) {
  return storeAssetUrl(restaurant?.logoUrl, slug) || `${storeBasePath(slug)}/assets/om-sushi-logo.jpeg`;
}

function restaurantCover(restaurant?: Restaurant) {
  return restaurant?.coverUrl || "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=80";
}

function useStore(slug: string) {
  const [store, setStore] = useState<StorePayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    fetch(`/api/chamo/store?slug=${encodeURIComponent(slug)}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setStore(payload);
        setError("");
        document.title = `${payload.restaurant?.name || "OM Sushi"} - Chamo`;
      })
      .catch(() => {
        if (!active) return;
        setError("Nao foi possivel carregar o cardapio do Chamo.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return { store, error, loading };
}

function Header({ restaurant, slug, theme }: { restaurant?: Restaurant; slug: string; theme: ReturnType<typeof storeTheme> }) {
  const base = storeBasePath(slug);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur" style={{ backgroundColor: `${theme.darkColor}eb` }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <a href={base} className="flex items-center gap-3 text-white">
          <img
            src={restaurantLogo(restaurant, slug)}
            alt={restaurant?.name || "OM Sushi"}
            className="h-10 w-16 rounded-md bg-black object-cover"
          />
          <span className="font-serif text-xl font-black tracking-tight">{restaurant?.name || "OM Sushi"}</span>
        </a>
        <nav className="ml-auto hidden items-center gap-6 text-sm font-semibold text-zinc-300 md:flex">
          <a href={`${base}/catalogo`} className="hover:text-white">Cardapio</a>
          <a href="#destaques" className="hover:text-white">Destaques</a>
          <a href="#contato" className="hover:text-white">Contato</a>
        </nav>
        <a
          href={`${base}/catalogo`}
          className="ml-auto inline-flex h-10 items-center gap-2 rounded-full bg-red-600 px-4 text-sm font-bold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 md:ml-0"
          style={{ backgroundColor: theme.accentColor }}
        >
          <ShoppingBag className="h-4 w-4" />
          Pedir
        </a>
      </div>
    </header>
  );
}

function Hero({ store, slug }: { store: StorePayload; slug: string }) {
  const restaurant = store.restaurant;
  const theme = storeTheme(store);
  const base = storeBasePath(slug);

  return (
    <section className="relative overflow-hidden text-white" style={{ backgroundColor: theme.darkColor }}>
      <div className="absolute inset-0 opacity-80">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 18% 18%, ${theme.accentColor}61, transparent 28%), radial-gradient(circle at 88% 22%, rgba(255,255,255,.14), transparent 18%), linear-gradient(135deg, ${theme.darkColor}, #18181b 55%, #2b0507)`,
          }}
        />
        <img
          src={restaurantCover(restaurant)}
          alt="Combinado de sushi OM Sushi"
          className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-70 md:block"
        />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent md:block" />
      </div>
      <div className="relative mx-auto grid min-h-[520px] max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.05fr_.95fr] md:py-20">
        <div>
          <p className="inline-flex rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-red-200">
            {theme.heroEyebrow}
          </p>
          <h1 className="mt-6 max-w-2xl font-serif text-5xl font-black leading-[0.92] md:text-7xl">
            {theme.heroTitle || restaurant.name}
            <span className="block text-red-500" style={{ color: theme.accentColor }}>{theme.heroHighlight}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-300">
            {theme.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={`${base}/catalogo`}
              className="inline-flex h-12 items-center rounded-full bg-red-600 px-7 font-bold text-white transition hover:bg-red-500"
              style={{ backgroundColor: theme.accentColor }}
            >
              {theme.primaryCtaLabel}
            </a>
            <a
              href="#destaques"
              className="inline-flex h-12 items-center rounded-full border border-white/20 px-7 font-bold text-white transition hover:bg-white/10"
            >
              {theme.secondaryCtaLabel}
            </a>
          </div>
        </div>
        <div className="relative mx-auto grid aspect-square w-full max-w-[420px] place-items-center md:hidden">
          <img src={restaurantCover(restaurant)} alt="Combinado de sushi OM Sushi" className="h-full w-full rounded-3xl object-cover" />
        </div>
      </div>
      <div className="relative border-y border-white/10 bg-black/25">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-5 md:grid-cols-4">
          <Stat theme={theme} icon={<Star />} value={rating(restaurant.rating)} label={`${restaurant.totalReviews || 120} avaliacoes`} />
          <Stat theme={theme} icon={<Clock />} value={`${restaurant.averagePrepTime || 35} min`} label="tempo medio" />
          <Stat theme={theme} icon={<ShoppingBag />} value={money(restaurant.minimumOrder || 2500)} label="pedido minimo" />
          <Stat theme={theme} icon={<MapPin />} value={restaurant.city || "Sao Paulo"} label={restaurant.state || "SP"} />
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, value, label, theme }: { icon: ReactNode; value: string; label: string; theme: ReturnType<typeof storeTheme> }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white [&_svg]:h-4 [&_svg]:w-4" style={{ backgroundColor: theme.accentColor }}>
        {icon}
      </div>
      <div className="font-serif text-2xl font-black">{value}</div>
      <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</div>
    </div>
  );
}

function CategoryNav({
  categories,
  selected,
  setSelected,
  theme,
  query,
  setQuery,
}: {
  categories: Category[];
  selected: number | null;
  setSelected: (value: number | null) => void;
  theme: ReturnType<typeof storeTheme>;
  query: string;
  setQuery: (value: string) => void;
}) {
  const scrollCategories = (direction: "left" | "right") => {
    const container = document.getElementById("om-sushi-category-scroll");
    if (!container) return;

    const amount = Math.max(220, container.clientWidth * 0.68);
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="sticky top-16 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[40px_minmax(0,1fr)_40px] items-center gap-2 px-3 py-3 lg:grid-cols-[40px_minmax(0,1fr)_40px_260px]">
        <button
          type="button"
          aria-label="Categorias anteriores"
          onClick={() => scrollCategories("left")}
          className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-700 transition hover:bg-zinc-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          id="om-sushi-category-scroll"
          className="om-sushi-category-scroll flex min-w-0 gap-2 overflow-x-auto scroll-smooth px-1"
        >
          <button
            onClick={() => setSelected(null)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${selected === null ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-700"}`}
            style={selected === null ? { backgroundColor: theme.darkColor } : undefined}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelected(category.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${selected === category.id ? "bg-red-600 text-white" : "bg-zinc-100 text-zinc-700"}`}
              style={selected === category.id ? { backgroundColor: theme.accentColor } : undefined}
            >
              {category.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Proximas categorias"
          onClick={() => scrollCategories("right")}
          className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-700 transition hover:bg-zinc-200"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <label className="col-span-full mt-2 flex h-10 min-w-0 items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 lg:col-span-1 lg:mt-0">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar no cardapio"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
      </div>
    </section>
  );
}

function PromoBanner({
  theme,
  onActivate,
}: {
  theme: ReturnType<typeof storeTheme>;
  onActivate: () => void;
}) {
  return (
    <section className="bg-zinc-50 px-4 py-7">
      <div
        className="relative mx-auto min-h-[250px] max-w-6xl overflow-hidden rounded-[30px] px-8 py-9 text-white shadow-lg shadow-red-950/10 md:px-12"
        style={{
          background: `linear-gradient(125deg, ${theme.accentColor}, #EF4444 48%, #F97316)`,
        }}
      >
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-wide">
            Missao da semana
          </span>
          <h2 className="mt-5 font-serif text-4xl font-black uppercase leading-none md:text-6xl">
            Ate <span className="text-yellow-300">30% off</span>
            <span className="block">nos combinados OM</span>
          </h2>
          <p className="mt-5 max-w-md text-base font-semibold leading-relaxed text-white/90">
            Selecao especial nos combinados mais pedidos da casa. Aproveite hoje.
          </p>
          <button
            type="button"
            onClick={onActivate}
            className="mt-7 inline-flex h-12 items-center rounded-full bg-zinc-950 px-7 text-sm font-black text-white transition hover:bg-black"
          >
            Aproveitar
            <span className="ml-2">→</span>
          </button>
        </div>
        <div className="absolute right-16 top-1/2 hidden h-36 w-8 -translate-y-1/2 rounded-full bg-white/20 md:block" />
        <div className="absolute right-6 top-1/2 hidden h-8 w-48 -translate-y-1/2 rounded-full bg-white/20 md:block" />
      </div>
    </section>
  );
}

function SpecialtyStrip({
  store,
  theme,
  onSelect,
}: {
  store: StorePayload;
  theme: ReturnType<typeof storeTheme>;
  onSelect: (itemName: string) => void;
}) {
  const source = store.featuredItems?.length
    ? store.featuredItems
    : store.items.filter((item) => item.isFeatured).length
      ? store.items.filter((item) => item.isFeatured)
      : store.items;
  const specialties = Array.from(new Map(source.map((item) => [item.name, item])).values()).slice(0, 8);
  const chipStyles = [
    { backgroundColor: "#7F2A12", color: "#fff" },
    { backgroundColor: theme.accentColor, color: "#fff" },
    { backgroundColor: theme.darkColor, color: "#fff" },
    { backgroundColor: "#8A2F16", color: "#fff" },
    { backgroundColor: "#C24126", color: "#fff" },
  ];

  if (!specialties.length) return null;

  return (
    <section className="border-b border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="mb-4 font-serif text-2xl font-black uppercase tracking-tight text-zinc-950">
          Especialidades da casa
        </h2>
        <div className="om-sushi-category-scroll flex gap-3 overflow-x-auto pb-2">
          {specialties.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.name)}
              className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-[22px] px-4 text-center text-xs font-black uppercase leading-tight tracking-wide shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:w-44"
              style={chipStyles[index % chipStyles.length]}
            >
              <span className="line-clamp-2 whitespace-normal break-words">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ item, categories, slug, theme }: { item: MenuItem; categories: Category[]; slug: string; theme: ReturnType<typeof storeTheme> }) {
  const image = itemImage(item);
  const category = categoryName(item, categories);

  return (
    <a
      href={`${storeBasePath(slug)}/produto/${encodeURIComponent(item.id)}`}
      className="group flex min-h-[314px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-zinc-950">
        {image ? (
          <img
            src={image}
            alt={item.name}
            className={`h-full w-full transition duration-300 group-hover:scale-105 ${theme.cardImageFit === "contain" ? "object-contain p-3" : "object-cover"}`}
          />
        ) : (
          <div
            className="grid h-full w-full place-items-center text-7xl font-black text-white/90"
            style={{ background: `radial-gradient(circle at 30% 20%, ${theme.accentColor}8c, transparent 25%), linear-gradient(135deg, #111, #27272a)` }}
          >
            {sushiIcon(`${item.name} ${category}`)}
          </div>
        )}
        {item.isFeatured && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
            Destaque
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-red-600" style={{ color: theme.accentColor }}>{category}</p>
        <h3 className="mt-1 line-clamp-2 font-serif text-xl font-black leading-tight text-zinc-950">{item.name}</h3>
        {item.description && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">{item.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="font-serif text-2xl font-black text-zinc-950">{money(item.price)}</span>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white" style={{ backgroundColor: theme.accentColor }}>
            <Plus className="h-5 w-5" />
          </span>
        </div>
      </div>
    </a>
  );
}

function Menu({ store, slug, compact = false }: { store: StorePayload; slug: string; compact?: boolean }) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const theme = storeTheme(store);
  const categories = store.categories || [];
  const items = store.items || [];
  const categoryPriority = useMemo(() => {
    const priorities = new Map<number, number>();

    categories.forEach((category, index) => {
      const slug = categorySlug(category.name);
      const priority = slug.includes("destaque") || slug.includes("promocion") ? -1 : index;
      priorities.set(category.id, priority);
    });

    return priorities;
  }, [categories]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = selectedCategory === null || item.categoryId === selectedCategory;
      const matchesQuery = !normalized || `${item.name} ${item.description || ""}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    }).sort((first, second) => {
      if (selectedCategory !== null || normalized) return 0;

      const firstPriority = categoryPriority.get(first.categoryId || 0) ?? 999;
      const secondPriority = categoryPriority.get(second.categoryId || 0) ?? 999;
      return firstPriority - secondPriority;
    });
  }, [categoryPriority, items, query, selectedCategory]);

  const featured = (store.featuredItems?.length ? store.featuredItems : items.filter((item) => item.isFeatured)).slice(0, 6);

  return (
    <>
      <CategoryNav
        categories={categories}
        selected={selectedCategory}
        setSelected={setSelectedCategory}
        theme={theme}
        query={query}
        setQuery={setQuery}
      />
      <PromoBanner
        theme={theme}
        onActivate={() => {
          const promotional = categories.find((category) => {
            const slug = categorySlug(category.name);
            return slug.includes("destaque") || slug.includes("promocion");
          });
          setSelectedCategory(promotional?.id ?? null);
          setQuery("");
          window.requestAnimationFrame(() => {
            document.getElementById("om-sushi-menu-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }}
      />
      <SpecialtyStrip
        store={store}
        theme={theme}
        onSelect={(itemName) => {
          setSelectedCategory(null);
          setQuery(itemName);
          window.requestAnimationFrame(() => {
            document.getElementById("om-sushi-menu-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }}
      />
      <main className="bg-zinc-50" style={{ backgroundColor: theme.surfaceColor }}>
        {!compact && featured.length > 0 && selectedCategory === null && !query && (
          <section id="destaques" className="mx-auto max-w-6xl px-4 py-12">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600" style={{ color: theme.accentColor }}>{theme.featuredKicker}</p>
                <h2 className="font-serif text-4xl font-black text-zinc-950" style={{ color: theme.textColor }}>{theme.featuredTitle}</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((item) => (
                <ProductCard key={item.id} item={item} categories={categories} slug={slug} theme={theme} />
              ))}
            </div>
          </section>
        )}

        <section id="om-sushi-menu-results" className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600" style={{ color: theme.accentColor }}>{theme.catalogKicker}</p>
              <h2 className="font-serif text-4xl font-black text-zinc-950" style={{ color: theme.textColor }}>{theme.catalogTitle}</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <ProductCard key={item.id} item={item} categories={categories} slug={slug} theme={theme} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function ProductPage({ store, slug, productId }: { store: StorePayload; slug: string; productId: string }) {
  const theme = storeTheme(store);
  const item = store.items.find((candidate) => String(candidate.id) === String(productId)) || store.items[0];

  if (!item) {
    return <Menu store={store} slug={slug} compact />;
  }

  const image = itemImage(item);
  const category = categoryName(item, store.categories || []);
  const related = store.items.filter((candidate) => String(candidate.id) !== String(item.id)).slice(0, 6);
  const description = item.description || `Produto do cardapio ${store.restaurant.name}.`;

  return (
    <main className="min-h-screen bg-zinc-50 pb-16" style={{ backgroundColor: theme.surfaceColor }}>
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="text-sm font-medium text-zinc-500">
          <a href={storeBasePath(slug)} className="hover:text-zinc-950">Pagina Inicial</a>
          <span className="mx-2">›</span>
          <a href={`${storeBasePath(slug)}/catalogo`} className="hover:text-zinc-950">Catalogo</a>
          <span className="mx-2">›</span>
          <span className="font-semibold text-zinc-950">{item.name}</span>
        </div>

        <a
          href={`${storeBasePath(slug)}/catalogo`}
          className="mt-6 inline-flex items-center gap-1 text-sm font-black uppercase tracking-wide"
          style={{ color: theme.accentColor }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </a>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div className="overflow-hidden rounded-[28px] bg-white p-6 shadow-xl shadow-zinc-950/10">
            {image ? (
              <img
                src={image}
                alt={item.name}
                className="aspect-square w-full object-contain"
              />
            ) : (
              <div
                className="grid aspect-square place-items-center text-9xl font-black text-white"
                style={{ background: `radial-gradient(circle at 30% 20%, ${theme.accentColor}8c, transparent 25%), linear-gradient(135deg, #111, #27272a)` }}
              >
                {sushiIcon(`${item.name} ${category}`)}
              </div>
            )}
          </div>

          <div className="pt-1">
            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: theme.accentColor }}>
              {category}
            </p>
            <h1 className="mt-2 font-serif text-5xl font-black uppercase leading-none text-zinc-950 md:text-6xl">
              {item.name}
            </h1>
            <p className="mt-5 text-base font-medium text-zinc-500">{store.restaurant.name}</p>
            <div className="mt-7 font-serif text-5xl font-black" style={{ color: theme.accentColor }}>
              {money(item.price)}
            </div>

            <div className="mt-10 rounded-[28px] bg-white p-6 shadow-xl shadow-zinc-950/10">
              <button
                className="flex h-16 w-full items-center justify-between rounded-full px-7 text-base font-black text-white transition hover:brightness-105"
                style={{ backgroundColor: theme.accentColor }}
              >
                <span>{theme.productCtaLabel}</span>
                <span>{money(item.price)}</span>
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-full bg-white px-5 py-4 text-center text-sm font-black shadow-lg shadow-zinc-950/10">
                Entrega em {store.restaurant.averagePrepTime || 35}min
              </div>
              <div className="rounded-full bg-white px-5 py-4 text-center text-sm font-black shadow-lg shadow-zinc-950/10">
                Taxa {money(store.restaurant.deliveryFee || 0)}
              </div>
              <div className="rounded-full bg-white px-5 py-4 text-center text-sm font-black shadow-lg shadow-zinc-950/10">
                Compra segura
              </div>
            </div>

            <section className="mt-10">
              <h2 className="font-serif text-2xl font-black uppercase tracking-tight text-zinc-950">
                Sobre o produto
              </h2>
              <p className="mt-4 leading-relaxed text-zinc-600">{description}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-5 shadow-lg shadow-zinc-950/10">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Loja</div>
                  <div className="mt-1 font-black text-zinc-950">{store.restaurant.name}</div>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-lg shadow-zinc-950/10">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Categoria</div>
                  <div className="mt-1 font-black text-zinc-950">{category}</div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-serif text-3xl font-black uppercase tracking-tight text-zinc-950">
              Voce tambem vai curtir
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {related.map((relatedItem) => (
                <ProductCard key={relatedItem.id} item={relatedItem} categories={store.categories || []} slug={slug} theme={theme} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function Footer({ restaurant, theme }: { restaurant: Restaurant; theme: ReturnType<typeof storeTheme> }) {
  return (
    <footer id="contato" className="bg-zinc-950 text-white" style={{ backgroundColor: theme.darkColor }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-serif text-2xl font-black">{restaurant.name}</div>
          <p className="mt-1 text-sm text-zinc-400">{restaurant.description || "Vitrine controlada pelo motor Chamo."}</p>
        </div>
        <div className="text-sm font-semibold text-zinc-300">{restaurant.city || "Sao Paulo"} {restaurant.state ? `- ${restaurant.state}` : ""}</div>
      </div>
    </footer>
  );
}

export default function Home() {
  const slug = slugFromPath();
  const productId = productIdFromPath();
  const isCatalog = window.location.pathname.includes("/catalogo");
  const { store, error, loading } = useStore(slug);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          <p className="font-serif text-2xl font-black">Carregando OM Sushi</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-center text-white">
        <div>
          <h1 className="font-serif text-4xl font-black">Cardapio indisponivel</h1>
          <p className="mt-3 text-zinc-300">{error || "Nao foi possivel carregar a loja."}</p>
        </div>
      </div>
    );
  }

  const theme = storeTheme(store);

  return (
    <div className="min-h-screen bg-zinc-50" style={{ backgroundColor: theme.surfaceColor }}>
      <Header restaurant={store.restaurant} slug={slug} theme={theme} />
      {productId ? (
        <ProductPage store={store} slug={slug} productId={productId} />
      ) : (
        <>
          {!isCatalog && <Hero store={store} slug={slug} />}
          <Menu store={store} slug={slug} compact={isCatalog} />
        </>
      )}
      <Footer restaurant={store.restaurant} theme={theme} />
    </div>
  );
}
