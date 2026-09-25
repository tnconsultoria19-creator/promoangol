import React, { useState } from "react";
import type { UserSession } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  initialMode: "login" | "register";
  onClose: () => void;
  onSuccess: (session: UserSession) => void;
}

type PreviewRole = "MEMBER" | "PARTNER_ADMIN" | "MASTER_ADMIN";

const roles: Array<{
  role: PreviewRole;
  label: string;
  title: string;
  description: string;
  accent: string;
}> = [
  {
    role: "MEMBER",
    label: "Cliente",
    title: "Explorar & ganhar",
    description: "Veja ofertas, a sua carteira, o cartão de membro e os seus resgates.",
    accent: "auth-role-client",
  },
  {
    role: "PARTNER_ADMIN",
    label: "Parceiro",
    title: "Gerir o seu negócio",
    description: "Veja vendas, valide membros, acompanhe resgates e gerencie listagens.",
    accent: "auth-role-partner",
  },
  {
    role: "MASTER_ADMIN",
    label: "Master Admin",
    title: "Operação PromoAngol",
    description: "Controle membros, parceiros, promoções, aprovações e liquidações.",
    accent: "auth-role-admin",
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<PreviewRole | null>(null);

  if (!isOpen) return null;

  const enterPreview = () => {
    if (!selectedRole) return;

    const previewSessions: Record<PreviewRole, UserSession> = {
      MEMBER: {
        token: "__PREVIEW__",
        role: "MEMBER",
        email: "cliente@preview",
        name: "Cliente PromoAngol",
        detail: "PA-000000",
        referenceId: "preview-member",
      },
      PARTNER_ADMIN: {
        token: "__PREVIEW__",
        role: "PARTNER_ADMIN",
        email: "parceiro@preview",
        name: "Gestor do Parceiro",
        detail: "Hotel / Parceiro",
        referenceId: "preview-partner",
      },
      MASTER_ADMIN: {
        token: "__PREVIEW__",
        role: "MASTER_ADMIN",
        email: "admin@preview",
        name: "Master Admin",
        detail: "PromoAngol Central",
        referenceId: "preview-admin",
      },
    };

    onSuccess(previewSessions[selectedRole]);
    onClose();
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal auth-role-modal">
        <button
          type="button"
          onClick={onClose}
          className="auth-close"
          aria-label="Fechar"
        >
          ×
        </button>

        <div className="auth-intro">
          <span className="eyebrow eyebrow-dark">ENTRAR NA PROMOANGOL</span>
          <h2>Escolha o seu acesso.</h2>
          <p>
            Por agora estamos a apresentar apenas a estrutura visual de cada área.
            Não é necessária palavra-passe.
          </p>
        </div>

        <div className="auth-role-grid">
          {roles.map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => setSelectedRole(item.role)}
              className={`auth-role-card ${item.accent} ${selectedRole === item.role ? "is-selected" : ""}`}
            >
              <span className="auth-role-label">{item.label}</span>
              <strong>{item.title}</strong>
              <span>{item.description}</span>
              <em>{selectedRole === item.role ? "Selecionado" : "Ver área →"}</em>
            </button>
          ))}
        </div>

        <div className="auth-preview-footer">
          <span>PRÉ-VISUALIZAÇÃO DE INTERFACE</span>
          <button
            type="button"
            onClick={enterPreview}
            disabled={!selectedRole}
            className="auth-preview-button"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
