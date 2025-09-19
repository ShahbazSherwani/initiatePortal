import { Card, CardContent } from "../../components/ui/card";

export const Testimonials = () => {
  return (
    <div
      className="
        hidden xl:block
        absolute inset-y-0 right-0 w-1/2
        flex flex-col justify-between
        px-4 lg:px-8 py-8 lg:py-16
        overflow-hidden
      "
    >
      {/* ─── Background Shapes ─── */}
      <div className="absolute inset-0 z-0">
        <img
          src="/rectangle-green.png"
          alt="bg"
          className="w-full h-full object-cover rounded-[0rem] lg:rounded-[0rem] animate-fadeIn"
        />
        <img
          src="/mask-group-green.png"
          alt="mask"
          className="absolute inset-0 object-cover rounded-[2rem] lg:rounded-[3.5rem] animate-fadeIn delay-200"
        />
        <div
          className="
            absolute w-[60vw] h-[25vh] lg:w-[942px] lg:h-[509px]
            bottom-[15%] lg:top-[625px] right-0
            bg-[#98B813] rounded-[2rem] lg:rounded-[3.5rem]
            rotate-[-29.6deg] opacity-60
            animate-slideIn delay-300
          "
        />
        <div
          className="
            absolute w-[60vw] h-[25vh] lg:w-[942px] lg:h-[509px]
            bottom-[5%] lg:top-[825px] right-0
            bg-[#0C4B20] rounded-[2rem] lg:rounded-[3.5rem]
            rotate-[-45.88deg] opacity-40
            animate-slideIn delay-500
          "
        />
      </div>

      {/* ─── Top Testimonial ─── */}
      <div className="relative z-10 h-1/2 flex items-start group">
        {/* Arrow */}
        <img
          src="/arrow-2.svg"
          alt="arrow"
          className="absolute z-20 top-[10%] lg:top-[16%] right-[25%] lg:right-[35%] w-12 lg:w-20 h-auto animate-fadeIn"
        />

        {/* Floating Image */}
        <img
          src="/rectangle-12.svg"
          alt="Top testimonial"
          className="
            absolute top-[15%] lg:top-[20%] right-[30%] lg:right-[40%]
            transform translate-x-2 lg:translate-x-4
            rounded-lg lg:rounded-xl shadow-lg
            w-16 lg:w-auto h-16 lg:h-auto
            animate-fadeIn delay-400
          "
        />

        {/* Testimonial Card */}
        <div
          className="
            absolute top-[25%] lg:top-[30%] right-[0%]
            w-3/5 lg:w-2/4
            transform transition duration-500
            group-hover:rotate-2
            group-hover:scale-105
            group-hover:shadow-2xl
            group-hover:translate-x-4 lg:group-hover:translate-x-10
            rounded-[14px]
          "
        >
          <Card className="rounded-xl bg-white pt-3 lg:pt-6">
            <CardContent className="p-3 lg:p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-xs lg:text-sm">John Doe</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <img key={i} src="/star-1.svg" alt="star" className="w-2 lg:w-4 h-2 lg:h-4" />
                  ))}
                </div>
              </div>
              <p className="text-xs lg:text-sm leading-snug">
                The real-time market data and personalized alerts keep me updated on
                market trends and help me seize opportunities.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Bottom Testimonial ─── */}
      <div className="relative z-10 h-1/2 flex items-end group">
        {/* Arrow */}
        <div className="absolute bottom-[20%] lg:bottom-[28%] right-[40%] lg:right-[50%] w-12 lg:w-20 h-auto transform -scale-x-100">
          <img
            src="/arrow-2.svg"
            alt="arrow"
            className="w-full h-full animate-fadeInOnly"
          />
        </div>

        {/* Floating Image */}
        <img
          src="/rectangle-13.svg"
          alt="Bottom testimonial"
          className="
            absolute bottom-[15%] lg:bottom-[20%] right-[5%] lg:right-[10%]
            transform translate-x-2 lg:translate-x-4
            rounded-lg lg:rounded-xl shadow-lg
            w-16 lg:w-auto h-16 lg:h-auto
            animate-fadeIn delay-300
          "
        />

        {/* Testimonial Card */}
        <div
          className="
            absolute bottom-[5%] lg:bottom-[10%] right-[35%] lg:right-[45%]
            w-3/5 lg:w-2/4
            transform transition duration-500
            group-hover:translate-x-3 lg:group-hover:translate-x-6
            group-hover:rotate-2
            group-hover:scale-105
            group-hover:shadow-2xl
            rounded-[14px]
          "
        >
          <Card className="rounded-xl bg-white pt-3 lg:pt-5">
            <CardContent className="p-3 lg:p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-xs lg:text-sm">Alexa John</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <img key={i} src="/star-1.svg" alt="star" className="w-2 lg:w-4 h-2 lg:h-4" />
                  ))}
                </div>
              </div>
              <p className="text-xs lg:text-sm leading-snug">
                Investie has truly elevated my investment journey.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Animations ─── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease forwards;
        }
        /* alias fadeInOnly to the same keyframe if you need */
        .animate-fadeInOnly {
          animation: fadeIn 0.8s ease forwards;
        }
        .flipped-arrow {
          transform: scaleX(-1);
        }

        @keyframes slideIn {
          from { transform: translateX(50px) rotate(-30deg); opacity: 0; }
          to   { transform: translateX(0) rotate(-30deg); opacity: 1; }
        }
        
        @media (min-width: 1024px) {
          @keyframes slideIn {
            from { transform: translateX(100px) rotate(-30deg); opacity: 0; }
            to   { transform: translateX(0) rotate(-30deg); opacity: 1; }
          }
        }
        
        .animate-slideIn {
          animation: slideIn 1s ease-out forwards;
        }

        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-\[600ms\] { animation-delay: 0.6s; }
        
        /* Ensure proper z-indexing and prevent overflow issues */
        .testimonials-container {
          isolation: isolate;
        }
      `}</style>
    </div>
  );
};
