import React from "react";
import type { Promotion } from "../types";

const placeholderImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=80",
];

interface PromoCardProps {
  promotion: Promotion;
  onSelect: (promotion: Promotion) => void;
  index: number;
}

export const PromoCard: React.FC<PromoCardProps> = ({ promotion, onSelect, index }) => {
  const imgSrc = placeholderImages[index % placeholderImages.length];

  const benefitStr =
    promotion.member_benefit_kz != null
      ? new Intl.NumberFormat("pt-AO").format(promotion.member_benefit_kz)
      : "—";

  const priceStr =
    promotion.base_price_kz != null
      ? new Intl.NumberFormat("pt-AO").format(promotion.base_price_kz)
      : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(promotion)}
      className="promo-market-card"
    >
      <span className="promo-market-image">
        <img src={imgSrc} alt="" />
        <span className="promo-market-badge">OFERTA</span>
        <span className="promo-market-save">
          {promotion.delivery_mode === "DISCOUNT" ? "DESCONTO" : "GANHA"}{" "}
          <strong>{benefitStr}</strong>{" "}
          {promotion.delivery_mode === "DISCOUNT" ? "Kz" : "PTS"}
        </span>
      </span>

      <span className="promo-market-body">
        <small>{promotion.partner_category || "Experiência"} · {promotion.partner_name || "Parceiro PromoAngol"}</small>
        <strong>{promotion.title || promotion.listing_title || "Oferta especial"}</strong>
        <span className="promo-market-price">
          {priceStr ? <b>{priceStr} Kz</b> : <b>Consultar preço</b>}
          <em>{promotion.delivery_mode === "DISCOUNT" ? `Poupa ${benefitStr} Kz` : `+${benefitStr} pontos`}</em>
        </span>
      </span>
    </button>
  );
};
