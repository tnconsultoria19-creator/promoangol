import React from "react";

interface CategoryCardsProps {
  onSelectCategory: (category: string) => void;
}

const cards = [
  {
    id: "Hotelaria",
    kicker: "ESTADIAS & ESCAPES",
    title: "Hotéis & Resorts",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80",
    tone: "category-photo-terracotta",
  },
  {
    id: "Restaurantes",
    kicker: "SABORES & EXPERIÊNCIAS",
    title: "Restaurantes",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",
    tone: "category-photo-teal",
  },
  {
    id: "Beleza",
    kicker: "BEM-ESTAR & CUIDADO",
    title: "Spas & Beleza",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80",
    tone: "category-photo-navy",
  },
  {
    id: "Lazer",
    kicker: "TEMPO LIVRE",
    title: "Lazer & Experiências",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
    tone: "category-photo-gold",
  },
];

export const CategoryCards: React.FC<CategoryCardsProps> = ({ onSelectCategory }) => {
  return (
    <section className="category-showcase">
      <div className="content-width">
        <div className="category-showcase-head">
          <div>
            <span className="eyebrow eyebrow-dark">EXPLORE POR CATEGORIA</span>
            <h2>O que está a acontecer esta semana.</h2>
          </div>
          <span className="category-showcase-note">
            Ofertas selecionadas para membros PromoAngol.
          </span>
        </div>

        <div className="category-showcase-grid">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectCategory(card.id)}
              className={`category-showcase-card ${card.tone}`}
            >
              <img src={card.image} alt="" aria-hidden="true" />
              <span className="category-showcase-scrim" />
              <span className="category-showcase-content">
                <small>{card.kicker}</small>
                <strong>{card.title}</strong>
                <em>Ver ofertas <span>→</span></em>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
