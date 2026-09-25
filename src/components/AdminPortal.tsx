import React, { useState } from "react";
import type { UserSession } from "../types";

interface AdminPortalProps {
  session: UserSession;
  adminSummary: any;
  adminMembers: any[];
  adminPartners: any[];
  adminPromotions: any[];
  adminListings: any[];
  adminRedemptions: any[];
  adminTransfers: any[];
  adminSettlements: any[];
  onMemberAction: (memberId: string, action: "FREEZE" | "UNFREEZE" | "SUSPEND" | "ACTIVATE") => Promise<void>;
  onCreatePartner: (partner: any) => Promise<void>;
  onCreatePromotion: (promo: any) => Promise<void>;
  onDeletePromotion?: (promoId: string) => Promise<void>;
  onDeletePartner?: (partnerId: string) => Promise<void>;
  onAdminRedeemAction: (redId: string, action: "APPROVE" | "REJECT") => Promise<void>;
  onAdminTransferAction: (transferId: string, action: "APPROVE" | "REJECT") => Promise<void>;
  onGenerateSettlement: (partnerId: string) => Promise<void>;
  onPaySettlement: (settlementId: string, bankRef: string) => Promise<void>;
  onRefresh: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  adminSummary,
  adminMembers,
  adminPartners,
  adminPromotions,
  adminListings,
  adminRedemptions,
  adminTransfers,
  adminSettlements,
  onMemberAction,
  onCreatePartner,
  onCreatePromotion,
  onDeletePromotion,
  onDeletePartner,
  onAdminRedeemAction,
  onAdminTransferAction,
  onGenerateSettlement,
  onPaySettlement,
}) => {
  const [tab, setTab] = useState<
    "overview" | "members" | "partners" | "promotions" | "redemptions" | "transfers" | "settlements" | "audit"
  >("overview");

  // Partner Form
  const [partnerForm, setPartnerForm] = useState({
    name: "",
    legal_name: "",
    category: "Hotelaria",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    admin_email: "",
  });

  // Promotion Form
  const [promoForm, setPromoForm] = useState({
    listing_id: "",
    title: "",
    description: "",
    commission_mode: "PERCENT_OF_PURCHASE",
    commission_value: 15,
    benefit_mode: "PERCENT_OF_COMMISSION",
    benefit_value: 80,
    delivery_mode: "POINTS",
    valid_from: "",
    valid_until: "",
  });

  // Bank Reference Input per settlement
  const [bankRefs, setBankRefs] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const formatKz = (num?: number | null) =>
    num != null ? new Intl.NumberFormat("pt-AO").format(num) + " Kz" : "—";

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreatePartner(partnerForm);
      setPartnerForm({
        name: "",
        legal_name: "",
        category: "Hotelaria",
        contact_name: "",
        phone: "",
        email: "",
        address: "",
        admin_email: "",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreatePromotion(promoForm);
      setPromoForm({
        listing_id: "",
        title: "",
        description: "",
        commission_mode: "PERCENT_OF_PURCHASE",
        commission_value: 15,
        benefit_mode: "PERCENT_OF_COMMISSION",
        benefit_value: 80,
        delivery_mode: "POINTS",
        valid_from: "",
        valid_until: "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-width py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-zinc-200">
        <div>
          <span className="eyebrow eyebrow-dark">SISTEMA CENTRAL DE OPERAÇÕES</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-light text-zinc-900 mt-1">
            Master Admin PromoAngol
          </h1>
          <p className="text-xs text-zinc-500 font-light mt-1">
            Governança comercial, livro razão de pontos, autorizações de resgates e liquidações financeiras.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider font-semibold text-zinc-500 overflow-x-auto pb-1 max-w-full">
          <button
            className={`pb-2 border-b-2 shrink-0 ${tab === "overview" ? "border-zinc-950 text-zinc-950" : "border-transparent"}`}
            onClick={() => setTab("overview")}
          >
            Dashboard
          </button>
          <button
            className={`pb-2 border-b-2 shrink-0 ${tab === "members" ? "border-zinc-950 text-zinc-950" : "border-transparent"}`}
            onClick={() => setTab("members")}
          >
            Membros ({adminMembers.length})
          </button>
          <button
            className={`pb-2 border-b-2 shrink-0 ${tab === "partners" ? "border-zinc-950 text-zinc-950" : "border-transparent"}`}
            onClick={() => setTab("partners")}
          >
            Parceiros ({adminPartners.length})
          </button>
          <button
            className={`pb-2 border-b-2 shrink-0 ${tab === "promotions" ? "border-zinc-950 text-zinc-950" : "border-transparent"}`}
            onClick={() => setTab("promotions")}
          >
            Promoções ({adminPromotions.length})
          </button>
          <button
            className={`pb-2 border-b-2 shrink-0 ${tab === "redemptions" ? "border-zinc-950 text-zinc-950" : "border-transparent"}`}
            onClick={() => setTab("redemptions")}
          >
            Resgates ({adminRedemptions.filter((r) => r.status === "AWAITING_ADMIN").length})
          </button>
          <button
            className={`pb-2 border-b-2 shrink-0 ${tab === "transfers" ? "border-zinc-950 text-zinc-950" : "border-transparent"}`}
            onClick={() => setTab("transfers")}
          >
            Transferências ({adminTransfers.filter((t) => t.status === "SENDER_APPROVED").length})
          </button>
          <button
            className={`pb-2 border-b-2 shrink-0 ${tab === "settlements" ? "border-zinc-950 text-zinc-950" : "border-transparent"}`}
            onClick={() => setTab("settlements")}
          >
            Liquidação
          </button>
          <button
            className={`pb-2 border-b-2 shrink-0 ${tab === "audit" ? "border-zinc-950 text-zinc-950" : "border-transparent"}`}
            onClick={() => setTab("audit")}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {/* VIEW: OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 border border-zinc-200 bg-white">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">Total de Membros</span>
              <span className="font-mono text-3xl font-bold mt-2 block text-zinc-900">{adminSummary?.stats?.members ?? 0}</span>
            </div>
            <div className="p-6 border border-zinc-200 bg-white">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">Empresas Parceiras</span>
              <span className="font-mono text-3xl font-bold mt-2 block text-zinc-900">{adminSummary?.stats?.partners ?? 0}</span>
            </div>
            <div className="p-6 border border-zinc-200 bg-white">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">Resgates a Autorizar</span>
              <span className="font-mono text-3xl font-bold mt-2 block text-amber-600">{adminSummary?.stats?.pendingRedemptions ?? 0}</span>
            </div>
            <div className="p-6 border border-zinc-200 bg-white">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">Envios por Validar</span>
              <span className="font-mono text-3xl font-bold mt-2 block text-teal-800">{adminSummary?.stats?.pendingTransfers ?? 0}</span>
            </div>
          </div>

          <div className="border border-zinc-200 p-6 md:p-8 bg-zinc-50 space-y-4">
            <h3 className="font-serif text-2xl font-light text-zinc-900">Passivo Consolidado de Pontos no Sistema</h3>
            <p className="text-xs text-zinc-500 font-light">
              Equilíbrio financeiro derivado diretamente das entradas e saídas do livro razão imutável.
            </p>
            <div className="grid md:grid-cols-3 gap-4 pt-2">
              {adminSummary?.ledger?.map((l: any) => (
                <div key={l.bucket} className="bg-white p-5 border border-zinc-200 text-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">{l.bucket}</span>
                  <span className="font-mono text-2xl font-bold text-zinc-900 mt-1 block">
                    {new Intl.NumberFormat("pt-AO").format(l.sum)} pts
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-1 font-mono">
                    Valor: Kz {new Intl.NumberFormat("pt-AO").format(l.sum)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: MEMBERS */}
      {tab === "members" && (
        <div className="space-y-6">
          <h3 className="font-serif text-2xl font-light text-zinc-900">Membros Registados</h3>
          <div className="border border-zinc-200 overflow-x-auto bg-white">
            <table className="w-full text-left text-xs font-mono divide-y divide-zinc-200">
              <thead className="bg-zinc-50 text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Membro</th>
                  <th className="p-3">Plano</th>
                  <th className="p-3">Email / Tel</th>
                  <th className="p-3">Disponível / Pendente</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {adminMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50 transition">
                    <td className="p-3">
                      <strong className="text-zinc-900 font-sans block">{m.full_name}</strong>
                      <span className="text-zinc-400">{m.member_number}</span>
                    </td>
                    <td className="p-3 uppercase text-[10px] font-bold text-zinc-700">{m.plan_name}</td>
                    <td className="p-3 font-sans text-zinc-600">{m.email}<br />{m.phone || "—"}</td>
                    <td className="p-3 font-bold text-teal-800">
                      {m.available_points} pts<br />
                      <span className="text-amber-600 font-normal">{m.pending_points} pts pendentes</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider rounded ${m.account_state === "FROZEN" ? "bg-red-100 text-red-900" : "bg-teal-100 text-teal-900"}`}>
                        {m.account_state}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {m.account_state === "NORMAL" ? (
                        <button
                          onClick={() => onMemberAction(m.id, "FREEZE")}
                          className="text-red-700 hover:underline uppercase text-[10px] font-bold"
                        >
                          Congelar
                        </button>
                      ) : (
                        <button
                          onClick={() => onMemberAction(m.id, "UNFREEZE")}
                          className="text-teal-700 hover:underline uppercase text-[10px] font-bold"
                        >
                          Descongelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: PARTNERS */}
      {tab === "partners" && (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="border border-zinc-200 p-6 bg-zinc-50 space-y-4">
            <span className="eyebrow eyebrow-dark">CREDENCIAR PARCEIRO</span>
            <h3 className="font-serif text-2xl font-light text-zinc-900">Novo Parceiro</h3>
            <form onSubmit={handlePartnerSubmit} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Nome Comercial</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Epic Sana Luanda"
                  className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none"
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Categoria</label>
                <select
                  className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none"
                  value={partnerForm.category}
                  onChange={(e) => setPartnerForm({ ...partnerForm, category: e.target.value })}
                >
                  <option value="Hotelaria">Hotelaria</option>
                  <option value="Restaurantes">Restaurantes</option>
                  <option value="Beleza">Beleza & Spas</option>
                  <option value="Lazer">Lazer & Experiências</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Email do Gestor (Login)</label>
                <input
                  type="email"
                  required
                  placeholder="gestor@hotel.com"
                  className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none"
                  value={partnerForm.admin_email}
                  onChange={(e) => setPartnerForm({ ...partnerForm, admin_email: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1c1c1c] hover:bg-black text-white py-3 text-xs uppercase tracking-widest font-semibold transition"
              >
                Criar Empresa Parceira
              </button>
            </form>
          </div>

          <div className="md:col-span-2 border border-zinc-200 p-6 md:p-8 bg-white space-y-4">
            <h3 className="font-serif text-2xl font-light text-zinc-900">Empresas Parceiras Credenciadas</h3>
            <div className="divide-y divide-zinc-100 text-sm">
              {adminPartners.map((p) => (
                <div key={p.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-serif text-lg font-medium text-zinc-900">{p.name}</h5>
                    <span className="text-xs text-zinc-500 font-mono">
                      {p.category} · {p.email || "Sem email"} · {p.phone || "Sem tel"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-teal-50 text-teal-800 font-bold px-2.5 py-1 text-xs uppercase tracking-wider rounded border border-teal-200">
                      {p.status}
                    </span>
                    <button
                      onClick={() => onGenerateSettlement(p.id)}
                      className="border border-zinc-300 hover:border-zinc-800 text-zinc-800 px-3 py-1.5 text-xs uppercase font-semibold transition"
                    >
                      Liquidação
                    </button>
                    {onDeletePartner && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja remover a empresa parceira "${p.name}"?`)) {
                            onDeletePartner(p.id);
                          }
                        }}
                        className="btn-remove-sm"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {adminPartners.length === 0 && (
                <p className="py-6 text-sm text-zinc-400 italic">Nenhum parceiro registado.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: PROMOTIONS */}
      {tab === "promotions" && (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="border border-zinc-200 p-6 bg-zinc-50 space-y-4">
            <span className="eyebrow eyebrow-dark">CRIAÇÃO DE CAMPANHAS</span>
            <h3 className="font-serif text-2xl font-light text-zinc-900">Lançar Oferta</h3>
            <p className="text-xs text-zinc-500 font-light">
              Apenas os Master Admins criam promoções com regras econômicas auditadas.
            </p>

            <form onSubmit={handlePromoSubmit} className="space-y-4 pt-2 text-xs">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Serviço Base</label>
                <select
                  required
                  className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none"
                  value={promoForm.listing_id}
                  onChange={(e) => setPromoForm({ ...promoForm, listing_id: e.target.value })}
                >
                  <option value="">-- Escolher Serviço --</option>
                  {adminListings.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.partner_name} - {l.title} ({formatKz(l.base_price_kz)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Título da Oferta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Noite de Gala Exclusiva"
                  className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none"
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Comissão (%)</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white font-mono"
                    value={promoForm.commission_value}
                    onChange={(e) => setPromoForm({ ...promoForm, commission_value: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Benefício (%)</label>
                  <input
                    type="number"
                    required
                    className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white font-mono"
                    value={promoForm.benefit_value}
                    onChange={(e) => setPromoForm({ ...promoForm, benefit_value: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Tipo de Entrega</label>
                <select
                  className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none"
                  value={promoForm.delivery_mode}
                  onChange={(e) => setPromoForm({ ...promoForm, delivery_mode: e.target.value })}
                >
                  <option value="POINTS">Crédito de Pontos (1pt = 1Kz)</option>
                  <option value="DISCOUNT">Desconto Comercial Imediato</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1c1c1c] hover:bg-black text-white py-3 text-xs uppercase tracking-widest font-semibold transition"
              >
                Publicar no Catálogo
              </button>
            </form>
          </div>

          <div className="md:col-span-2 border border-zinc-200 p-6 md:p-8 bg-white space-y-4">
            <h3 className="font-serif text-2xl font-light text-zinc-900">Promoções em Vigor</h3>
            <div className="divide-y divide-zinc-100 text-sm">
              {adminPromotions.map((p) => (
                <div key={p.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-serif text-lg font-medium text-zinc-900">{p.title}</h5>
                    <p className="text-zinc-600 text-xs mt-0.5">
                      Parceiro: <strong className="text-zinc-800">{p.partner_name}</strong> · Serviço: {p.listing_title}
                    </p>
                    <p className="text-zinc-500 font-mono text-xs mt-0.5">
                      Comissão: {p.commission_value}% · Retorno ao Membro: <strong>{formatKz(p.member_benefit_kz)}</strong> ({p.delivery_mode === "DISCOUNT" ? "Desconto" : "Pontos"})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-teal-50 text-teal-800 font-bold px-2.5 py-1 text-xs uppercase tracking-wider rounded border border-teal-200">
                      {p.status || "Ativa"}
                    </span>
                    {onDeletePromotion && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Deseja remover a promoção "${p.title}"?`)) {
                            onDeletePromotion(p.id);
                          }
                        }}
                        className="btn-remove-sm"
                      >
                        Remover Oferta
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {adminPromotions.length === 0 && (
                <p className="py-6 text-sm text-zinc-400 italic">Nenhuma promoção registada.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: REDEMPTIONS APPROVAL */}
      {tab === "redemptions" && (
        <div className="space-y-6">
          <h3 className="font-serif text-2xl font-light text-zinc-900">Aprovação Final de Resgates</h3>
          <p className="text-xs text-zinc-500 font-light">
            Quando o parceiro aprova um resgate, o Master Admin emite a autorização final gerando um código OTP de segurança de 6 dígitos.
          </p>

          <div className="divide-y divide-zinc-200 border border-zinc-200 bg-white text-xs font-mono">
            {adminRedemptions.map((r) => (
              <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-zinc-50">
                <div>
                  <strong className="text-zinc-900 block font-serif text-sm">Resgate #{r.redemption_number}</strong>
                  <span className="text-zinc-500">Membro: {r.member_name} ({r.member_number}) · Parceiro: {r.partner_name}</span>
                  <p className="text-zinc-700 font-bold mt-1">Pontos a Consumir: {r.points_requested} pts</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                    {r.status}
                  </span>
                  {r.status === "AWAITING_ADMIN" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onAdminRedeemAction(r.id, "APPROVE")}
                        className="bg-teal-800 hover:bg-teal-900 text-white font-semibold py-1.5 px-3 uppercase text-[10px] tracking-wider"
                      >
                        Aprovar e Emitir OTP
                      </button>
                      <button
                        onClick={() => onAdminRedeemAction(r.id, "REJECT")}
                        className="border border-red-300 text-red-700 font-semibold py-1.5 px-3 uppercase text-[10px] tracking-wider"
                      >
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {adminRedemptions.length === 0 && (
              <p className="p-8 text-center text-zinc-400 italic">Sem resgates a necessitar de validação.</p>
            )}
          </div>
        </div>
      )}

      {/* VIEW: TRANSFERS APPROVAL */}
      {tab === "transfers" && (
        <div className="space-y-6">
          <h3 className="font-serif text-2xl font-light text-zinc-900">Aprovação de Transferências de Pontos</h3>
          <div className="divide-y divide-zinc-200 border border-zinc-200 bg-white text-xs font-mono">
            {adminTransfers.map((t) => (
              <div key={t.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-zinc-50">
                <div>
                  <strong className="text-zinc-900 block font-serif text-sm">Transferência #{t.transfer_number}</strong>
                  <span className="text-zinc-500">Remetente: {t.sender_name} ({t.sender_number}) → Destinatário: {t.recipient_name} ({t.recipient_number})</span>
                  <p className="text-zinc-700 font-bold mt-1">Pontos em Trânsito: {t.points} pts</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                    {t.status}
                  </span>
                  {t.status === "SENDER_APPROVED" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onAdminTransferAction(t.id, "APPROVE")}
                        className="bg-teal-800 hover:bg-teal-900 text-white font-semibold py-1.5 px-3 uppercase text-[10px] tracking-wider"
                      >
                        Aprovar Transferência
                      </button>
                      <button
                        onClick={() => onAdminTransferAction(t.id, "REJECT")}
                        className="border border-red-300 text-red-700 font-semibold py-1.5 px-3 uppercase text-[10px] tracking-wider"
                      >
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {adminTransfers.length === 0 && (
              <p className="p-8 text-center text-zinc-400 italic">Sem transferências pendentes.</p>
            )}
          </div>
        </div>
      )}

      {/* VIEW: SETTLEMENTS */}
      {tab === "settlements" && (
        <div className="space-y-6">
          <h3 className="font-serif text-2xl font-light text-zinc-900">Liquidação Financeira a Parceiros</h3>
          <p className="text-xs text-zinc-500 font-light">
            Fechos de contas por estabelecimento comercial. Pague as obrigações através de transferência bancária e insira a referência comprovativa.
          </p>

          <div className="divide-y divide-zinc-200 border border-zinc-200 bg-white text-xs font-mono">
            {adminSettlements.map((s) => (
              <div key={s.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-zinc-50">
                <div>
                  <strong className="text-zinc-900 font-serif text-base block">{s.partner_name}</strong>
                  <span className="text-zinc-500">Período: {s.period_start} a {s.period_end}</span>
                  <p className="text-zinc-800 font-bold mt-1">Montante Devido: {formatKz(s.net_payable_kz)}</p>
                  {s.bank_reference && (
                    <p className="text-teal-700 text-[10px]">Ref Bancária: {s.bank_reference} (Pago a {s.paid_at?.slice(0, 10)})</p>
                  )}
                </div>
                <div>
                  {s.status === "READY" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ref Bancária"
                        className="border border-zinc-300 px-2 py-1.5 text-xs bg-white focus:outline-none"
                        value={bankRefs[s.id] || ""}
                        onChange={(e) => setBankRefs({ ...bankRefs, [s.id]: e.target.value })}
                      />
                      <button
                        onClick={() => onPaySettlement(s.id, bankRefs[s.id])}
                        className="bg-teal-800 hover:bg-teal-900 text-white font-semibold py-1.5 px-3 uppercase text-[10px] tracking-wider"
                      >
                        Registar Pagamento
                      </button>
                    </div>
                  ) : (
                    <span className="bg-teal-50 text-teal-800 font-bold px-3 py-1 uppercase text-[10px] rounded">
                      {s.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {adminSettlements.length === 0 && (
              <p className="p-8 text-center text-zinc-400 italic">Sem relatórios de fecho criados. Clique em "Fechar Mês" na aba Parceiros.</p>
            )}
          </div>
        </div>
      )}

      {/* VIEW: AUDIT */}
      {tab === "audit" && (
        <div className="space-y-6">
          <h3 className="font-serif text-2xl font-light text-zinc-900">Registo de Auditoria Imutável</h3>
          <div className="border border-zinc-200 overflow-x-auto bg-white p-4">
            <table className="w-full text-left text-xs font-mono divide-y divide-zinc-200">
              <thead className="text-zinc-400 text-[10px] uppercase">
                <tr>
                  <th className="pb-2">Data / Hora</th>
                  <th className="pb-2">Autor</th>
                  <th className="pb-2">Ação</th>
                  <th className="pb-2">Entidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {adminSummary?.audit?.map((log: any) => (
                  <tr key={log.id}>
                    <td className="py-2.5 text-zinc-500">{log.created_at?.slice(0, 19)}</td>
                    <td className="py-2.5 font-bold text-zinc-800">{log.actor_type}</td>
                    <td className="py-2.5 text-teal-800 font-semibold">{log.action}</td>
                    <td className="py-2.5 text-zinc-600">{log.entity_type} (ID: {log.entity_id?.slice(0, 8)})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
