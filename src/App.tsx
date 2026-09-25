import { useEffect, useMemo, useState } from "react";

type Promotion = {
  id: string;
  title: string;
  description?: string | null;
  listing_title?: string | null;
  partner_name?: string | null;
  delivery_mode?: "POINTS" | "DISCOUNT" | string | null;
  member_benefit_kz?: number | null;
};

const categories = [
  { label: "Hotelaria", note: "Estadias e experiências", tone: "terracotta" },
  { label: "Restaurantes", note: "Sabores e momentos", tone: "teal" },
  { label: "Beleza", note: "Cuidado e bem-estar", tone: "navy" },
  { label: "Lazer", note: "Experiências em Angola", tone: "gold" },
];

function formatKz(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-AO").format(value);
}

function benefitLabel(promotion: Promotion) {
  const amount = formatKz(promotion.member_benefit_kz);
  return promotion.delivery_mode === "DISCOUNT"
    ? "Poupa Kz " + amount
    : "Recebe " + amount + " pontos";
}

export default function App() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [catalogState, setCatalogState] = useState<"loading" | "ready" | "empty" | "error">("loading");

  useEffect(() => {
    let active = true;
    fetch("/api/catalog/promotions")
      .then(async (response) => {
        if (!response.ok) throw new Error("catalog unavailable");
        const data = (await response.json()) as { promotions?: Promotion[] };
        if (!active) return;
        const rows = Array.isArray(data.promotions) ? data.promotions : [];
        setPromotions(rows);
        setCatalogState(rows.length ? "ready" : "empty");
      })
      .catch(() => {
        if (!active) return;
        setCatalogState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  const featuredPromotions = useMemo(() => promotions.slice(0, 6), [promotions]);

  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <button className="header-search" onClick={() => scrollToId("catalog")}>
            <span className="icon icon-search" aria-hidden="true" />
            <span>Pesquisar</span>
          </button>

          <nav className="desktop-nav" aria-label="Principal">
            <button className="nav-active" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Início</button>
            <button onClick={() => scrollToId("catalog")}>Catálogo</button>
            <button onClick={() => scrollToId("membership")}>Membros</button>
            <div className="brand-mark">PROMOANGOL</div>
            <button onClick={() => scrollToId("how")}>Como funciona</button>
            <button onClick={() => scrollToId("partners")}>Parceiros</button>
            <button onClick={() => scrollToId("footer")}>Contacto</button>
          </nav>

          <div className="header-actions">
            <button className="header-login" onClick={() => scrollToId("member")}>Entrar</button>
            <button className="header-action" onClick={() => scrollToId("member")} aria-label="Membros">
              <span className="icon icon-user" aria-hidden="true" />
            </button>
            <button className="header-action" onClick={() => scrollToId("catalog")} aria-label="Catálogo">
              <span className="icon icon-bag" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-gradient" />
          <div className="hero-art" aria-hidden="true">
            <div className="hero-block terracotta-block" />
            <div className="hero-block white-block" />
            <div className="hero-object object-one"><div className="object-core" /></div>
            <div className="hero-object object-two"><div className="object-core" /></div>
            <div className="hero-object object-three"><div className="object-core" /></div>
          </div>

          <div className="content-width hero-content">
            <div className="hero-copy">
              <div className="eyebrow-line">
                <span />
                <span>RECOMPENSAS FEITAS PARA ANGOLA</span>
              </div>
              <h1>Mais valor<br />no que já compra.</h1>
              <p>
                Compre nos parceiros PromoAngol, confirme a sua compra e transforme parte do valor
                gerado em pontos ou descontos para usar em todo o ecossistema.
              </p>
              <div className="hero-actions">
                <button className="solid-light-btn" onClick={() => scrollToId("catalog")}>Ver catálogo</button>
                <button className="ghost-light-btn" onClick={() => scrollToId("member")}>Conhecer a adesão</button>
              </div>
            </div>

            <div className="hero-pagination" aria-hidden="true">
              <span />
              <span className="active" />
              <span />
            </div>
          </div>
        </section>

        <section className="content-width feature-section" id="how">
          <div className="feature-grid">
            <article className="feature-card feature-terracotta">
              <div>
                <span className="feature-kicker">COMPRE</span>
                <h2>Escolha ofertas</h2>
              </div>
              <button onClick={() => scrollToId("catalog")}>Explorar ofertas <span>↗</span></button>
            </article>
            <article className="feature-card feature-teal">
              <div>
                <span className="feature-kicker">GANHE</span>
                <h2>Acumule pontos</h2>
              </div>
              <button onClick={() => scrollToId("member")}>Ver a carteira <span>↗</span></button>
            </article>
            <article className="feature-card feature-navy">
              <div>
                <span className="feature-kicker">USE</span>
                <h2>Resgate valor</h2>
              </div>
              <button onClick={() => scrollToId("membership")}>Conhecer benefícios <span>↗</span></button>
            </article>
          </div>
        </section>

        <section className="content-width weekly-section" id="catalog">
          <div className="section-heading">
            <div>
              <span className="eyebrow eyebrow-dark">ESTA SEMANA</span>
              <h2>Catálogo em destaque.</h2>
              <p>Promoções ativas entram no catálogo semanal. Os termos comerciais são definidos e controlados pela PromoAngol.</p>
            </div>
            <button className="outline-btn" onClick={() => window.location.reload()}>Atualizar</button>
          </div>

          {catalogState === "ready" ? (
            <div className="promo-rail">
              {featuredPromotions.map((promotion) => (
                <article className="promo-card" key={promotion.id}>
                  <div className="promo-visual">
                    <span className="promo-index">PROMO</span>
                    <span className="promo-arrow">↗</span>
                  </div>
                  <div className="promo-body">
                    <span className="promo-partner">{promotion.partner_name || "Parceiro PromoAngol"}</span>
                    <h3>{promotion.title || promotion.listing_title || "Oferta em destaque"}</h3>
                    <p>{promotion.description || "Condição promocional disponível no catálogo semanal."}</p>
                    <div className="promo-meta">
                      <strong>{benefitLabel(promotion)}</strong>
                      <span>Consultar condições</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="catalog-empty">
              <div>
                <span className="eyebrow eyebrow-dark">
                  {catalogState === "error" ? "CATÁLOGO OFFLINE" : "CATÁLOGO"}
                </span>
                <h3>{catalogState === "error" ? "A base ainda não está ligada." : "As promoções da semana aparecem aqui."}</h3>
                <p>
                  {catalogState === "error"
                    ? "O interface está pronto. O catálogo passa a carregar dados reais assim que o D1 do ambiente for configurado e migrado."
                    : "Cada oferta publicada pelo Master Admin surge neste espaço sem alterar a estrutura visual do site."}
                </p>
              </div>
              <span className="catalog-rule" aria-hidden="true" />
            </div>
          )}
        </section>

        <section className="content-width member-section" id="member">
          <div className="member-rail">
            <article className="member-card">
              <div className="card-sheen" />
              <div className="member-card-top">
                <span>PROMOANGOL</span>
                <span>MEMBERSHIP</span>
              </div>
              <div className="member-card-main">
                <div>
                  <span className="member-card-label">CARTÃO DIGITAL</span>
                  <strong>Seu nome</strong>
                  <small>PA-00000000</small>
                </div>
                <div className="qr-placeholder" aria-label="QR do membro">
                  <span>QR</span>
                </div>
              </div>
            </article>

            <article className="wallet-card">
              <span className="eyebrow eyebrow-dark">SUA CARTEIRA</span>
              <div className="wallet-head">
                <h3>Pontos que ficam disponíveis.</h3>
                <button className="outline-btn compact" onClick={() => window.alert("A autenticação de membro será ligada ao Worker nesta etapa.")}>Entrar</button>
              </div>
              <div className="wallet-grid">
                <div><span>Disponíveis</span><strong>—</strong><small>pontos</small></div>
                <div><span>Pendentes</span><strong>—</strong><small>após confirmação</small></div>
                <div><span>Expiram</span><strong>12</strong><small>meses após adesão</small></div>
              </div>
              <div className="wallet-foot">
                <span>1 ponto = Kz 1</span>
                <span>Resgate mínimo: 800 pontos</span>
              </div>
            </article>
          </div>
        </section>

        <section className="content-width membership-section" id="membership">
          <div className="section-heading">
            <div>
              <span className="eyebrow eyebrow-dark">MEMBERSHIP</span>
              <h2>Uma base. Mais benefícios.</h2>
              <p>O plano Standard é gratuito. Preferred e Elite podem desbloquear mais vantagens e serviços exclusivos.</p>
            </div>
          </div>

          <div className="plan-rail">
            <article className="plan-card plan-standard">
              <span className="plan-kicker">BASE</span>
              <h3>Standard</h3>
              <p>Entrada gratuita no ecossistema PromoAngol.</p>
              <div className="plan-rule" />
              <span>Catálogo semanal</span>
              <span>Carteira de pontos</span>
              <span>Resgates a partir de 800 pontos</span>
            </article>
            <article className="plan-card plan-preferred">
              <span className="plan-kicker">PLUS</span>
              <h3>Preferred</h3>
              <p>Mais vantagens e benefícios para membros elegíveis.</p>
              <div className="plan-rule" />
              <span>Benefícios melhorados</span>
              <span>Serviços PromoAngol</span>
              <span>Upgrade por pontos ou valor configurado</span>
            </article>
            <article className="plan-card plan-elite">
              <span className="plan-kicker">EXCLUSIVE</span>
              <h3>Elite</h3>
              <p>Uma camada premium para benefícios ainda mais completos.</p>
              <div className="plan-rule" />
              <span>Melhores condições</span>
              <span>Benefícios exclusivos</span>
              <span>Serviços e experiências premium</span>
            </article>
          </div>
        </section>

        <section className="content-width categories-section" id="partners">
          <div className="section-heading">
            <div>
              <span className="eyebrow eyebrow-dark">ECOSSISTEMA</span>
              <h2>Parceiros para diferentes momentos.</h2>
            </div>
          </div>
          <div className="category-rail">
            {categories.map((category) => (
              <article className={"category-card category-" + category.tone} key={category.label}>
                <span>{category.note}</span>
                <h3>{category.label}</h3>
                <span className="category-arrow">↗</span>
              </article>
            ))}
          </div>
        </section>

        <section className="content-width member-note">
          <div>
            <span className="eyebrow eyebrow-dark">O MODELO</span>
            <h2>O parceiro fornece.<br />A PromoAngol recompensa.</h2>
          </div>
          <p>
            O parceiro confirma a compra. O cliente confirma a compra. A PromoAngol mantém o registo,
            calcula a recompensa e controla o resgate. Assim, pontos, descontos e liquidação permanecem
            num histórico único e auditável.
          </p>
        </section>
      </main>

      <footer className="site-footer" id="footer">
        <div className="content-width footer-main">
          <div>
            <div className="footer-brand">PROMOANGOL</div>
            <p>Recompensas, descontos e benefícios conectados a negócios em Angola.</p>
          </div>
          <div className="footer-links">
            <button onClick={() => scrollToId("catalog")}>Catálogo</button>
            <button onClick={() => scrollToId("membership")}>Membership</button>
            <button onClick={() => scrollToId("partners")}>Parceiros</button>
            <button onClick={() => scrollToId("how")}>Como funciona</button>
          </div>
        </div>
        <div className="content-width footer-bottom">
          <span>© PromoAngol</span>
          <span>Rewards ecosystem · Angola</span>
        </div>
      </footer>

      <nav className="mobile-bottom-nav" aria-label="Navegação móvel">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="mobile-nav-icon">⌂</span>
          <small>Início</small>
        </button>
        <button onClick={() => scrollToId("catalog")}>
          <span className="mobile-nav-icon">◌</span>
          <small>Catálogo</small>
        </button>
        <button onClick={() => scrollToId("member")}>
          <span className="mobile-nav-icon">◒</span>
          <small>Carteira</small>
        </button>
        <button onClick={() => scrollToId("membership")}>
          <span className="mobile-nav-icon">✦</span>
          <small>Benefícios</small>
        </button>
      </nav>
    </div>
  );
}
