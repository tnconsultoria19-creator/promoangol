import React from "react";

export const GalleryStrip: React.FC = () => {
  const images = [
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuByIyu_hzzSE_PellYXZyPgnqpUSFY-iWv6RmO-zVEK0FX9eXnAlbqFp_utSyz7zbu7XlUflLHbJB8tIF767JkMp4eg_1J7XeXqazLc4uhVni24nQrZdGG74T1Tl6pkycZewcoHXA2THHsQk3siVogMWw_hnKgGEHj4G6H2-smQ5KMQRrUQGxYQgrlrtkhfuvUWWZju1xkudsIY62qV7mh3PJ1z5zppXjj8YIHxxfE8BBByQKzj88A",
      alt: "Lounge Executivo",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8FU3bg_cLXTO0TN-NtGKhCqUNIN4RFoggrSjAwAvWXtBL-Mgave8GbtejJ00ppVsZPChmqviodghuzFCytfUw7b-8qrHfEVedX0Y1SOdyYr2aNL7kGfBgGI0j_LCK41rU4iWPdkXLG9IfUs1lO8cgpximzymeAddKFI2xMf65Y58m6oOM4hs06-LMDWNPd0F1nMcdCVBetZ5D_ac9PeGhslOofFMwt3hecrKhDFDcTpv7kA8vpus",
      alt: "Cozinha e Sabores",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoN979QBMSJ0LXT46F0sjPnEbB6t_pjoPuGeiEoNP6vkKNfy7-GCYIt5qga6vrMVVSHXIN2OXLX9WWKqyvZRaMsLoeQAEQ_fr0HUF806AOuxH_RJ2JW_YEu143gVcXVqp7tmSMFChWYBbX5WIyRIYFsHt1-74Ip_KN40H8bZqX7CK-ha6DNSwwZRlF3Dx_3QbxE1FeV-Hd20rgDGXOeO7bjDABuk7hT9nSKAqi1iTBxFJPHNAzs38",
      alt: "Ambiente e Iluminação",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4pEuljXiG_9GfuggxchKaqRI5Vzg5lkqveW8g6RhTKkyd6oWeVqQ19J8UTn00ORKZApRguQiURKoTh88v-mIUDht-Xk4U9gfFmacd6vD_qDb7ySKN2CcK0u4KvZ7Rb73UWRv90_gZu9qNWMI1AUPPE17ceGwt7BYSY0KIdtucLa7X03ZTojsdoizIaF35NtfXVo3jlyik_wH2jPvmQmyaslS6IHTSkicPHvLYOEqdVG94DtoCoGw",
      alt: "Conforto e Estilo",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbwYZvE0I1JQwb-2dsIVv7f5H10doPsF3nn_DRYIvPyOhaE4g4QwLK-aHEbksgzkRRouaA6jfGD33V5MSsQXwHg-15d-V-rYSxjx1DuxEw50spBw95MBRmdI0Fu-a8QL3J2HHkrSLM8aUsLQjbW3TsBE-zLaycswPjQ3wPUX6CplySq53sXvuy5K-BgDoJrQNEHNDa7FSlMLA0DW2TuxWCSAs5Bo2jxjrJOmAvs4RruUDazRR6Th8",
      alt: "Mobiliário e Design",
    },
  ];

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border-t border-b border-neutral-200 overflow-hidden bg-neutral-100">
      {images.map((img, i) => (
        <div key={i} className="relative aspect-square overflow-hidden group">
          <img
            alt={img.alt}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 filter brightness-95 group-hover:brightness-105"
            src={img.src}
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        </div>
      ))}
    </div>
  );
};
