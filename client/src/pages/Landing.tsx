import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type LandingRestaurant = {
  icon: string;
  name: string;
  category: string;
  rating: string;
  time: string;
  tone: string;
  href?: string;
  logo?: string;
};

type PublicStore = {
  slug: string;
  name: string;
  description?: string;
  logoUrl?: string;
  rating?: number;
  averagePrepTime?: number;
  theme?: {
    tone?: string;
    publicSiteUrl?: string | null;
  };
};

const realStoreSlugs = new Set(["frango-galactico", "rancho-figueira", "om-sushi"]);

const restaurants: LandingRestaurant[] = [
  {
    icon: "🚀",
    name: "Frango Galáctico",
    category: "Frango frito espacial",
    rating: "4.9",
    time: "30 min",
    tone: "galaxy",
    href: "/loja/frango-galactico/catalogo",
    logo: "/loja/frango-galactico/assets/logo-frango-sem-borda.png",
  },
  {
    icon: "🥩",
    name: "Rancho Figueira",
    category: "Carnes e porções",
    rating: "4.9",
    time: "35 min",
    tone: "rancho",
    href: "/loja/rancho-figueira/catalogo",
    logo: "/loja/rancho-figueira/assets/rancho-logo.png",
  },
  {
    icon: "🍣",
    name: "OM Sushi",
    category: "Sushi premium",
    rating: "4.9",
    time: "35 min",
    tone: "sushi",
    href: "/loja/om-sushi/catalogo",
    logo: "/loja/om-sushi/assets/om-sushi-logo.jpeg",
  },
  { icon: "🍣", name: "Sushi Kaze", category: "Japonês", rating: "4.9", time: "30–45 min", tone: "rose" },
  { icon: "🍕", name: "Napoli Forno", category: "Pizzaria", rating: "4.7", time: "25–40 min", tone: "red" },
  { icon: "🥗", name: "Verde Bowl", category: "Saudável", rating: "4.8", time: "15–25 min", tone: "green" },
  { icon: "☕", name: "Café da Praça", category: "Cafeteria", rating: "4.9", time: "10–20 min", tone: "yellow" },
  { icon: "🧁", name: "Doce Alma", category: "Confeitaria", rating: "5.0", time: "20–30 min", tone: "pink" },
  { icon: "🌮", name: "Taco Loco", category: "Mexicano", rating: "4.7", time: "25–35 min", tone: "taco" },
  { icon: "🍝", name: "Massa Nossa", category: "Italiana", rating: "4.8", time: "30–40 min", tone: "pasta" },
  { icon: "🍧", name: "Açaí do Bairro", category: "Açaiteria", rating: "4.9", time: "15–25 min", tone: "purple" },
  { icon: "🍛", name: "Sabor da Vila", category: "Comida caseira", rating: "4.9", time: "20–30 min", tone: "amber" },
  { icon: "🍔", name: "Burger Fábrica", category: "Hambúrguer artesanal", rating: "4.8", time: "25–35 min", tone: "orange" },
];

function assetUrl(path: string | undefined, baseUrl: string, storeUrl?: string | null) {
  if (!path) return undefined;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  if (path.startsWith("/assets/") && storeUrl) {
    if (storeUrl.startsWith("/")) {
      const storeBasePath = storeUrl.replace(/\/catalogo\/?$/, "").replace(/\/$/, "");
      return `${storeBasePath}${path}`;
    }

    try {
      const url = new URL(storeUrl);
      return `${url.origin}${url.pathname.replace(/\/$/, "")}${path}`;
    } catch {
      return path;
    }
  }
  if (path.startsWith("/")) return `${baseUrl}${path}`;
  return path;
}

function ratingLabel(value?: number) {
  return value ? (value / 100).toFixed(1) : "4.9";
}

