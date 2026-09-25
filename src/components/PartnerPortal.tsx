import React, { useState } from "react";
import type { UserSession } from "../types";

interface PartnerPortalProps {
  session: UserSession;
  partnerSummary: any;
  partnerRedemptions: any[];
  onVerifyMember: (memberNumber: string) => Promise<{ member: any; promotions: any[] }>;
  onRecordPurchase: (memberId: string, listingId: string, promotionId: string, amountKz: number) => Promise<void>;
  onPartnerRedeemAction: (redId: string, action: "APPROVE" | "REJECT") => Promise<void>;
  onVerifyRedemptionToken: (redId: string, token: string) => Promise<void>;
  onSaveListing: (listing: { id?: string; title: string; description?: string; base_price_kz: number }) => Promise<void>;
  onDeleteListing?: (listingId: string) => Promise<void>;
  onCancelTransaction?: (txId: string) => Promise<void>;
  onRefresh: () => void;
}

export const PartnerPortal: React.FC<PartnerPortalProps> = ({
  session,
  partnerSummary,
  partnerRedemptions,
  onVerifyMember,
  onRecordPurchase,
  onPartnerRedeemAction,
  onVerifyRedemptionToken,
  onSaveListing,
  onDeleteListing,
  onCancelTransaction,
}) => {
  const [tab, setTab] = useState<"overview" | "record" | "redemptions" | "listings">("overview");

  // Member Search State
  const [searchNumber, setSearchNumber] = useState("");
  const [verifiedMember, setVerifiedMember] = useState<any>(null);
  const [verifiedPromos, setVerifiedPromos] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Purchase Form
  const [selectedListingId, setSelectedListingId] = useState("");
  const [purchaseAmountKz, setPurchaseAmountKz] = useState<number>(0);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // OTP Verification
  const [otpRedemptionId, setOtpRedemptionId] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Listing Form
  const [listingForm, setListingForm] = useState({ id: "", title: "", description: "", base_price_kz: 25000 });
  const [isAddingListing, setIsAddingListing] = useState(false);

  const formatKz = (num?: number | null) =>
    num != null ? new Intl.NumberFormat("pt-AO").format(num) + " Kz" : "—";

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    setVerifiedMember(null);
    try {
      const data = await onVerifyMember(searchNumber);
      setVerifiedMember(data.member);
      setVerifiedPromos(data.promotions || []);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedMember) return;
    const promo = verifiedPromos.find((p) => p.listing_id === selectedListingId);
    setPurchaseLoading(true);
    try {
      await onRecordPurchase(
        verifiedMember.id,
        selectedListingId,
        promo ? promo.id : "",
        purchaseAmountKz
      );
      setVerifiedMember(null);
      setSelectedListingId("");
      setPurchaseAmountKz(0);
      setSearchNumber("");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    try {
      await onVerifyRedemptionToken(otpRedemptionId, otpToken);
      setOtpRedemptionId("");
      setOtpToken("");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveListing(listingForm);
    setListingForm({ id: "", title: "", description: "", base_price_kz: 25000 });
    setIsAddingListing(false);
  };

  const handleDeleteListingClick = async (listingId: string, title: string) => {
    if (window.confirm(`Tem a certeza que deseja remover o serviço "${title}"?`)) {
      if (onDeleteListing) {
        await onDeleteListing(listingId);
      }
    }
  };

  return (
    <div className="content-width py-10 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-neutral-200">
        <div>
          <span className="eyebrow eyebrow-dark">PORTAL DO PARCEIRO COMERCIAL</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-neutral-900 mt-1">
            {partnerSummary?.partner?.name || "Painel do Parceiro"}
          </h1>
          <p className="text-sm text-neutral-500 font-light mt-1">
            Operador: <strong className="text-neutral-800 font-semibold">{session.name}</strong> ({session.role === "PARTNER_ADMIN" ? "Administrador do Estabelecimento" : "Operador de Balcão"})
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 text-sm uppercase tracking-wider font-semibold text-neutral-500 overflow-x-auto pb-1 max-w-full">
          <button
            className={`pb-2 border-b-2 transition shrink-0 ${tab === "overview" ? "border-neutral-900 text-neutral-900 font-bold" : "border-transparent hover:text-neutral-900"}`}
            onClick={() => setTab("overview")}
          >
            Visão Geral
          </button>
          <button
            className={`pb-2 border-b-2 transition shrink-0 ${tab === "record" ? "border-neutral-900 text-neutral-900 font-bold" : "border-transparent hover:text-neutral-900"}`}
            onClick={() => setTab("record")}
          >
            Registar Venda
          </button>
          <button
            className={`pb-2 border-b-2 transition shrink-0 ${tab === "redemptions" ? "border-neutral-900 text-neutral-900 font-bold" : "border-transparent hover:text-neutral-900"}`}
            onClick={() => setTab("redemptions")}
          >
            Resgates ({partnerRedemptions?.length || 0})
          </button>
          <button
            className={`pb-2 border-b-2 transition shrink-0 ${tab === "listings" ? "border-neutral-900 text-neutral-900 font-bold" : "border-transparent hover:text-neutral-900"}`}
            onClick={() => setTab("listings")}
          >
            Serviços & Preçário ({partnerSummary?.listings?.length || 0})
          </button>
        </div>
      </div>

      {/* VIEW: OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="p-6 border border-neutral-200 bg-white shadow-sm">
              <span className="text-xs uppercase tracking-wider text-neutral-500 block font-semibold">Vendas de Hoje</span>
              <span className="font-mono text-3xl font-bold mt-2 block text-neutral-900">{partnerSummary?.stats?.todayCount ?? 0}</span>
            </div>
            <div className="p-6 border border-neutral-200 bg-white shadow-sm">
              <span className="text-xs uppercase tracking-wider text-neutral-500 block font-semibold">Volume Comercial Hoje</span>
              <span className="font-mono text-xl sm:text-2xl font-bold mt-2 block text-neutral-900">{formatKz(partnerSummary?.stats?.todayVolume ?? 0)}</span>
            </div>
            <div className="p-6 border border-neutral-200 bg-white shadow-sm">
              <span className="text-xs uppercase tracking-wider text-neutral-500 block font-semibold">Confirmações Pendentes</span>
              <span className="font-mono text-3xl font-bold mt-2 block text-amber-600">{partnerSummary?.stats?.pendingConfirm ?? 0}</span>
            </div>
            <div className="p-6 border border-neutral-200 bg-white shadow-sm">
              <span className="text-xs uppercase tracking-wider text-neutral-500 block font-semibold">Resgates a Validar</span>
              <span className="font-mono text-3xl font-bold mt-2 block text-teal-800">{partnerSummary?.stats?.pendingRedeem ?? 0}</span>
            </div>
          </div>

          <div className="border border-neutral-200 p-6 md:p-8 bg-white shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-2xl font-light text-neutral-900">Vendas Registadas Recentemente</h3>
              <button
                onClick={() => setTab("record")}
                className="bg-neutral-900 hover:bg-black text-white text-xs uppercase tracking-wider font-semibold py-2 px-4 transition"
              >
                + Nova Venda
              </button>
            </div>

            <div className="divide-y divide-neutral-100 text-sm">
              {partnerSummary?.transactions?.map((tx: any) => (
                <div key={tx.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="font-semibold text-neutral-900 block text-base font-serif">
                      {tx.member_name} ({tx.member_number})
                    </span>
                    <span className="text-xs text-neutral-500 mt-0.5 block">
                      Serviço: <strong className="text-neutral-700">{tx.listing_title}</strong> · Ref: #{tx.transaction_number} · {tx.created_at?.slice(0, 16)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-mono font-bold text-base block text-neutral-900">{formatKz(tx.amount_paid_kz)}</span>
                      <span className={`text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded ${tx.status === "VERIFIED" ? "bg-teal-50 text-teal-800 border border-teal-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
                        {tx.status}
                      </span>
                    </div>
                    {tx.status !== "VERIFIED" && onCancelTransaction && (
                      <button
                        type="button"
                        onClick={() => onCancelTransaction(tx.id)}
                        className="btn-remove-sm"
                        title="Cancelar registo"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(!partnerSummary?.transactions || partnerSummary.transactions.length === 0) && (
                <p className="py-8 text-sm text-neutral-400 italic text-center">Nenhuma venda registada até ao momento.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: RECORD PURCHASE */}
      {tab === "record" && (
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="border border-neutral-200 p-6 md:p-8 bg-neutral-50/70 shadow-sm space-y-4">
            <span className="eyebrow eyebrow-dark">PASSO 1: IDENTIFICAR CLIENTE</span>
            <h3 className="font-serif text-2xl font-light text-neutral-900">Validar Cartão ou Nº do Membro</h3>
            <p className="text-sm text-neutral-600 font-light leading-relaxed">
              Introduza o número de membro PromoAngol apresentado pelo cliente para verificar a elegibilidade e as condições promocionais ativas.
            </p>

            <form onSubmit={handleSearchSubmit} className="space-y-4 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: PA-000000 ou PA-304812"
                  className="flex-grow border border-neutral-300 px-4 py-2.5 text-sm bg-white font-mono uppercase focus:outline-none focus:border-neutral-900"
                  value={searchNumber}
                  onChange={(e) => setSearchNumber(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="bg-neutral-900 hover:bg-black text-white px-6 py-2.5 text-xs uppercase tracking-widest font-semibold transition disabled:opacity-50"
                >
                  {searchLoading ? "A verificar..." : "Validar"}
                </button>
              </div>
            </form>

            {verifiedMember && (
              <div className="mt-6 p-5 border border-teal-200 bg-teal-50/70 rounded space-y-2 text-sm">
                <span className="text-xs uppercase tracking-wider text-teal-800 font-bold block">
                  ✓ Membro Ativo e Elegível
                </span>
                <p className="font-serif text-xl font-bold text-neutral-900">{verifiedMember.full_name}</p>
                <p className="text-neutral-700 font-light">
                  Nº: <strong className="font-mono">{verifiedMember.member_number}</strong> · Plano: <strong>{verifiedMember.plan_name}</strong>
                </p>
                <p className="text-teal-900 font-semibold font-mono text-base">
                  Saldo Disponível: {verifiedMember.available_points} pontos
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Record Sale Form */}
          <div className="border border-neutral-200 p-6 md:p-8 bg-white shadow-sm space-y-4">
            <span className="eyebrow eyebrow-dark">PASSO 2: SUBMETER VENDA</span>
            <h3 className="font-serif text-2xl font-light text-neutral-900">Registar Venda Promovida</h3>
            <p className="text-sm text-neutral-600 font-light leading-relaxed">
              Selecione o serviço do seu catálogo e confirme o valor pago em Kwanzas. O cliente receberá a notificação de validação no telemóvel.
            </p>

            {verifiedMember ? (
              <form onSubmit={handlePurchaseSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                    Serviço / Artigo Vendido
                  </label>
                  <select
                    required
                    className="w-full border border-neutral-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-neutral-900"
                    value={selectedListingId}
                    onChange={(e) => {
                      setSelectedListingId(e.target.value);
                      const match = partnerSummary?.listings?.find((l: any) => l.id === e.target.value);
                      if (match) setPurchaseAmountKz(match.base_price_kz);
                    }}
                  >
                    <option value="">-- Escolher Serviço --</option>
                    {partnerSummary?.listings?.map((l: any) => (
                      <option key={l.id} value={l.id}>
                        {l.title} - Preço: {formatKz(l.base_price_kz)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                    Valor Cobrado ao Cliente (Kz)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full border border-neutral-300 px-3 py-2.5 text-base font-mono bg-white focus:outline-none focus:border-neutral-900"
                    value={purchaseAmountKz || ""}
                    onChange={(e) => setPurchaseAmountKz(Number(e.target.value))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={purchaseLoading || !selectedListingId || purchaseAmountKz <= 0}
                  className="w-full bg-neutral-900 hover:bg-black text-white py-3.5 text-xs uppercase tracking-widest font-semibold transition disabled:opacity-50 mt-4"
                >
                  {purchaseLoading ? "A registar transação..." : "Confirmar e Enviar para Validação"}
                </button>
              </form>
            ) : (
              <div className="py-12 text-center text-neutral-400 bg-neutral-50 rounded border border-dashed border-neutral-200">
                <p className="text-sm">Valide primeiro o número do membro no Passo 1 ao lado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: REDEMPTIONS */}
      {tab === "redemptions" && (
        <div className="space-y-8">
          {/* OTP Validation Box */}
          <div className="border border-neutral-200 p-6 md:p-8 bg-neutral-50/70 shadow-sm max-w-xl space-y-4">
            <span className="eyebrow eyebrow-dark">ENTREGA DE BENEFÍCIO</span>
            <h3 className="font-serif text-2xl font-light text-neutral-900">Validar Código OTP do Cliente</h3>
            <p className="text-sm text-neutral-600 font-light">
              Quando o cliente apresenta o código de 6 dígitos gerado pela aplicação, introduza-o abaixo para concluir o resgate.
            </p>

            <form onSubmit={handleOtpSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                  ID do Resgate
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: RED-1042"
                  className="w-full border border-neutral-300 px-3 py-2.5 text-sm bg-white font-mono focus:outline-none"
                  value={otpRedemptionId}
                  onChange={(e) => setOtpRedemptionId(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                  Código OTP de 6 Dígitos
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Ex: 584920"
                  className="w-full border border-neutral-300 px-3 py-2.5 text-lg font-mono text-center tracking-widest bg-white focus:outline-none"
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full bg-neutral-900 hover:bg-black text-white py-3 text-xs uppercase tracking-widest font-semibold transition disabled:opacity-50"
              >
                {otpLoading ? "A verificar..." : "Validar e Entregar Benefício"}
              </button>
            </form>
          </div>

          {/* Redemptions List */}
          <div className="border border-neutral-200 p-6 md:p-8 bg-white shadow-sm space-y-4">
            <h3 className="font-serif text-2xl font-light text-neutral-900">Histórico de Pedidos de Resgate</h3>
            <div className="divide-y divide-neutral-100 text-sm">
              {partnerRedemptions?.map((r) => (
                <div key={r.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="font-mono font-bold text-neutral-900 text-base">
                      Resgate #{r.redemption_number} · Membro: {r.member_name} ({r.member_number})
                    </span>
                    <p className="text-neutral-600 mt-1 text-sm">
                      Serviço: <strong className="text-neutral-800">{r.listing_title}</strong> · Pontos Reclamados:{" "}
                      <strong className="font-mono text-teal-800">{r.points_requested} pts</strong>
                    </p>
                    <p className="text-neutral-500 text-xs mt-0.5">
                      Montante em Dinheiro a Cobrar: <strong>{formatKz(r.cash_amount_kz)}</strong>
                    </p>
                  </div>

                  <div>
                    {r.status === "REQUESTED" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onPartnerRedeemAction(r.id, "APPROVE")}
                          className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold py-2 px-4 uppercase tracking-wider transition"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => onPartnerRedeemAction(r.id, "REJECT")}
                          className="border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold py-2 px-4 uppercase tracking-wider transition"
                        >
                          Rejeitar
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs uppercase font-bold tracking-wider px-3 py-1 rounded ${r.status === "USED" ? "bg-neutral-100 text-neutral-600" : r.status === "APPROVED" ? "bg-teal-100 text-teal-900" : "bg-neutral-100 text-neutral-700"}`}>
                        {r.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {(!partnerRedemptions || partnerRedemptions.length === 0) && (
                <p className="py-8 text-sm text-neutral-400 italic text-center">Nenhum pedido de resgate registado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: LISTINGS MANAGEMENT (WITH ADD AND REMOVE!) */}
      {tab === "listings" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-serif text-2xl font-light text-neutral-900">Serviços & Preçário do Estabelecimento</h3>
              <p className="text-sm text-neutral-500 font-light mt-1">
                Adicione, edite ou remova serviços que a sua empresa disponibiliza aos membros PromoAngol.
              </p>
            </div>
            {!isAddingListing && !listingForm.id && (
              <button
                type="button"
                onClick={() => {
                  setListingForm({ id: "", title: "", description: "", base_price_kz: 25000 });
                  setIsAddingListing(true);
                }}
                className="btn-add-primary"
              >
                + Adicionar Novo Serviço
              </button>
            )}
          </div>

          {/* Form Modal / Inline Box for Adding / Editing */}
          {(isAddingListing || listingForm.id) && (
            <div className="border border-neutral-300 p-6 md:p-8 bg-neutral-50/80 rounded shadow-md space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
                <h4 className="font-serif text-xl font-medium text-neutral-900">
                  {listingForm.id ? "Editar Serviço Existente" : "Adicionar Novo Serviço"}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setListingForm({ id: "", title: "", description: "", base_price_kz: 25000 });
                    setIsAddingListing(false);
                  }}
                  className="text-neutral-400 hover:text-neutral-800 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleListingSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                      Título do Serviço / Quarto / Menu
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Suite Deluxe com Vista Mar ou Menu Degustação"
                      className="w-full border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-neutral-900"
                      value={listingForm.title}
                      onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                      Preço de Tabela Base (Kz)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="Ex: 50000"
                      className="w-full border border-neutral-300 px-3 py-2 text-sm font-mono bg-white focus:outline-none focus:border-neutral-900"
                      value={listingForm.base_price_kz}
                      onChange={(e) => setListingForm({ ...listingForm, base_price_kz: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                    Descrição Detalhada do Serviço
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva o que está incluído nesta oferta..."
                    className="w-full border border-neutral-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-neutral-900"
                    value={listingForm.description}
                    onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setListingForm({ id: "", title: "", description: "", base_price_kz: 25000 });
                      setIsAddingListing(false);
                    }}
                    className="px-5 py-2.5 border border-neutral-300 text-neutral-700 text-xs uppercase tracking-wider font-semibold hover:bg-neutral-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs uppercase tracking-wider font-semibold transition"
                  >
                    {listingForm.id ? "Salvar Alterações" : "Adicionar Serviço"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Listings Table with Remove/Delete Button */}
          <div className="border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-100">
            {partnerSummary?.listings?.map((l: any) => (
              <div key={l.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/50 transition">
                <div className="flex-1">
                  <h5 className="font-serif text-lg font-medium text-neutral-900">{l.title}</h5>
                  <p className="text-neutral-500 text-sm font-light mt-0.5">{l.description || "Sem descrição adicional"}</p>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <span className="font-mono font-bold text-base text-neutral-900 block">{formatKz(l.base_price_kz)}</span>
                    <span className="text-[11px] uppercase tracking-wider text-teal-800 font-semibold">Estado: {l.status || "Ativo"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setListingForm({ id: l.id, title: l.title, description: l.description || "", base_price_kz: l.base_price_kz });
                        setIsAddingListing(true);
                      }}
                      className="border border-neutral-300 hover:border-neutral-900 text-neutral-800 px-3 py-1.5 text-xs uppercase font-semibold transition"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteListingClick(l.id, l.title)}
                      className="btn-remove-sm"
                      title="Eliminar este serviço"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {(!partnerSummary?.listings || partnerSummary.listings.length === 0) && (
              <div className="py-12 text-center text-neutral-400">
                <p className="text-base font-serif mb-2">Ainda não tem serviços registados.</p>
                <button
                  type="button"
                  onClick={() => setIsAddingListing(true)}
                  className="btn-add-primary mt-2"
                >
                  + Adicionar o Primeiro Serviço
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
