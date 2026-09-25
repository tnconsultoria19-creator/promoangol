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
    <section className="hero hero-compact">
      <div className="hero-gradient" />

      <div className="hero-art hero-art-compact" aria-hidden="true">
        <div className="hero-photo-placeholder">
          <div className="hero-photo-overlay" />
          <div className="hero-photo-label">
            <span>ANGOLA</span>
            <strong>OFERTAS QUE VALEM MAIS</strong>
          </div>
        </div>
        <div className="hero-mini-block hero-mini-block-one" />
        <div className="hero-mini-block hero-mini-block-two" />
      </div>

      <div className="hero-content hero-content-compact content-width">
        <div className="hero-copy hero-copy-compact">
          <div className="eyebrow-line">
            <span />
            <span>CLUBE DE OFERTAS EM ANGOLA</span>
          </div>

          <h1>Mais valor no que já compra.</h1>

          <p>
            Descubra ofertas em hotéis, restaurantes, beleza, lazer e experiências.
            Compre, acumule pontos e aproveite mais.
          </p>

          <div className="hero-actions">
            <button onClick={onExploreCatalog} className="solid-light-btn">
              Ver ofertas
            </button>
            <button onClick={onExploreMembership} className="ghost-light-btn">
              Aderir
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
