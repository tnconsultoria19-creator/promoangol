import React from "react";
import type { Promotion } from "../types";

const defaultImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuByIyu_hzzSE_PellYXZyPgnqpUSFY-iWv6RmO-zVEK0FX9eXnAlbqFp_utSyz7zbu7XlUflLHbJB8tIF767JkMp4eg_1J7XeXqazLc4uhVni24nQrZdGG74T1Tl6pkycZewcoHXA2THHsQk3siVogMWw_hnKgGEHj4G6H2-smQ5KMQRrUQGxYQgrlrtkhfuvUWWZju1xkudsIY62qV7mh3PJ1z5zppXjj8YIHxxfE8BBByQKzj88A",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD8FU3bg_cLXTO0TN-NtGKhCqUNIN4RFoggrSjAwAvWXtBL-Mgave8GbtejJ00ppVsZPChmqviodghuzFCytfUw7b-8qrHfEVedX0Y1SOdyYr2aNL7kGfBgGI0j_LCK41rU4iWPdkXLG9IfUs1lO8cgpximzymeAddKFI2xMf65Y58m6oOM4hs06-LMDWNPd0F1nMcdCVBetZ5D_ac9PeGhslOofFMwt3hecrKhDFDcTpv7kA8vpus",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCriBrEMuZeuQUS1Yu0s8sEd4Cb6a1MkC-GH_4IffbEaTxtUJSzrE4whw5gXg5o374t71i5ZI8M1Hn5x2JzJIWv_6iLz-LMxn147UQzL2EA0kSseoTb9wQg_h8yFXlHsn9jFHmY4glileMWynhgiwCeaiWhylA7TAe3Wwn47Fcnr7SnTK3U9G-fMA_AArb6KFW_OOLA0FiTQuJpER2yuaEYpL8vOHbcP-JbzmtnBdx3_V_GdirvNYg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAslfQ1RWzBztjEFSz1-x7JGnE_eKTEx03O0FQAXf8rLTs6iwhZQVJG4UAuFnAfC-C7wXqD-5LYMesoo9s7NYJgEE_TM5bX7_pzGBpKqVHKvPHsTw7_7ZZkmnM4Tub45mWFuXLn0MIz40IZhx9In6Sei5w20lx6nHY9fxkuCNZEgTJ8boVbwhyoZ81qF3Eq9PJSfL1wiE7YBqqd6ffBn2KdWw96lrZsIldqfT3vAd0SE8dwx-JVrEw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB2OEhhUsEC_U0da3LGUR8b8n3jNNRI1P5BPW6cpFNxtm4wMNWjU63-UV-G4Nu-EddNEm2K2Ujc2qMYMx0jlI5qv_x0yifQnNbbnjr8chGE7Zu4UqjFDAtCQ1RTtk_Qpromag9ANoV1aUWnANR4-tFEpLiQ1rDXDRRnxypBmGp2mINejiVOeOaeA-oMw3c5YmJPvRMPRRcwvgf0HXOxM0_ZqP2QxczYQFr2aSLVM0MsnnaNitNBEDw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDbwYZvE0I1JQwb-2dsIVv7f5H10doPsF3nn_DRYIvPyOhaE4g4QwLK-aHEbksgzkRRouaA6jfGD33V5MSsQXwHg-15d-V-rYSxjx1DuxEw50spBw95MBRmdI0Fu-a8QL3J2HHkrSLM8aUsLQjbW3TsBE-zLaycswPjQ3wPUX6CplySq53sXvuy5K-BgDoJrQNEHNDa7FSlMLA0DW2TuxWCSAs5Bo2jxjrJOmAvs4RruUDazRR6Th8",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCoN979QBMSJ0LXT46F0sjPnEbB6t_pjoPuGeiEoNP6vkKNfy7-GCYIt5qga6vrMVVSHXIN2OXLX9WWKqyvZRaMsLoeQAEQ_fr0HUF806AOuxH_RJ2JW_YEu143gVcXVqp7tmSMFChWYBbX5WIyRIYFsHt1-74Ip_KN40H8bZqX7CK-ha6DNSwwZRlF3Dx_3QbxE1FeV-Hd20rgDGXOeO7bjDABuk7hT9nSKAqi1iTBxFJPHNAzs38",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA4pEuljXiG_9GfuggxchKaqRI5Vzg5lkqveW8g6RhTKkyd6oWeVqQ19J8UTn00ORKZApRguQiURKoTh88v-mIUDht-Xk4U9gfFmacd6vD_qDb7ySKN2CcK0u4KvZ7Rb73UWRv90_gZu9qNWMI1AUPPE17ceGwt7BYSY0KIdtucLa7X03ZTojsdoizIaF35NtfXVo3jlyik_wH2jPvmQmyaslS6IHTSkicPHvLYOEqdVG94DtoCoGw",
];

