import React from "react";

interface CategoryCardsProps {
  onSelectCategory: (category: string) => void;
}

export const CategoryCards: React.FC<CategoryCardsProps> = ({ onSelectCategory }) => {
  return (
    <section className="content-width feature-section" id="how">
      <div className="feature-grid">
        {/* Card 1: Terracotta - Hotelaria */}
        <article className="feature-card feature-terracotta group cursor-pointer" onClick={() => onSelectCategory("Hotelaria")}>
          <div>
            <span className="feature-kicker">EXPERIÊNCIAS PREMIUM</span>
            <h2>Hotelaria & Resorts</h2>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onSelectCategory("Hotelaria"); }}>
            Explorar Estadias <span>↗</span>
          </button>
        </article>

        {/* Card 2: Teal - Gastronomia */}
        <article className="feature-card feature-teal group cursor-pointer" onClick={() => onSelectCategory("Restaurantes")}>
          <div>
            <span className="feature-kicker">SABORES DE ANGOLA</span>
            <h2>Gastronomia & Vinhos</h2>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onSelectCategory("Restaurantes"); }}>
            Ver Restaurantes <span>↗</span>
          </button>
        </article>

        {/* Card 3: Deep Navy - Bem-Estar */}
        <article className="feature-card feature-navy group cursor-pointer" onClick={() => onSelectCategory("Beleza")}>
          <div>
            <span className="feature-kicker">CUIDADO & BEM-ESTAR</span>
            <h2>Spas & Estética</h2>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onSelectCategory("Beleza"); }}>
            Conhecer Benefícios <span>↗</span>
          </button>
        </article>
      </div>
    </section>
  );
};
