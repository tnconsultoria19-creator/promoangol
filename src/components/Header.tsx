import React, { useState, useEffect } from "react";
import type { UserSession } from "../types";

interface HeaderProps {
  session: UserSession | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onLogout: () => void;
  onNavigate: (view: "home" | "catalog" | "partners" | "membership" | "how" | "portal") => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onOpenAuth,
  onLogout,
  onNavigate,
  activeView,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDarkBg = activeView !== "home" || scrolled;

  const handleNav = (view: "home" | "catalog" | "partners" | "membership" | "how" | "portal") => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`w-full fixed top-0 left-0 z-50 transition-colors duration-300 ${
          isDarkBg
            ? "bg-[#1c1c1c] text-white border-b border-white/10 shadow-sm"
            : "bg-transparent text-white border-b border-white/20"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 sm:h-20 flex items-center justify-between font-sans">
          {/* Search on the Left matching Agota */}
          <div
            onClick={() => handleNav("catalog")}
            className="flex items-center space-x-2 text-white/90 hover:text-white cursor-pointer transition text-xs sm:text-sm font-sans"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
            <span className="tracking-wide hidden sm:inline">Pesquisar</span>
          </div>

          {/* Center Nav Links + Prominent Brand Logo matching Agota */}
          <nav className="hidden md:flex items-center space-x-8 lg:space-x-10">
            <button
              onClick={() => handleNav("home")}
              className={`text-xs sm:text-sm tracking-wider font-medium transition ${
                activeView === "home"
                  ? "text-white border-b-2 border-white pb-1"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Início
            </button>
            <button
              onClick={() => handleNav("catalog")}
              className={`text-xs sm:text-sm tracking-wider font-medium transition ${
                activeView === "catalog"
                  ? "text-white border-b-2 border-white pb-1"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Ofertas
            </button>
            <button
              onClick={() => handleNav("partners")}
              className={`text-xs sm:text-sm tracking-wider font-medium transition ${
                activeView === "partners"
                  ? "text-white border-b-2 border-white pb-1"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Parceiros
            </button>

            {/* Central Logo matching Agota Typography */}
            <button
              onClick={() => handleNav("home")}
              className="text-2xl lg:text-3xl font-bold tracking-[0.25em] text-white uppercase font-sans px-4 focus:outline-none"
            >
              PROMOANGOL
            </button>

            <button
              onClick={() => handleNav("membership")}
              className={`text-xs sm:text-sm tracking-wider font-medium transition ${
                activeView === "membership"
                  ? "text-white border-b-2 border-white pb-1"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Adesão
            </button>
            <button
              onClick={() => handleNav("how")}
              className={`text-xs sm:text-sm tracking-wider font-medium transition ${
                activeView === "how"
                  ? "text-white border-b-2 border-white pb-1"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Como Funciona
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("footer");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-white/80 hover:text-white text-xs sm:text-sm tracking-wider transition"
            >
              Contacto
            </button>
          </nav>

          {/* Central Logo on Mobile */}
          <button
            onClick={() => handleNav("home")}
            className="md:hidden text-lg font-bold tracking-[0.2em] text-white uppercase font-sans focus:outline-none"
          >
            PROMOANGOL
          </button>

          {/* Right Account, Wishlist & Cart matching Agota */}
          <div className="flex items-center space-x-4 sm:space-x-6 text-white/90 text-sm">
            {!session ? (
              <button
                onClick={() => onOpenAuth("login")}
                className="hover:text-white transition font-medium tracking-wider text-[11px] uppercase hidden sm:inline-block"
              >
                Entrar
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleNav("portal")}
                  className="hover:text-white text-[11px] uppercase tracking-wider font-semibold border-b border-white pb-0.5"
                >
                  {session.role === "MEMBER" ? "Minha Carteira" : session.role === "MASTER_ADMIN" ? "Master Admin" : "Portal Parceiro"}
                </button>
                <button
                  onClick={onLogout}
                  className="text-white/60 hover:text-white text-[10px] uppercase tracking-wider"
                >
                  Sair
                </button>
              </div>
            )}

            {/* Heart Wishlist Icon matching Agota */}
            <button
              onClick={() => handleNav("catalog")}
              className="flex items-center space-x-1 hover:text-white transition"
              aria-label="Ofertas guardadas"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-[10px] font-semibold">0</span>
            </button>

            {/* Cart Bag Icon matching Agota */}
            <button
              onClick={() => handleNav("catalog")}
              className="flex items-center space-x-1 hover:text-white transition"
              aria-label="Catálogo"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-[10px] font-semibold">OF</span>
            </button>

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1 text-white hover:text-neutral-200 focus:outline-none"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#1c1c1c] text-white pt-24 px-6 pb-12 flex flex-col justify-between md:hidden font-sans">
          <div className="flex flex-col space-y-6 text-sm uppercase tracking-widest pt-4">
            <button
              onClick={() => handleNav("home")}
              className={`text-left pb-2 border-b border-white/10 ${activeView === "home" ? "text-[#cba557] font-bold" : "text-white/80"}`}
            >
              Início
            </button>
            <button
              onClick={() => handleNav("catalog")}
              className={`text-left pb-2 border-b border-white/10 ${activeView === "catalog" ? "text-[#cba557] font-bold" : "text-white/80"}`}
            >
              Ofertas em Destaque
            </button>
            <button
              onClick={() => handleNav("partners")}
              className={`text-left pb-2 border-b border-white/10 ${activeView === "partners" ? "text-[#cba557] font-bold" : "text-white/80"}`}
            >
              Rede de Parceiros
            </button>
            <button
              onClick={() => handleNav("membership")}
              className={`text-left pb-2 border-b border-white/10 ${activeView === "membership" ? "text-[#cba557] font-bold" : "text-white/80"}`}
            >
              Planos de Adesão
            </button>
            <button
              onClick={() => handleNav("how")}
              className={`text-left pb-2 border-b border-white/10 ${activeView === "how" ? "text-[#cba557] font-bold" : "text-white/80"}`}
            >
              Como Funciona
            </button>
            {session ? (
              <button
                onClick={() => handleNav("portal")}
                className="text-left pb-2 border-b border-white/10 text-[#cba557] font-bold"
              >
                {session.role === "MEMBER" ? "Minha Carteira de Pontos" : "Painel Administrativo"}
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth("login");
                }}
                className="text-left pb-2 border-b border-white/10 text-white font-semibold"
              >
                Entrar / Criar Conta
              </button>
            )}
          </div>

          <div className="text-xs text-white/50 tracking-wider">
            <span>PROMOANGOL · LUANDA, ANGOLA</span>
          </div>
        </div>
      )}
    </>
  );
};
