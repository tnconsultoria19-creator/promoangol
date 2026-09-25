import React, { useState } from "react";
import type { Promotion } from "../types";
import { PromoCard } from "./PromoCard";

interface CatalogSectionProps {
  promotions: Promotion[];
  onSelectPromotion: (promo: Promotion) => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  savedPromoIds?: string[];
  onToggleSavePromo?: (promo: Promotion) => void;
}

const categories = [
  { id: "all", label: "Todas as Ofertas" },
  { id: "Hotelaria", label: "Hotéis & Resorts" },
  { id: "Restaurantes", label: "Restaurantes & Gastronomia" },
  { id: "Beleza", label: "Spas & Bem-Estar" },
  { id: "Lazer", label: "Lazer & Experiências" },
];

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  promotions,
  onSelectPromotion,
  activeCategory,
  onSelectCategory,
  savedPromoIds = [],
  onToggleSavePromo,
}) => {
  const [visibleLimit, setVisibleLimit] = useState(8);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPromotions = promotions.filter((p) => {
    const matchesCategory =
      activeCategory === "all" ||
      (p.partner_category &&
        p.partner_category.toLowerCase() === activeCategory.toLowerCase());

    const matchesSearch =
      !searchQuery.trim() ||
      (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.listing_title &&
        p.listing_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.partner_name &&
        p.partner_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description &&
        p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const displayedPromotions = filteredPromotions.slice(0, visibleLimit);

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16 font-sans deals-catalog" id="catalog">
      {/* Editorial Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="eyebrow eyebrow-dark mb-2">CATÁLOGO EXCLUSIVO</span>
        <h2 className="text-4xl sm:text-5xl font-light text-neutral-900 tracking-tight mb-4 font-serif">
          Ofertas em Destaque
        </h2>
        <p className="text-neutral-600 text-sm sm:text-base font-light leading-relaxed">
          Benefícios e recompensas comerciais ativas em estabelecimentos credenciados em Luanda e no país.
          1 Ponto = 1 Kz de recompensa garantida na sua carteira.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="max-w-xl mx-auto mb-10">
        <div className="relative flex items-center border border-neutral-300 bg-white rounded shadow-sm focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 transition">
          <svg
            className="w-5 h-5 text-neutral-400 ml-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Pesquisar por hotel, restaurante, serviço ou oferta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-3 text-sm text-neutral-900 placeholder-neutral-400 bg-transparent focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mr-3 text-neutral-400 hover:text-neutral-700 text-sm px-2 py-1"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 mb-12 text-xs uppercase tracking-widest font-semibold text-neutral-500">
        {categories.map((cat) => {
          const isActive = activeCategory.toLowerCase() === cat.id.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                setVisibleLimit(8);
              }}
              className={`pb-2 transition relative ${
                isActive
                  ? "text-neutral-900 font-bold border-b-2 border-neutral-900"
                  : "hover:text-neutral-900 border-b-2 border-transparent"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Promotions Grid */}
      {displayedPromotions.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 border border-neutral-200 rounded p-8">
          <p className="text-base text-neutral-600 font-serif mb-2">
            Nenhuma oferta encontrada para os critérios selecionados.
          </p>
          <p className="text-xs text-neutral-500 mb-6">
            Tente alterar o termo de pesquisa ou selecione outra categoria.
          </p>
          <button
            onClick={() => {
              onSelectCategory("all");
              setSearchQuery("");
            }}
            className="inline-block bg-neutral-900 text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition"
          >
            Ver Todas as Ofertas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {displayedPromotions.map((promo, idx) => (
            <PromoCard
              key={promo.id}
              promotion={promo}
              onSelect={onSelectPromotion}
              index={idx}
              isSaved={savedPromoIds.includes(promo.id)}
              onToggleSave={onToggleSavePromo}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {displayedPromotions.length < filteredPromotions.length && (
        <div className="text-center mt-14">
          <button
            onClick={() => setVisibleLimit((prev) => prev + 8)}
            className="inline-block border border-neutral-300 hover:border-neutral-900 bg-white text-neutral-900 px-10 py-3.5 text-xs uppercase tracking-widest font-semibold transition"
          >
            Carregar Mais Ofertas ({filteredPromotions.length - displayedPromotions.length} restantes)
          </button>
        </div>
      )}
    </section>
  );
};
