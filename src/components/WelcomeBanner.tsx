import React from "react";

interface WelcomeBannerProps {
  onJoin: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onJoin }) => {
  return (
    <section className="relative w-full min-h-[520px] lg:min-h-[580px] flex items-center justify-center text-center overflow-hidden my-16">
      {/* Background with Dark Atmospheric Gradients and Scrim */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center filter brightness-50 contrast-125 transition-transform duration-700 hover:scale-105"
        style={{
          backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAL7SRrDUTvj-04CyEUmRuJluEVfcuMAeglqb-6eAHiK5--R-fWmGV9L8znXb2Mnsr5YIDFOknyFnd-7hE1lT31Tp6YunM4YFkb0vxoCeK7-8BQuHXyQgBiPZ96ISGn76NdN1t03coUjoD7RE28-3vGHbqxx1ugQ14j8kQu9zOin7FbMop1wAARkcxQH5tGkcBIt0YxHbwRKOAA7jRK5EOhW4LeEOvMNlZuW9MbQHE5JUA2nCOruYc')`,
          backgroundColor: "#1c2b36",
        }}
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-white flex flex-col items-center">
        {/* Calligraphic Script Welcome Headline from Reference */}
        <h2 className="text-7xl sm:text-8xl md:text-9xl tracking-normal text-white mb-6 select-none leading-none font-['Great_Vibes',cursive]">
          Bem-vindo
        </h2>

        {/* Subtitle Description */}
        <p className="text-xs sm:text-sm md:text-base font-light text-neutral-200 tracking-wide max-w-2xl leading-relaxed mb-10">
          PromoAngol é o primeiro clube de benefícios e recompensas comerciais de alto padrão em Angola.
          Conectamos membros a experiências gastronómicas, estadias e bem-estar com retorno real de valor.
        </p>

        {/* White Box Outline CTA */}
        <button
          onClick={onJoin}
          className="inline-block bg-white text-neutral-900 hover:bg-neutral-100 px-10 py-3.5 text-xs font-semibold tracking-widest uppercase transition shadow-md"
        >
          Aderir ao Clube
        </button>
      </div>
    </section>
  );
};
