import React from "react";

interface CategoryCardsProps {
  onSelectCategory: (category: string) => void;
}

export const CategoryCards: React.FC<CategoryCardsProps> = ({ onSelectCategory }) => {
  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-8 py-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {/* Card 1: Terracotta / Hotelaria */}
        <div
          onClick={() => onSelectCategory("Hotelaria")}
          className="relative overflow-hidden bg-[#a65d50] text-white h-72 sm:h-80 p-8 flex flex-col justify-between group cursor-pointer"
        >
          {/* Background Art Shape & Plant */}
          <div className="absolute right-0 bottom-0 w-1/2 h-full pointer-events-none flex items-end justify-end">
            <div className="w-36 h-48 rounded-t-full bg-[#c97b6c] opacity-80 mr-4 mb-2 flex items-center justify-center">
              <svg className="w-24 h-24 text-rose-100 transform -rotate-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
          </div>
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-widest text-rose-200 block mb-1 font-sans">
              EXPERIÊNCIAS PREMIUM
            </span>
            <h3 className="text-3xl font-light tracking-tight font-serif">
              Hotelaria & Resorts
            </h3>
          </div>
          <div className="relative z-10">
            <span className="text-xs tracking-wider uppercase inline-block border-b border-white pb-1 font-medium hover:text-neutral-200 font-sans">
              Explorar Ofertas
            </span>
          </div>
        </div>

        {/* Card 2: Green / Gastronomia */}
        <div
          onClick={() => onSelectCategory("Restaurantes")}
          className="relative overflow-hidden bg-[#2d6b63] text-white h-72 sm:h-80 p-8 flex flex-col justify-between group cursor-pointer"
        >
          {/* Background Art Sculptural Shape */}
          <div className="absolute right-0 bottom-0 w-1/2 h-full pointer-events-none flex items-end justify-end">
            <div className="w-32 h-32 rounded-full bg-[#1b4b45] -mr-4 -mb-4" />
            <div className="w-28 h-40 bg-[#21574f] absolute right-6 bottom-0 rounded-t-3xl" />
          </div>
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-widest text-emerald-200 block mb-1 font-sans">
              SABORES DE ANGOLA
            </span>
            <h3 className="text-3xl font-light tracking-tight font-serif">
              Gastronomia & Vinhos
            </h3>
          </div>
          <div className="relative z-10">
            <span className="text-xs tracking-wider uppercase inline-block border-b border-white pb-1 font-medium hover:text-neutral-200 font-sans">
              Explorar Ofertas
            </span>
          </div>
        </div>

        {/* Card 3: Deep Navy / Bem-Estar */}
        <div
          onClick={() => onSelectCategory("Beleza")}
          className="relative overflow-hidden bg-[#162744] text-white h-72 sm:h-80 p-8 flex flex-col justify-between group cursor-pointer"
        >
          {/* Background Architectural Angle Mock */}
          <div className="absolute right-0 bottom-0 w-1/2 h-full pointer-events-none flex items-end justify-end">
            <div className="w-40 h-40 border-[16px] border-neutral-300 rounded-3xl transform rotate-45 translate-x-12 translate-y-12 opacity-80" />
          </div>
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-widest text-blue-200 block mb-1 font-sans">
              CUIDADO & BEM-ESTAR
            </span>
            <h3 className="text-3xl font-light tracking-tight font-serif">
              Spas & Estética
            </h3>
          </div>
          <div className="relative z-10">
            <span className="text-xs tracking-wider uppercase inline-block border-b border-white pb-1 font-medium hover:text-neutral-200 font-sans">
              Explorar Ofertas
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
