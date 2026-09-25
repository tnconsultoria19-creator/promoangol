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
    <section className="relative w-full min-h-[700px] lg:min-h-[820px] bg-[#617482] flex items-center overflow-hidden">
      {/* Hero Background Tone & Composition Mockup */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#4d606f] via-[#5d7180] to-[#718696] opacity-90" />

      {/* 3D Pedestals / Architectural Composition Graphics from Reference */}
      <div className="absolute right-0 bottom-0 w-full lg:w-3/5 h-full pointer-events-none flex items-end justify-end">
        <div className="relative w-[550px] lg:w-[700px] h-[580px] mr-0 mb-0">
          {/* Blue top element on block */}
          <div className="absolute top-10 left-12 w-48 h-36 bg-[#4c7a8f] rounded-3xl shadow-2xl p-4 flex flex-col items-center justify-center transform -rotate-1 border border-white/10">
            <div className="w-2 h-6 bg-neutral-300 absolute -top-4 rounded-full" />
            <div className="w-24 h-24 rounded-full bg-[#f4b39e] shadow-inner flex items-center justify-center border-4 border-[#3a6274]" />
          </div>

          {/* Terracotta lower element on pink pedestal */}
          <div className="absolute bottom-6 left-16 w-52 h-40 bg-[#ba5d45] rounded-3xl shadow-2xl p-4 flex items-center justify-center border border-white/20">
            <div className="w-28 h-28 rounded-full bg-[#dec0b2] shadow-inner border-4 border-[#9a4b36]" />
          </div>

          {/* White modern element on white block */}
          <div className="absolute bottom-24 right-16 w-60 h-48 bg-white rounded-3xl shadow-2xl p-4 flex items-center justify-center">
            <div className="w-2 h-8 bg-neutral-200 absolute -top-5 rounded-full" />
            <div className="w-32 h-32 rounded-full bg-[#e8a892] shadow-inner border-4 border-neutral-100" />
          </div>

          {/* Architectural 3D Blocks */}
          <div className="absolute bottom-0 left-0 w-80 h-32 bg-[#a3513e] opacity-90" />
          <div className="absolute bottom-0 right-0 w-96 h-56 bg-[#f7f7f7] shadow-xl" />
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 py-32 w-full flex flex-col justify-center">
        <div className="max-w-xl text-white">
          {/* Subtag */}
          <div className="flex items-center space-x-3 mb-4">
            <span className="w-6 h-[2px] bg-yellow-400" />
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-yellow-300 font-sans">
              RECOMPENSAS FEITAS PARA ANGOLA
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-normal tracking-tight leading-none mb-6 font-serif">
            Mais valor<br />
            no que já compra.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-neutral-200/90 leading-relaxed font-light mb-10 max-w-md font-sans">
            Descubra experiências, serviços e marcas em Angola que devolvem valor àquilo que já faz parte da sua vida.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={onExploreCatalog}
              className="inline-block bg-white text-neutral-900 px-9 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-neutral-100 transition shadow-sm font-sans"
            >
              Explorar Ofertas
            </button>
            <button
              onClick={onExploreMembership}
              className="inline-block border border-white/50 text-white hover:border-white px-8 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase transition font-sans"
            >
              Conhecer a Adesão
            </button>
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center space-x-2 mt-20">
          <span className="w-2 h-2 rounded-full bg-white/40 cursor-pointer" />
          <span className="w-2 h-2 rounded-full bg-white cursor-pointer" />
          <span className="w-2 h-2 rounded-full bg-white/40 cursor-pointer" />
        </div>
      </div>
    </section>
  );
};
