import React from "react";
import type { Promotion } from "../types";

interface PartnersSectionProps {
  promotions: Promotion[];
  onSelectPromotion: (promo: Promotion) => void;
  onExploreMembership: () => void;
}

export const PartnersSection: React.FC<PartnersSectionProps> = ({
  promotions,
  onSelectPromotion,
  onExploreMembership,
}) => {
  const partners = [
    {
      id: "part-1",
      name: "Epic Sana Luanda Hotel",
      category: "Hotelaria & Luxo",
      location: "Avenida Lenine, Baixa de Luanda",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuByIyu_hzzSE_PellYXZyPgnqpUSFY-iWv6RmO-zVEK0FX9eXnAlbqFp_utSyz7zbu7XlUflLHbJB8tIF767JkMp4eg_1J7XeXqazLc4uhVni24nQrZdGG74T1Tl6pkycZewcoHXA2THHsQk3siVogMWw_hnKgGEHj4G6H2-smQ5KMQRrUQGxYQgrlrtkhfuvUWWZju1xkudsIY62qV7mh3PJ1z5zppXjj8YIHxxfE8BBByQKzj88A",
      tag: "10% Retorno em Pontos",
      description: "Suítes executivas, salas de conferências e gastronomia refinada com benefícios diretos na carteira PromoAngol.",
    },
    {
      id: "part-2",
      name: "Restaurante O Celeiro",
      category: "Gastronomia",
      location: "Ilha do Cabo, Luanda",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8FU3bg_cLXTO0TN-NtGKhCqUNIN4RFoggrSjAwAvWXtBL-Mgave8GbtejJ00ppVsZPChmqviodghuzFCytfUw7b-8qrHfEVedX0Y1SOdyYr2aNL7kGfBgGI0j_LCK41rU4iWPdkXLG9IfUs1lO8cgpximzymeAddKFI2xMf65Y58m6oOM4hs06-LMDWNPd0F1nMcdCVBetZ5D_ac9PeGhslOofFMwt3hecrKhDFDcTpv7kA8vpus",
      tag: "8% Retorno em Pontos",
      description: "Sabores tradicionais angolanos e peixe fresco da costa com validação de consumo instantânea e acúmulo de saldo.",
    },
    {
      id: "part-3",
      name: "Talatona Day Spa & Wellness",
      category: "Beleza & Bem-Estar",
      location: "Condomínio Belas, Talatona",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCriBrEMuZeuQUS1Yu0s8sEd4Cb6a1MkC-GH_4IffbEaTxtUJSzrE4whw5gXg5o374t71i5ZI8M1Hn5x2JzJIWv_6iLz-LMxn147UQzL2EA0kSseoTb9wQg_h8yFXlHsn9jFHmY4glileMWynhgiwCeaiWhylA7TAe3Wwn47Fcnr7SnTK3U9G-fMA_AArb6KFW_OOLA0FiTQuJpER2yuaEYpL8vOHbcP-JbzmtnBdx3_V_GdirvNYg",
      tag: "15% Desconto Membros Elite",
      description: "Massagens de relaxamento, tratamentos faciais e hidroterapia com resgate flexível por voucher a partir de 800 pontos.",
    },
    {
      id: "part-4",
      name: "Club Náutico da Ilha",
      category: "Lazer & Náutica",
      location: "Ilha de Luanda",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoN979QBMSJ0LXT46F0sjPnEbB6t_pjoPuGeiEoNP6vkKNfy7-GCYIt5qga6vrMVVSHXIN2OXLX9WWKqyvZRaMsLoeQAEQ_fr0HUF806AOuxH_RJ2JW_YEu143gVcXVqp7tmSMFChWYBbX5WIyRIYFsHt1-74Ip_KN40H8bZqX7CK-ha6DNSwwZRlF3Dx_3QbxE1FeV-Hd20rgDGXOeO7bjDABuk7hT9nSKAqi1iTBxFJPHNAzs38",
      tag: "12% Retorno em Pontos",
      description: "Passeios de barco ao pôr do sol, desportos náuticos e eventos privados com pontuação dobrada aos fins de semana.",
    },
  ];

  return (
    <div className="pt-28 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#357169] block mb-2">
            REDE CREDENCIADA PROMOANGOL
          </span>
          <h1 className="text-3xl sm:text-5xl font-normal text-neutral-800 tracking-tight mb-4 font-serif">
            Empresas Parceiras
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm font-light leading-relaxed">
            Estabelecimentos comerciais em Luanda e no país onde as suas compras geram pontos reais no livro razão
            e onde pode resgatar benefícios a qualquer momento.
          </p>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-20">
          {partners.map((partner) => (
            <div
              key={partner.id}
              className="bg-white border border-neutral-100 flex flex-col sm:flex-row group overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="sm:w-1/2 h-64 sm:h-auto overflow-hidden bg-neutral-100 relative">
                <img
                  alt={partner.name}
                  src={partner.image}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-[#1c1c1c] text-white text-[9px] uppercase tracking-wider font-semibold px-2.5 py-1">
                  {partner.category}
                </span>
              </div>
              <div className="sm:w-1/2 p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-[#cba557] font-semibold tracking-wider uppercase block mb-1">
                    {partner.tag}
                  </span>
                  <h3 className="text-lg font-serif font-medium text-neutral-900 mb-1">
                    {partner.name}
                  </h3>
                  <div className="flex items-center space-x-1 text-neutral-400 text-[11px] mb-3">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{partner.location}</span>
                  </div>
                  <p className="text-xs text-neutral-500 font-light leading-relaxed mb-4">
                    {partner.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-[#357169] font-medium">
                    1 Ponto = 1 Kz
                  </span>
                  <button
                    onClick={() => {
                      const relatedPromo = promotions.find((p) =>
                        p.partner_name?.toLowerCase().includes(partner.name.split(" ")[0].toLowerCase())
                      );
                      if (relatedPromo) onSelectPromotion(relatedPromo);
                      else onExploreMembership();
                    }}
                    className="text-xs uppercase tracking-wider font-medium text-neutral-800 hover:text-black border-b border-neutral-800 pb-0.5"
                  >
                    Ver Oferta →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Partner Commercial Callout */}
        <div className="bg-[#1c1c1c] text-white p-10 sm:p-14 text-center max-w-4xl mx-auto">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#cba557] font-semibold block mb-2">
            EXPANSÃO COMERCIAL
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-light mb-4">
            Tem um negócio em Angola? Torne-se Parceiro PromoAngol.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 font-light max-w-xl mx-auto leading-relaxed mb-8">
            Atraia clientes de alto poder de compra sem custos fixos iniciais. Pague comissão de sucesso
            apenas sobre compras confirmadas e liquidadas pelo sistema.
          </p>
          <a
            href="mailto:parceiros@promoangol.com?subject=Candidatura%20a%20Parceiro%20PromoAngol"
            className="inline-block bg-[#cba557] hover:bg-[#b99448] text-[#1c1c1c] px-8 py-3 text-xs font-semibold tracking-widest uppercase transition"
          >
            Credenciar Estabelecimento
          </a>
        </div>
      </div>
    </div>
  );
};
