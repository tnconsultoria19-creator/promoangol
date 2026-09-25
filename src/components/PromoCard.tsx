import React from "react";
import type { Promotion } from "../types";

interface PromoCardProps {
  promotion: Promotion;
  onSelect: (promotion: Promotion) => void;
  index: number;
}

export const PromoCard: React.FC<PromoCardProps> = ({ promotion, onSelect, index }) => {
  const amountStr = promotion.member_benefit_kz != null
    ? new Intl.NumberFormat("pt-AO").format(promotion.member_benefit_kz)
    : "—";

  const priceStr = promotion.base_price_kz != null
    ? new Intl.NumberFormat("pt-AO").format(promotion.base_price_kz)
    : null;

  return (
    <article
      className="promo-card cursor-pointer group"
      onClick={() => onSelect(promotion)}
    >
      <div className="promo-visual relative overflow-hidden">
        <span className="promo-index">PROMO 0{index + 1}</span>
        <span className="promo-arrow transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
          ↗
        </span>
      </div>

      <div className="promo-body">
        <span className="promo-partner">{promotion.partner_name || "Parceiro Oficial"}</span>
        <h3>{promotion.title || promotion.listing_title || "Oferta Especial"}</h3>
        <p>{promotion.description || "Aproveite esta condição comercial exclusiva para membros PromoAngol."}</p>

        <div className="promo-meta">
          <div>
            <strong>
              {promotion.delivery_mode === "DISCOUNT"
                ? `Poupa Kz ${amountStr}`
                : `Recebe ${amountStr} pontos`}
            </strong>
            {priceStr && (
              <span className="block text-[10px] text-zinc-400 line-through">
                Valor Base: Kz {priceStr}
              </span>
            )}
          </div>
          <span>Ver Detalhes</span>
        </div>
      </div>
    </article>
  );
};
