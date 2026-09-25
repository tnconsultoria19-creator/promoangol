import React from "react";

interface HowItWorksSectionProps {
  onJoin: () => void;
  onExploreCatalog: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onJoin, onExploreCatalog }) => {
  const steps = [
    {
      num: "01",
      title: "Identifique-se no Parceiro",
      subtitle: "SEM CARTÕES PLÁSTICOS OU COMPLICAÇÕES",
      desc: "Quando for jantar, hospedar-se ou frequentar um spa parceiro em Luanda, informe o seu Número de Membro PromoAngol ou apresente o QR Code no seu telemóvel ao solicitar a conta.",
      accent: "text-[#cba557]",
    },
    {
      num: "02",
      title: "Dupla Confirmação no Telemóvel",
      subtitle: "TOTAL CONTROLO SOBRE A SUA CONTA",
      desc: "O estabelecimento regista o valor real pago no sistema. Instantaneamente, recebe um alerta no seu telemóvel para confirmar a transação. Ninguém pode debitar ou creditar sem a sua aprovação.",
      accent: "text-[#357169]",
    },
    {
      num: "03",
      title: "Pontos Reais no Livro Razão",
      subtitle: "1 PONTO = 1 KWANZA GARANTIDO",
      desc: "Após o período de carência comercial, os pontos passam a DISPONÍVEL. Use os seus pontos para pagar contas em qualquer estabelecimento parceiro da rede ou transferir para amigos membros.",
      accent: "text-[#a66258]",
    },
  ];

  return (
    <div className="pt-28 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#357169] block mb-2">
            MECANISMO DE CONFIANÇA
          </span>
          <h1 className="text-3xl sm:text-5xl font-normal text-neutral-800 tracking-tight mb-4 font-serif">
            Como Funciona a PromoAngol
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm font-light leading-relaxed">
            Criámos um sistema transparente onde não existem fórmulas misteriosas de pontuação.
            O valor que gasta é auditado e o retorno em Kwanzas volta diretamente para si.
          </p>
        </div>

        {/* 3 Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {steps.map((s) => (
            <div
              key={s.num}
              className="bg-white border border-neutral-200/70 p-8 sm:p-10 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <span className={`text-4xl sm:text-5xl font-serif font-light ${s.accent} block mb-6`}>
                  {s.num}
                </span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 font-semibold block mb-1">
                  {s.subtitle}
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-medium text-neutral-900 mb-4">
                  {s.title}
                </h3>
                <p className="text-xs text-neutral-500 font-light leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="pt-8 mt-8 border-t border-neutral-100 flex items-center justify-between text-neutral-400 text-[11px]">
                <span>Registo imutável</span>
                <span>Auditado Cloudflare</span>
              </div>
            </div>
          ))}
        </div>

        {/* Economics Breakdown */}
        <div className="bg-[#f8f8f8] border border-neutral-200 p-8 sm:p-12 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#a66258] font-semibold block mb-2">
                EXEMPLO PRÁTICO
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-neutral-900 mb-4 font-light">
                Jantar no valor de Kz 50.000 num restaurante parceiro
              </h2>
              <p className="text-xs text-neutral-600 font-light leading-relaxed mb-4">
                Com o plano <strong>Preferred (1.5x)</strong> numa oferta de 10% de retorno:
              </p>
              <div className="space-y-2 text-xs text-neutral-700">
                <div className="flex justify-between py-1.5 border-b border-neutral-200">
                  <span>Valor total pago:</span>
                  <span className="font-semibold">Kz 50.000</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-200">
                  <span>Retorno base da promoção (10%):</span>
                  <span>5.000 pontos</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-200 text-[#357169] font-medium">
                  <span>Multiplicador de plano (1.5x):</span>
                  <span>7.500 pontos</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-neutral-900 text-sm">
                  <span>Saldo disponível para resgates:</span>
                  <span className="text-[#357169]">Kz 7.500 em pontos</span>
                </div>
              </div>
            </div>

            <div className="text-center lg:text-right flex flex-col items-center lg:items-end justify-center">
              <p className="text-xs text-neutral-500 max-w-sm mb-6 font-light">
                Junte-se aos milhares de clientes em Luanda que já não deixam as suas despesas habituais sem retorno.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={onJoin}
                  className="bg-[#1c1c1c] hover:bg-black text-white px-8 py-3 text-xs uppercase tracking-widest font-semibold transition"
                >
                  Criar Conta de Membro
                </button>
                <button
                  onClick={onExploreCatalog}
                  className="border border-neutral-400 hover:border-black text-neutral-800 px-6 py-3 text-xs uppercase tracking-widest font-medium transition"
                >
                  Ver Ofertas Ativas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
