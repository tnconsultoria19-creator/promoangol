import { useEffect, useMemo, useState } from "react";

type Promotion = {
  id: string;
  title: string;
  description?: string | null;
  listing_title?: string | null;
  partner_name?: string | null;
  partner_category?: string | null;
  delivery_mode?: "POINTS" | "DISCOUNT" | string | null;
  member_benefit_kz?: number | null;
  base_price_kz?: number | null;
  commission_mode?: string | null;
  commission_value?: number | null;
  benefit_mode?: string | null;
};

type UserSession = {
  token: string;
  role: "MASTER_ADMIN" | "PARTNER_ADMIN" | "PARTNER_STAFF" | "MEMBER";
  email: string;
  name: string;
  detail: string;
  referenceId: string | null;
};

function formatKz(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-AO").format(value) + " Kz";
}

export default function App() {
  // Navigation & Authentication
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("promoangol_session");
    return saved ? JSON.parse(saved) : null;
  });
  const [currentView, setCurrentView] = useState<"public-home" | "public-catalog" | "login" | "register" | "app">("public-home");

  // Portal Subviews
  const [memberTab, setMemberTab] = useState<"dashboard" | "catalog" | "wallet" | "redemptions" | "transfers">("dashboard");
  const [partnerTab, setPartnerTab] = useState<"dashboard" | "verify" | "redemptions" | "listings">("dashboard");
  const [adminTab, setAdminTab] = useState<"dashboard" | "members" | "partners" | "promotions" | "redemptions" | "transfers" | "settlements" | "audit">("dashboard");

  // Catalog State
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [catalogState, setCatalogState] = useState<"loading" | "ready" | "empty" | "error">("loading");

  // Common UI State
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Member Portal Data
  const [memberSummary, setMemberSummary] = useState<any>(null);
  const [memberTxList, setMemberTxList] = useState<any[]>([]);
  const [memberLedger, setMemberLedger] = useState<any[]>([]);
  const [memberRedemptions, setMemberRedemptions] = useState<any[]>([]);
  const [memberTransfersSent, setMemberTransfersSent] = useState<any[]>([]);
  const [memberTransfersRecv, setMemberTransfersRecv] = useState<any[]>([]);

  // Partner Portal Data
  const [partnerSummary, setPartnerSummary] = useState<any>(null);
  const [verifiedMember, setVerifiedMember] = useState<any>(null);
  const [verifiedPromos, setVerifiedPromos] = useState<any[]>([]);
  const [partnerRedemptions, setPartnerRedemptions] = useState<any[]>([]);

  // Admin Portal Data
  const [adminSummary, setAdminSummary] = useState<any>(null);
  const [adminMembers, setAdminMembers] = useState<any[]>([]);
  const [adminPartners, setAdminPartners] = useState<any[]>([]);
  const [adminPromotions, setAdminPromotions] = useState<any[]>([]);
  const [adminListings, setAdminListings] = useState<any[]>([]);
  const [adminRedemptions, setAdminRedemptions] = useState<any[]>([]);
  const [adminTransfers, setAdminTransfers] = useState<any[]>([]);
  const [adminSettlements, setAdminSettlements] = useState<any[]>([]);

  // Forms State
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [redeemForm, setRedeemForm] = useState({ listing_id: "", points: 800 });
  const [transferForm, setTransferForm] = useState({ recipient_number: "", points: 100 });
  const [purchaseForm, setPurchaseForm] = useState({ listing_id: "", promotion_id: "", amount_paid_kz: 0 });
  const [verifyTokenInput, setVerifyTokenInput] = useState({ redemption_id: "", token: "" });
  const [partnerListingForm, setPartnerListingForm] = useState({ id: "", title: "", description: "", base_price_kz: 10000 });
  const [adminPartnerForm, setAdminPartnerForm] = useState({ name: "", legal_name: "", category: "Hotelaria", contact_name: "", phone: "", email: "", address: "", admin_email: "" });
  const [adminPromoForm, setAdminPromoForm] = useState({ listing_id: "", title: "", description: "", commission_mode: "PERCENT_OF_PURCHASE", commission_value: 10, benefit_mode: "PERCENT_OF_COMMISSION", benefit_value: 50, delivery_mode: "POINTS", valid_from: "", valid_until: "" });
  const [bankRefInput, setBankRefInput] = useState<{ [settlementId: string]: string }>({});

  // -------------------------------------------------------------
  // DATA FETCHING & SYNC
  // -------------------------------------------------------------
  const fetchCatalog = () => {
    setCatalogState("loading");
    fetch("/api/catalog/promotions")
      .then(async (res) => {
        if (!res.ok) throw new Error("catalog unavailable");
        const data = await res.json();
        const rows = data.promotions || [];
        setPromotions(rows);
        setCatalogState(rows.length ? "ready" : "empty");
      })
      .catch(() => setCatalogState("error"));
  };

  useEffect(() => {
    fetchCatalog();
    if (session) {
      setCurrentView("app");
    }
  }, [session]);

  const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    if (!session) return null;
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${session.token}`);
    headers.set("Content-Type", "application/json");

    const res = await fetch(endpoint, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Ocorreu um erro no servidor.");
    }
    return data;
  };

  // Sync Logged-In User Data
  useEffect(() => {
    if (!session || currentView !== "app") return;

    if (session.role === "MEMBER") {
      syncMemberData();
    } else if (session.role === "PARTNER_ADMIN" || session.role === "PARTNER_STAFF") {
      syncPartnerData();
    } else if (session.role === "MASTER_ADMIN") {
      syncAdminData();
    }
  }, [session, currentView, memberTab, partnerTab, adminTab]);

  const syncMemberData = () => {
    apiFetch("/api/member/summary").then(setMemberSummary).catch(console.error);
    apiFetch("/api/member/transactions").then((data) => {
      setMemberTxList(data.purchases || []);
      setMemberLedger(data.ledger || []);
    }).catch(console.error);
    apiFetch("/api/member/redemptions").then((data) => setMemberRedemptions(data.redemptions || [])).catch(console.error);
    apiFetch("/api/member/transfers").then((data) => {
      setMemberTransfersSent(data.sent || []);
      setMemberTransfersRecv(data.received || []);
    }).catch(console.error);
  };

  const syncPartnerData = () => {
    apiFetch("/api/partner/summary").then((data) => {
      setPartnerSummary(data);
    }).catch(console.error);
    apiFetch("/api/partner/redemptions").then((data) => setPartnerRedemptions(data.redemptions || [])).catch(console.error);
  };

  const syncAdminData = () => {
    apiFetch("/api/admin/summary").then(setAdminSummary).catch(console.error);
    apiFetch("/api/admin/members").then((data) => setAdminMembers(data.members || [])).catch(console.error);
    apiFetch("/api/admin/partners").then((data) => setAdminPartners(data.partners || [])).catch(console.error);
    apiFetch("/api/admin/promotions").then((data) => {
      setAdminPromotions(data.promotions || []);
      setAdminListings(data.listings || []);
    }).catch(console.error);
    apiFetch("/api/admin/redemptions").then((data) => setAdminRedemptions(data.redemptions || [])).catch(console.error);
    apiFetch("/api/admin/transfers").then((data) => setAdminTransfers(data.transfers || [])).catch(console.error);
    apiFetch("/api/admin/settlements").then((data) => setAdminSettlements(data.settlements || [])).catch(console.error);
  };

  // -------------------------------------------------------------
  // AUTHENTICATION HANDLERS
  // -------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao iniciar sessão.");

      localStorage.setItem("promoangol_session", JSON.stringify(data));
      setSession(data);
      setCurrentView("app");
      setSuccessMessage("Bem-vindo de volta, " + data.name + "!");
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro no registo.");

      setSuccessMessage("Registo concluído! Conta criada: " + data.memberNumber + ". Faça login.");
      setCurrentView("login");
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("promoangol_session");
    setSession(null);
    setCurrentView("public-home");
    setSuccessMessage("Sessão terminada.");
  };

  // -------------------------------------------------------------
  // BUSINESS OPERATIONS HANDLERS
  // -------------------------------------------------------------

  // MEMBER: Confirm Purchase
  const handleConfirmPurchase = async (txId: string, action: "CONFIRM" | "REJECT", reason?: string) => {
    try {
      await apiFetch("/api/member/confirm-purchase", {
        method: "POST",
        body: JSON.stringify({ transaction_id: txId, action, reason }),
      });
      setSuccessMessage(action === "CONFIRM" ? "Recompensa verificada com sucesso!" : "Compra rejeitada.");
      syncMemberData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // MEMBER: Redeem Points
  const handleRequestRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const res = await apiFetch("/api/member/redemptions", {
        method: "POST",
        body: JSON.stringify(redeemForm),
      });
      setSuccessMessage(`Pedido de resgate efetuado! Referência: ${res.redemptionNumber}`);
      setRedeemForm({ listing_id: "", points: 800 });
      syncMemberData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // MEMBER: Transfer Points
  const handleRequestTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const res = await apiFetch("/api/member/transfers", {
        method: "POST",
        body: JSON.stringify(transferForm),
      });
      setSuccessMessage(`Transferência iniciada! Referência: ${res.transferNumber}. Enviaremos os pontos em 3 dias úteis após validação.`);
      setTransferForm({ recipient_number: "", points: 100 });
      syncMemberData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // PARTNER: Verify Member Number
  const handleVerifyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setVerifiedMember(null);
    const mNum = (e.currentTarget as any).member_number.value;
    try {
      const data = await apiFetch("/api/partner/verify-member", {
        method: "POST",
        body: JSON.stringify({ member_number: mNum }),
      });
      setVerifiedMember(data.member);
      setVerifiedPromos(data.promotions || []);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // PARTNER: Record Purchase
  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      const res = await apiFetch("/api/partner/purchase/record", {
        method: "POST",
        body: JSON.stringify({
          member_id: verifiedMember.id,
          listing_id: purchaseForm.listing_id,
          promotion_id: purchaseForm.promotion_id,
          amount_paid_kz: Number(purchaseForm.amount_paid_kz),
          idempotency_key: crypto.randomUUID(),
        }),
      });
      setSuccessMessage(`Transação criada: #${res.transactionNumber}. O cliente deve confirmar na app para receber ${res.points} pontos.`);
      setVerifiedMember(null);
      setPurchaseForm({ listing_id: "", promotion_id: "", amount_paid_kz: 0 });
      syncPartnerData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // PARTNER: Approve/Reject Redemption
  const handlePartnerRedeemAction = async (redId: string, action: "APPROVE" | "REJECT") => {
    try {
      await apiFetch("/api/partner/redemptions", {
        method: "POST",
        body: JSON.stringify({ redemption_id: redId, action }),
      });
      setSuccessMessage(action === "APPROVE" ? "Aprovado pelo parceiro! A aguardar Admin." : "Resgate rejeitado.");
      syncPartnerData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // PARTNER: Verify short-lived OTP verification code
  const handleVerifyRedemptionToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      await apiFetch("/api/partner/redemptions", {
        method: "POST",
        body: JSON.stringify({
          redemption_id: verifyTokenInput.redemption_id,
          token: verifyTokenInput.token,
          action: "VERIFY_TOKEN",
        }),
      });
      setSuccessMessage("Benefício resgatado e entregue com sucesso!");
      setVerifyTokenInput({ redemption_id: "", token: "" });
      syncPartnerData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // PARTNER: Create/Edit Listing
  const handleSaveListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      await apiFetch("/api/partner/listings", {
        method: "POST",
        body: JSON.stringify(partnerListingForm),
      });
      setSuccessMessage("Oferta atualizada com sucesso!");
      setPartnerListingForm({ id: "", title: "", description: "", base_price_kz: 10000 });
      syncPartnerData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // ADMIN: Member Account actions
  const handleAdminMemberAction = async (memberId: string, action: "FREEZE" | "UNFREEZE" | "SUSPEND" | "ACTIVATE") => {
    try {
      await apiFetch("/api/admin/members/action", {
        method: "POST",
        body: JSON.stringify({ id: memberId, action }),
      });
      setSuccessMessage(`Operação ${action} realizada com sucesso.`);
      syncAdminData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // ADMIN: Create Partner
  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      await apiFetch("/api/admin/partners", {
        method: "POST",
        body: JSON.stringify(adminPartnerForm),
      });
      setSuccessMessage("Parceiro criado com sucesso!");
      setAdminPartnerForm({ name: "", legal_name: "", category: "Hotelaria", contact_name: "", phone: "", email: "", address: "", admin_email: "" });
      syncAdminData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // ADMIN: Create Promotion
  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      await apiFetch("/api/admin/promotions", {
        method: "POST",
        body: JSON.stringify(adminPromoForm),
      });
      setSuccessMessage("Campanha promocional publicada com sucesso!");
      setAdminPromoForm({ listing_id: "", title: "", description: "", commission_mode: "PERCENT_OF_PURCHASE", commission_value: 10, benefit_mode: "PERCENT_OF_COMMISSION", benefit_value: 50, delivery_mode: "POINTS", valid_from: "", valid_until: "" });
      syncAdminData();
      fetchCatalog();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // ADMIN: Approve Redemption Request
  const handleAdminRedeemAction = async (redId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await apiFetch("/api/admin/redemptions/action", {
        method: "POST",
        body: JSON.stringify({ redemption_id: redId, action }),
      });
      if (action === "APPROVE" && res.verificationCode) {
        setSuccessMessage(`Resgate aprovado! Envie o código OTP ao membro: ${res.verificationCode}`);
      } else {
        setSuccessMessage("Operação executada.");
      }
      syncAdminData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // ADMIN: Approve Transfer
  const handleAdminTransferAction = async (transferId: string, action: "APPROVE" | "REJECT") => {
    try {
      await apiFetch("/api/admin/transfers/action", {
        method: "POST",
        body: JSON.stringify({ transfer_id: transferId, action }),
      });
      setSuccessMessage(action === "APPROVE" ? "Transferência aprovada! Será liquidada pelo agendamento do sistema." : "Transferência rejeitada.");
      syncAdminData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // ADMIN: Settlements
  const handleGenerateSettlement = async (pId: string) => {
    try {
      const res = await apiFetch("/api/admin/settlements", {
        method: "POST",
        body: JSON.stringify({ partner_id: pId, action: "GENERATE" }),
      });
      setSuccessMessage(`Relatório de fecho gerado: ${formatKz(res.grossRedemptions)} pendentes de pagamento.`);
      syncAdminData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handlePaySettlement = async (settId: string) => {
    const ref = bankRefInput[settId];
    if (!ref) {
      setErrorMessage("Por favor insira a referência bancária para provar o pagamento.");
      return;
    }
    try {
      await apiFetch("/api/admin/settlements", {
        method: "POST",
        body: JSON.stringify({ settlement_id: settId, action: "PAY", bank_reference: ref }),
      });
      setSuccessMessage("Liquidação fechada e registada com sucesso!");
      syncAdminData();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="app-shell flex flex-col min-h-screen bg-white">
      {/* ----------------- GLOBAL BANNER ALERTS ----------------- */}
      {errorMessage && (
        <div className="bg-red-50 text-red-800 text-sm py-3 px-4 border-b border-red-200 flex justify-between items-center z-50">
          <span>{errorMessage}</span>
          <button className="font-semibold px-2" onClick={() => setErrorMessage("")}>×</button>
        </div>
      )}
      {successMessage && (
        <div className="bg-teal-50 text-teal-900 text-sm py-3 px-4 border-b border-teal-200 flex justify-between items-center z-50">
          <span>{successMessage}</span>
          <button className="font-semibold px-2" onClick={() => setSuccessMessage("")}>×</button>
        </div>
      )}

      {/* ----------------- WEB TOP BAR CONTRACT ----------------- */}
      <header className="site-header border-b border-gray-100 bg-white text-zinc-900 shadow-sm sticky top-0 z-40">
        <div className="header-inner max-w-7xl mx-auto px-4 min-h-[72px] flex items-center justify-between gap-4">
          {/* Brand Wordmark (Single text element) */}
          <button onClick={() => { if (!session) setCurrentView("public-home"); }} className="brand-mark text-xl font-bold tracking-widest text-zinc-950 font-serif">
            PROMOANGOL
          </button>

          {/* Navigation links (4-6 links) */}
          <nav className="hidden md:flex items-center gap-6 text-xs tracking-widest uppercase text-zinc-500 font-medium">
            {!session ? (
              <>
                <button onClick={() => setCurrentView("public-home")} className={currentView === "public-home" ? "text-zinc-950 border-b border-zinc-950 pb-1 font-semibold" : "hover:text-zinc-950 transition-colors"}>Início</button>
                <button onClick={() => setCurrentView("public-catalog")} className={currentView === "public-catalog" ? "text-zinc-950 border-b border-zinc-950 pb-1 font-semibold" : "hover:text-zinc-950 transition-colors"}>Catálogo</button>
                <a href="#how" className="hover:text-zinc-950 transition-colors">Adesão</a>
                <a href="#partners" className="hover:text-zinc-950 transition-colors">Parceiros</a>
              </>
            ) : (
              <>
                <span className="text-zinc-400 normal-case italic">Sessão: {session.name} ({session.role})</span>
              </>
            )}
          </nav>

          {/* Actions Zone */}
          <div className="flex items-center gap-3 text-xs tracking-wider">
            {!session ? (
              <>
                <button onClick={() => setCurrentView("login")} className="hover:text-zinc-950 uppercase font-semibold">Entrar</button>
                <button onClick={() => setCurrentView("register")} className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 uppercase font-semibold transition-colors">Aderir</button>
              </>
            ) : (
              <button onClick={logout} className="border border-zinc-200 text-zinc-700 hover:text-zinc-900 px-3 py-1.5 uppercase font-medium transition-colors">Sair</button>
            )}
          </div>
        </div>
      </header>

      {/* ----------------- ROUTER RENDERING ZONE ----------------- */}
      <main className="flex-grow">
        {/* VIEW: PUBLIC HOME */}
        {currentView === "public-home" && (
          <div>
            {/* Elegant luxury hero banner */}
            <section className="relative overflow-hidden bg-zinc-950 text-white py-28 px-4 text-center md:text-left">
              <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 text-[#cba557] font-semibold text-xs tracking-widest uppercase">
                    <span className="w-6 h-[1px] bg-[#cba557]"></span>
                    Recompensas feitas para Angola
                  </div>
                  <h1 className="text-4xl md:text-6xl font-light font-serif tracking-tight leading-tight">
                    Mais valor no que já compra.
                  </h1>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-lg">
                    Compre nos parceiros PromoAngol, confirme a sua compra na plataforma e transforme parte do valor em pontos ou descontos imediatos.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                    <button onClick={() => setCurrentView("public-catalog")} className="bg-white hover:bg-zinc-100 text-zinc-950 px-6 py-3 uppercase text-xs tracking-wider font-semibold transition-colors">Explorar Catálogo</button>
                    <button onClick={() => setCurrentView("register")} className="border border-zinc-700 hover:border-white text-white px-6 py-3 uppercase text-xs tracking-wider font-semibold transition-colors">Aderir Agora</button>
                  </div>
                </div>
                {/* Visual Fallback Banner - Luxe Terracotta Mesh */}
                <div className="relative h-[320px] bg-gradient-to-tr from-[#a65d50] via-[#dec0b2] to-[#1a2b49] shadow-2xl flex items-center justify-center p-8">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative text-center space-y-2 max-w-xs bg-white/10 backdrop-blur-md p-6 border border-white/20">
                    <p className="text-[10px] tracking-widest uppercase text-[#cba557]">EXCLUSIVO</p>
                    <h3 className="font-serif text-2xl font-light">PROMOANGOL BENEFÍCIOS</h3>
                    <div className="h-[1px] bg-white/20 my-4"></div>
                    <p className="text-xs text-white/80">Hotéis, SPAs e Restaurantes com recompensas que voltam para si.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Three Premium Feature Cards */}
            <section className="max-w-7xl mx-auto px-4 py-16" id="how">
              <div className="text-center mb-12 space-y-2">
                <p className="text-[#357169] font-semibold text-xs tracking-widest uppercase">Simples e Seguro</p>
                <h2 className="font-serif text-3xl md:text-4xl font-light tracking-tight text-zinc-950">Como Funciona</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="p-8 border border-zinc-100 bg-zinc-50 flex flex-col justify-between min-h-[220px]">
                  <span className="text-xs tracking-widest text-zinc-400 uppercase">01 / ESCOLHA</span>
                  <h3 className="font-serif text-xl font-medium mt-4 text-zinc-900">Explore ofertas premium no catálogo semanal.</h3>
                </div>
                <div className="p-8 border border-[#cadbd8] bg-[#eef4f2] flex flex-col justify-between min-h-[220px]">
                  <span className="text-xs tracking-widest text-[#357169] uppercase font-semibold">02 / COMPRE</span>
                  <h3 className="font-serif text-xl font-medium mt-4 text-zinc-900">O parceiro submete o registo; confirme o valor na app.</h3>
                </div>
                <div className="p-8 border border-zinc-100 bg-[#1a2b49] text-white flex flex-col justify-between min-h-[220px]">
                  <span className="text-xs tracking-widest text-[#cba557] uppercase font-semibold">03 / RECEBA</span>
                  <h3 className="font-serif text-xl font-medium mt-4">Acumule pontos em carteira ou use descontos.</h3>
                </div>
              </div>
            </section>

            {/* Micro weekly highlight rail */}
            <section className="bg-zinc-50 py-16 px-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                  <div className="space-y-1">
                    <p className="text-xs tracking-widest uppercase text-[#357169] font-semibold">Ofertas Ativas</p>
                    <h2 className="font-serif text-3xl font-light">Catálogo em Destaque</h2>
                  </div>
                  <button onClick={() => setCurrentView("public-catalog")} className="text-xs uppercase tracking-wider font-semibold text-[#cba557] hover:underline">Ver tudo →</button>
                </div>
                {catalogState === "ready" ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    {promotions.slice(0, 3).map((p) => (
                      <div key={p.id} className="bg-white border border-zinc-200 shadow-sm flex flex-col justify-between">
                        <div className="h-44 bg-gradient-to-br from-[#a65d50] to-[#2d6b63] p-4 flex flex-col justify-between text-white">
                          <span className="text-[10px] tracking-widest uppercase bg-black/20 self-start px-2 py-0.5">PROMO</span>
                          <span className="text-xl font-serif">{p.partner_category || "Serviço"}</span>
                        </div>
                        <div className="p-6 space-y-4">
                          <div>
                            <p className="text-[10px] tracking-widest uppercase text-zinc-400">{p.partner_name}</p>
                            <h3 className="font-serif text-xl font-medium text-zinc-950">{p.title}</h3>
                          </div>
                          <p className="text-xs text-zinc-500 line-clamp-2">{p.description || "Consulte as condições na plataforma PromoAngol."}</p>
                          <div className="pt-4 border-t border-zinc-100 flex justify-between items-center text-xs">
                            <span className="font-bold text-zinc-900">{p.delivery_mode === "DISCOUNT" ? "Desconto Directo" : "Recompensa de Pontos"}</span>
                            <span className="text-[#357169] font-semibold">{formatKz(p.member_benefit_kz)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-zinc-500 bg-white border border-zinc-100 font-light">
                    O catálogo de ofertas está temporariamente offline.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* VIEW: CATALOG */}
        {currentView === "public-catalog" && (
          <section className="max-w-7xl mx-auto px-4 py-16 space-y-12">
            <div className="space-y-2 text-center md:text-left">
              <p className="text-xs tracking-widest uppercase text-[#357169] font-semibold">Promoções de Estilo de Vida</p>
              <h1 className="font-serif text-4xl font-light tracking-tight text-zinc-950">Catálogo Semanal</h1>
              <p className="text-zinc-500 text-sm max-w-xl">Todos os benefícios e taxas de comissão são auditados. 1 Ponto = 1 Kz de recompensa para o seu dia-a-dia em Luanda e no país.</p>
            </div>

            {catalogState === "loading" && <div className="text-center py-12 text-zinc-500">A carregar ofertas...</div>}
            {catalogState === "ready" && (
              <div className="grid md:grid-cols-3 gap-6">
                {promotions.map((p) => (
                  <div key={p.id} className="bg-white border border-zinc-200 shadow-sm flex flex-col justify-between">
                    <div className="h-44 bg-gradient-to-br from-[#1a2b49] via-[#617482] to-[#a65d50] p-4 flex flex-col justify-between text-white">
                      <span className="text-[10px] tracking-widest uppercase bg-black/20 self-start px-2 py-0.5">ACTIVO</span>
                      <p className="font-serif text-lg">{p.listing_title || "Premium Service"}</p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-[10px] tracking-widest uppercase text-zinc-400">{p.partner_name}</p>
                        <h3 className="font-serif text-xl font-medium text-zinc-950">{p.title}</h3>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-3">{p.description || "Consulte os termos adicionais no balcão do parceiro comercial."}</p>
                      <div className="pt-4 border-t border-zinc-100 flex justify-between items-center text-xs">
                        <div>
                          <p className="text-[9px] text-zinc-400 uppercase">Benefício do Membro</p>
                          <p className="font-bold text-zinc-900">{p.delivery_mode === "DISCOUNT" ? "Desconto Directo" : "Crédito em Pontos"}</p>
                        </div>
                        <span className="text-[#cba557] font-semibold text-lg">{formatKz(p.member_benefit_kz)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {catalogState === "empty" && <div className="text-center py-12 text-zinc-500">De momento não há campanhas promocionais ativas.</div>}
          </section>
        )}

        {/* VIEW: LOGIN */}
        {currentView === "login" && (
          <section className="max-w-md mx-auto my-16 p-8 border border-zinc-100 bg-zinc-50">
            <h2 className="font-serif text-3xl font-light text-center mb-6 text-zinc-900">Entrar na Plataforma</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1 font-medium">Email</label>
                <input type="email" required className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-zinc-500" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1 font-medium">Palavra-passe</label>
                <input type="password" required className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-zinc-500" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
              </div>
              <button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3 text-xs tracking-widest uppercase transition-colors">Iniciar Sessão</button>
            </form>
            <p className="text-center text-xs text-zinc-500 mt-6">Ainda não é membro? <button onClick={() => setCurrentView("register")} className="text-zinc-900 font-bold hover:underline">Registe-se aqui</button></p>
          </section>
        )}

        {/* VIEW: REGISTER */}
        {currentView === "register" && (
          <section className="max-w-md mx-auto my-16 p-8 border border-zinc-100 bg-zinc-50">
            <h2 className="font-serif text-3xl font-light text-center mb-6 text-zinc-900">Aderir à PromoAngol</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1 font-medium">Nome Completo</label>
                <input type="text" required placeholder="Ex: António Silva" className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-zinc-500" value={registerForm.full_name} onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1 font-medium">Email</label>
                <input type="email" required placeholder="Ex: cliente@promoangol.com" className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-zinc-500" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1 font-medium">Telemóvel</label>
                <input type="text" placeholder="Ex: 923xxxxxx" className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-zinc-500" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1 font-medium">Palavra-passe</label>
                <input type="password" required className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-zinc-500" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
              </div>
              <button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3 text-xs tracking-widest uppercase transition-colors">Criar Conta & Receber Oferta</button>
            </form>
            <p className="text-center text-xs text-zinc-500 mt-6">Já possui conta? <button onClick={() => setCurrentView("login")} className="text-zinc-900 font-bold hover:underline">Entre por aqui</button></p>
          </section>
        )}

        {/* VIEW: AUTHENTICATED AREAS */}
        {currentView === "app" && session && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* ------------------- ROLE: MEMBER ------------------- */}
            {session.role === "MEMBER" && (
              <div className="space-y-8">
                {/* Member App Tabs */}
                <div className="flex border-b border-zinc-200 gap-6 text-sm tracking-widest uppercase font-medium">
                  <button onClick={() => setMemberTab("dashboard")} className={`pb-3 ${memberTab === "dashboard" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Dashboard</button>
                  <button onClick={() => setMemberTab("catalog")} className={`pb-3 ${memberTab === "catalog" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Ofertas</button>
                  <button onClick={() => setMemberTab("wallet")} className={`pb-3 ${memberTab === "wallet" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Extrato da Carteira</button>
                  <button onClick={() => setMemberTab("redemptions")} className={`pb-3 ${memberTab === "redemptions" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Resgatar</button>
                  <button onClick={() => setMemberTab("transfers")} className={`pb-3 ${memberTab === "transfers" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Transferir</button>
                </div>

                {memberTab === "dashboard" && (
                  <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Column 1: Member Card & Balances */}
                    <div className="space-y-6">
                      {/* Premium Member Card */}
                      <div className="bg-gradient-to-tr from-[#1a2b49] via-[#617482] to-[#a65d50] text-white p-6 shadow-xl relative overflow-hidden min-h-[220px] flex flex-col justify-between rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] tracking-widest uppercase opacity-80">Cartão de Membro Oficial</p>
                            <h3 className="font-serif text-2xl font-light mt-1">{memberSummary?.profile?.plan_name || "Standard"}</h3>
                          </div>
                          <span className="font-bold text-xs tracking-wider">PROMOANGOL</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-sm font-semibold tracking-wide uppercase">{memberSummary?.profile?.full_name}</p>
                            <p className="text-[11px] font-mono opacity-85 mt-1">{memberSummary?.profile?.member_number}</p>
                          </div>
                          {/* SImulated QR Code */}
                          <div className="w-16 h-16 bg-white p-1 rounded flex flex-col items-center justify-center">
                            <div className="w-14 h-14 bg-zinc-900 flex items-center justify-center text-[8px] text-white font-mono font-bold leading-none text-center">
                              PA QR
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Balances */}
                      <div className="bg-zinc-50 border border-zinc-200 p-6 space-y-4">
                        <h4 className="text-xs uppercase tracking-wider font-semibold text-zinc-500">Saldo de Pontos (1 Pt = 1 Kz)</h4>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white p-3 border border-zinc-100">
                            <span className="text-[10px] uppercase text-zinc-400 block">Disponíveis</span>
                            <span className="font-mono text-xl font-bold block text-teal-800">{memberSummary?.balances?.available_points ?? 0}</span>
                          </div>
                          <div className="bg-white p-3 border border-zinc-100">
                            <span className="text-[10px] uppercase text-zinc-400 block">Pendente</span>
                            <span className="font-mono text-xl font-bold block text-orange-600">{memberSummary?.balances?.pending_points ?? 0}</span>
                          </div>
                          <div className="bg-white p-3 border border-zinc-100">
                            <span className="text-[10px] uppercase text-zinc-400 block">Reservado</span>
                            <span className="font-mono text-xl font-bold block text-zinc-500">{memberSummary?.balances?.reserved_points ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Pending Confirmations */}
                    <div className="space-y-6 md:col-span-2">
                      <div className="border border-zinc-200 p-6 bg-white space-y-4">
                        <h3 className="font-serif text-2xl font-light text-zinc-950">Compras por Confirmar ({memberSummary?.pendingPurchasesCount || 0})</h3>
                        <p className="text-xs text-zinc-500">Sempre que comprar num parceiro, ele submeterá a transação. Verifique e confirme aqui para libertar os seus pontos de recompensa.</p>
                        
                        <div className="space-y-3">
                          {memberTxList.filter(t => t.status === "PENDING_MEMBER_CONFIRMATION").map((tx) => (
                            <div key={tx.id} className="p-4 border border-orange-200 bg-orange-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                              <div>
                                <p className="text-[10px] tracking-widest uppercase font-semibold text-orange-800">Transação #{tx.transaction_number}</p>
                                <h4 className="font-serif text-lg font-medium text-zinc-900">{tx.listing_title}</h4>
                                <p className="text-xs text-zinc-500">Parceiro: {tx.partner_name} · Total Pago: {formatKz(tx.amount_paid_kz)}</p>
                                <p className="text-xs font-bold text-teal-800 mt-1">Recompensa: +{tx.points_to_release} pontos</p>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleConfirmPurchase(tx.id, "CONFIRM")} className="bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-semibold py-2 px-4 uppercase tracking-wider">Confirmar</button>
                                <button onClick={() => handleConfirmPurchase(tx.id, "REJECT")} className="border border-red-300 hover:bg-red-50 text-red-700 text-[10px] font-semibold py-2 px-4 uppercase tracking-wider">Rejeitar</button>
                              </div>
                            </div>
                          ))}
                          {memberTxList.filter(t => t.status === "PENDING_MEMBER_CONFIRMATION").length === 0 && (
                            <p className="text-sm text-zinc-400 italic font-light">Não tem nenhuma transação comercial pendente de confirmação.</p>
                          )}
                        </div>
                      </div>

                      {/* Recent Activities */}
                      <div className="border border-zinc-100 p-6 space-y-4">
                        <h3 className="font-serif text-xl font-light text-zinc-950">Historial Recente</h3>
                        <div className="divide-y divide-zinc-100 text-xs">
                          {memberTxList.slice(0, 5).map((tx) => (
                            <div key={tx.id} className="py-3 flex justify-between items-center">
                              <div>
                                <p className="font-medium text-zinc-900">{tx.listing_title || "Compra Comercial"}</p>
                                <p className="text-[10px] text-zinc-400">{tx.partner_name} · {tx.created_at?.slice(0,10)}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold block">{formatKz(tx.amount_paid_kz)}</span>
                                <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 inline-block ${tx.status === "VERIFIED" ? "text-teal-800" : "text-orange-600"}`}>
                                  {tx.status}
                                </span>
                              </div>
                            </div>
                          ))}
                          {memberTxList.length === 0 && <p className="text-zinc-400 italic">Nenhuma compra registada.</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {memberTab === "catalog" && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-2xl font-light text-zinc-950">Explore Promoções Disponíveis</h3>
                    {catalogState === "ready" ? (
                      <div className="grid md:grid-cols-3 gap-6">
                        {promotions.map((p) => (
                          <div key={p.id} className="bg-white border border-zinc-200 p-6 shadow-sm space-y-4">
                            <div>
                              <p className="text-[10px] tracking-widest uppercase text-zinc-400">{p.partner_name}</p>
                              <h4 className="font-serif text-xl font-medium text-zinc-950">{p.title}</h4>
                            </div>
                            <p className="text-xs text-zinc-500">{p.description || "Consulte no balcão de atendimento."}</p>
                            <div className="pt-4 border-t border-zinc-100 flex justify-between items-center text-xs">
                              <span>Benefício</span>
                              <span className="font-bold text-teal-800">{formatKz(p.member_benefit_kz)} ({p.delivery_mode === "DISCOUNT" ? "DESCONTO" : "PONTOS"})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500">Sem ofertas ativas de momento.</p>
                    )}
                  </div>
                )}

                {memberTab === "wallet" && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-2xl font-light text-zinc-950">Extrato Consolidado de Pontos</h3>
                    <div className="bg-zinc-50 border border-zinc-200 p-4">
                      <table className="w-full text-left text-xs font-mono divide-y divide-zinc-200">
                        <thead>
                          <tr className="text-zinc-400 uppercase tracking-wider">
                            <th className="py-2">Data</th>
                            <th className="py-2">Fluxo</th>
                            <th className="py-2">Pontos</th>
                            <th className="py-2">Histórico/Razão</th>
                            <th className="py-2">Expiração</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {memberLedger.map((entry) => (
                            <tr key={entry.id} className="hover:bg-white transition-colors">
                              <td className="py-3 text-zinc-500">{entry.created_at?.slice(0, 16)}</td>
                              <td className={`py-3 font-semibold ${entry.direction === "CREDIT" ? "text-teal-700" : "text-red-700"}`}>
                                {entry.direction === "CREDIT" ? "+ ENTRADA" : "- SAÍDA"} ({entry.bucket})
                              </td>
                              <td className="py-3 font-bold">{entry.points} pts</td>
                              <td className="py-3 text-zinc-700">{entry.reason}</td>
                              <td className="py-3 text-zinc-400">{entry.expires_at?.slice(0,10) || "Sem expiração"}</td>
                            </tr>
                          ))}
                          {memberLedger.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-zinc-400 italic">Não foram encontrados movimentos contabilísticos associados.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {memberTab === "redemptions" && (
                  <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Form to Request */}
                    <div className="border border-zinc-200 p-6 space-y-4 bg-zinc-50">
                      <h4 className="font-serif text-xl font-light text-zinc-950">Solicitar Novo Resgate</h4>
                      <p className="text-xs text-zinc-500">Mínimo de resgate: 800 pontos. Os pontos entram em reserva imediatamente. O parceiro e o Admin PromoAngol devem aprovar. Receberá um código OTP na aprovação.</p>
                      
                      <form onSubmit={handleRequestRedeem} className="space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Escolha a Oferta Comercial</label>
                          <select required className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none" value={redeemForm.listing_id} onChange={(e) => setRedeemForm({ ...redeemForm, listing_id: e.target.value })}>
                            <option value="">-- Seleccionar Oferta --</option>
                            {promotions.map(p => (
                              <option key={p.id} value={p.listing_id || ""}>{p.title} ({p.partner_name})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Pontos a Resgatar</label>
                          <input type="number" required min={800} className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none" value={redeemForm.points} onChange={(e) => setRedeemForm({ ...redeemForm, points: Number(e.target.value) })} />
                        </div>
                        <button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3 text-xs tracking-widest uppercase transition-colors">Solicitar Resgate</button>
                      </form>
                    </div>

                    {/* Active requests lists */}
                    <div className="md:col-span-2 border border-zinc-100 p-6 space-y-4 bg-white">
                      <h4 className="font-serif text-xl font-light text-zinc-950">Os Meus Pedidos de Resgate</h4>
                      <div className="divide-y divide-zinc-100 text-xs">
                        {memberRedemptions.map((r) => (
                          <div key={r.id} className="py-4 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-zinc-900">Resgate #{r.redemption_number}</span>
                              <span className={`px-2 py-0.5 text-[9px] uppercase font-semibold ${r.status === "APPROVED" ? "bg-teal-100 text-teal-900" : r.status === "USED" ? "bg-zinc-200 text-zinc-700" : "bg-orange-100 text-orange-900"}`}>
                                {r.status}
                              </span>
                            </div>
                            <p className="text-zinc-600">Serviço: {r.listing_title} ({r.partner_name}) · Pontos Usados: {r.points_requested}</p>
                            <p className="text-zinc-500">Valor Adicional a Pagar no Balcão: <strong className="text-zinc-900">{formatKz(r.cash_amount_kz)}</strong></p>
                            
                            {r.status === "APPROVED" && (
                              <div className="p-3 bg-teal-50 border border-teal-200 mt-2">
                                <p className="text-xs font-semibold text-teal-900">Aprovado pelo Administrador!</p>
                                <p className="text-[11px] text-teal-800 mt-1">Apresente esta referência no estabelecimento para validar o seu resgate.</p>
                                <p className="text-[10px] text-zinc-400 mt-1">Expira a: {r.approval_expires_at}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        {memberRedemptions.length === 0 && (
                          <p className="text-sm text-zinc-400 italic py-4">Nenhum resgate solicitado de momento.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {memberTab === "transfers" && (
                  <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Transfer form */}
                    <div className="border border-zinc-200 p-6 bg-zinc-50 space-y-4">
                      <h4 className="font-serif text-xl font-light text-zinc-950">Transferir Pontos para Outro Membro</h4>
                      <p className="text-xs text-zinc-500">Insira o número de membro PromoAngol do destinatário. As transferências são auditadas e demoram até 3 dias úteis para estarem disponíveis.</p>
                      
                      <form onSubmit={handleRequestTransfer} className="space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Nº do Membro Destinatário</label>
                          <input type="text" required placeholder="Ex: PA923456789" className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none" value={transferForm.recipient_number} onChange={(e) => setTransferForm({ ...transferForm, recipient_number: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Pontos a Transferir</label>
                          <input type="number" required min={1} className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none" value={transferForm.points} onChange={(e) => setTransferForm({ ...transferForm, points: Number(e.target.value) })} />
                        </div>
                        <button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3 text-xs tracking-widest uppercase transition-colors">Iniciar Transferência</button>
                      </form>
                    </div>

                    {/* Transfers logs */}
                    <div className="md:col-span-2 border border-zinc-100 p-6 bg-white space-y-6">
                      <div>
                        <h4 className="font-serif text-lg font-light mb-3 text-zinc-900">Transferências Enviadas</h4>
                        <div className="divide-y divide-zinc-100 text-xs">
                          {memberTransfersSent.map(t => (
                            <div key={t.id} className="py-2 flex justify-between items-center">
                              <div>
                                <p className="font-semibold">Para: {t.recipient_name} ({t.recipient_number})</p>
                                <p className="text-[10px] text-zinc-400">{t.created_at?.slice(0, 10)} · Ref: #{t.transfer_number}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold block text-red-700">-{t.points} pts</span>
                                <span className="text-[10px] uppercase text-zinc-400 font-semibold">{t.status}</span>
                              </div>
                            </div>
                          ))}
                          {memberTransfersSent.length === 0 && <p className="text-xs text-zinc-400 italic">Nenhuma transferência enviada.</p>}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-serif text-lg font-light mb-3 text-zinc-900">Transferências Recebidas</h4>
                        <div className="divide-y divide-zinc-100 text-xs">
                          {memberTransfersRecv.map(t => (
                            <div key={t.id} className="py-2 flex justify-between items-center">
                              <div>
                                <p className="font-semibold">De: {t.sender_name} ({t.sender_number})</p>
                                <p className="text-[10px] text-zinc-400">{t.created_at?.slice(0, 10)} · Ref: #{t.transfer_number}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold block text-teal-700">+{t.points} pts</span>
                                <span className="text-[10px] uppercase text-zinc-400 font-semibold">{t.status}</span>
                              </div>
                            </div>
                          ))}
                          {memberTransfersRecv.length === 0 && <p className="text-xs text-zinc-400 italic">Nenhuma transferência recebida.</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------- ROLE: PARTNER ------------------- */}
            {(session.role === "PARTNER_ADMIN" || session.role === "PARTNER_STAFF") && (
              <div className="space-y-8">
                {/* Partner App Tabs */}
                <div className="flex border-b border-zinc-200 gap-6 text-sm tracking-widest uppercase font-medium">
                  <button onClick={() => setPartnerTab("dashboard")} className={`pb-3 ${partnerTab === "dashboard" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Painel Geral</button>
                  <button onClick={() => setPartnerTab("verify")} className={`pb-3 ${partnerTab === "verify" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Registar Compra</button>
                  <button onClick={() => setPartnerTab("redemptions")} className={`pb-3 ${partnerTab === "redemptions" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Gestão de Resgates</button>
                  <button onClick={() => setPartnerTab("listings")} className={`pb-3 ${partnerTab === "listings" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Gerir Preços & Ofertas</button>
                </div>

                {partnerTab === "dashboard" && (
                  <div className="space-y-8">
                    {/* Welcome Banner */}
                    <div className="p-6 border border-zinc-200 bg-zinc-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="font-serif text-3xl font-light text-zinc-950">{partnerSummary?.partner?.name}</h2>
                        <p className="text-xs text-zinc-500">Parceiro Oficial PromoAngol · Categoria: {partnerSummary?.partner?.category} · {partnerSummary?.partner?.address}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="bg-white p-3 border border-zinc-100">
                          <span className="text-[10px] uppercase text-zinc-400 block">Vendas Hoje</span>
                          <span className="font-mono text-xl font-bold block">{partnerSummary?.stats?.todayCount || 0}</span>
                        </div>
                        <div className="bg-white p-3 border border-zinc-100">
                          <span className="text-[10px] uppercase text-zinc-400 block">Volume Hoje</span>
                          <span className="font-mono text-xs font-bold block">{formatKz(partnerSummary?.stats?.todayVolume || 0)}</span>
                        </div>
                        <div className="bg-white p-3 border border-zinc-100">
                          <span className="text-[10px] uppercase text-zinc-400 block">Confirmações Pendentes</span>
                          <span className="font-mono text-xl font-bold block text-orange-600">{partnerSummary?.stats?.pendingConfirm || 0}</span>
                        </div>
                        <div className="bg-white p-3 border border-zinc-100">
                          <span className="text-[10px] uppercase text-zinc-400 block">Resgates Pendentes</span>
                          <span className="font-mono text-xl font-bold block text-teal-800">{partnerSummary?.stats?.pendingRedeem || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Today's Transactions list */}
                    <div className="border border-zinc-100 p-6 space-y-4 bg-white">
                      <h3 className="font-serif text-xl font-light text-zinc-950">Transações Recentes no Estabelecimento</h3>
                      <div className="divide-y divide-zinc-100 text-xs">
                        {partnerSummary?.transactions?.map((tx: any) => (
                          <div key={tx.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <p className="font-semibold text-zinc-900">Cliente: {tx.member_name} ({tx.member_number})</p>
                              <p className="text-[10px] text-zinc-400">Oferta: {tx.listing_title} · {tx.created_at?.slice(0, 16)} · Ref: #{tx.transaction_number}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold block text-zinc-950">{formatKz(tx.amount_paid_kz)}</span>
                              <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 inline-block ${tx.status === "VERIFIED" ? "text-teal-800" : "text-orange-600"}`}>
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {partnerSummary?.transactions?.length === 0 && <p className="text-zinc-400 italic py-4">Nenhuma transação comercial registada.</p>}
                      </div>
                    </div>
                  </div>
                )}

                {partnerTab === "verify" && (
                  <div className="grid md:grid-cols-2 gap-8 items-start">
                    {/* Search & Validate Customer */}
                    <div className="border border-zinc-200 p-6 bg-zinc-50 space-y-4">
                      <h4 className="font-serif text-xl font-light text-zinc-950">Validar Nº de Membro</h4>
                      <p className="text-xs text-zinc-500">Insira o número de membro apresentado pelo cliente ou digitalizado do seu cartão PromoAngol.</p>
                      
                      <form onSubmit={handleVerifyMember} className="space-y-4">
                        <div className="flex gap-2">
                          <input type="text" name="member_number" required placeholder="Ex: PA923456789" className="flex-grow border border-zinc-200 px-3 py-2 text-sm bg-white focus:outline-none" />
                          <button type="submit" className="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-2 px-6 text-xs uppercase tracking-wider transition-colors">Pesquisar</button>
                        </div>
                      </form>

                      {verifiedMember && (
                        <div className="p-4 border border-teal-200 bg-teal-50 space-y-3">
                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-teal-800 font-semibold">Cliente Validado</p>
                            <h5 className="font-serif text-lg font-bold text-zinc-900">{verifiedMember.full_name}</h5>
                            <p className="text-xs text-zinc-500">Nº Cartão: {verifiedMember.member_number} · Plano: {verifiedMember.plan_name}</p>
                            <p className="text-xs font-bold text-teal-800 mt-1">Saldo Disponível do Cliente: {verifiedMember.available_points} pontos</p>
                          </div>

                          <div className="h-[1px] bg-teal-200 my-2"></div>

                          {/* Record transaction details */}
                          <form onSubmit={handleRecordPurchase} className="space-y-4">
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Selecione o Serviço Promovido</label>
                              <select required className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white" value={purchaseForm.listing_id} onChange={(e) => {
                                const selectedPromo = verifiedPromos.find(p => p.listing_id === e.target.value);
                                setPurchaseForm({
                                  ...purchaseForm,
                                  listing_id: e.target.value,
                                  promotion_id: selectedPromo ? selectedPromo.id : ""
                                });
                              }}>
                                <option value="">-- Escolher Oferta Comercial --</option>
                                {verifiedPromos.map(p => (
                                  <option key={p.id} value={p.listing_id || ""}>{p.title} (Preço Base: {formatKz(p.base_price_kz)})</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Valor Comercial Pago (Kz)</label>
                              <input type="number" required className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white" value={purchaseForm.amount_paid_kz} onChange={(e) => setPurchaseForm({ ...purchaseForm, amount_paid_kz: Number(e.target.value) })} />
                            </div>
                            <button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 text-xs tracking-wider uppercase transition-colors">Submeter Venda ao Cliente</button>
                          </form>
                        </div>
                      )}
                    </div>

                    <div className="border border-zinc-100 p-6 bg-white space-y-4">
                      <h4 className="font-serif text-xl font-light text-zinc-950">Suporte Operacional</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Ao submeter uma compra, o sistema calcula os termos e comissões do parceiro comercial PromoAngol em tempo real na Cloudflare. Os pontos correspondentes entrarão em saldo pendente para o cliente e ficarão disponíveis após 3 dias úteis de hold administrativo.
                      </p>
                    </div>
                  </div>
                )}

                {partnerTab === "redemptions" && (
                  <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* OTP verification form */}
                    <div className="border border-zinc-200 p-6 bg-zinc-50 space-y-4">
                      <h4 className="font-serif text-xl font-light text-zinc-950">Verificar Token de Resgate</h4>
                      <p className="text-xs text-zinc-500">Quando um resgate do membro é aprovado pelo Administrador, o membro recebe um código OTP de 6 dígitos. Digite a referência do resgate e o código abaixo para entregar o benefício.</p>
                      
                      <form onSubmit={handleVerifyRedemptionToken} className="space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Selecione o Pedido Aprovado</label>
                          <select required className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white" value={verifyTokenInput.redemption_id} onChange={(e) => setVerifyTokenInput({ ...verifyTokenInput, redemption_id: e.target.value })}>
                            <option value="">-- Seleccionar Resgate --</option>
                            {partnerRedemptions.filter(r => r.status === "APPROVED").map(r => (
                              <option key={r.id} value={r.id}>#{r.redemption_number} - {r.member_name} ({r.points_requested} pts)</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Código de Segurança OTP (6 dígitos)</label>
                          <input type="text" required placeholder="Ex: 123456" maxLength={6} className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white" value={verifyTokenInput.token} onChange={(e) => setVerifyTokenInput({ ...verifyTokenInput, token: e.target.value })} />
                        </div>
                        <button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 text-xs tracking-widest uppercase transition-colors">Concluir Entrega de Recompensa</button>
                      </form>
                    </div>

                    {/* Redemption requests history */}
                    <div className="md:col-span-2 border border-zinc-100 p-6 bg-white space-y-4">
                      <h4 className="font-serif text-xl font-light text-zinc-950">Pedidos de Resgate Recebidos</h4>
                      <div className="divide-y divide-zinc-100 text-xs">
                        {partnerRedemptions.map((r) => (
                          <div key={r.id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <p className="font-bold text-zinc-900">Resgate #{r.redemption_number} (Ref: {r.listing_title})</p>
                              <p className="text-zinc-500">Membro: {r.member_name} ({r.member_number}) · Data: {r.created_at?.slice(0, 10)}</p>
                              <p className="text-zinc-700">Pontos Reclamados: {r.points_requested} pts · Pagamento Adicional: {formatKz(r.cash_amount_kz)}</p>
                            </div>
                            <div>
                              {r.status === "REQUESTED" ? (
                                <div className="flex gap-2">
                                  <button onClick={() => handlePartnerRedeemAction(r.id, "APPROVE")} className="bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-semibold py-2 px-4 uppercase tracking-wider">Aprovar</button>
                                  <button onClick={() => handlePartnerRedeemAction(r.id, "REJECT")} className="border border-red-300 text-red-700 text-[10px] font-semibold py-2 px-4 uppercase tracking-wider">Rejeitar</button>
                                </div>
                              ) : (
                                <span className="text-[10px] uppercase font-semibold text-zinc-400 bg-zinc-100 px-2.5 py-1 inline-block">
                                  {r.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {partnerRedemptions.length === 0 && (
                          <p className="text-sm text-zinc-400 italic py-4">Nenhum pedido de resgate de pontos de momento.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {partnerTab === "listings" && (
                  <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Listings pricing form */}
                    <div className="border border-zinc-200 p-6 bg-zinc-50 space-y-4">
                      <h4 className="font-serif text-xl font-light text-zinc-950">Adicionar/Editar Oferta de Preços</h4>
                      <p className="text-xs text-zinc-500">Os parceiros criam e gerem as ofertas e os preços de tabela. No entanto, as campanhas promocionais de pontos correspondentes são criadas de forma exclusiva pela administração do PromoAngol.</p>
                      
                      <form onSubmit={handleSaveListing} className="space-y-4">
                        <input type="hidden" value={partnerListingForm.id} />
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Título do Serviço</label>
                          <input type="text" required placeholder="Ex: Diária Suite Executiva" className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white" value={partnerListingForm.title} onChange={(e) => setPartnerListingForm({ ...partnerListingForm, title: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Breve Descrição do Serviço</label>
                          <textarea className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white h-20 focus:outline-none" value={partnerListingForm.description} onChange={(e) => setPartnerListingForm({ ...partnerListingForm, description: e.target.value })}></textarea>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Preço de Tabela Base (Kz)</label>
                          <input type="number" required className="w-full border border-zinc-200 px-3 py-2 text-sm bg-white" value={partnerListingForm.base_price_kz} onChange={(e) => setPartnerListingForm({ ...partnerListingForm, base_price_kz: Number(e.target.value) })} />
                        </div>
                        <button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3 text-xs tracking-widest uppercase transition-colors">Guardar Artigo</button>
                      </form>
                    </div>

                    {/* Listings lists */}
                    <div className="md:col-span-2 border border-zinc-100 p-6 bg-white space-y-4">
                      <h4 className="font-serif text-xl font-light text-zinc-950">Ofertas Ativas do Parceiro</h4>
                      <div className="divide-y divide-zinc-100 text-xs">
                        {partnerSummary?.listings?.map((l: any) => (
                          <div key={l.id} className="py-4 flex justify-between items-center">
                            <div>
                              <h5 className="font-semibold text-sm text-zinc-900">{l.title}</h5>
                              <p className="text-zinc-500 mt-1">{l.description || "Sem descrição"}</p>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <div>
                                <span className="font-mono font-bold block text-sm">{formatKz(l.base_price_kz)}</span>
                                <span className="text-[10px] text-zinc-400">Estado: {l.status}</span>
                              </div>
                              <button onClick={() => setPartnerListingForm({ id: l.id, title: l.title, description: l.description || "", base_price_kz: l.base_price_kz })} className="text-xs uppercase font-bold text-zinc-900 hover:underline">Editar</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------- ROLE: MASTER ADMIN ------------------- */}
            {session.role === "MASTER_ADMIN" && (
              <div className="space-y-8">
                {/* Admin Tabs */}
                <div className="flex border-b border-zinc-200 gap-4 text-xs tracking-widest uppercase font-semibold overflow-x-auto scrollbar-none pb-1">
                  <button onClick={() => setAdminTab("dashboard")} className={`pb-3 shrink-0 ${adminTab === "dashboard" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Dashboard</button>
                  <button onClick={() => setAdminTab("members")} className={`pb-3 shrink-0 ${adminTab === "members" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Membros ({adminMembers.length})</button>
                  <button onClick={() => setAdminTab("partners")} className={`pb-3 shrink-0 ${adminTab === "partners" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Parceiros ({adminPartners.length})</button>
                  <button onClick={() => setAdminTab("promotions")} className={`pb-3 shrink-0 ${adminTab === "promotions" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Campanhas ({adminPromotions.length})</button>
                  <button onClick={() => setAdminTab("redemptions")} className={`pb-3 shrink-0 ${adminTab === "redemptions" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Aprovar Resgates ({adminRedemptions.filter(r=>r.status==="AWAITING_ADMIN").length})</button>
                  <button onClick={() => setAdminTab("transfers")} className={`pb-3 shrink-0 ${adminTab === "transfers" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Aprovar Envios ({adminTransfers.filter(t=>t.status==="SENDER_APPROVED").length})</button>
                  <button onClick={() => setAdminTab("settlements")} className={`pb-3 shrink-0 ${adminTab === "settlements" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Liquidação</button>
                  <button onClick={() => setAdminTab("audit")} className={`pb-3 shrink-0 ${adminTab === "audit" ? "border-b-2 border-zinc-950 text-zinc-950" : "text-zinc-400"}`}>Audit Log</button>
                </div>

                {adminTab === "dashboard" && (
                  <div className="space-y-8">
                    {/* Admin summary counts */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border border-zinc-200 text-center">
                        <span className="text-[10px] uppercase text-zinc-400 block font-semibold">Total de Membros</span>
                        <span className="text-3xl font-bold font-mono mt-1 block">{adminSummary?.stats?.members || 0}</span>
                      </div>
                      <div className="p-4 border border-zinc-200 text-center">
                        <span className="text-[10px] uppercase text-zinc-400 block font-semibold">Empresas Parceiras</span>
                        <span className="text-3xl font-bold font-mono mt-1 block">{adminSummary?.stats?.partners || 0}</span>
                      </div>
                      <div className="p-4 border border-zinc-200 text-center">
                        <span className="text-[10px] uppercase text-zinc-400 block font-semibold">Resgates Pendentes</span>
                        <span className="text-3xl font-bold font-mono text-orange-600 mt-1 block">{adminSummary?.stats?.pendingRedemptions || 0}</span>
                      </div>
                      <div className="p-4 border border-zinc-200 text-center">
                        <span className="text-[10px] uppercase text-zinc-400 block font-semibold">Envios por Aprovar</span>
                        <span className="text-3xl font-bold font-mono text-indigo-600 mt-1 block">{adminSummary?.stats?.pendingTransfers || 0}</span>
                      </div>
                    </div>

                    {/* Bookkeeping Summary */}
                    <div className="border border-zinc-100 p-6 bg-zinc-50">
                      <h4 className="font-serif text-lg font-light mb-4 text-zinc-900">Estado Consolidado do Passivo de Pontos</h4>
                      <div className="grid md:grid-cols-3 gap-4 text-center">
                        {adminSummary?.ledger?.map((l: any) => (
                          <div key={l.bucket} className="bg-white p-4 border border-zinc-200">
                            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">{l.bucket}</span>
                            <span className="font-mono text-xl font-bold mt-1 block">{l.sum} pts</span>
                          </div>
                        ))}
                        {adminSummary?.ledger?.length === 0 && <p className="text-sm text-zinc-400 italic">Sem passivo acumulado no livro razão.</p>}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === "members" && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-2xl font-light text-zinc-950">Gestão e Controlo de Membros</h3>
                    <div className="border border-zinc-200 overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono divide-y divide-zinc-200">
                        <thead className="bg-zinc-50">
                          <tr className="text-zinc-400 uppercase tracking-wider">
                            <th className="p-3">Membro</th>
                            <th className="p-3">Email/Tel</th>
                            <th className="p-3">Adesão</th>
                            <th className="p-3">Saldos (Disponível / Pendente)</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {adminMembers.map((m) => (
                            <tr key={m.id} className="hover:bg-zinc-50">
                              <td className="p-3">
                                <span className="font-bold block">{m.full_name}</span>
                                <span className="text-zinc-400">{m.member_number}</span>
                              </td>
                              <td className="p-3">{m.email}<br/>{m.phone || "—"}</td>
                              <td className="p-3">{m.plan_name} <br/> <span className="text-[10px] text-zinc-400">Desde: {m.joined_at}</span></td>
                              <td className="p-3 font-semibold text-teal-800">{m.available_points} pts <br/><span className="text-orange-600 font-normal">{m.pending_points} pts pendentes</span></td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 text-[10px] font-semibold ${m.account_state === "FROZEN" ? "bg-red-100 text-red-900" : "bg-teal-100 text-teal-900"}`}>{m.account_state}</span>
                              </td>
                              <td className="p-3 text-right space-x-2">
                                {m.account_state === "NORMAL" ? (
                                  <button onClick={() => handleAdminMemberAction(m.id, "FREEZE")} className="text-red-700 hover:underline">Congelar</button>
                                ) : (
                                  <button onClick={() => handleAdminMemberAction(m.id, "UNFREEZE")} className="text-teal-700 hover:underline">Descongelar</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {adminTab === "partners" && (
                  <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Form to add partner */}
                    <div className="border border-zinc-200 p-6 bg-zinc-50 space-y-4">
                      <h4 className="font-serif text-xl font-light text-zinc-950">Novo Parceiro Comercial</h4>
                      <form onSubmit={handleCreatePartner} className="space-y-4 text-xs">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Nome Fantasia</label>
                          <input type="text" required className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white" value={adminPartnerForm.name} onChange={(e) => setAdminPartnerForm({ ...adminPartnerForm, name: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Razão Social</label>
                          <input type="text" className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white" value={adminPartnerForm.legal_name} onChange={(e) => setAdminPartnerForm({ ...adminPartnerForm, legal_name: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Categoria de Negócio</label>
                          <select className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white" value={adminPartnerForm.category} onChange={(e) => setAdminPartnerForm({ ...adminPartnerForm, category: e.target.value })}>
                            <option value="Hotelaria">Hotelaria</option>
                            <option value="Restaurantes">Restaurantes</option>
                            <option value="Beleza">Beleza & SPAs</option>
                            <option value="Lazer">Lazer & Experiências</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Contacto Comercial</label>
                          <input type="text" className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white" value={adminPartnerForm.contact_name} onChange={(e) => setAdminPartnerForm({ ...adminPartnerForm, contact_name: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Email Gestor (Criará conta de Acesso)</label>
                          <input type="email" required className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white" placeholder="gestor@parceiro.com" value={adminPartnerForm.admin_email} onChange={(e) => setAdminPartnerForm({ ...adminPartnerForm, admin_email: e.target.value })} />
                        </div>
                        <button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3 text-xs tracking-widest uppercase transition-colors">Criar Parceiro</button>
                      </form>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <h3 className="font-serif text-2xl font-light text-zinc-950">Lista de Empresas Parceiras</h3>
                      <div className="border border-zinc-200 overflow-x-auto text-xs font-mono">
                        <table className="w-full text-left divide-y divide-zinc-200">
                          <thead className="bg-zinc-50">
                            <tr>
                              <th className="p-3">Parceiro</th>
                              <th className="p-3">Contacto</th>
                              <th className="p-3">Estado</th>
                              <th className="p-3 text-right">Liquidação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 bg-white">
                            {adminPartners.map((p) => (
                              <tr key={p.id} className="hover:bg-zinc-50">
                                <td className="p-3">
                                  <strong className="text-zinc-900 block font-serif text-sm">{p.name}</strong>
                                  <span className="text-zinc-400 text-[10px]">{p.category} · {p.legal_name || "—"}</span>
                                </td>
                                <td className="p-3">{p.email}<br/>{p.phone || "—"}</td>
                                <td className="p-3"><span className="bg-teal-100 text-teal-900 px-2 py-0.5 font-bold">{p.status}</span></td>
                                <td className="p-3 text-right">
                                  <button onClick={() => handleGenerateSettlement(p.id)} className="bg-zinc-900 text-white py-1.5 px-3 uppercase font-semibold text-[10px] tracking-wider">Fechar Mês</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === "promotions" && (
                  <div className="grid md:grid-cols-3 gap-8 items-start">
                    {/* Create campaign */}
                    <div className="border border-zinc-200 p-6 bg-zinc-50 space-y-4 text-xs">
                      <h4 className="font-serif text-xl font-light text-zinc-950">Lançar Nova Campanha de Pontos</h4>
                      <p className="text-xs text-zinc-500">As regras comerciais de comissão do parceiro e recompensas de pontos para os membros são configuradas aqui e aplicadas em cada compra.</p>
                      
                      <form onSubmit={handleCreatePromotion} className="space-y-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Selecione o Serviço Base do Parceiro</label>
                          <select required className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none" value={adminPromoForm.listing_id} onChange={(e) => setAdminPromoForm({ ...adminPromoForm, listing_id: e.target.value })}>
                            <option value="">-- Escolher Oferta Base --</option>
                            {adminListings.map(l => (
                              <option key={l.id} value={l.id}>{l.partner_name} - {l.title} ({formatKz(l.base_price_kz)})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Título da Campanha</label>
                          <input type="text" required placeholder="Ex: Campanha Especial SPA" className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white focus:outline-none" value={adminPromoForm.title} onChange={(e) => setAdminPromoForm({ ...adminPromoForm, title: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Modo de Comissão do Parceiro</label>
                          <select className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white" value={adminPromoForm.commission_mode} onChange={(e) => setAdminPromoForm({ ...adminPromoForm, commission_mode: e.target.value })}>
                            <option value="PERCENT_OF_PURCHASE">Percentagem do Valor da Compra</option>
                            <option value="FIXED_KZ">Fixo em Kz por Venda</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Valor da Comissão (% ou Kz)</label>
                          <input type="number" required className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white" value={adminPromoForm.commission_value} onChange={(e) => setAdminPromoForm({ ...adminPromoForm, commission_value: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Distribuição da Recompensa</label>
                          <select className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white" value={adminPromoForm.benefit_mode} onChange={(e) => setAdminPromoForm({ ...adminPromoForm, benefit_mode: e.target.value })}>
                            <option value="PERCENT_OF_COMMISSION">Percentagem da Comissão para o Cliente</option>
                            <option value="FULL_COMMISSION">100% da Comissão Reverte em Pontos</option>
                            <option value="FIXED_KZ">Fixo em Kz para o Cliente</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Valor de Recompensa ao Cliente (% ou Kz)</label>
                          <input type="number" className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white" value={adminPromoForm.benefit_value} onChange={(e) => setAdminPromoForm({ ...adminPromoForm, benefit_value: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Tipo de Entrega</label>
                          <select className="w-full border border-zinc-200 px-3 py-2 text-xs bg-white" value={adminPromoForm.delivery_mode} onChange={(e) => setAdminPromoForm({ ...adminPromoForm, delivery_mode: e.target.value })}>
                            <option value="POINTS">Pontos na Carteira (1pt = 1Kz)</option>
                            <option value="DISCOUNT">Desconto Directo Comercial</option>
                          </select>
                        </div>
                        <button type="submit" className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold py-3 text-xs tracking-widest uppercase transition-colors">Publicar Campanha</button>
                      </form>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                      <h3 className="font-serif text-2xl font-light text-zinc-950">Campanhas Promocionais Activas</h3>
                      <div className="grid gap-4 font-mono text-xs">
                        {adminPromotions.map((p) => (
                          <div key={p.id} className="p-4 border border-zinc-200 bg-white flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                              <strong className="text-zinc-950 font-serif text-base font-bold">{p.title}</strong>
                              <p className="text-zinc-400 text-[10px]">Parceiro: {p.partner_name} · Serviço: {p.listing_title}</p>
                              <p className="text-zinc-600 mt-1">Comissão: {p.commission_value} ({p.commission_mode}) · Recompensa: {formatKz(p.member_benefit_kz)} ({p.delivery_mode})</p>
                            </div>
                            <span className="bg-teal-100 text-teal-900 font-bold py-1 px-3 self-start md:self-center uppercase text-[10px]">{p.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {adminTab === "redemptions" && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-2xl font-light text-zinc-950">Aprovação Administrativa de Resgates</h3>
                    <p className="text-xs text-zinc-500">Todo o pedido de resgate requer dupla aprovação: primeiro do parceiro comercial e finalmente da administração do PromoAngol para gerar o token OTP de segurança de ponta-a-ponta.</p>
                    
                    <div className="divide-y divide-zinc-200 border border-zinc-200 bg-white font-mono text-xs">
                      {adminRedemptions.map((r) => (
                        <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-zinc-50">
                          <div>
                            <strong className="text-zinc-900 block font-serif text-sm">Pedido #{r.redemption_number}</strong>
                            <p className="text-zinc-500 mt-1">Membro: {r.member_name} ({r.member_number}) · Parceiro: {r.partner_name}</p>
                            <p className="text-zinc-700">Pontos a Consumir: <span className="font-bold">{r.points_requested} pts</span></p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] uppercase font-bold text-orange-900 bg-orange-50 px-2 py-0.5">{r.status}</span>
                            {r.status === "AWAITING_ADMIN" && (
                              <div className="flex gap-2">
                                <button onClick={() => handleAdminRedeemAction(r.id, "APPROVE")} className="bg-teal-700 hover:bg-teal-800 text-white font-semibold py-1.5 px-3 uppercase text-[10px] tracking-wider">Aprovar & Gerar OTP</button>
                                <button onClick={() => handleAdminRedeemAction(r.id, "REJECT")} className="border border-red-300 text-red-700 font-semibold py-1.5 px-3 uppercase text-[10px] tracking-wider">Rejeitar</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {adminRedemptions.length === 0 && (
                        <p className="p-6 text-center text-zinc-400 italic">Não existem pedidos de resgate no sistema de momento.</p>
                      )}
                    </div>
                  </div>
                )}

                {adminTab === "transfers" && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-2xl font-light text-zinc-950">Auditar Transferências de Pontos</h3>
                    <div className="divide-y divide-zinc-200 border border-zinc-200 bg-white font-mono text-xs">
                      {adminTransfers.map((t) => (
                        <div key={t.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <strong className="text-zinc-900 block">Transferência #{t.transfer_number}</strong>
                            <p className="text-zinc-500 mt-1">Origem (Remetente): {t.sender_name} ({t.sender_number})</p>
                            <p className="text-zinc-500">Destino (Recetáculo): {t.recipient_name} ({t.recipient_number})</p>
                            <p className="text-zinc-700 font-bold">Pontos em trânsito: {t.points} pts</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] uppercase font-bold bg-zinc-100 text-zinc-800 px-2 py-0.5">{t.status}</span>
                            {t.status === "SENDER_APPROVED" && (
                              <div className="flex gap-2">
                                <button onClick={() => handleAdminTransferAction(t.id, "APPROVE")} className="bg-teal-700 hover:bg-teal-800 text-white font-semibold py-1.5 px-3 uppercase text-[10px] tracking-wider">Aprovar Transferência</button>
                                <button onClick={() => handleAdminTransferAction(t.id, "REJECT")} className="border border-red-300 text-red-700 font-semibold py-1.5 px-3 uppercase text-[10px] tracking-wider">Rejeitar</button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {adminTransfers.length === 0 && (
                        <p className="p-6 text-center text-zinc-400 italic">Nenhum fluxo de transferência pendente de validação.</p>
                      )}
                    </div>
                  </div>
                )}

                {adminTab === "settlements" && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-2xl font-light text-zinc-950">Liquidação Financeira de Parceiros</h3>
                    <p className="text-xs text-zinc-500">A PromoAngol liquida o dinheiro real correspondente aos pontos resgatados pelos membros nos estabelecimentos comerciais parceiros.</p>
                    
                    <div className="divide-y divide-zinc-200 border border-zinc-200 bg-white font-mono text-xs">
                      {adminSettlements.map((s) => (
                        <div key={s.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <strong className="text-zinc-900 font-serif text-base block">{s.partner_name}</strong>
                            <p className="text-zinc-500">Período: {s.period_start} a {s.period_end} · Criado a: {s.generated_at?.slice(0, 10)}</p>
                            <p className="text-zinc-700 font-bold">Valor Net a Pagar: {formatKz(s.net_payable_kz)}</p>
                            {s.bank_reference && <p className="text-teal-700">Ref Bancária: {s.bank_reference} · Pago a: {s.paid_at?.slice(0, 10)}</p>}
                          </div>
                          <div>
                            {s.status === "READY" ? (
                              <div className="flex items-center gap-2">
                                <input type="text" placeholder="Referência Bancária" className="border border-zinc-300 px-2 py-1.5 text-xs bg-white focus:outline-none" value={bankRefInput[s.id] || ""} onChange={(e) => setBankRefInput({ ...bankRefInput, [s.id]: e.target.value })} />
                                <button onClick={() => handlePaySettlement(s.id)} className="bg-teal-700 hover:bg-teal-800 text-white font-semibold py-1.5 px-3 uppercase text-[10px] tracking-wider">Registrar Pagamento</button>
                              </div>
                            ) : (
                              <span className="bg-teal-100 text-teal-950 font-bold px-3 py-1 uppercase text-[10px]">{s.status}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {adminSettlements.length === 0 && (
                        <p className="p-6 text-center text-zinc-400 italic">Sem relatórios de liquidação de momento. Feche o mês na aba de Parceiros.</p>
                      )}
                    </div>
                  </div>
                )}

                {adminTab === "audit" && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-2xl font-light text-zinc-950">Audit Trail (Rastreamento de Auditoria)</h3>
                    <div className="border border-zinc-200 overflow-x-auto text-xs font-mono bg-zinc-50 p-4">
                      <table className="w-full text-left divide-y divide-zinc-200">
                        <thead>
                          <tr className="text-zinc-400">
                            <th className="pb-2">Data / Hora</th>
                            <th className="pb-2">Autor</th>
                            <th className="pb-2">Acção Realizada</th>
                            <th className="pb-2">Entidade Afectada</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {adminSummary?.audit?.map((log: any) => (
                            <tr key={log.id}>
                              <td className="py-2 text-zinc-500">{log.created_at}</td>
                              <td className="py-2 font-semibold text-zinc-800">{log.actor_type} (ID: {log.actor_id?.slice(0, 8)})</td>
                              <td className="py-2 text-indigo-700 font-bold">{log.action}</td>
                              <td className="py-2 text-zinc-600">{log.entity_type} (ID: {log.entity_id?.slice(0, 8)})</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ----------------- MOBILE BOTTOM NAV CONTRACT ----------------- */}
      <footer className="site-footer bg-zinc-950 text-white py-12 px-4 mt-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div>
            <p className="text-lg font-bold font-serif tracking-widest text-white">PROMOANGOL</p>
            <p className="text-zinc-500 text-xs mt-1">Recompensas que voltam para si · Luanda, Angola.</p>
          </div>
          <div className="text-zinc-600 text-[10px] tracking-wider uppercase">
            © {new Date().getFullYear()} PROMOANGOL. TODOS OS DIREITOS RESERVADOS.
          </div>
        </div>
      </footer>
    </div>
  );
}