function publicStoreToRestaurant(store: PublicStore, assetsBaseUrl: string): LandingRestaurant {
  return {
    icon: "C",
    name: store.name,
    category: store.description || "Restaurante com Chamo ativo",
    rating: ratingLabel(store.rating),
    time: `${store.averagePrepTime || 30} min`,
    tone: store.theme?.tone || "orange",
    href: store.theme?.publicSiteUrl || `#/loja/${store.slug}`,
    logo: assetUrl(store.logoUrl, assetsBaseUrl, store.theme?.publicSiteUrl),
  };
}

const platformStats = [
  { value: "+320", label: "restaurantes" },
  { value: "24/7", label: "atendimento IA" },
  { value: "2s", label: "tempo médio de resposta" },
  { value: "0", label: "app pra baixar" },
];

const brainFeatures = [
  {
    icon: "📖",
    number: "01",
    title: "Cardápio digital",
    description: "Sempre atualizado, com fotos, descrições vivas e categorias que fazem sentido.",
  },
  {
    icon: "🎨",
    number: "02",
    title: "Site personalizado",
    description: "Um site só do seu restaurante, com a sua cara, seu domínio e sua identidade.",
  },
  {
    icon: "🤖",
    number: "03",
    title: "Atendimento 100% autônomo",
    description: "IA responde no WhatsApp, no site e no cardápio. Recomenda, vende e fecha pedido.",
  },
  {
    icon: "📊",
    number: "04",
    title: "Painel do dono",
    description: "Você acompanha vendas, conversas e destaques em tempo real. Simples e direto.",
  },
];

