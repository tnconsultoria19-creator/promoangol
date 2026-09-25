import React from "react";
import type { UserSession } from "../types";

interface HeaderProps {
  session: UserSession | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onLogout: () => void;
  onNavigate: (view: "home" | "catalog" | "partners" | "membership" | "how" | "portal") => void;
  activeView: string;
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onOpenAuth,
  onLogout,
  onNavigate,
  activeView,
  cartCount = 0,
}) => {
  return (
    <header className="site-header">
      <div className="header-inner">
        {/* Left: Search Trigger */}
        <button
          className="header-search"
          onClick={() => onNavigate("catalog")}
          aria-label="Pesquisar promoções"
        >
          <span className="icon icon-search" aria-hidden="true" />
          <span>Pesquisar</span>
        </button>

        {/* Center: Desktop Navigation & Brand Wordmark */}
        <nav className="desktop-nav" aria-label="Navegação Principal">
          <button
            className={activeView === "home" ? "nav-active" : ""}
            onClick={() => onNavigate("home")}
          >
            Início
          </button>
          <button
            className={activeView === "catalog" ? "nav-active" : ""}
            onClick={() => onNavigate("catalog")}
          >
            Ofertas
          </button>
          <button
            className={activeView === "partners" ? "nav-active" : ""}
            onClick={() => onNavigate("partners")}
          >
            Parceiros
          </button>

          {/* Central Architectural Brand Wordmark */}
          <div
            className="brand-mark cursor-pointer"
            onClick={() => onNavigate("home")}
            role="button"
            tabIndex={0}
          >
            PROMOANGOL
          </div>

          <button
            className={activeView === "membership" ? "nav-active" : ""}
            onClick={() => onNavigate("membership")}
          >
            Adesão
          </button>
          <button
            className={activeView === "how" ? "nav-active" : ""}
            onClick={() => onNavigate("how")}
          >
            Como Funciona
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("footer");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Contacto
          </button>
        </nav>

        {/* Right: Actions (Account, Wishlist, Member Bag) */}
        <div className="header-actions">
          {!session ? (
            <>
              <button
                className="header-login"
                onClick={() => onOpenAuth("login")}
              >
                Entrar / Registar
              </button>
              <button
                className="header-action"
                onClick={() => onOpenAuth("login")}
                aria-label="Entrar na conta"
              >
                <span className="icon icon-user" aria-hidden="true" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate("portal")}
                className="text-xs uppercase tracking-wider font-semibold border-b border-white pb-0.5"
                title="Aceder ao Painel"
              >
                {session.role === "MEMBER" ? "Minha Carteira" : session.role === "MASTER_ADMIN" ? "Master Admin" : "Portal Parceiro"}
              </button>
              <button
                onClick={onLogout}
                className="text-[10px] uppercase tracking-wider text-white/70 hover:text-white transition"
              >
                Sair
              </button>
            </div>
          )}

          <button
            className="header-action"
            onClick={() => onNavigate("catalog")}
            aria-label="Catálogo de Recompensas"
          >
            <span className="icon icon-bag" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#cba557] text-[#1c1c1c] text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
