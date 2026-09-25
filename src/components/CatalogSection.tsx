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

  const filteredPromotions = useMemo(() => {
    if (activeCategory === "all") return promotions;
    return promotions.filter((p) =>
      p.partner_category?.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [promotions, activeCategory]);

  return (
    <section className="content-width weekly-section" id="catalog">
      <div className="section-heading">
        <div>
          <span className="eyebrow eyebrow-dark">ESTA SEMANA EM ANGOLA</span>
          <h2>Catálogo em Destaque.</h2>
          <p>
            Promoções ativas com retorno garantido de valor. Todos os termos e benefícios
            são controlados e auditados pela PromoAngol. 1 ponto acumulado = 1 Kz de recompensa real.
          </p>
        </div>
        <button className="outline-btn" onClick={onRefresh}>
          Atualizar Catálogo
        </button>
      </div>

      {/* Category Filter Pills (Minimalist inline tabs) */}
      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 text-xs uppercase tracking-widest font-medium text-zinc-500">
        <button
          className={`pb-1 transition-colors ${activeCategory === "all" ? "text-zinc-950 font-bold border-b border-zinc-950" : "hover:text-zinc-900"}`}
          onClick={() => setActiveCategory("all")}
        >
          Todos
        </button>
        <button
          className={`pb-1 transition-colors ${activeCategory === "Hotelaria" ? "text-zinc-950 font-bold border-b border-zinc-950" : "hover:text-zinc-900"}`}
          onClick={() => setActiveCategory("Hotelaria")}
        >
          Hotelaria & Resorts
        </button>
        <button
          className={`pb-1 transition-colors ${activeCategory === "Restaurantes" ? "text-zinc-950 font-bold border-b border-zinc-950" : "hover:text-zinc-900"}`}
          onClick={() => setActiveCategory("Restaurantes")}
        >
          Restaurantes
        </button>
        <button
          className={`pb-1 transition-colors ${activeCategory === "Beleza" ? "text-zinc-950 font-bold border-b border-zinc-950" : "hover:text-zinc-900"}`}
          onClick={() => setActiveCategory("Beleza")}
        >
          Spas & Beleza
        </button>
      </div>

      {catalogState === "ready" && filteredPromotions.length > 0 ? (
        <div className="promo-rail">
          {filteredPromotions.map((promotion, idx) => (
            <PromoCard
              key={promotion.id}
              promotion={promotion}
              index={idx}
              onSelect={onSelectPromotion}
            />
          ))}
        </div>
      ) : catalogState === "loading" ? (
        <div className="py-20 text-center text-xs tracking-widest uppercase text-zinc-400">
          A carregar ofertas ativas da base de dados...
        </div>
      ) : (
        <div className="catalog-empty">
          <div>
            <span className="eyebrow eyebrow-dark">
              {catalogState === "error" ? "CATÁLOGO TEMPORARIAMENTE OFFLINE" : "CATÁLOGO SEMANAL"}
            </span>
            <h3>
              {catalogState === "error"
                ? "A carregar do cluster Cloudflare D1."
                : "Sem ofertas disponíveis nesta categoria."}
            </h3>
            <p>
              As ofertas oficiais publicadas pelo Master Admin surgem aqui com cálculos em tempo real.
            </p>
          </div>
          <span className="catalog-rule" aria-hidden="true" />
        </div>
      )}
    </section>
  );
};
