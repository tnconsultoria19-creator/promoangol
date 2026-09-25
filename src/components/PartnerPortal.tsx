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
  const [listingForm, setListingForm] = useState({ id: "", title: "", description: "", base_price_kz: 15000 });

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
    setListingForm({ id: "", title: "", description: "", base_price_kz: 15000 });
  };

  return (
    <div className="content-width py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-zinc-200">
        <div>
          <span className="eyebrow eyebrow-dark">PORTAL DO PARCEIRO COMERCIAL</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-zinc-900 mt-1">
            {partnerSummary?.partner?.name || "Painel do Parceiro"}
          </h1>
          <p className="text-xs text-zinc-500 font-light mt-1">
            Operador: <strong className="text-zinc-800">{session.name}</strong> ({session.role === "PARTNER_ADMIN" ? "Administrador do Estabelecimento" : "Operador de Balcão"})
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 text-xs uppercase tracking-widest font-medium text-zinc-500">
          <button
            className={`pb-2 border-b-2 transition ${tab === "overview" ? "border-zinc-950 text-zinc-950 font-bold" : "border-transparent hover:text-zinc-950"}`}
            onClick={() => setTab("overview")}
          >
            Visão Geral
          </button>
          <button
            className={`pb-2 border-b-2 transition ${tab === "record" ? "border-zinc-950 text-zinc-950 font-bold" : "border-transparent hover:text-zinc-950"}`}
            onClick={() => setTab("record")}
          >
            Registar Venda
          </button>
          <button
            className={`pb-2 border-b-2 transition ${tab === "redemptions" ? "border-zinc-950 text-zinc-950 font-bold" : "border-transparent hover:text-zinc-950"}`}
            onClick={() => setTab("redemptions")}
          >
            Resgates ({partnerRedemptions.length})
          </button>
          <button
            className={`pb-2 border-b-2 transition ${tab === "listings" ? "border-zinc-950 text-zinc-950 font-bold" : "border-transparent hover:text-zinc-950"}`}
            onClick={() => setTab("listings")}
          >
            Ofertas & Preçário
          </button>
        </div>
      </div>

      {/* VIEW: OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 border border-zinc-200 bg-white">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">Vendas de Hoje</span>
              <span className="font-mono text-3xl font-bold mt-2 block text-zinc-900">{partnerSummary?.stats?.todayCount ?? 0}</span>
            </div>
            <div className="p-6 border border-zinc-200 bg-white">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">Volume Comercial Hoje</span>
              <span className="font-mono text-xl font-bold mt-2 block text-zinc-900">{formatKz(partnerSummary?.stats?.todayVolume ?? 0)}</span>
            </div>
            <div className="p-6 border border-zinc-200 bg-white">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">Confirmações Pendentes</span>
              <span className="font-mono text-3xl font-bold mt-2 block text-amber-600">{partnerSummary?.stats?.pendingConfirm ?? 0}</span>
            </div>
            <div className="p-6 border border-zinc-200 bg-white">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">Resgates a Validar</span>
              <span className="font-mono text-3xl font-bold mt-2 block text-teal-800">{partnerSummary?.stats?.pendingRedeem ?? 0}</span>
            </div>
          </div>

          <div className="border border-zinc-200 p-6 md:p-8 bg-white space-y-4">
            <h3 className="font-serif text-2xl font-light text-zinc-900">Vendas Registadas Recentemente</h3>
            <div className="divide-y divide-zinc-100 text-xs">
              {partnerSummary?.transactions?.map((tx: any) => (
                <div key={tx.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <span className="font-medium text-zinc-900 block font-serif text-sm">
                      {tx.member_name} ({tx.member_number})
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Serviço: {tx.listing_title} · Ref: #{tx.transaction_number} · {tx.created_at?.slice(0, 16)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold block text-zinc-900">{formatKz(tx.amount_paid_kz)}</span>
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${tx.status === "VERIFIED" ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-800"}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!partnerSummary?.transactions || partnerSummary.transactions.length === 0) && (
                <p className="py-4 text-xs text-zinc-400 italic">Nenhuma venda registada hoje.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: RECORD PURCHASE */}
      {tab === "record" && (
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="border border-zinc-200 p-6 md:p-8 bg-zinc-50 space-y-4">
            <span className="eyebrow eyebrow-dark">PASSO 1: IDENTIFICAR CLIENTE</span>
            <h3 className="font-serif text-2xl font-light text-zinc-900">Validar Cartão ou Nº do Membro</h3>
            <p className="text-xs text-zinc-500 font-light">
              Introduza o número de membro PromoAngol (ex: PA923456789) apresentado pelo cliente para carregar a elegibilidade e as condições promocionais ativas.
            </p>

            <form onSubmit={handleSearchSubmit} className="space-y-4 pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ex: PA923456789"
                  className="flex-grow border border-zinc-200 px-3 py-2 text-sm bg-white font-mono uppercase focus:outline-none"
                  value={searchNumber}
                  onChange={(e) => setSearchNumber(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="bg-[#1c1c1c] hover:bg-black text-white px-5 py-2 text-xs uppercase tracking-widest font-semibold transition disabled:opacity-50"
                >
                  {searchLoading ? "A verificar..." : "Validar"}
                </button>
              </div>
            </form>

            {verifiedMember && (
              <div className="mt-6 p-4 border border-teal-200 bg-teal-50/60 rounded space-y-2 text-xs animate-fade-in">
                <span className="text-[10px] uppercase tracking-wider text-teal-800 font-bold block">
                  ✓ Membro Ativo e Elegível
                </span>
                <p className="font-serif text-lg font-bold text-zinc-900">{verifiedMember.full_name}</p>
                <p className="text-zinc-600 font-light">
                  Nº: <strong className="font-mono">{verifiedMember.member_number}</strong> · Plano: <strong>{verifiedMember.plan_name}</strong>
                </p>
                <p className="text-teal-900 font-semibold font-mono">
                  Saldo Disponível: {verifiedMember.available_points} pontos
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Record Sale Form */}
          <div className="border border-zinc-200 p-6 md:p-8 bg-white space-y-4">
            <span className="eyebrow eyebrow-dark">PASSO 2: SUBMETER VENDA</span>
            <h3 className="font-serif text-2xl font-light text-zinc-900">Registar Venda Promovida</h3>
            <p className="text-xs text-zinc-500 font-light">
              Selecione o serviço e insira o valor exato pago. O servidor calculará a comissão PromoAngol e a recompensa do membro em tempo real.
            </p>

            {verifiedMember ? (
              <form onSubmit={handlePurchaseSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                    Serviço / Oferta Promovida
                  </label>
                  <select
                    required
                    className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none"
                    value={selectedListingId}
                    onChange={(e) => setSelectedListingId(e.target.value)}
                  >
                    <option value="">-- Escolha o Serviço --</option>
                    {verifiedPromos.map((p) => (
                      <option key={p.id} value={p.listing_id || ""}>
                        {p.title} (Preço Base: {formatKz(p.base_price_kz)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                    Valor Total Pago no Balcão (Kz)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white font-mono focus:outline-none"
                    value={purchaseAmountKz || ""}
                    onChange={(e) => setPurchaseAmountKz(Number(e.target.value))}
                  />
                </div>

                <button
                  type="submit"
                  disabled={purchaseLoading}
                  className="w-full bg-teal-800 hover:bg-teal-900 text-white py-3 text-xs uppercase tracking-widest font-semibold transition disabled:opacity-50"
                >
                  {purchaseLoading ? "A registar..." : "Submeter Venda ao Membro"}
                </button>
              </form>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-400 italic font-light">
                Valide primeiro o número do membro no Passo 1 para desbloquear o registo de venda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: REDEMPTIONS MANAGEMENT */}
      {tab === "redemptions" && (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* OTP Verification Box */}
          <div className="border border-zinc-200 p-6 bg-zinc-50 space-y-4">
            <span className="eyebrow eyebrow-dark">ENTREGA DE BENEFÍCIO</span>
            <h3 className="font-serif text-2xl font-light text-zinc-900">Validar Código OTP</h3>
            <p className="text-xs text-zinc-500 font-light leading-relaxed">
              O membro deve apresentar o código de segurança de 6 dígitos gerado após a aprovação da PromoAngol.
              A validação consome os pontos e liberta a obrigação de liquidação.
            </p>

            <form onSubmit={handleOtpSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Selecione o Resgate Aprovado
                </label>
                <select
                  required
                  className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none"
                  value={otpRedemptionId}
                  onChange={(e) => setOtpRedemptionId(e.target.value)}
                >
                  <option value="">-- Escolher Pedido --</option>
                  {partnerRedemptions
                    .filter((r) => r.status === "APPROVED")
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        #{r.redemption_number} - {r.member_name} ({r.points_requested} pts)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Código OTP do Membro (6 dígitos)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Ex: 849201"
                  className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white font-mono tracking-widest text-center focus:outline-none"
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full bg-[#1c1c1c] hover:bg-black text-white py-3 text-xs uppercase tracking-widest font-semibold transition disabled:opacity-50"
              >
                {otpLoading ? "A verificar..." : "Validar e Entregar Benefício"}
              </button>
            </form>
          </div>

          {/* Redemptions List */}
          <div className="md:col-span-2 border border-zinc-200 p-6 md:p-8 bg-white space-y-4">
            <h3 className="font-serif text-2xl font-light text-zinc-900">Pedidos de Resgate no Estabelecimento</h3>
            <div className="divide-y divide-zinc-100 text-xs">
              {partnerRedemptions.map((r) => (
                <div key={r.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="font-mono font-bold text-zinc-900">
                      Resgate #{r.redemption_number} · Membro: {r.member_name} ({r.member_number})
                    </span>
                    <p className="text-zinc-600 mt-1">
                      Serviço: <strong>{r.listing_title}</strong> · Pontos Reclamados:{" "}
                      <strong className="font-mono">{r.points_requested} pts</strong>
                    </p>
                    <p className="text-zinc-500">
                      Montante em Dinheiro a Cobrar: <strong>{formatKz(r.cash_amount_kz)}</strong>
                    </p>
                  </div>

                  <div>
                    {r.status === "REQUESTED" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onPartnerRedeemAction(r.id, "APPROVE")}
                          className="bg-teal-800 hover:bg-teal-900 text-white text-[10px] font-semibold py-2 px-4 uppercase tracking-wider"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => onPartnerRedeemAction(r.id, "REJECT")}
                          className="border border-red-300 text-red-700 hover:bg-red-50 text-[10px] font-semibold py-2 px-4 uppercase tracking-wider"
                        >
                          Rejeitar
                        </button>
                      </div>
                    ) : (
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded ${r.status === "USED" ? "bg-zinc-100 text-zinc-600" : r.status === "APPROVED" ? "bg-teal-100 text-teal-900" : "bg-zinc-100 text-zinc-700"}`}>
                        {r.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {partnerRedemptions.length === 0 && (
                <p className="py-4 text-xs text-zinc-400 italic">Nenhum pedido de resgate registado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: LISTINGS MANAGEMENT */}
      {tab === "listings" && (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="border border-zinc-200 p-6 bg-zinc-50 space-y-4">
            <span className="eyebrow eyebrow-dark">CATÁLOGO DO PARCEIRO</span>
            <h3 className="font-serif text-2xl font-light text-zinc-900">
              {listingForm.id ? "Editar Serviço" : "Adicionar Serviço"}
            </h3>
            <p className="text-xs text-zinc-500 font-light">
              Os parceiros gerem os seus serviços e preços de tabela. As promoções e comissões são configuradas exclusivamente pela equipa PromoAngol.
            </p>

            <form onSubmit={handleListingSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Título do Artigo / Serviço
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Suite Executiva com Vista Mar"
                  className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none"
                  value={listingForm.title}
                  onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Descrição Curta
                </label>
                <textarea
                  className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white h-20 focus:outline-none"
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                  Preço de Tabela Base (Kz)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white font-mono focus:outline-none"
                  value={listingForm.base_price_kz}
                  onChange={(e) => setListingForm({ ...listingForm, base_price_kz: Number(e.target.value) })}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-grow bg-[#1c1c1c] hover:bg-black text-white py-3 text-xs uppercase tracking-widest font-semibold transition"
                >
                  Guardar Artigo
                </button>
                {listingForm.id && (
                  <button
                    type="button"
                    onClick={() => setListingForm({ id: "", title: "", description: "", base_price_kz: 15000 })}
                    className="border border-zinc-300 text-zinc-600 px-3 py-3 text-xs uppercase font-medium"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="md:col-span-2 border border-zinc-200 p-6 md:p-8 bg-white space-y-4">
            <h3 className="font-serif text-2xl font-light text-zinc-900">Serviços Atuais da Empresa</h3>
            <div className="divide-y divide-zinc-100 text-xs">
              {partnerSummary?.listings?.map((l: any) => (
                <div key={l.id} className="py-4 flex justify-between items-center">
                  <div>
                    <h5 className="font-semibold text-sm text-zinc-900 font-serif">{l.title}</h5>
                    <p className="text-zinc-500 font-light mt-0.5">{l.description || "Sem descrição adicional"}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <span className="font-mono font-bold text-sm text-zinc-900 block">{formatKz(l.base_price_kz)}</span>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400">Estado: {l.status}</span>
                    </div>
                    <button
                      onClick={() => setListingForm({ id: l.id, title: l.title, description: l.description || "", base_price_kz: l.base_price_kz })}
                      className="text-xs uppercase font-bold text-zinc-900 hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
