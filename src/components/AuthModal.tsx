import React, { useState } from "react";
import type { UserSession } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  initialMode: "login" | "register";
  onClose: () => void;
  onSuccess: (session: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erro ao entrar");
        localStorage.setItem("promoangol_session", JSON.stringify(data));
        onSuccess(data);
        onClose();
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ full_name: fullName, email, password, phone }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erro no registo");

        // Automatically log in with the new credentials
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          localStorage.setItem("promoangol_session", JSON.stringify(loginData));
          onSuccess(loginData);
          onClose();
        } else {
          setMode("login");
          setError("Registo concluído! Faça login agora.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro no servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white max-w-md w-full border border-neutral-200 shadow-2xl p-8 relative flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-800 text-2xl font-light w-8 h-8 flex items-center justify-center"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <span className="eyebrow eyebrow-dark">AUTENTICAÇÃO SEGURA</span>
          <h2 className="font-serif text-3xl font-light text-neutral-900 mt-2">
            {mode === "login" ? "Entrar na Conta" : "Criar Nova Adesão"}
          </h2>
          <p className="text-xs text-neutral-500 font-light mt-1">
            {mode === "login"
              ? "Aceda aos seus pontos, carteira e histórico de transações."
              : "Registe-se e ganhe 1.000 pontos de boas-vindas imediatamente."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs border border-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: António Silva"
                  className="w-full border border-neutral-300 px-3 py-2 text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-800"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
                  Telemóvel (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 923 000 000"
                  className="w-full border border-neutral-300 px-3 py-2 text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-800"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="seu-email@exemplo.com"
              className="w-full border border-neutral-300 px-3 py-2 text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-500 mb-1">
              Palavra-passe
            </label>
            <input
              type="password"
              required
              className="w-full border border-neutral-300 px-3 py-2 text-sm bg-neutral-50 focus:bg-white focus:outline-none focus:border-neutral-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white py-3 text-xs uppercase tracking-widest font-semibold transition mt-2 disabled:opacity-50"
          >
            {loading ? "A processar..." : mode === "login" ? "Entrar" : "Concluir Adesão"}
          </button>
        </form>

        {/* Quick Testing Accounts Helper */}
        <div className="mt-6 pt-4 border-t border-neutral-100">
          <p className="text-[10px] uppercase tracking-wider text-neutral-400 text-center mb-2">
            Perfis de Teste Pré-Configurados:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <button
              type="button"
              onClick={() => handleQuickLogin("member@promoangol.com", "member123")}
              className="p-1.5 border border-neutral-200 hover:border-neutral-800 text-left bg-neutral-50"
            >
              <strong>Membro:</strong> member@...
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("hotel_admin@promoangol.com", "partner123")}
              className="p-1.5 border border-neutral-200 hover:border-neutral-800 text-left bg-neutral-50"
            >
              <strong>Parceiro:</strong> hotel_admin@...
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("hotel_staff@promoangol.com", "staff123")}
              className="p-1.5 border border-neutral-200 hover:border-neutral-800 text-left bg-neutral-50"
            >
              <strong>Staff:</strong> hotel_staff@...
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("admin@promoangol.com", "admin123")}
              className="p-1.5 border border-neutral-200 hover:border-neutral-800 text-left bg-neutral-50"
            >
              <strong>Master:</strong> admin@...
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-neutral-500">
          {mode === "login" ? (
            <span>
              Ainda não é membro?{" "}
              <button
                type="button"
                onClick={() => { setMode("register"); setError(""); }}
                className="font-bold text-neutral-900 hover:underline"
              >
                Aderir Agora
              </button>
            </span>
          ) : (
            <span>
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
                className="font-bold text-neutral-900 hover:underline"
              >
                Iniciar Sessão
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