const plans = [
  {
    label: "Plano gratuito",
    name: "Profissional",
    price: "R$ 0",
    period: "/mês",
    description: "Site próprio, cardápio digital e presença online para seu restaurante começar no Chamo sem mensalidade.",
    features: ["Site do restaurante", "Cardápio digital", "Tema personalizado", "Pedidos pelo WhatsApp", "Painel do dono"],
    cta: "Começar grátis",
    featured: true,
  },
  {
    label: "Operação completa",
    name: "Premium",
    price: "R$ 697",
    period: "/mês",
    description: "Para restaurantes que querem o Chamo atuando com automação, prioridade e operação mais completa.",
    features: ["Tudo do Profissional", "Atendimento por IA", "Múltiplas unidades", "Integrações sob medida", "Prioridade no suporte"],
    cta: "Falar com o Chamo",
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const [liveRestaurants, setLiveRestaurants] = useState<LandingRestaurant[]>([]);
  const visibleRestaurants = useMemo(() => {
    if (!liveRestaurants.length) return restaurants.slice(0, 3);
    return liveRestaurants;
  }, [liveRestaurants]);
  const nameLoop = useMemo(
    () => [
      ...visibleRestaurants,
      ...visibleRestaurants,
      ...visibleRestaurants,
      ...visibleRestaurants,
      ...visibleRestaurants,
      ...visibleRestaurants,
    ],
    [visibleRestaurants],
  );
  const cardLoop = useMemo(() => {
    const repeatedRestaurants = [
      ...visibleRestaurants,
      ...visibleRestaurants,
      ...visibleRestaurants,
      ...visibleRestaurants,
    ];

    return [...repeatedRestaurants, ...repeatedRestaurants];
  }, [visibleRestaurants]);

  useEffect(() => {
    let active = true;

    fetch("/api/public/stores")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload: { assetsBaseUrl?: string; stores?: PublicStore[] }) => {
        if (!active || !Array.isArray(payload.stores)) return;
        const baseUrl = payload.assetsBaseUrl || "";
        setLiveRestaurants(
          payload.stores
            .filter((store) => realStoreSlugs.has(store.slug))
            .map((store) => publicStoreToRestaurant(store, baseUrl)),
        );
      })
      .catch(() => {
        if (active) setLiveRestaurants([]);
      });

    return () => {
      active = false;
    };
  }, []);

  function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="alo-page alo-faithful">
      <div className="alo-gradient-bg" aria-hidden="true" />
      <div className="alo-dot-bg" aria-hidden="true" />

      <header className="alo-header">
        <a href="/" className="alo-brand" aria-label="ALÔCHAMO">
          <span className="alo-brand-mark">A</span>
          <span>
            ALÔ<span>CHAMO</span>
          </span>
        </a>

        <nav className="alo-nav" aria-label="Navegação principal">
          <a href="#restaurantes">Restaurantes</a>
          <a href="#planos">Planos e preços</a>
          <a href="#chamo">O Chamo</a>
        </nav>

        <div className="alo-header-actions">
          <button type="button" onClick={() => setLocation("/painel-restaurante")} className="alo-link-button">
            Entrar/Cadastro
          </button>
        </div>
      </header>

      <section className="alo-hero">
        <div className="alo-hero-copy">
          <div className="alo-status-pill">
            <span className="alo-live-dot" />
            Chamo online — atendendo agora
          </div>

          <h1>
            Seu cardápio.
            <br />
            Seu site.
            <br />
            <span className="alo-emphasis">
              Seu atendente
              <svg viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true">
                <path d="M2 8 C 80 2, 220 2, 298 8" />
              </svg>
            </span>{" "}
            que nunca dorme.
          </h1>

          <p>
            A ALÔCHAMO não é marketplace. Criamos <strong>sites personalizados</strong> e cuidamos do{" "}
            <strong>atendimento 100% autônomo por IA</strong> pro seu restaurante — tudo orquestrado pelo{" "}
            <strong>Chamo</strong>, nosso cérebro.
          </p>

          <form className="alo-search-form" onSubmit={submitAddress}>
            <div>
              <span className="alo-location-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <input placeholder="Digite seu endereço" aria-label="Seu endereço" />
            </div>
            <button type="submit">Buscar perto de mim →</button>
          </form>

          <div className="alo-benefits">
            <span>
              <i /> Grátis pro cliente
            </span>
            <span>
              <i /> Sem app
            </span>
            <span>
              <i /> Sem cadastro
            </span>
          </div>
        </div>

        <div className="alo-phone-wrap" aria-label="Prévia de atendimento do Chamo">
          <div className="alo-phone-shell">
            <div className="alo-phone-screen">
              <div className="alo-notch" />
              <div className="alo-phone-top">
                <span>19:42</span>
                <span>••• ⌾</span>
              </div>

              <div className="alo-chat-head">
                <div className="alo-chat-avatar">C</div>
                <div>
                  <strong>Chamo · Burger Fábrica</strong>
                  <span>
                    <i /> respondendo em segundos
                  </span>
                </div>
              </div>

              <div className="alo-chat">
                <p className="alo-bubble alo-bubble-user">Oi! Tem opção sem glúten?</p>
                <p className="alo-bubble alo-bubble-bot">
                  Temos sim 🍔 O <strong>Smash Verde</strong> vai em pão sem glúten. Quer que eu monte o pedido?
                </p>
                <p className="alo-bubble alo-bubble-user alo-short">Bora! 2 desses.</p>
                <p className="alo-bubble alo-bubble-bot alo-typing">
                  <span />
                  <span />
                  <span />
                </p>
              </div>

              <div className="alo-order-card">
                <div>
                  <span>Pedido #4821</span>
                  <strong>Confirmando…</strong>
                </div>
                <p>
                  <b>2× Smash Verde</b>
                  <b>R$ 74,00</b>
                </p>
                <i />
              </div>
            </div>
          </div>

          <div className="alo-phone-float alo-phone-float-left">⚡ Responde em 2s</div>
          <div className="alo-phone-float alo-phone-float-right">🧠 100% autônomo</div>
        </div>
      </section>

      <section className="alo-stats" aria-label="Números da plataforma">
        <div>
          {platformStats.map((stat) => (
            <article key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="alo-name-marquee" aria-label="Restaurantes que já usam ALÔCHAMO">
        <div>
          {nameLoop.map((restaurant, index) => (
            <span key={`${restaurant.name}-${index}`}>{restaurant.name}</span>
          ))}
        </div>
      </section>

      <section id="restaurantes" className="alo-section alo-restaurants">
        <div className="alo-section-head">
          <div>
            <span className="alo-kicker">Já usam ALÔCHAMO</span>
            <h2>
              Restaurantes <span>na plataforma</span>
            </h2>
          </div>
          <a href="#restaurantes" className="alo-inline-action">
            Ver todos →
          </a>
        </div>

        <div className="alo-card-marquee">
          <div>
            {cardLoop.map((restaurant, index) => (
              <a
                key={`${restaurant.name}-card-${index}`}
                href={restaurant.href ?? "#restaurantes"}
                className="alo-restaurant-card"
                aria-label={`Abrir site ${restaurant.name}`}
              >
                <div className={`alo-restaurant-art alo-tone-${restaurant.tone}`}>
                  {restaurant.logo ? (
                    <img src={restaurant.logo} alt={`Logo ${restaurant.name}`} />
                  ) : (
                    <span>{restaurant.icon}</span>
                  )}
                  <b>Chamo ativo</b>
                  <em>★ {restaurant.rating}</em>
                </div>
                <div className="alo-restaurant-body">
                  <h3>{restaurant.name}</h3>
                  <p>{restaurant.category}</p>
                  <footer>
                    <span>🛵 {restaurant.time}</span>
                    <strong>Abrir site →</strong>
                  </footer>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="chamo" className="alo-section alo-brain-section">
        <div className="alo-brain-copy">
          <span className="alo-kicker">O cérebro</span>
          <h2>
            Conheça o <span>Chamo</span>.
          </h2>
          <p>
            A IA que atende, tira dúvida, sugere prato, fecha pedido e cuida do seu cliente enquanto você cuida da
            cozinha. 24 horas por dia.
          </p>

          <div className="alo-brain-badge">
            <div className="alo-chat-avatar">C</div>
            <div>
              <strong>Chamo está online</strong>
              <span>Aprende o seu cardápio em minutos</span>
            </div>
          </div>
        </div>

        <ul className="alo-feature-list">
          {brainFeatures.map((feature) => (
            <li key={feature.title} className="alo-feature-card">
              <span className="alo-feature-emoji">{feature.icon}</span>
              <div>
                <header>
                  <b>{feature.number}</b>
                  <i />
                </header>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="planos" className="alo-section alo-pricing">
        <div className="alo-section-head">
          <div>
            <span className="alo-kicker">Planos e preços</span>
            <h2>
              Escolha como seu restaurante <span>vai chamar</span>.
            </h2>
          </div>
          <a href="#restaurante" className="alo-inline-action">
            Quero contratar →
          </a>
        </div>

        <div className="alo-plan-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={`alo-plan-card${plan.featured ? " alo-plan-card-featured" : ""}`}>
              {plan.featured && <strong className="alo-plan-badge">Mais escolhido</strong>}
              <span className="alo-plan-label">{plan.label}</span>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <div className="alo-plan-price">
                <small>A partir de</small>
                <strong>{plan.price}</strong>
                <span>{plan.period}</span>
              </div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setLocation("/cadastro-restaurante")}
                className={`alo-pill ${plan.featured ? "alo-pill-primary" : "alo-pill-outline"}`}
              >
                {plan.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section id="restaurante" className="alo-cta">
        <div>
          <span className="alo-kicker">Pra dono de restaurante</span>
          <h2>
            Coloque seu restaurante <br /> pra <span>falar com o mundo</span>.
          </h2>
          <p>
            Em minutos você tem site, cardápio e o Chamo atendendo os seus clientes. Sem taxa por pedido. Sem app pro
            cliente baixar.
          </p>
          <div className="alo-cta-actions">
            <button type="button" onClick={() => setLocation("/cadastro-restaurante")} className="alo-pill alo-pill-primary">
              Quero na minha casa →
            </button>
            <button type="button" onClick={() => setLocation("/painel-restaurante")} className="alo-pill alo-pill-outline">
              Falar com o Chamo
            </button>
          </div>
        </div>
      </section>

      <footer className="alo-footer">
        <div className="alo-brand">
          <span className="alo-brand-mark">A</span>
          <span>ALÔCHAMO</span>
        </div>
        <span>© 2026 — feito com fogo brando.</span>
      </footer>
    </main>
  );
}
