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
  isSaved?: boolean;
  onToggleSave?: (promo: Promotion) => void;
}

export const PromoCard: React.FC<PromoCardProps> = ({
  promotion,
  onSelect,
  index,
  isSaved = false,
  onToggleSave,
}) => {
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
    <div className="relative group text-left bg-white border border-neutral-200/80 hover:border-neutral-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden">
      {/* Top Image Container */}
      <div
        className="relative w-full h-64 bg-neutral-100 overflow-hidden cursor-pointer"
        onClick={() => onSelect(promotion)}
      >
        <img
          src={imgSrc}
          alt={promotion.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Promo tag */}
        <span className="absolute top-3 left-3 bg-[#e53935] text-white text-[11px] font-semibold tracking-wider uppercase px-2.5 py-1 shadow-sm">
          {promotion.delivery_mode === "DISCOUNT" ? "DESCONTO" : "RECOMPENSA"}
        </span>

        {/* Wishlist / Save Button */}
        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(promotion);
            }}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition shadow-sm ${
              isSaved
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white/90 text-neutral-700 hover:bg-white hover:text-red-500"
            }`}
            title={isSaved ? "Remover dos guardados" : "Guardar oferta"}
            aria-label="Guardar oferta"
          >
            <svg
              className="w-4 h-4 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        )}

        {/* Highlighted Value Banner */}
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm px-3.5 py-2 flex items-center justify-between text-xs border border-neutral-200/60 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
            {promotion.delivery_mode === "DISCOUNT" ? "Poupança Direta" : "Retorno Garantido"}
          </span>
          <strong className="font-mono text-sm font-bold text-neutral-900">
            {benefitStr} {promotion.delivery_mode === "DISCOUNT" ? "Kz" : "pts"}
          </strong>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-5 flex flex-col justify-between flex-1">
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-teal-800 mb-1.5">
            {promotion.partner_category || "Serviço"} · {promotion.partner_name || "Parceiro Oficial"}
          </div>
          <h3
            onClick={() => onSelect(promotion)}
            className="font-serif text-xl sm:text-2xl font-light text-neutral-900 group-hover:text-black cursor-pointer leading-tight mb-2"
          >
            {promotion.title || promotion.listing_title || "Condição Especial"}
          </h3>
          {promotion.description && (
            <p className="text-neutral-600 text-xs sm:text-sm font-light line-clamp-2 mb-4 leading-relaxed">
              {promotion.description}
            </p>
          )}
        </div>

        {/* Pricing and Action row */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
          <div>
            {priceStr ? (
              <div>
                <span className="text-[11px] text-neutral-400 block font-light">Preço de tabela</span>
                <span className="font-mono text-base sm:text-lg font-bold text-neutral-900">
                  {priceStr} Kz
                </span>
              </div>
            ) : (
              <span className="text-xs text-neutral-500 font-light">Sob consulta</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelect(promotion)}
              className="bg-neutral-900 hover:bg-black text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition"
            >
              Aproveitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
