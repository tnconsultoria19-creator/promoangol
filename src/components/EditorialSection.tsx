import React from "react";

export const EditorialSection: React.FC = () => {
  const articles = [
    {
      id: "art-1",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDK7uRXBwf5RoxYA1KuDPIzvdRNXGnBEJUl-KVlgZ8PU7NP7vaUgI3_6OBfeQTkX_g12jmJJ4QC_TIjC7kedijGOSDe6fljq2Vpf_OZ6bmzkRZTuJBUzCz3ErUdE1vN0wbiVkNv2E90Dm6ud_L0c0nTQgbasksx9UDy7FbYK7_8lcP0rVHkac4Wyhzf_IZsdr3rzwDzlHfzAcXmswVW6xstIslWkRM5Tw3KR-2LY60C_QMcw0iOc34",
      date: "Setembro, 2026",
      title: "Fins de Semana em Luanda: Da Ilha a Talatona",
      excerpt: "Descubra como os membros PromoAngol estão a transformar estadias executivas e jantares à beira-mar em saldos acumulados de pontos reais.",
    },
    {
      id: "art-2",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVnZ_q145Aj_8h9VKvIk8Wjkl2BT8SHFqHz8fT89kFJlSQiNzv3xGYZlTRaG_iiGcFQtDmLdATUHy2TGDWSRJ2v3I3U2UxMJbGJb9gxHKz2v9y2ZIZCWu6WUpnUBdldKdSmsO4dgWP2GoX8kDGTUD12fAX8I5uwDavUj1j9s3bhDbq2w8B6rYGA6dIXLp6NJg9xuXv1lWk2ohHO31LE-mqUGx0tTHu0QlvXMnKW7oNVYBY0OVK_Bw",
      date: "Agosto, 2026",
      title: "Dupla Confirmação: A Garantia de Segurança",
      excerpt: "Compreender como a verificação pelo comerciante e aprovação no seu telemóvel protegem o seu saldo contra qualquer cobrança indevida.",
    },
    {
      id: "art-3",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCriBrEMuZeuQUS1Yu0s8sEd4Cb6a1MkC-GH_4IffbEaTxtUJSzrE4whw5gXg5o374t71i5ZI8M1Hn5x2JzJIWv_6iLz-LMxn147UQzL2EA0kSseoTb9wQg_h8yFXlHsn9jFHmY4glileMWynhgiwCeaiWhylA7TAe3Wwn47Fcnr7SnTK3U9G-fMA_AArb6KFW_OOLA0FiTQuJpER2yuaEYpL8vOHbcP-JbzmtnBdx3_V_GdirvNYg",
      date: "Julho, 2026",
      title: "O Guia dos Melhores Spas e Rituais de Bem-Estar",
      excerpt: "Relaxe nos centros de estética mais prestigiados da capital e aproveite descontos imediatos através da adesão Elite.",
    },
  ];

  return (
    <section className="content-width py-24 border-t border-zinc-100">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-3xl sm:text-4xl font-normal text-neutral-800 tracking-tight mb-3 font-serif">
          Experiências PromoAngol
        </h2>
        <p className="text-neutral-500 text-xs sm:text-sm font-light">
          Histórias, recomendações e novas formas de valorizar o seu estilo de vida em Angola.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
        {articles.map((art) => (
          <article key={art.id} className="flex flex-col group">
            <div className="w-full h-64 overflow-hidden mb-5 bg-zinc-100">
              <img
                alt={art.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                src={art.image}
              />
            </div>
            <div className="text-xs text-neutral-400 mb-2">
              Publicado em: <span className="text-[#357169] font-medium">{art.date}</span>
            </div>
            <h3 className="text-base font-medium text-neutral-800 group-hover:text-black mb-3 cursor-pointer font-serif">
              {art.title}
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-light mb-6 flex-grow">
              {art.excerpt}
            </p>
            <div>
              <span className="inline-block border border-neutral-300 group-hover:border-neutral-800 text-neutral-700 group-hover:text-neutral-900 px-5 py-2 text-[11px] font-medium tracking-wider uppercase transition cursor-pointer">
                Ler Artigo
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
