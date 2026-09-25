import React, { useState, useMemo } from "react";
import { PromoCard } from "./PromoCard";
import type { Promotion } from "../types";

interface CatalogSectionProps {
  promotions: Promotion[];
  catalogState: "loading" | "ready" | "empty" | "error";
  onSelectPromotion: (promotion: Promotion) => void;
  selectedCategory?: string;
  onRefresh: () => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  promotions,
  catalogState,
  onSelectPromotion,
  selectedCategory,
  onRefresh,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategory || "all");
  const [visibleLimit, setVisibleLimit] = useState(8);

  const categories = [
    { id: "all", label: "Todas as Ofertas" },
    { id: "Hotelaria", label: "Hotelaria & Resorts" },
    { id: "Restaurantes", label: "Restaurantes" },
    { id: "Beleza", label: "Spas & Beleza" },
    { id: "Lazer", label: "Experiências" },
  ];

  const filteredPromotions = useMemo(() => {
    if (activeCategory === "all") return promotions;
    return promotions.filter((p) =>
      p.partner_category?.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [promotions, activeCategory]);

  const displayedPromotions = filteredPromotions.slice(0, visibleLimit);

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 py-10 font-sans deals-catalog" id="catalog">
      {/* Centered Editorial Header Matching Agota BestsellersSection */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl sm:text-5xl font-normal text-neutral-800 tracking-tight mb-3 font-serif">
          Ofertas em Destaque
        </h2>
        <p className="text-neutral-500 text-sm sm:text-[15px] font-light leading-relaxed">
          Benefícios e recompensas comerciais ativas em estabelecimentos de referência em Luanda e no país.
          1 Ponto = 1 Kz de recompensa real garantida.
        </p>
      </div>

      {/* Category Filter Minimalist Tabs */}
      <div className="flex items-center justify-center flex-wrap gap-5 sm:gap-8 mb-10 text-[11px] uppercase tracking-[.14em] font-medium text-neutral-400">
        {categories.map((cat) => {
          const isActive = activeCategory.toLowerCase() === cat.id.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setVisibleLimit(8);
              }}
              className={`pb-1 transition-colors ${
                isActive
                  ? "text-neutral-900 border-b border-neutral-900 font-semibold"
                  : "hover:text-neutral-900"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Products Grid (4 items per row matching Agota) */}
      {catalogState === "ready" && displayedPromotions.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-16">
            {displayedPromotions.map((promotion, idx) => (
              <PromoCard
                key={promotion.id}
                promotion={promotion}
                index={idx}
                onSelect={onSelectPromotion}
              />
            ))}
          </div>

          {filteredPromotions.length > visibleLimit && (
            <div className="text-center">
              <button
                onClick={() => setVisibleLimit((prev) => prev + 8)}
                className="inline-block border border-neutral-300 hover:border-neutral-900 text-neutral-700 hover:text-neutral-900 px-8 py-3 text-xs tracking-widest font-medium uppercase transition cursor-pointer"
              >
                Ver Mais Ofertas
              </button>
            </div>
          )}
        </>
      ) : catalogState === "loading" ? (
        <div className="py-24 text-center text-xs tracking-widest uppercase text-neutral-400">
          A carregar catálogo oficial da base de dados...
        </div>
      ) : (
        <div className="py-20 text-center max-w-lg mx-auto border border-neutral-200 p-8 bg-neutral-50 mb-16">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-[#357169] block mb-2">
            Catálogo PromoAngol
          </span>
          <h3 className="text-2xl font-serif text-neutral-800 mb-2">
            {catalogState === "error"
              ? "Base de dados temporariamente indisponível"
              : "Sem ofertas ativas nesta categoria"}
          </h3>
          <p className="text-xs text-neutral-500 mb-6 font-light leading-relaxed">
            {catalogState === "error"
              ? "Por favor recarregue a ligação com o cluster Cloudflare."
              : "Novas campanhas estão a ser preparadas pelos nossos parceiros credenciados."}
          </p>
          <button
            onClick={onRefresh}
            className="inline-block border border-neutral-400 hover:border-neutral-900 text-neutral-800 px-6 py-2.5 text-xs tracking-widest uppercase font-medium transition"
          >
            Recarregar
          </button>
        </div>
      )}
    </section>
  );
};