interface PromoCardProps {
  promotion: Promotion;
  onSelect: (promotion: Promotion) => void;
  index: number;
}

export const PromoCard: React.FC<PromoCardProps> = ({ promotion, onSelect, index }) => {
  const imgSrc = defaultImages[index % defaultImages.length];

  const benefitStr = promotion.member_benefit_kz != null
    ? new Intl.NumberFormat("pt-AO").format(promotion.member_benefit_kz)
    : "—";

  const priceStr = promotion.base_price_kz != null
    ? new Intl.NumberFormat("pt-AO").format(promotion.base_price_kz)
    : null;

  return (
    <div
      onClick={() => onSelect(promotion)}
      className="relative flex flex-col items-center text-center group cursor-pointer"
    >
      {/* Sale/Promo Badge */}
      <span className="absolute top-2 left-2 w-8 h-8 rounded-full bg-[#f0483e] text-white text-[10px] font-semibold flex items-center justify-center z-20 uppercase tracking-tighter font-sans">
        Promo
      </span>

      {/* Image Box with hover zoom and countdown badge */}
      <div className="relative w-full h-72 bg-white flex items-center justify-center p-4 product-image-wrap overflow-hidden border border-neutral-100/80">
        <img
          alt={promotion.title}
          className="max-h-60 object-contain transition-transform duration-300"
          src={imgSrc}
        />

        {/* Benefit Pill */}
        <div className="absolute bottom-2 bg-white px-3 py-1 rounded-full shadow border border-neutral-100 flex items-center space-x-2 text-[9px] font-semibold tracking-wider text-neutral-600 countdown-badge font-sans">
          <div>
            {promotion.delivery_mode === "DISCOUNT" ? "DESCONTO" : "RETORNO"}{" "}
            <span className="font-light text-[8px] text-neutral-400">BENEFÍCIO</span>
          </div>
          <span>·</span>
          <div>
            {benefitStr}{" "}
            <span className="font-light text-[8px] text-neutral-400">
              {promotion.delivery_mode === "DISCOUNT" ? "KZ" : "PONTOS"}
            </span>
          </div>
        </div>
      </div>

      {/* Details below matching Agota hierarchy */}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-[#357169] font-medium mb-0.5 font-sans">
          {promotion.partner_name || "Parceiro Oficial"} · {promotion.partner_category || "Serviço"}
        </div>
        <h3 className="text-xs sm:text-sm font-medium text-neutral-700 hover:text-black cursor-pointer mb-1 font-sans">
          {promotion.title || promotion.listing_title || "Condição Especial"}
        </h3>
        <div className="text-xs font-sans">
          {priceStr && <span className="font-bold text-neutral-900">Kz {priceStr}</span>}
          <span className="text-emerald-700 font-semibold ml-2 text-[11px]">
            {promotion.delivery_mode === "DISCOUNT" ? `Poupa Kz ${benefitStr}` : `+${benefitStr} pts`}
          </span>
        </div>
      </div>
    </div>
  );
};
