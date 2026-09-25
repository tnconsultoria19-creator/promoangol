import React from "react";
import type { Promotion } from "../types";

interface PromotionDetailModalProps {
  promotion: Promotion | null;
  onClose: () => void;
  onUseOffer?: (promotion: Promotion) => void;
  isLoggedIn?: boolean;
}

export const PromotionDetailModal: React.FC<PromotionDetailModalProps> = ({
  promotion,
  onClose,
  onUseOffer,
  isLoggedIn,
}) => {
  if (!promotion) return null;

  const formatKz = (val?: number | null) =>
    val != null ? new Intl.NumberFormat("pt-AO").format(val) + " Kz" : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white max-w-2xl w-full border border-neutral-200 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Visual Accent */}
        <div className="h-48 bg-gradient-to-br from-[#1a2b49] via-[#617482] to-[#a65d50] p-6 flex flex-col justify-between text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl font-light leading-none w-8 h-8 flex items-center justify-center rounded-full bg-black/20"
          >
            ×
          </button>
          <span className="text-[10px] tracking-widest uppercase bg-black/30 self-start px-2 py-1 rounded">
            {promotion.partner_category || "OFERTA OFICIAL"}
          </span>
          <div>
            <span className="text-xs uppercase tracking-widest text-[#cba557] font-semibold block">
              {promotion.partner_name || "Parceiro PromoAngol"}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-light text-white mt-1">
              {promotion.title}
            </h2>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-8 overflow-y-auto space-y-6 text-sm text-neutral-600">
          <div>
            <h4 className="text-xs uppercase tracking-widest font-semibold text-neutral-400 mb-2">
              Detalhes da Condição Promocional
            </h4>
            <p className="leading-relaxed font-light text-neutral-700">
              {promotion.description ||
                "Aproveite as condições comerciais negociadas pela equipa da PromoAngol. Apresente o seu cartão de membro no acto do pagamento para que o parceiro registe a transação."}
            </p>
          </div>

          {/* Pricing & Benefit Overview Box */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 border border-neutral-200 rounded">
            <div>
              <span className="text-[10px] uppercase text-neutral-400 block tracking-wider">
                Preço Base de Tabela
              </span>
              <span className="font-mono text-lg font-bold text-neutral-900">
                {formatKz(promotion.base_price_kz)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-neutral-400 block tracking-wider">
                Benefício do Membro
              </span>
              <span className="font-mono text-lg font-bold text-[#357169]">
                {promotion.delivery_mode === "DISCOUNT"
                  ? `Desconto de ${formatKz(promotion.member_benefit_kz)}`
                  : `+${new Intl.NumberFormat("pt-AO").format(promotion.member_benefit_kz || 0)} Pontos`}
              </span>
            </div>
          </div>

          {/* Rules of Engagement */}
          <div className="space-y-2 border-t border-neutral-100 pt-4 text-xs">
            <h5 className="font-semibold uppercase tracking-wider text-neutral-800 text-[11px]">
              Como Funciona a Compra Promovida:
            </h5>
            <ol className="list-decimal pl-5 space-y-1.5 text-neutral-500 font-light">
              <li>Dirija-se ao estabelecimento parceiro e mostre o seu Número ou QR de Membro.</li>
              <li>O operador do parceiro submete o valor da compra no sistema seguro PromoAngol.</li>
              <li>Receberá uma confirmação instantânea no seu painel para validar a transação.</li>
              <li>Após confirmação, os seus pontos entram em PENDENTE e ficam DISPONÍVEIS após 3 dias úteis.</li>
            </ol>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 font-medium"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                if (onUseOffer) onUseOffer(promotion);
                onClose();
              }}
              className="bg-[#1c1c1c] hover:bg-[#333] text-white px-6 py-3 text-xs uppercase tracking-widest font-semibold transition"
            >
              {isLoggedIn ? "Registar Compra no Balcão" : "Aderir para Usufruir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
