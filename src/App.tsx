import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { CategoryCards } from "./components/CategoryCards";
import { CatalogSection } from "./components/CatalogSection";
import { WelcomeBanner } from "./components/WelcomeBanner";
import { ValueProps } from "./components/ValueProps";
import { EditorialSection } from "./components/EditorialSection";
import { GalleryStrip } from "./components/GalleryStrip";
import { Footer } from "./components/Footer";
import { PromotionDetailModal } from "./components/PromotionDetailModal";
import { AuthModal } from "./components/AuthModal";
import { MemberPortal } from "./components/MemberPortal";
import { PartnerPortal } from "./components/PartnerPortal";
import { AdminPortal } from "./components/AdminPortal";
import { PartnersSection } from "./components/PartnersSection";
import { MembershipSection } from "./components/MembershipSection";
import { HowItWorksSection } from "./components/HowItWorksSection";
import type { Promotion, UserSession } from "./types";

export default function App() {
  // Session & Authentication
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem("promoangol_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation State
  const [activeView, setActiveView] = useState<"home" | "catalog" | "partners" | "membership" | "how" | "portal">("home");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Modals State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);

  // Global Alerts
  const [toastError, setToastError] = useState("");
  const [toastSuccess, setToastSuccess] = useState("");

  // Data
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [catalogState, setCatalogState] = useState<"loading" | "ready" | "empty" | "error">("loading");

  // Role Portal Data
  const [memberSummary, setMemberSummary] = useState<any>(null);
  const [memberTxList, setMemberTxList] = useState<any[]>([]);
  const [memberLedger, setMemberLedger] = useState<any[]>([]);
  const [memberRedemptions, setMemberRedemptions] = useState<any[]>([]);
  const [memberTransfersSent, setMemberTransfersSent] = useState<any[]>([]);
  const [memberTransfersRecv, setMemberTransfersRecv] = useState<any[]>([]);

  const [partnerSummary, setPartnerSummary] = useState<any>(null);
  const [partnerRedemptions, setPartnerRedemptions] = useState<any[]>([]);

  const [adminSummary, setAdminSummary] = useState<any>(null);
  const [adminMembers, setAdminMembers] = useState<any[]>([]);
  const [adminPartners, setAdminPartners] = useState<any[]>([]);
  const [adminPromotions, setAdminPromotions] = useState<any[]>([]);
  const [adminListings, setAdminListings] = useState<any[]>([]);
  const [adminRedemptions, setAdminRedemptions] = useState<any[]>([]);
  const [adminTransfers, setAdminTransfers] = useState<any[]>([]);
  const [adminSettlements, setAdminSettlements] = useState<any[]>([]);

  // -------------------------------------------------------------
  // CATALOG FETCHING
  // -------------------------------------------------------------
  const fetchCatalog = () => {
    setCatalogState("loading");
    fetch("/api/catalog/promotions")
      .then(async (res) => {
        if (!res.ok) throw new Error("Catalog unavailable");
        const data = await res.json();
        const rows = data.promotions || [];
        setPromotions(rows);
        setCatalogState(rows.length ? "ready" : "empty");
      })
      .catch(() => setCatalogState("error"));
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // -------------------------------------------------------------
  // SECURE API CLIENT
  // -------------------------------------------------------------
  const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
    if (!session) return null;
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${session.token}`);
    headers.set("Content-Type", "application/json");

    const res = await fetch(endpoint, { ...options, headers });
    if (res.status === 401) {
      handleLogout();
      throw new Error("Sessão expirada. Por favor autentique-se novamente.");
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Erro de processamento no servidor.");
    }
    return data;
  };

  // Sync role-specific records
  const syncRoleData = () => {
    if (!session) return;

    if (session.role === "MEMBER") {
      apiCall("/api/member/summary").then(setMemberSummary).catch(console.error);
      apiCall("/api/member/transactions").then((d) => {
        setMemberTxList(d.purchases || []);
        setMemberLedger(d.ledger || []);
      }).catch(console.error);
      apiCall("/api/member/redemptions").then((d) => setMemberRedemptions(d.redemptions || [])).catch(console.error);
      apiCall("/api/member/transfers").then((d) => {
        setMemberTransfersSent(d.sent || []);
        setMemberTransfersRecv(d.received || []);
      }).catch(console.error);
    } else if (session.role === "PARTNER_ADMIN" || session.role === "PARTNER_STAFF") {
      apiCall("/api/partner/summary").then(setPartnerSummary).catch(console.error);
      apiCall("/api/partner/redemptions").then((d) => setPartnerRedemptions(d.redemptions || [])).catch(console.error);
    } else if (session.role === "MASTER_ADMIN") {
      apiCall("/api/admin/summary").then(setAdminSummary).catch(console.error);
      apiCall("/api/admin/members").then((d) => setAdminMembers(d.members || [])).catch(console.error);
      apiCall("/api/admin/partners").then((d) => setAdminPartners(d.partners || [])).catch(console.error);
      apiCall("/api/admin/promotions").then((d) => {
        setAdminPromotions(d.promotions || []);
        setAdminListings(d.listings || []);
      }).catch(console.error);
      apiCall("/api/admin/redemptions").then((d) => setAdminRedemptions(d.redemptions || [])).catch(console.error);
      apiCall("/api/admin/transfers").then((d) => setAdminTransfers(d.transfers || [])).catch(console.error);
      apiCall("/api/admin/settlements").then((d) => setAdminSettlements(d.settlements || [])).catch(console.error);
    }
  };

  useEffect(() => {
    if (session && activeView === "portal" && session.token !== "__PREVIEW__") {
      syncRoleData();
    }
  }, [session, activeView]);

  // -------------------------------------------------------------
  // ACTIONS HANDLERS
  // -------------------------------------------------------------
  const handleLogout = () => {
    if (session?.token !== "__PREVIEW__") {
      fetch("/api/auth/logout", { method: "POST" });
    }
    localStorage.removeItem("promoangol_session");
    setSession(null);
    setActiveView("home");
    setToastSuccess("Sessão terminada com sucesso.");
  };

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (newSession: UserSession) => {
    if (newSession.token === "__PREVIEW__") {
      if (newSession.role === "MEMBER") {
        setMemberSummary({
          profile: {
            full_name: "Cliente PromoAngol",
            member_number: "PA-000000",
            plan_name: "Preferred",
          },
          balances: {
            available_points: 8450,
            pending_points: 1200,
            reserved_points: 800,
          },
        });
        setMemberTxList([
          {
            id: "preview-tx-1",
            transaction_number: "PA-10482",
            partner_name: "Hotel Alvalade",
            listing_title: "Fim de semana Suite Deluxe",
            amount_paid_kz: 80000,
            points_to_release: 9600,
            status: "VERIFIED",
            created_at: "2026-09-25T14:20:00Z",
          },
          {
            id: "preview-tx-2",
            transaction_number: "PA-10467",
            partner_name: "Amandla Spa",
            listing_title: "Massagem de Aromaterapia",
            amount_paid_kz: 20000,
            points_to_release: 3000,
            status: "PENDING_MEMBER_CONFIRMATION",
            created_at: "2026-09-24T17:10:00Z",
          },
        ]);
        setMemberLedger([
          { id: "ledger-1", bucket: "AVAILABLE", direction: "CREDIT", points: 5000, reason: "Bónus de adesão", created_at: "2026-09-01" },
          { id: "ledger-2", bucket: "PENDING", direction: "CREDIT", points: 1200, reason: "Compra em parceiro", created_at: "2026-09-24" },
        ]);
        setMemberRedemptions([]);
        setMemberTransfersSent([]);
        setMemberTransfersRecv([]);
      }

      if (newSession.role === "PARTNER_ADMIN") {
        setPartnerSummary({
          partner: { name: "Hotel Alvalade" },
          stats: { todayCount: 18, todayVolume: 1260000, pendingConfirm: 4, pendingRedeem: 2 },
          transactions: [
            { id: "ptx-1", member_name: "Maria Domingos", member_number: "PA-304812", listing_title: "Suite Deluxe", transaction_number: "PA-20381", amount_paid_kz: 80000, status: "PENDING_MEMBER_CONFIRMATION", created_at: "2026-09-25T15:30:00Z" },
            { id: "ptx-2", member_name: "António Silva", member_number: "PA-294601", listing_title: "Jantar de Gala", transaction_number: "PA-20374", amount_paid_kz: 25000, status: "VERIFIED", created_at: "2026-09-25T12:14:00Z" },
          ],
          listings: [
            { id: "listing-preview-1", title: "Suite Deluxe", description: "Estadia para duas pessoas.", base_price_kz: 80000, status: "ACTIVE" },
            { id: "listing-preview-2", title: "Jantar de Gala", description: "Experiência gastronómica.", base_price_kz: 25000, status: "ACTIVE" },
          ],
        });
        setPartnerRedemptions([]);
      }

      if (newSession.role === "MASTER_ADMIN") {
        setAdminSummary({
          stats: { members: 2846, partners: 94, pendingRedemptions: 12, pendingTransfers: 7 },
          ledger: [
            { bucket: "AVAILABLE", sum: 1842500 },
            { bucket: "PENDING", sum: 386400 },
            { bucket: "RESERVED", sum: 74200 },
          ],
          audit: [
            { action: "APPROVE_REDEMPTION", entity_id: "RED-1042", actor_id: "admin", created_at: "2026-09-25 16:42" },
            { action: "PUBLISH_PROMOTION", entity_id: "PROMO-884", actor_id: "admin", created_at: "2026-09-25 15:18" },
          ],
        });
        setAdminMembers([]);
        setAdminPartners([]);
        setAdminPromotions([]);
        setAdminListings([]);
        setAdminRedemptions([]);
        setAdminTransfers([]);
        setAdminSettlements([]);
      }
    }

    setSession(newSession);
    setActiveView("portal");
    setToastSuccess(
      newSession.token === "__PREVIEW__"
        ? `Pré-visualização: ${newSession.name}`
        : `Sessão iniciada como ${newSession.name}!`
    );
  };

  // MEMBER HANDLERS
  const handleConfirmPurchase = async (txId: string, action: "CONFIRM" | "REJECT", reason?: string) => {
    try {
      await apiCall("/api/member/confirm-purchase", {
        method: "POST",
        body: JSON.stringify({ transaction_id: txId, action, reason }),
      });
      setToastSuccess(action === "CONFIRM" ? "Venda confirmada! Recompensa creditada em saldo pendente." : "Compra rejeitada.");
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
    }
  };

  const handleRequestRedeem = async (listingId: string, points: number) => {
    try {
      const res = await apiCall("/api/member/redemptions", {
        method: "POST",
        body: JSON.stringify({ listing_id: listingId, points }),
      });
      setToastSuccess(`Resgate #${res.redemptionNumber} solicitado com sucesso!`);
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
      throw err;
    }
  };

  const handleRequestTransfer = async (recipientNumber: string, points: number) => {
    try {
      const res = await apiCall("/api/member/transfers", {
        method: "POST",
        body: JSON.stringify({ recipient_number: recipientNumber, points }),
      });
      setToastSuccess(`Transferência #${res.transferNumber} iniciada para ${res.recipientName}!`);
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
      throw err;
    }
  };

  // PARTNER HANDLERS
  const handleVerifyMember = async (memberNumber: string) => {
    try {
      const data = await apiCall("/api/partner/verify-member", {
        method: "POST",
        body: JSON.stringify({ member_number: memberNumber }),
      });
      return data;
    } catch (err: any) {
      setToastError(err.message);
      throw err;
    }
  };

  const handleRecordPurchase = async (memberId: string, listingId: string, promotionId: string, amountKz: number) => {
    try {
      const res = await apiCall("/api/partner/purchase/record", {
        method: "POST",
        body: JSON.stringify({
          member_id: memberId,
          listing_id: listingId,
          promotion_id: promotionId,
          amount_paid_kz: amountKz,
        }),
      });
      setToastSuccess(`Venda #${res.transactionNumber} registada! O cliente deve agora confirmar no telemóvel.`);
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
      throw err;
    }
  };

  const handlePartnerRedeemAction = async (redId: string, action: "APPROVE" | "REJECT") => {
    try {
      await apiCall("/api/partner/redemptions", {
        method: "POST",
        body: JSON.stringify({ redemption_id: redId, action }),
      });
      setToastSuccess(action === "APPROVE" ? "Resgate aprovado pelo parceiro! A aguardar validação do Master Admin." : "Resgate rejeitado.");
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
    }
  };

  const handleVerifyRedemptionToken = async (redId: string, token: string) => {
    try {
      await apiCall("/api/partner/redemptions", {
        method: "POST",
        body: JSON.stringify({ redemption_id: redId, token, action: "VERIFY_TOKEN" }),
      });
      setToastSuccess("Código OTP verificado com sucesso! Benefício entregue ao cliente.");
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
      throw err;
    }
  };

  const handleSaveListing = async (listing: { id?: string; title: string; description?: string; base_price_kz: number }) => {
    try {
      await apiCall("/api/partner/listings", {
        method: "POST",
        body: JSON.stringify(listing),
      });
      setToastSuccess("Artigo do preçário guardado com sucesso.");
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
    }
  };

  // ADMIN HANDLERS
  const handleMemberAction = async (memberId: string, action: "FREEZE" | "UNFREEZE" | "SUSPEND" | "ACTIVATE") => {
    try {
      await apiCall("/api/admin/members/action", {
        method: "POST",
        body: JSON.stringify({ id: memberId, action }),
      });
      setToastSuccess(`Ação ${action} efetuada com sucesso.`);
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
    }
  };

  const handleCreatePartner = async (partner: any) => {
    try {
      await apiCall("/api/admin/partners", {
        method: "POST",
        body: JSON.stringify(partner),
      });
      setToastSuccess("Empresa parceira credenciada e login de gestor gerado!");
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
      throw err;
    }
  };

  const handleCreatePromotion = async (promo: any) => {
    try {
      await apiCall("/api/admin/promotions", {
        method: "POST",
        body: JSON.stringify(promo),
      });
      setToastSuccess("Campanha promocional publicada com sucesso!");
      syncRoleData();
      fetchCatalog();
    } catch (err: any) {
      setToastError(err.message);
      throw err;
    }
  };

  const handleAdminRedeemAction = async (redId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await apiCall("/api/admin/redemptions/action", {
        method: "POST",
        body: JSON.stringify({ redemption_id: redId, action }),
      });
      if (action === "APPROVE" && res.verificationCode) {
        setToastSuccess(`Resgate aprovado! Código OTP de uso único gerado: ${res.verificationCode}`);
      } else {
        setToastSuccess("Operação concluída.");
      }
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
    }
  };

  const handleAdminTransferAction = async (transferId: string, action: "APPROVE" | "REJECT") => {
    try {
      await apiCall("/api/admin/transfers/action", {
        method: "POST",
        body: JSON.stringify({ transfer_id: transferId, action }),
      });
      setToastSuccess(action === "APPROVE" ? "Transferência aprovada pelo Master Admin!" : "Transferência rejeitada.");
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
    }
  };

  const handleGenerateSettlement = async (partnerId: string) => {
    try {
      const res = await apiCall("/api/admin/settlements", {
        method: "POST",
        body: JSON.stringify({ partner_id: partnerId, action: "GENERATE" }),
      });
      setToastSuccess(`Relatório de liquidação gerado! Valor a pagar: Kz ${new Intl.NumberFormat("pt-AO").format(res.grossRedemptions)}.`);
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
    }
  };

  const handlePaySettlement = async (settlementId: string, bankRef: string) => {
    try {
      await apiCall("/api/admin/settlements", {
        method: "POST",
        body: JSON.stringify({ settlement_id: settlementId, action: "PAY", bank_reference: bankRef }),
      });
      setToastSuccess("Liquidação marcada como PAGA com registo bancário imutável.");
      syncRoleData();
    } catch (err: any) {
      setToastError(err.message);
    }
  };

  return (
    <div className="app-shell flex flex-col min-h-screen">
      {/* Toast Feedback Alerts */}
      {toastError && (
        <div className="bg-red-800 text-white text-xs py-3 px-6 flex justify-between items-center fixed top-0 left-0 right-0 z-50 shadow-md">
          <span>{toastError}</span>
          <button onClick={() => setToastError("")} className="font-bold text-base px-2">×</button>
        </div>
      )}
      {toastSuccess && (
        <div className="bg-[#357169] text-white text-xs py-3 px-6 flex justify-between items-center fixed top-0 left-0 right-0 z-50 shadow-md">
          <span>{toastSuccess}</span>
          <button onClick={() => setToastSuccess("")} className="font-bold text-base px-2">×</button>
        </div>
      )}

      {/* Top Bar Navigation */}
      <Header
        session={session}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onNavigate={(view) => setActiveView(view)}
        activeView={activeView}
      />

      {/* Main Body */}
      <main className="flex-grow">
        {/* PUBLIC EXPERIENCE: HOME */}
        {activeView === "home" && (
          <div>
            <Hero
              onExploreCatalog={() => setActiveView("catalog")}
              onExploreMembership={() => {
                if (session) setActiveView("portal");
                else handleOpenAuth("register");
              }}
            />

            <CategoryCards
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setActiveView("catalog");
              }}
            />

            <CatalogSection
              promotions={promotions}
              catalogState={catalogState}
              selectedCategory={selectedCategory}
              onSelectPromotion={(promo) => setSelectedPromo(promo)}
              onRefresh={fetchCatalog}
            />

            <WelcomeBanner
              onJoin={() => {
                if (session) setActiveView("portal");
                else handleOpenAuth("register");
              }}
            />

            <ValueProps />

            <EditorialSection />

            <GalleryStrip />
          </div>
        )}

        {/* PUBLIC EXPERIENCE: CATALOG */}
        {activeView === "catalog" && (
          <div className="pt-28">
            <CatalogSection
              promotions={promotions}
              catalogState={catalogState}
              selectedCategory={selectedCategory}
              onSelectPromotion={(promo) => setSelectedPromo(promo)}
              onRefresh={fetchCatalog}
            />
            <GalleryStrip />
          </div>
        )}

        {/* PUBLIC EXPERIENCE: PARTNERS */}
        {activeView === "partners" && (
          <div>
            <PartnersSection
              promotions={promotions}
              onSelectPromotion={(promo) => setSelectedPromo(promo)}
              onExploreMembership={() => {
                if (session) setActiveView("portal");
                else handleOpenAuth("register");
              }}
            />
            <GalleryStrip />
          </div>
        )}

        {/* PUBLIC EXPERIENCE: MEMBERSHIP */}
        {activeView === "membership" && (
          <div>
            <MembershipSection
              onJoinPlan={(_planCode) => {
                if (session) setActiveView("portal");
                else handleOpenAuth("register");
              }}
            />
            <GalleryStrip />
          </div>
        )}

        {/* PUBLIC EXPERIENCE: HOW IT WORKS */}
        {activeView === "how" && (
          <div>
            <HowItWorksSection
              onJoin={() => {
                if (session) setActiveView("portal");
                else handleOpenAuth("register");
              }}
              onExploreCatalog={() => setActiveView("catalog")}
            />
            <GalleryStrip />
          </div>
        )}

        {/* AUTHENTICATED EXPERIENCE: PORTAL */}
        {activeView === "portal" && session && (
          <div className={`portal-shell role-${session.role.toLowerCase()}`}>
            {session.token === "__PREVIEW__" && (
              <div className="preview-modebar content-width">
                <span><strong>PRÉ-VISUALIZAÇÃO</strong> · está a ver a área {session.role === "MEMBER" ? "Cliente" : session.role === "PARTNER_ADMIN" ? "Parceiro" : "Master Admin"} sem palavras-passe.</span>
                <button type="button" onClick={handleLogout}>Voltar a escolher área</button>
              </div>
            )}
            <div className="pt-6 min-h-[70vh]">
            {session.role === "MEMBER" && (
              <MemberPortal
                session={session}
                memberSummary={memberSummary}
                memberTxList={memberTxList}
                memberLedger={memberLedger}
                memberRedemptions={memberRedemptions}
                memberTransfersSent={memberTransfersSent}
                memberTransfersRecv={memberTransfersRecv}
                promotions={promotions}
                onConfirmPurchase={handleConfirmPurchase}
                onRequestRedeem={handleRequestRedeem}
                onRequestTransfer={handleRequestTransfer}
                onRefresh={syncRoleData}
              />
            )}

            {(session.role === "PARTNER_ADMIN" || session.role === "PARTNER_STAFF") && (
              <PartnerPortal
                session={session}
                partnerSummary={partnerSummary}
                partnerRedemptions={partnerRedemptions}
                onVerifyMember={handleVerifyMember}
                onRecordPurchase={handleRecordPurchase}
                onPartnerRedeemAction={handlePartnerRedeemAction}
                onVerifyRedemptionToken={handleVerifyRedemptionToken}
                onSaveListing={handleSaveListing}
                onRefresh={syncRoleData}
              />
            )}

            {session.role === "MASTER_ADMIN" && (
              <AdminPortal
                session={session}
                adminSummary={adminSummary}
                adminMembers={adminMembers}
                adminPartners={adminPartners}
                adminPromotions={adminPromotions}
                adminListings={adminListings}
                adminRedemptions={adminRedemptions}
                adminTransfers={adminTransfers}
                adminSettlements={adminSettlements}
                onMemberAction={handleMemberAction}
                onCreatePartner={handleCreatePartner}
                onCreatePromotion={handleCreatePromotion}
                onAdminRedeemAction={handleAdminRedeemAction}
                onAdminTransferAction={handleAdminTransferAction}
                onGenerateSettlement={handleGenerateSettlement}
                onPaySettlement={handlePaySettlement}
                onRefresh={syncRoleData}
              />
            )}
          </div>
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={(view) => setActiveView(view)} />

      {/* Promotion Detail Modal */}
      <PromotionDetailModal
        promotion={selectedPromo}
        onClose={() => setSelectedPromo(null)}
        isLoggedIn={Boolean(session)}
        onUseOffer={() => {
          if (!session) {
            handleOpenAuth("register");
          } else if (session.role === "MEMBER") {
            setActiveView("portal");
            setToastSuccess("Apresente o seu número de membro no estabelecimento parceiro.");
          }
        }}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
