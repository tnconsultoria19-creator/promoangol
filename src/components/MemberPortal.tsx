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
  onRequestTransfer: (recipientNumber: string, points: number) => Promise<void>;
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
  onRequestTransfer,
}) => {
  const [tab, setTab] = useState<"overview" | "wallet" | "redemptions" | "transfers">("overview");

  // Forms
  const [redeemListingId, setRedeemListingId] = useState("");
  const [redeemPoints, setRedeemPoints] = useState(800);
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferPoints, setTransferPoints] = useState(100);
  const [actionLoading, setActionLoading] = useState(false);

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

  return (
    <div className="content-width py-12 space-y-10">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-zinc-200">
        <div>
          <span className="eyebrow eyebrow-dark">PORTAL DO MEMBRO</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-zinc-900 mt-1">
            Olá, {memberSummary?.profile?.full_name || session.name}
          </h1>
          <p className="text-xs text-zinc-500 font-light mt-1">
            Nº de Membro: <strong className="font-mono text-zinc-800">{memberSummary?.profile?.member_number || session.detail}</strong> · 1 Ponto = 1 Kz
          </p>
        </div>

        {/* Portal Tabs */}
        <div className="flex items-center gap-6 text-xs uppercase tracking-widest font-medium text-zinc-500">
          <button
            className={`pb-2 border-b-2 transition ${tab === "overview" ? "border-zinc-950 text-zinc-950 font-bold" : "border-transparent hover:text-zinc-950"}`}
            onClick={() => setTab("overview")}
          >
            Visão Geral
          </button>
          <button
            className={`pb-2 border-b-2 transition ${tab === "wallet" ? "border-zinc-950 text-zinc-950 font-bold" : "border-transparent hover:text-zinc-950"}`}
            onClick={() => setTab("wallet")}
          >
            Livro Razão ({memberLedger.length})
          </button>
          <button
            className={`pb-2 border-b-2 transition ${tab === "redemptions" ? "border-zinc-950 text-zinc-950 font-bold" : "border-transparent hover:text-zinc-950"}`}
            onClick={() => setTab("redemptions")}
          >
            Resgatar Pontos
          </button>
          <button
            className={`pb-2 border-b-2 transition ${tab === "transfers" ? "border-zinc-950 text-zinc-950 font-bold" : "border-transparent hover:text-zinc-950"}`}
            onClick={() => setTab("transfers")}
          >
            Transferências
          </button>
        </div>
      </div>

      {/* VIEW: OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-12">
          {/* Top Two Columns: Digital Card + Wallet */}
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <DigitalMemberCard
              fullName={memberSummary?.profile?.full_name || session.name}
              memberNumber={memberSummary?.profile?.member_number || session.detail}
              planName={memberSummary?.profile?.plan_name || "Standard"}
              status="ACTIVE"
            />

            <WalletCard
              availablePoints={memberSummary?.balances?.available_points ?? 0}
              pendingPoints={memberSummary?.balances?.pending_points ?? 0}
              reservedPoints={memberSummary?.balances?.reserved_points ?? 0}
            />
          </div>

          {/* Pending Confirmations Section (CRITICAL WORKFLOW) */}
          <div className="border border-amber-200 bg-amber-50/40 p-6 md:p-8 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="eyebrow text-amber-700">DUPLA CONFIRMAÇÃO DE COMPRA</span>
                <h3 className="font-serif text-2xl font-light text-zinc-900 mt-1">
                  Compras por Validar ({pendingConfirmations.length})
                </h3>
                <p className="text-xs text-zinc-600 font-light mt-1">
                  O parceiro comercial registou a sua compra no balcão. Verifique os valores abaixo e aprove para creditar os pontos de recompensa.
                </p>
              </div>
            </div>

            <div className="divide-y divide-amber-200/60 pt-2">
              {pendingConfirmations.map((tx) => (
                <div key={tx.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono tracking-wider uppercase text-amber-800 font-bold">
                      Ref: #{tx.transaction_number} · {tx.partner_name}
                    </span>
                    <h4 className="font-serif text-lg font-medium text-zinc-900">{tx.listing_title}</h4>
                    <p className="text-xs text-zinc-500 font-light">
                      Total Pago: <strong className="text-zinc-800">{formatKz(tx.amount_paid_kz)}</strong> · Recompensa a Ganhar:{" "}
                      <strong className="text-teal-700 font-mono">+{tx.points_to_release} Pontos</strong>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onConfirmPurchase(tx.id, "CONFIRM")}
                      className="bg-[#1c1c1c] hover:bg-black text-white px-5 py-2.5 text-xs uppercase tracking-widest font-semibold transition"
                    >
                      Aprovar & Confirmar
                    </button>
                    <button
                      onClick={() => onConfirmPurchase(tx.id, "REJECT", "Rejeitado pelo membro")}
                      className="border border-red-300 text-red-700 hover:bg-red-50 px-4 py-2.5 text-xs uppercase tracking-widest font-semibold transition"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}

              {pendingConfirmations.length === 0 && (
                <p className="py-4 text-xs text-zinc-400 italic font-light">
                  Não possui nenhuma compra pendente de confirmação. As suas compras no balcão de parceiros aparecerão aqui.
                </p>
              )}
            </div>
          </div>

          {/* Recent Transaction Rail */}
          <div className="border border-zinc-200 p-6 md:p-8 space-y-4">
            <h3 className="font-serif text-2xl font-light text-zinc-900">Histórico de Atividade Recente</h3>
            <div className="divide-y divide-zinc-100 text-xs">
              {memberTxList.slice(0, 6).map((tx) => (
                <div key={tx.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-medium text-zinc-900 block font-serif text-sm">
                      {tx.listing_title || "Compra Comercial"}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {tx.partner_name} · {tx.created_at?.slice(0, 10)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-zinc-900 block">{formatKz(tx.amount_paid_kz)}</span>
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${tx.status === "VERIFIED" ? "bg-teal-50 text-teal-800" : "bg-zinc-100 text-zinc-600"}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
              {memberTxList.length === 0 && (
                <p className="py-4 text-xs text-zinc-400 italic">Sem transações registadas ainda.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: WALLET & LEDGER */}
      {tab === "wallet" && (
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="eyebrow eyebrow-dark">TRANSPARÊNCIA TOTAL</span>
              <h2 className="font-serif text-3xl font-light text-zinc-900">Livro Razão Imutável de Pontos</h2>
              <p className="text-xs text-zinc-500 font-light mt-1">
                Todas as entradas, saídas, reservas e expirações de pontos são gravadas de forma permanente.
              </p>
            </div>
          </div>

          <div className="border border-zinc-200 overflow-x-auto bg-white">
            <table className="w-full text-left text-xs font-mono divide-y divide-zinc-200">
              <thead className="bg-zinc-50 text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Bucket</th>
                  <th className="p-3">Movimento</th>
                  <th className="p-3">Pontos</th>
                  <th className="p-3">Razão / Referência</th>
                  <th className="p-3">Expiração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {memberLedger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-zinc-50/80 transition">
                    <td className="p-3 text-zinc-500">{entry.created_at?.slice(0, 16)}</td>
                    <td className="p-3 font-semibold text-zinc-800">{entry.bucket}</td>
                    <td className={`p-3 font-bold ${entry.direction === "CREDIT" ? "text-teal-700" : "text-red-700"}`}>
                      {entry.direction === "CREDIT" ? "+ CRÉDITO" : "- DÉBITO"}
                    </td>
                    <td className="p-3 font-bold">{entry.points} pts</td>
                    <td className="p-3 text-zinc-700 font-sans">{entry.reason}</td>
                    <td className="p-3 text-zinc-400">{entry.expires_at?.slice(0, 10) || "—"}</td>
                  </tr>
                ))}
                {memberLedger.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-400 italic">
                      Nenhum movimento no livro razão associado a esta conta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: REDEMPTIONS */}
      {tab === "redemptions" && (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Request Form */}
          <div className="border border-zinc-200 p-6 bg-zinc-50 space-y-4">
            <span className="eyebrow eyebrow-dark">RESGATE DE PONTOS</span>
            <h3 className="font-serif text-2xl font-light text-zinc-900">Solicitar Benefício</h3>
            <p className="text-xs text-zinc-500 font-light leading-relaxed">
              Mínimo de resgate: <strong>800 pontos</strong> (Kz 800). Os seus pontos ficam reservados.
              Após aprovação do parceiro e do Master Admin, receberá um código OTP de uso único para apresentar no balcão.
            </p>

            <form onSubmit={handleRedeemSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Selecione a Oferta Comercial
                </label>
                <select
                  required
                  className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none"
                  value={redeemListingId}
                  onChange={(e) => setRedeemListingId(e.target.value)}
                >
                  <option value="">-- Escolher Oferta --</option>
                  {promotions.map((p) => (
                    <option key={p.id} value={p.listing_id || ""}>
                      {p.title} ({p.partner_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Pontos a Descontar (Mínimo 800)
                </label>
                <input
                  type="number"
                  required
                  min={800}
                  className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white font-mono focus:outline-none"
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(Number(e.target.value))}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-[#1c1c1c] hover:bg-black text-white py-3 text-xs uppercase tracking-widest font-semibold transition disabled:opacity-50"
              >
                {actionLoading ? "A submeter..." : "Confirmar Reserva de Pontos"}
              </button>
            </form>
          </div>

          {/* Redemptions List */}
          <div className="md:col-span-2 border border-zinc-200 p-6 md:p-8 bg-white space-y-4">
            <h3 className="font-serif text-2xl font-light text-zinc-900">Os Meus Pedidos de Resgate</h3>
            <div className="divide-y divide-zinc-100 text-xs">
              {memberRedemptions.map((r) => (
                <div key={r.id} className="py-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-zinc-900">
                      Resgate #{r.redemption_number} · {r.partner_name}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded ${r.status === "APPROVED" ? "bg-teal-100 text-teal-900" : r.status === "USED" ? "bg-zinc-200 text-zinc-700" : "bg-amber-100 text-amber-900"}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-zinc-600">Oferta: {r.listing_title} · Pontos Reservados: <strong className="font-mono">{r.points_requested} pts</strong></p>
                  <p className="text-zinc-500">Valor Complementar em Dinheiro: <strong className="text-zinc-900">{formatKz(r.cash_amount_kz)}</strong></p>

                  {r.status === "APPROVED" && (
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded mt-2">
                      <p className="text-xs font-bold text-teal-900">Resgate Aprovado pelo Administrador!</p>
                      <p className="text-xs text-teal-800 mt-1">
                        Apresente a referência <strong>#{r.redemption_number}</strong> e o código OTP emitido no balcão do parceiro.
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-1 font-mono">Validade do Token: {r.approval_expires_at}</p>
                    </div>
                  )}
                </div>
              ))}

              {memberRedemptions.length === 0 && (
                <p className="py-4 text-xs text-zinc-400 italic">Nenhum resgate solicitado de momento.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: TRANSFERS */}
      {tab === "transfers" && (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Transfer Form */}
          <div className="border border-zinc-200 p-6 bg-zinc-50 space-y-4">
            <span className="eyebrow eyebrow-dark">TRANSFERÊNCIA ENTRE MEMBROS</span>
            <h3 className="font-serif text-2xl font-light text-zinc-900">Enviar Pontos</h3>
            <p className="text-xs text-zinc-500 font-light leading-relaxed">
              Transfira pontos para qualquer membro ativo através do seu número oficial (ex: PA923456789).
              As transferências passam por aprovação administrativa e o crédito ocorre em 3 dias úteis.
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Nº de Membro Destinatário
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: PA923456789"
                  className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white font-mono uppercase focus:outline-none"
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Quantidade de Pontos
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white font-mono focus:outline-none"
                  value={transferPoints}
                  onChange={(e) => setTransferPoints(Number(e.target.value))}
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-[#1c1c1c] hover:bg-black text-white py-3 text-xs uppercase tracking-widest font-semibold transition disabled:opacity-50"
              >
                {actionLoading ? "A enviar..." : "Iniciar Transferência"}
              </button>
            </form>
          </div>

          {/* Transfers History */}
          <div className="md:col-span-2 border border-zinc-200 p-6 md:p-8 bg-white space-y-6">
            <div>
              <h4 className="font-serif text-xl font-light mb-3 text-zinc-900">Transferências Enviadas</h4>
              <div className="divide-y divide-zinc-100 text-xs">
                {memberTransfersSent.map((t) => (
                  <div key={t.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-zinc-900 block">
                        Destinatário: {t.recipient_name} ({t.recipient_number})
                      </span>
                      <span className="text-[10px] text-zinc-400">Ref: #{t.transfer_number} · {t.created_at?.slice(0, 10)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-red-700 block">-{t.points} pts</span>
                      <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">{t.status}</span>
                    </div>
                  </div>
                ))}
                {memberTransfersSent.length === 0 && <p className="text-xs text-zinc-400 italic py-2">Nenhum envio realizado.</p>}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <h4 className="font-serif text-xl font-light mb-3 text-zinc-900">Transferências Recebidas</h4>
              <div className="divide-y divide-zinc-100 text-xs">
                {memberTransfersRecv.map((t) => (
                  <div key={t.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-zinc-900 block">
                        Remetente: {t.sender_name} ({t.sender_number})
                      </span>
                      <span className="text-[10px] text-zinc-400">Ref: #{t.transfer_number} · {t.created_at?.slice(0, 10)}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-teal-700 block">+{t.points} pts</span>
                      <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">{t.status}</span>
                    </div>
                  </div>
                ))}
                {memberTransfersRecv.length === 0 && <p className="text-xs text-zinc-400 italic py-2">Nenhum recebimento registado.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
