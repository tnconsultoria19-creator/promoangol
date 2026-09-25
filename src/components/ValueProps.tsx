import React from "react";

export const ValueProps: React.FC = () => {
  return (
    <section className="w-full bg-[#111111] text-white py-20 border-b border-neutral-800">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        {/* Pillar 1 */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 mb-4 text-[#cba557] flex items-center justify-center">
            <svg className="w-10 h-10 stroke-[1.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" x2="22" y1="12" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <h4 className="text-sm font-medium tracking-wider mb-2 font-serif text-white">1 Ponto = Kz 1</h4>
          <p className="text-neutral-400 text-xs leading-relaxed max-w-xs font-light">
            Transparência financeira absoluta. Cada ponto acumulado equivale a um Kwanza real para gastar em qualquer parceiro da rede.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 mb-4 text-[#357169] flex items-center justify-center">
            <svg className="w-10 h-10 stroke-[1.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <h4 className="text-sm font-medium tracking-wider mb-2 font-serif text-white">Dupla Confirmação</h4>
          <p className="text-neutral-400 text-xs leading-relaxed max-w-xs font-light">
            Segurança em cada compra. O parceiro regista o valor da despesa e o membro valida no telemóvel antes do crédito no livro razão.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 mb-4 text-[#a66258] flex items-center justify-center">
            <svg className="w-10 h-10 stroke-[1.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M19 14v1a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3v-1" />
              <path d="M12 6v4m-2-2h4" />
            </svg>
          </div>
          <h4 className="text-sm font-medium tracking-wider mb-2 font-serif text-white">Resgate Flexível</h4>
          <p className="text-neutral-400 text-xs leading-relaxed max-w-xs font-light">
            A partir de 800 pontos. Combine pontos acumulados com numerário/cartão para desfrutar de estadias e menus requintados.
          </p>
        </div>
      </div>
    </section>
  );
};
