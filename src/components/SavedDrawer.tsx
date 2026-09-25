import React from "react";
import type { Promotion } from "../types";

interface SavedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedPromotions: Promotion[];
  onRemoveSaved: (promoId: string) => void;
  onClearAll: () => void;
  onSelectPromo: (promo: Promotion) => void;
}

export const SavedDrawer: React.FC<SavedDrawerProps> = ({
  isOpen,
  onClose,
  savedPromotions,
  onRemoveSaved,
  onClearAll,
  onSelectPromo,
}) => {
  if (!isOpen) return null;

  const formatKz = (num?: number | null) =>
    num != null ? new Intl.NumberFormat("pt-AO").format(num) + " Kz" : "—";

  const totalSavings = savedPromotions.reduce(
    (acc, p) => acc + (p.member_benefit_kz || 0),
    0
  );

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="drawer-header">
          <div>
            <span className="eyebrow eyebrow-dark">A SUA LISTA</span>
            <h3 className="font-serif text-2xl font-light text-neutral-900 mt-1">
              Ofertas Guardadas ({savedPromotions.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 text-3xl font-light w-9 h-9 flex items-center justify-center transition"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {savedPromotions.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 space-y-4">
              <svg
                className="w-12 h-12 mx-auto stroke-current opacity-40"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <p className="text-sm font-light text-neutral-500">
                Ainda não guardou nenhuma oferta.
              </p>
              <p className="text-xs text-neutral-400">
                Clique no ícone de coração nas ofertas do catálogo para guardar e consultar mais tarde.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 text-xs text-neutral-500">
                <span>{savedPromotions.length} oferta(s) selecionada(s)</span>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-red-600 hover:text-red-800 text-xs font-semibold uppercase tracking-wider transition"
                >
                  Limpar todas
                </button>
              </div>

              {savedPromotions.map((promo) => (
                <div
                  key={promo.id}
                  className="flex gap-4 p-3.5 border border-neutral-200 bg-neutral-50/60 rounded hover:bg-neutral-50 transition items-start"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-semibold tracking-wider text-teal-800 uppercase block">
                      {promo.partner_name || "Parceiro"} · {promo.partner_category || "Serviço"}
                    </span>
                    <h4 className="font-serif text-base font-normal text-neutral-900 truncate mt-0.5">
                      {promo.title || promo.listing_title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {promo.base_price_kz && (
                        <span className="font-semibold text-neutral-900">
                          {formatKz(promo.base_price_kz)}
                        </span>
                      )}
                      <span className="text-teal-700 font-medium">
                        {promo.delivery_mode === "DISCOUNT"
                          ? `Poupa ${formatKz(promo.member_benefit_kz)}`
                          : `+${formatKz(promo.member_benefit_kz)} pts`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onRemoveSaved(promo.id)}
                      className="btn-remove-sm"
                      title="Remover das guardadas"
                    >
                      Remover
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectPromo(promo);
                      }}
                      className="text-xs uppercase tracking-wider font-semibold text-neutral-900 hover:underline mt-1"
                    >
                      Aproveitar →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {savedPromotions.length > 0 && (
          <div className="drawer-footer space-y-3">
            <div className="flex justify-between items-baseline text-sm">
              <span className="text-neutral-500 font-light">Poupança total estimada:</span>
              <strong className="text-teal-800 font-serif text-xl font-medium">
                {formatKz(totalSavings)}
              </strong>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-neutral-900 hover:bg-black text-white py-3 text-xs uppercase tracking-widest font-semibold transition"
            >
              Continuar a Explorar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
