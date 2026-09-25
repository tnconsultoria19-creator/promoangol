import React from "react";

interface HeroProps {
  onExploreCatalog: () => void;
  onExploreMembership: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreCatalog,
  onExploreMembership,
}) => {
  return (
    <section className="hero">
      <div className="hero-gradient" />

      {/* 3D Composition Graphics from Agota/Stitch Reference */}
      <div className="hero-art" aria-hidden="true">
        <div className="hero-block terracotta-block" />
        <div className="hero-block white-block" />
        <div className="hero-object object-one">
          <div className="object-core" />
        </div>
        <div className="hero-object object-two">
          <div className="object-core" />
        </div>
        <div className="hero-object object-three">
          <div className="object-core" />
        </div>
      </div>

      <div className="content-width hero-content">
        <div className="hero-copy">
          <div className="eyebrow-line">
            <span />
            <span>RECOMPENSAS FEITAS PARA ANGOLA</span>
          </div>

          <h1>
            Mais valor<br />
            no que já compra.
          </h1>

          <p>
            Compre nos parceiros PromoAngol, confirme a sua compra no telemóvel e
            transforme parte do valor gerado em pontos ou descontos reais para usar em
            todo o ecossistema de hospitalidade, restauração e lazer em Angola.
          </p>

          <div className="hero-actions">
            <button className="solid-light-btn" onClick={onExploreCatalog}>
              Explorar Ofertas
            </button>
            <button className="ghost-light-btn" onClick={onExploreMembership}>
              Conhecer a Adesão
            </button>
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="hero-pagination" aria-hidden="true">
          <span />
          <span className="active" />
          <span />
        </div>
      </div>
    </section>
  );
};
