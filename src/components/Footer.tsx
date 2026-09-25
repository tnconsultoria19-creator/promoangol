import React from "react";

interface FooterProps {
  onNavigate: (view: "home" | "catalog" | "partners" | "membership" | "how" | "portal") => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="site-footer" id="footer">
      <div className="content-width">
        <div className="footer-main">
          <div>
            <div className="footer-brand font-serif">PROMOANGOL</div>
            <p>
              O ecossistema oficial de benefícios e recompensas comerciais de Angola.
              Compre nos parceiros aderentes, acumule pontos reais (1 Ponto = 1 Kz) e
              aproveite mais do seu estilo de vida em Luanda e no país.
            </p>
          </div>

          <div className="footer-links">
            <button onClick={() => onNavigate("home")}>Início</button>
            <button onClick={() => onNavigate("catalog")}>Catálogo Semanal</button>
            <button onClick={() => onNavigate("partners")}>Empresas Parceiras</button>
            <button onClick={() => onNavigate("membership")}>Planos de Adesão</button>
            <button onClick={() => onNavigate("how")}>Como Funciona</button>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} PROMOANGOL. TODOS OS DIREITOS RESERVADOS.</span>
          <span>REPÚBLICA DE ANGOLA · LUANDA</span>
        </div>
      </div>
    </footer>
  );
};
