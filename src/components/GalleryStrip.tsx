import React from "react";

export const GalleryStrip: React.FC = () => {
  const images = [
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdqa-lecH6cFHUexXwsHfflu1taQVseCMWqZ_Wu9NWdnTUrH_2HZMahKY4fEuGlHGTpef_r_TME12xxE6eELPzuwl4mZT6UfyUr4VYz4N8msGKwCxuDN_4uG9dVFMiKflRJeVoA2p2egoasum8UMgKNV1TPOoTgYGZyfEGyGwoK1j0nxtl9ue5mIFOsm2P2cPD4NVV1sfcxC_yMEJjo7qxx4HpwGilMydNNdKs1xZoJP0QzG3EfU4",
      alt: "Ambiente Interior 1",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdGqikarXxk57gD0OLESXRzESZRrBWTJMwqpx9zPI8j4MS9_VebvlTenG8myelNEnsjcbYb6zczoOr_EHvUdjAitbNe0i8yyQBy5NpHwNN8cq580cESFq3WzPhdzKSLfibkL9kFe1O6sMFl4J4mEcmwLz2BpEkbbxL5t3VYPSrnLL50wh7NxVCdCIZR4xgdR7Zd-yTaAwdXVNzdxN1w8NnjzlfGKAIeOXJWulWWDhq9GJ0UgdUnz0",
      alt: "Ambiente Interior 2",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTIH4DvLJ5ZC9csQTuLloq0Hhz7XTSn_go8ug_cEAJhki8yxunS2eZUCPaLblqY89jmX-EwiXfB-tLu1DfRekYcVn9vE26siFa-Zbx1IA2GdnPNhHYtMfcImZWvyqLFdQRqfYtrmZV_Cdg8WhS_GD1l4JDErlXp-fQ6BZhO2H-0vDzURoGZHtAGa_tGqiCxXVnXq11uIFtct5sbDCXTFWcCdB1xGkNRaBD0quQI-oyWXHgQ8QB4q0",
      alt: "Ambiente Interior 3",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnl0KPE2dWph5RP6RJfQzZpa7a5HZD1_oHo8gIxWj2_Wpceq9cPTnUGNfXYupejMJxAiO69DkamxKa-bBPy4PZ-iLRxG5JFkgSFqyfGNQ4Fc2Pw2o9SQzLfQdj5nROvWejI3QKXaFjD9naxh6k413XsOv1UPrHobkhrDu4lZtOyU_YPiXsGHkpCSAU5avtdbIXF1bxXyufV4lDHGsF4k-hoFBSu70qspJkBr_nEOkTmvUMyOBQVPA",
      alt: "Ambiente Interior 4",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuB7N6BMUmA2JUnaYLYhg1vLMLVnrOgHOgrgANHmBg9FmBgRsIH8l67WNpdJIAJ-ooZC4xWmYRYsFhyUTTeHKRZUYK6-8hEPNMjF5uDbhyTq3oZKhMAZ-lKQ0vDVC01bxcNShpB642OYej40xXdKHDSw1RrrrUspTdipGq4E6aH77H_asUYzCxXpv92Oa01fSPJd4hjKOlubGRWTh9vCB06GZt2EtENmh36eN9z4l8KcI2dRyEkk6QU",
      alt: "Ambiente Interior 5",
    },
    {
      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDiCWyWQjbErvS0-_RX9CSIdqY52OzY3Wf_czESjVE231BMzmD96kkVcz1koqh5hfaAowXS3GURnEI_cdw0rCt2OIEcqG1dgfxJU9jwf_gU56qdR0hJslzPrcr17DDg7QD4UFpewtypTUPMJ23tFHCVAN74bVndBRMqjYudBjx4O9ueLgAQsv1J2kRj5Ob4MHyR63xdG_d-19oPJahJ5uXNLeCHOURTscy_2KfPWHhX2oksczGDcME",
      alt: "Ambiente Interior 6",
    },
  ];

  return (
    <section className="w-full overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-52 sm:h-60">
        {images.map((img, i) => (
          <div key={i} className="h-full overflow-hidden">
            <img
              alt={img.alt}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
              src={img.src}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
