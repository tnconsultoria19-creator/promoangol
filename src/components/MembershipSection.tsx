import React from "react";

interface MembershipSectionProps {
  onJoinPlan: (planCode: string) => void;
}

export const MembershipSection: React.FC<MembershipSectionProps> = ({ onJoinPlan }) => {
  const plans = [
    {
      code: "STANDARD",
      name: "Standard",
      kicker: "ADESÃO ESSENCIAL",
      price: "Gratuito",
      period: "sem anuidade",
      multiplier: "1.0x Pontos",
      features: [
        "Acesso total ao catálogo de ofertas ativas",
        "1 Ponto = 1 Kz em cada compra confirmada",
        "Resgate a partir de 800 pontos em qualquer parceiro",
        "Cartão digital de membro com QR Code seguro",
        "Histórico e extrato de transações em tempo real",
      ],
      bg: "bg-white",
      textColor: "text-neutral-900",
      btnClass: "border border-neutral-300 hover:border-neutral-900 text-neutral-800",
    },
    {
      code: "PREFERRED",
      name: "Preferred",
      kicker: "O MAIS POPULAR",
      price: "Kz 15.000",
      period: "por mês",
      multiplier: "1.5x Pontos",
      features: [
        "Tudo do plano Standard com 50% mais pontos",
        "Bónus de boas-vindas: 2.000 pontos creditados",
        "Acesso antecipado a campanhas e menus sazonais",
        "Transferência de pontos para outros membros autorizada",
        "Atendimento prioritário de suporte",
      ],
      bg: "bg-[#eef4f2]",
      textColor: "text-neutral-900",
      btnClass: "bg-[#2d6b63] hover:bg-[#235650] text-white",
    },
    {
      code: "ELITE",
      name: "Elite",
      kicker: "EXPERIÊNCIA EXCLUSIVA",
      price: "Kz 35.000",
      period: "por mês",
      multiplier: "2.0x Pontos",
      features: [
        "Pontuação a dobrar (2.0x) em todas as transações",
        "Bónus de adesão: 5.000 pontos imediatos",
        "Descontos diretos imediatos até 25% na rede",
        "Transferências de pontos ilimitadas sem taxa",
        "Convites para degustações privadas e noites exclusivas",
        "Gestor de conta pessoal PromoAngol",
      ],
      bg: "bg-[#1a2b49]",
      textColor: "text-white",
      btnClass: "bg-[#cba557] hover:bg-[#b99448] text-neutral-900 font-semibold",
    },
  ];

  return (
    <div className="pt-28 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#cba557] block mb-2">
            PLANOS DE ADESÃO PROMOANGOL
          </span>
          <h1 className="text-3xl sm:text-5xl font-normal text-neutral-800 tracking-tight mb-4 font-serif">
            Escolha o Seu Nível de Benefício
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm font-light leading-relaxed">
            Acumule pontos em cada estadia e refeição. Desfrute de descontos automáticos e experiências reservadas aos nossos associados.
          </p>
        </div>

        {/* Plans 3-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((p) => (
            <div
              key={p.code}
              className={`${p.bg} ${p.textColor} p-8 sm:p-10 border border-neutral-200/80 flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1 shadow-sm`}
            >
              <div>
                <span className={`text-[9px] uppercase tracking-[0.2em] block mb-2 font-semibold opacity-75`}>
                  {p.kicker}
                </span>
                <h3 className="text-3xl sm:text-4xl font-serif font-light mb-2">
                  {p.name}
                </h3>
                <div className="my-6 pb-6 border-b border-neutral-200/30">
                  <div className="text-3xl sm:text-4xl font-serif font-normal">{p.price}</div>
                  <div className="text-[11px] opacity-60 uppercase tracking-wider mt-1">{p.period} · {p.multiplier}</div>
                </div>

                <ul className="space-y-3.5 mb-8 text-xs font-light leading-relaxed">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start space-x-2.5">
                      <span className="text-[#cba557] text-sm leading-none mt-0.5 font-bold">✓</span>
                      <span className="opacity-90">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <button
                  onClick={() => onJoinPlan(p.code)}
                  className={`w-full py-3.5 text-xs font-semibold tracking-widest uppercase transition text-center ${p.btnClass}`}
                >
                  Aderir ao Plano {p.name}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Guarantee Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center border-t border-neutral-100 pt-12 text-neutral-600">
          <div>
            <h4 className="font-serif text-sm text-neutral-800 font-semibold mb-1">Sem Fidelização Obrigatória</h4>
            <p className="text-xs font-light text-neutral-400">Pode alterar ou cancelar o seu plano a qualquer momento sem penalizações contratuais.</p>
          </div>
          <div>
            <h4 className="font-serif text-sm text-neutral-800 font-semibold mb-1">Pontos Nunca Desaparecem</h4>
            <p className="text-xs font-light text-neutral-400">Os pontos acumulados têm validade de 12 meses renováveis e garantia patrimonial.</p>
          </div>
          <div>
            <h4 className="font-serif text-sm text-neutral-800 font-semibold mb-1">Pagamento Local Seguro</h4>
            <p className="text-xs font-light text-neutral-400">Adesões processadas via Multicaixa Express ou transferência bancária confirmada.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
