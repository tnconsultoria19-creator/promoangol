import React from "react";

interface DigitalMemberCardProps {
  fullName: string;
  memberNumber: string;
  planName: string;
  status?: string;
  expiresAt?: string | null;
}

export const DigitalMemberCard: React.FC<DigitalMemberCardProps> = ({
  fullName,
  memberNumber,
  planName,
  status = "ACTIVE",
  expiresAt,
}) => {
  const isElite = planName?.toLowerCase().includes("elite");

  return (
    <div
      className={`member-card ${isElite ? "plan-elite" : ""}`}
      style={{
        borderRadius: "12px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
      }}
    >
      <div className="card-sheen" />

      {/* Top Bar of the Card */}
      <div className="member-card-top">
        <span>CARTÃO DIGITAL DE MEMBRO</span>
        <span className="font-bold tracking-widest text-[#cba557]">PROMOANGOL</span>
      </div>

      {/* Main Info */}
      <div className="member-card-main">
        <div>
          <span className="member-card-label">CATEGORIA DE MEMBRO</span>
          <strong className="text-3xl font-serif font-light">{planName || "Standard"}</strong>

          <div className="mt-4">
            <span className="text-[10px] uppercase tracking-wider block opacity-75">TITULAR</span>
            <span className="font-serif text-lg tracking-wide block">{fullName || "Membro PromoAngol"}</span>
            <small className="font-mono text-xs opacity-80 block mt-1 tracking-widest">{memberNumber || "PA000000000"}</small>
          </div>
        </div>

        {/* Embedded Scannable Visual Matrix QR Code */}
        <div className="flex flex-col items-center">
          <div className="qr-placeholder rounded p-1">
            <svg viewBox="0 0 40 40" className="w-full h-full text-zinc-950 fill-current">
              <rect x="0" y="0" width="12" height="12" fill="white" />
              <rect x="2" y="2" width="8" height="8" fill="black" />
              <rect x="4" y="4" width="4" height="4" fill="white" />

              <rect x="28" y="0" width="12" height="12" fill="white" />
              <rect x="30" y="2" width="8" height="8" fill="black" />
              <rect x="32" y="4" width="4" height="4" fill="white" />

              <rect x="0" y="28" width="12" height="12" fill="white" />
              <rect x="2" y="30" width="8" height="8" fill="black" />
              <rect x="4" y="32" width="4" height="4" fill="white" />

              {/* Matrix points */}
              <rect x="16" y="4" width="4" height="4" fill="black" />
              <rect x="20" y="8" width="4" height="4" fill="black" />
              <rect x="14" y="16" width="6" height="6" fill="black" />
              <rect x="22" y="18" width="4" height="4" fill="black" />
              <rect x="16" y="26" width="4" height="4" fill="black" />
              <rect x="26" y="26" width="6" height="6" fill="black" />
              <rect x="34" y="20" width="4" height="4" fill="black" />
            </svg>
          </div>
          <span className="text-[7px] tracking-widest uppercase mt-1 opacity-70">
            {status === "ACTIVE" ? "VÁLIDO" : status}
          </span>
        </div>
      </div>
    </div>
  );
};
