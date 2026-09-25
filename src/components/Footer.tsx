import React from "react";

interface FooterProps {
  onNavigate: (view: "home" | "catalog" | "partners" | "membership" | "how" | "portal") => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full bg-white py-12 relative border-t border-neutral-100 font-sans" id="footer">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500">
        {/* Left Copyright */}
        <div className="mb-4 md:mb-0">
          Copyright © <span className="text-neutral-700 font-medium">PromoAngol</span> – Recompensas & Benefícios em Angola. Todos os direitos reservados.
        </div>

        {/* Right Links */}
        <div className="flex items-center flex-wrap justify-center gap-6 text-[11px] tracking-wide">
          <button onClick={() => onNavigate("home")} className="hover:text-neutral-900 transition">
            Início
          </button>
          <button onClick={() => onNavigate("catalog")} className="hover:text-neutral-900 transition">
            Ofertas
          </button>
          <button onClick={() => onNavigate("partners")} className="hover:text-neutral-900 transition">
            Parceiros
          </button>
          <button onClick={() => onNavigate("membership")} className="hover:text-neutral-900 transition">
            Adesão
          </button>
          <button onClick={() => onNavigate("how")} className="hover:text-neutral-900 transition">
            Como Funciona
          </button>
          <button onClick={scrollToTop} className="hover:text-neutral-900 transition">
            Contacto
          </button>
        </div>
      </div>

      {/* Scroll To Top Floating Button from Agota master reference */}
      <button
        type="button"
        aria-label="Voltar ao topo"
        onClick={scrollToTop}
        className="absolute right-6 sm:right-8 -top-5 w-10 h-10 bg-white border border-neutral-200 text-neutral-600 hover:text-black hover:border-black flex items-center justify-center shadow-sm transition cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </footer>
  );
};
