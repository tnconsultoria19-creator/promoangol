import React, { useState, useEffect } from "react";
import type { UserSession } from "../types";

interface HeaderProps {
  session: UserSession | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onLogout: () => void;
  onNavigate: (view: "home" | "catalog" | "partners" | "membership" | "how" | "portal") => void;
  activeView: string;
  savedCount?: number;
  onOpenSaved?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onOpenAuth,
  onLogout,
  onNavigate,
  activeView,
  savedCount = 0,
  onOpenSaved,
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
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between font-sans">
          {/* Search Trigger */}
          <div
            onClick={() => handleNav("catalog")}
            className="flex items-center space-x-2 text-white/90 hover:text-white cursor-pointer transition text-sm font-sans"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
            <span className="tracking-wider hidden sm:inline text-xs uppercase font-medium">Pesquisar</span>
          </div>

          {/* Center Brand & Nav */}
          <div className="flex items-center space-x-8">
            <button
              onClick={() => handleNav("home")}
              className="text-2xl sm:text-3xl font-bold tracking-[0.25em] text-white uppercase font-sans focus:outline-none"
            >
              PROMOANGOL
            </button>

            <nav className="hidden lg:flex items-center space-x-7">
              <button
                onClick={() => handleNav("home")}
                className={`text-xs uppercase tracking-widest font-semibold transition ${
                  activeView === "home" ? "text-white border-b-2 border-white pb-1" : "text-white/70 hover:text-white"
                }`}
              >
                Início
              </button>
              <button
                onClick={() => handleNav("catalog")}
                className={`text-xs uppercase tracking-widest font-semibold transition ${
                  activeView === "catalog" ? "text-white border-b-2 border-white pb-1" : "text-white/70 hover:text-white"
                }`}
              >
                Ofertas
              </button>
              <button
                onClick={() => handleNav("partners")}
                className={`text-xs uppercase tracking-widest font-semibold transition ${
                  activeView === "partners" ? "text-white border-b-2 border-white pb-1" : "text-white/70 hover:text-white"
                }`}
              >
                Parceiros
              </button>
              <button
                onClick={() => handleNav("membership")}
                className={`text-xs uppercase tracking-widest font-semibold transition ${
                  activeView === "membership" ? "text-white border-b-2 border-white pb-1" : "text-white/70 hover:text-white"
                }`}
              >
                Adesão
              </button>
              <button
                onClick={() => handleNav("how")}
                className={`text-xs uppercase tracking-widest font-semibold transition ${
                  activeView === "how" ? "text-white border-b-2 border-white pb-1" : "text-white/70 hover:text-white"
                }`}
              >
                Como Funciona
              </button>
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4 sm:space-x-5 text-white/90 text-sm">
            {!session ? (
              <button
                onClick={() => onOpenAuth("login")}
                className="hover:text-white transition font-semibold tracking-wider text-xs uppercase px-3 py-1.5 border border-white/40 hover:border-white rounded-sm"
              >
                Entrar
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleNav("portal")}
                  className="hover:text-white text-xs uppercase tracking-wider font-semibold border-b border-white pb-0.5"
                >
                  {session.role === "MEMBER" ? "Minha Carteira" : session.role === "MASTER_ADMIN" ? "Master Admin" : "Portal Parceiro"}
                </button>
                <button
                  onClick={onLogout}
                  className="text-white/60 hover:text-white text-xs uppercase tracking-wider"
                >
                  Sair
                </button>
              </div>
            )}

            {/* Saved Offers Button */}
            <button
              type="button"
              onClick={onOpenSaved || (() => handleNav("catalog"))}
              className="flex items-center space-x-1.5 hover:text-white transition relative py-1.5 px-2.5 rounded hover:bg-white/10"
              aria-label="Ofertas guardadas"
              title="Ver ofertas guardadas"
            >
              <svg
                className="w-5 h-5 text-white"
                fill={savedCount > 0 ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {savedCount > 0 && (
                <span className="bg-[#e53935] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {savedCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1 text-white hover:text-neutral-200 focus:outline-none"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#1c1c1c] border-b border-white/10 px-6 py-6 space-y-4">
            <button
              onClick={() => handleNav("home")}
              className="block w-full text-left text-sm uppercase tracking-widest font-semibold text-white/90 hover:text-white"
            >
              Início
            </button>
            <button
              onClick={() => handleNav("catalog")}
              className="block w-full text-left text-sm uppercase tracking-widest font-semibold text-white/90 hover:text-white"
            >
              Ofertas
            </button>
            <button
              onClick={() => handleNav("partners")}
              className="block w-full text-left text-sm uppercase tracking-widest font-semibold text-white/90 hover:text-white"
            >
              Parceiros
            </button>
            <button
              onClick={() => handleNav("membership")}
              className="block w-full text-left text-sm uppercase tracking-widest font-semibold text-white/90 hover:text-white"
            >
              Adesão
            </button>
            <button
              onClick={() => handleNav("how")}
              className="block w-full text-left text-sm uppercase tracking-widest font-semibold text-white/90 hover:text-white"
            >
              Como Funciona
            </button>
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              {session ? (
                <>
                  <button
                    onClick={() => handleNav("portal")}
                    className="w-full text-left text-sm font-semibold text-[#cba557] uppercase tracking-wider"
                  >
                    Abrir Painel ({session.name})
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full text-left text-xs uppercase tracking-wider text-white/60"
                  >
                    Terminar Sessão
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onOpenAuth("login")}
                  className="w-full bg-white text-neutral-900 py-2.5 text-xs font-semibold uppercase tracking-widest text-center"
                >
                  Entrar / Aderir
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
