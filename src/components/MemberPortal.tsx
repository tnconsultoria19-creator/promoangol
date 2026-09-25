import React, { useState } from "react";
import type { UserSession, Promotion } from "../types";
import { DigitalMemberCard } from "./DigitalMemberCard";
import { WalletCard } from "./WalletCard";

interface MemberPortalProps {
  session: UserSession;
  memberSummary: any;
  memberTxList: any[];
  memberLedger: any[];
  memberRedemptions: any[];
  memberTransfersSent: any[];
  memberTransfersRecv: any[];
  promotions: Promotion[];
  onConfirmPurchase: (txId: string, action: "CONFIRM" | "REJECT", reason?: string) => Promise<void>;
  onRequestRedeem: (listingId: string, points: number) => Promise<void>;
  onCancelRedemption?: (redId: string) => Promise<void>;
  onRequestTransfer: (recipientNumber: string, points: number) => Promise<void>;
  onClaimInvoice?: (invoiceNumber: string, partnerName: string, amountKz: number) => Promise<void>;
  onRefresh: () => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = ({
  session,
  memberSummary,
  memberTxList,
  memberLedger,
  memberRedemptions,
  memberTransfersSent,
  memberTransfersRecv,
  promotions,
  onConfirmPurchase,
  onRequestRedeem,
  onCancelRedemption,
  onRequestTransfer,
  onClaimInvoice,
}) => {
  const [tab, setTab] = useState<"overview" | "wallet" | "redemptions" | "transfers">("overview");

  // Forms
  const [redeemListingId, setRedeemListingId] = useState("");
  const [redeemPoints, setRedeemPoints] = useState(800);
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferPoints, setTransferPoints] = useState(100);
  const [actionLoading, setActionLoading] = useState(false);

  // Claim Invoice Form State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimInvoiceNum, setClaimInvoiceNum] = useState("");
  const [claimPartner, setClaimPartner] = useState("Hotel Alvalade");
  const [claimAmount, setClaimAmount] = useState(35000);

  const pendingConfirmations = memberTxList.filter(
    (t) => t.status === "PENDING_MEMBER_CONFIRMATION"
  );

