import React from "react";

interface WalletCardProps {
  availablePoints: number;
  pendingPoints: number;
  reservedPoints: number;
  expiringPoints?: number;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  availablePoints,
  pendingPoints,
  reservedPoints,
}) => {
  const formatNumber = (num: number) => new Intl.NumberFormat("pt-AO").format(num);

  return (
    <div className="wallet-card rounded-xl">
      <span className="eyebrow eyebrow-dark">CARTEIRA PROMOANGOL</span>

      <div className="wallet-head">
        <h3>Saldo de Pontos</h3>
        <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono">1 PT = 1 KZ</span>
      </div>

      <div className="wallet-grid">
        <div>
          <span>Disponíveis</span>
          <strong className="text-teal-700 font-mono tabular-nums">{formatNumber(availablePoints)}</strong>
          <small>Pronto a usar</small>
        </div>

        <div>
          <span>Pendentes</span>
          <strong className="text-amber-600 font-mono tabular-nums">{formatNumber(pendingPoints)}</strong>
          <small>Libertação 3 dias</small>
        </div>

        <div>
          <span>Reservados</span>
          <strong className="text-zinc-500 font-mono tabular-nums">{formatNumber(reservedPoints)}</strong>
          <small>Resgates / Envios</small>
        </div>
      </div>

      <div className="wallet-foot">
        <span>Transações Auditadas</span>
        <span>LIVRO RAZÃO SEGURO</span>
      </div>
    </div>
  );
};