  const formatKz = (num?: number | null) =>
    num != null ? new Intl.NumberFormat("pt-AO").format(num) + " Kz" : "—";

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await onRequestRedeem(redeemListingId, redeemPoints);
      setRedeemListingId("");
      setRedeemPoints(800);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await onRequestTransfer(transferRecipient, transferPoints);
      setTransferRecipient("");
      setTransferPoints(100);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onClaimInvoice) return;
    setActionLoading(true);
    try {
      await onClaimInvoice(claimInvoiceNum, claimPartner, claimAmount);
      setShowClaimModal(false);
      setClaimInvoiceNum("");
      setClaimAmount(35000);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="content-width py-10 space-y-8 font-sans">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-neutral-200">
        <div>
          <span className="eyebrow eyebrow-dark">PORTAL DO MEMBRO PROMOANGOL</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-neutral-900 mt-1">
            Olá, {memberSummary?.profile?.full_name || session.name}
          </h1>
          <p className="text-sm text-neutral-500 font-light mt-1">
            Nº de Membro: <strong className="font-mono text-neutral-800 font-semibold">{memberSummary?.profile?.member_number || session.detail}</strong> · 1 Ponto = 1 Kz garantido
          </p>
        </div>

        {/* Portal Tabs */}
        <div className="flex items-center gap-6 text-sm uppercase tracking-wider font-semibold text-neutral-500 overflow-x-auto pb-1 max-w-full">
          <button
            className={`pb-2 border-b-2 transition shrink-0 ${tab === "overview" ? "border-neutral-900 text-neutral-900 font-bold" : "border-transparent hover:text-neutral-900"}`}
            onClick={() => setTab("overview")}
          >
            Visão Geral
          </button>
          <button
            className={`pb-2 border-b-2 transition shrink-0 ${tab === "wallet" ? "border-neutral-900 text-neutral-900 font-bold" : "border-transparent hover:text-neutral-900"}`}
            onClick={() => setTab("wallet")}
          >
            Extrato de Pontos ({memberLedger.length})
          </button>
          <button
            className={`pb-2 border-b-2 transition shrink-0 ${tab === "redemptions" ? "border-neutral-900 text-neutral-900 font-bold" : "border-transparent hover:text-neutral-900"}`}
            onClick={() => setTab("redemptions")}
          >
            Resgates ({memberRedemptions.length})
          </button>
          <button
            className={`pb-2 border-b-2 transition shrink-0 ${tab === "transfers" ? "border-neutral-900 text-neutral-900 font-bold" : "border-transparent hover:text-neutral-900"}`}
            onClick={() => setTab("transfers")}
          >
            Transferências
          </button>
        </div>
      </div>

      {/* VIEW: OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-10">
          {/* Top Two Columns: Digital Card + Wallet */}
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <DigitalMemberCard
              fullName={memberSummary?.profile?.full_name || session.name}
              memberNumber={memberSummary?.profile?.member_number || session.detail}
              planName={memberSummary?.profile?.plan_name || "Standard"}
              status="ACTIVE"
            />

            <div className="space-y-4">
              <WalletCard
                availablePoints={memberSummary?.balances?.available_points ?? 0}
                pendingPoints={memberSummary?.balances?.pending_points ?? 0}
                reservedPoints={memberSummary?.balances?.reserved_points ?? 0}
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(true)}
                  className="btn-add-primary flex-1 justify-center"
                >
                  + Reclamar Pontos com Fatura
                </button>
                <button
                  type="button"
                  onClick={() => setTab("redemptions")}
                  className="border border-neutral-300 hover:border-neutral-900 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold text-neutral-800 transition"
                >
                  Resgatar
                </button>
              </div>
            </div>
          </div>

          {/* Pending Confirmations Section */}
          <div className="border border-amber-200 bg-amber-50/60 p-6 md:p-8 rounded shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="eyebrow text-amber-800 font-bold">DUPLA CONFIRMAÇÃO DE COMPRA</span>
                <h3 className="font-serif text-2xl font-light text-neutral-900 mt-1">
                  Compras por Validar ({pendingConfirmations.length})
                </h3>
                <p className="text-sm text-neutral-600 font-light mt-1">
                  O parceiro registou a sua compra. Confirme os valores para libertar os pontos de recompensa para o seu saldo.
                </p>
              </div>
            </div>

            <div className="divide-y divide-amber-200/60 pt-2">
              {pendingConfirmations.map((tx) => (
                <div key={tx.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono tracking-wider uppercase text-amber-900 font-bold block">
                      Ref: #{tx.transaction_number} · {tx.partner_name}
                    </span>
                    <h4 className="font-serif text-lg font-medium text-neutral-900">{tx.listing_title}</h4>
                    <p className="text-sm text-neutral-600 font-light">
                      Total Pago: <strong className="text-neutral-900">{formatKz(tx.amount_paid_kz)}</strong> · Recompensa a Ganhar:{" "}
                      <strong className="text-teal-800 font-mono font-bold">+{tx.points_to_release} Pontos</strong>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onConfirmPurchase(tx.id, "CONFIRM")}
                      className="bg-teal-800 hover:bg-teal-900 text-white font-semibold py-2 px-5 uppercase text-xs tracking-wider transition"
                    >
                      Aprovar Compra
                    </button>
                    <button
                      onClick={() => onConfirmPurchase(tx.id, "REJECT", "Valor incorreto")}
                      className="border border-red-300 text-red-700 hover:bg-red-50 font-semibold py-2 px-4 uppercase text-xs tracking-wider transition"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}

              {pendingConfirmations.length === 0 && (
                <p className="py-4 text-sm text-neutral-500 italic">
                  Todas as suas compras foram validadas. Não há confirmações pendentes.
                </p>
              )}
            </div>
          </div>

          {/* Recent History Table */}
          <div className="border border-neutral-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
            <h3 className="font-serif text-2xl font-light text-neutral-900">Histórico de Compras com Recompensa</h3>
            <div className="divide-y divide-neutral-100 text-sm">
              {memberTxList.map((tx) => (
                <div key={tx.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-serif text-base font-medium text-neutral-900">{tx.listing_title}</h5>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {tx.partner_name} · Ref #{tx.transaction_number} · {tx.created_at?.slice(0, 10)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-base block text-neutral-900">{formatKz(tx.amount_paid_kz)}</span>
                    <span className="text-xs text-teal-800 font-mono font-semibold">+{tx.points_to_release} pts ({tx.status})</span>
                  </div>
                </div>
              ))}
              {memberTxList.length === 0 && (
                <p className="py-6 text-sm text-neutral-400 italic text-center">Nenhuma transação registada.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: WALLET LEDGER */}
      {tab === "wallet" && (
        <div className="border border-neutral-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
          <h3 className="font-serif text-2xl font-light text-neutral-900">Extrato Auditado de Pontos</h3>
          <p className="text-sm text-neutral-500 font-light">
            Registo em livro-razão de cada crédito e débito no seu saldo de pontos. 1 Ponto = 1 Kz.
          </p>
          <div className="divide-y divide-neutral-100 text-sm">
            {memberLedger.map((row) => (
              <div key={row.id} className="py-3.5 flex justify-between items-center">
                <div>
                  <span className="font-medium text-neutral-900">{row.reason}</span>
                  <span className="block text-xs text-neutral-400 font-mono">Conta: {row.bucket} · {row.created_at}</span>
                </div>
                <span className={`font-mono font-bold text-base ${row.direction === "CREDIT" ? "text-teal-800" : "text-neutral-800"}`}>
                  {row.direction === "CREDIT" ? "+" : "-"}{row.points} pts
                </span>
              </div>
            ))}
            {memberLedger.length === 0 && (
              <p className="py-6 text-sm text-neutral-400 italic text-center">Nenhum movimento no livro-razão.</p>
            )}
          </div>
        </div>
      )}

      {/* VIEW: REDEMPTIONS (WITH ABILITY TO REQUEST AND CANCEL) */}
      {tab === "redemptions" && (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="border border-neutral-200 p-6 bg-neutral-50 shadow-sm space-y-4">
            <span className="eyebrow eyebrow-dark">NOVO PEDIDO</span>
            <h3 className="font-serif text-2xl font-light text-neutral-900">Resgatar Pontos</h3>
            <p className="text-sm text-neutral-600 font-light leading-relaxed">
              Utilize os seus pontos disponíveis para abater o valor em compras ou serviços nos estabelecimentos parceiros.
            </p>

            <form onSubmit={handleRedeemSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                  Selecione a Oferta Comercial
                </label>
                <select
                  required
                  className="w-full border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none"
                  value={redeemListingId}
                  onChange={(e) => setRedeemListingId(e.target.value)}
                >
                  <option value="">-- Escolher Oferta --</option>
                  {promotions.map((p) => (
                    <option key={p.id} value={p.listing_id || p.id}>
                      {p.title} ({p.partner_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                  Pontos a Descontar (Mínimo 800)
                </label>
                <input
                  type="number"
                  required
                  min={800}
                  className="w-full border border-neutral-300 px-3 py-2 text-sm bg-white font-mono focus:outline-none"
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(Number(e.target.value))}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-neutral-900 hover:bg-black text-white py-3 text-xs uppercase tracking-widest font-semibold transition disabled:opacity-50"
              >
                {actionLoading ? "A submeter..." : "Confirmar Reserva de Pontos"}
              </button>
            </form>
          </div>

          {/* Redemptions List with Cancel Option */}
          <div className="md:col-span-2 border border-neutral-200 p-6 md:p-8 bg-white shadow-sm space-y-4">
            <h3 className="font-serif text-2xl font-light text-neutral-900">Os Meus Pedidos de Resgate</h3>
            <div className="divide-y divide-neutral-100 text-sm">
              {memberRedemptions.map((r) => (
                <div key={r.id} className="py-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-neutral-900 text-base">
                      Resgate #{r.redemption_number} · {r.partner_name}
                    </span>
                    <span className={`px-2.5 py-0.5 text-xs uppercase font-bold tracking-wider rounded ${r.status === "APPROVED" ? "bg-teal-100 text-teal-900" : r.status === "USED" ? "bg-neutral-200 text-neutral-700" : "bg-amber-100 text-amber-900"}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-neutral-700">Oferta: <strong>{r.listing_title}</strong> · Pontos Reservados: <strong className="font-mono text-teal-800">{r.points_requested} pts</strong></p>
                  <p className="text-neutral-500 text-xs">Valor Complementar em Dinheiro: <strong className="text-neutral-900">{formatKz(r.cash_amount_kz)}</strong></p>

                  {r.status === "APPROVED" && (
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded mt-2">
                      <p className="text-sm font-bold text-teal-900">Resgate Aprovado!</p>
                      <p className="text-xs text-teal-800 mt-1">
                        Apresente a referência <strong>#{r.redemption_number}</strong> e o código OTP emitido no balcão do parceiro.
                      </p>
                    </div>
                  )}

                  {/* Cancel Button if Pending */}
                  {r.status === "REQUESTED" && onCancelRedemption && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Deseja cancelar este pedido de resgate e devolver os pontos ao seu saldo?")) {
                            onCancelRedemption(r.id);
                          }
                        }}
                        className="btn-remove-sm"
                      >
                        Cancelar Pedido & Devolver Pontos
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {memberRedemptions.length === 0 && (
                <p className="py-6 text-sm text-neutral-400 italic text-center">Nenhum resgate solicitado de momento.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: TRANSFERS */}
      {tab === "transfers" && (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="border border-neutral-200 p-6 bg-neutral-50 shadow-sm space-y-4">
            <span className="eyebrow eyebrow-dark">TRANSFERÊNCIA ENTRE MEMBROS</span>
            <h3 className="font-serif text-2xl font-light text-neutral-900">Enviar Pontos</h3>
            <p className="text-sm text-neutral-600 font-light leading-relaxed">
              Transfira pontos para qualquer membro ativo através do seu número oficial (ex: PA-304812).
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                  Nº de Membro Destinatário
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PA-304812"
                  className="w-full border border-neutral-300 px-3 py-2 text-sm bg-white font-mono focus:outline-none"
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                  Quantidade de Pontos
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  className="w-full border border-neutral-300 px-3 py-2 text-sm bg-white font-mono focus:outline-none"
                  value={transferPoints}
                  onChange={(e) => setTransferPoints(Number(e.target.value))}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-neutral-900 hover:bg-black text-white py-3 text-xs uppercase tracking-widest font-semibold transition disabled:opacity-50"
              >
                {actionLoading ? "A transferir..." : "Submeter Transferência"}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 border border-neutral-200 p-6 md:p-8 bg-white shadow-sm space-y-4">
            <h3 className="font-serif text-2xl font-light text-neutral-900">Histórico de Transferências</h3>
            <div className="divide-y divide-neutral-100 text-sm">
              {memberTransfersSent.map((t) => (
                <div key={t.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-medium text-neutral-900">Para: {t.recipient_name} ({t.recipient_number})</span>
                    <span className="block text-xs text-neutral-400">Ref: #{t.transfer_number} · {t.created_at}</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-red-600">-{t.points} pts</span>
                </div>
              ))}
              {memberTransfersSent.length === 0 && (
                <p className="py-6 text-sm text-neutral-400 italic text-center">Nenhuma transferência enviada.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Claim Invoice Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full border border-neutral-300 shadow-2xl p-8 relative rounded">
            <button
              type="button"
              onClick={() => setShowClaimModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-800 text-2xl"
            >
              ×
            </button>
            <span className="eyebrow eyebrow-dark">PONTOS NÃO CREDITADOS?</span>
            <h3 className="font-serif text-2xl font-light text-neutral-900 mt-1 mb-3">
              Reclamar Pontos com Fatura
            </h3>
            <p className="text-xs text-neutral-600 font-light mb-4">
              Se comprou num estabelecimento parceiro e não apresentou o seu cartão no momento do pagamento, submeta os dados do talão abaixo.
            </p>

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                  Estabelecimento Parceiro
                </label>
                <select
                  className="w-full border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none"
                  value={claimPartner}
                  onChange={(e) => setClaimPartner(e.target.value)}
                >
                  <option value="Hotel Alvalade">Hotel Alvalade</option>
                  <option value="Restaurante O Lume">Restaurante O Lume</option>
                  <option value="Amandla Spa">Amandla Spa</option>
                  <option value="Epic Sana Luanda">Epic Sana Luanda</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                  Número da Fatura / Recibo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: FT-2026/89421"
                  className="w-full border border-neutral-300 px-3 py-2 text-sm font-mono bg-white focus:outline-none"
                  value={claimInvoiceNum}
                  onChange={(e) => setClaimInvoiceNum(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                  Valor Pago (Kz)
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  className="w-full border border-neutral-300 px-3 py-2 text-sm font-mono bg-white focus:outline-none"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(Number(e.target.value))}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-xs uppercase tracking-wider font-semibold text-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-neutral-900 hover:bg-black text-white py-2 text-xs uppercase tracking-wider font-semibold transition"
                >
                  {actionLoading ? "A submeter..." : "Submeter para Validação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
