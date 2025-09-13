import React from "react";
import { Card, CardContent } from "../../components/ui/card";

export const Testimonials = () => {
  return (
    <div
      className="
    hidden md:block
    absolute inset-y-0 right-0 w-1/2
    flex flex-col justify-between
    px-8 py-16
      "
    >
      {/* ─── Background Shapes ─── */}
      <div className="absolute inset-0 z-0 left-[150px]">
        <img
          src="/rectangle-green.png"
          alt="bg"
          className="w-full h-full object-cover rounded-[59px] animate-fadeIn"
        />
        <img
          src="/mask-group-green.png"
          alt="mask"
          className="absolute inset-0 object-cover rounded-[59px] animate-fadeIn delay-200"
        />
        {/* Decorative rotated shapes: keep rotation on the wrapper and animate only the inner element */}
        <div className="absolute w-[942px] h-[509px] top-[625px] right-0 pointer-events-none">
          <div style={{ transform: 'rotate(-30deg)' }} className="w-full h-full">
            <div className="w-full h-full bg-[#98B813] rounded-[59px] animate-slideIn delay-300" />
          </div>
        </div>

        <div className="absolute w-[942px] h-[509px] top-[925px] right-0 pointer-events-none">
          <div style={{ transform: 'rotate(-30deg)' }} className="w-full h-full">
            <div className="w-full h-full bg-[#0C4B20] rounded-[59px] animate-slideIn delay-500" />
          </div>
        </div>
      </div>

      {/* ─── Top Testimonial ─── */}
      <div className="relative z-10 h-1/2 flex items-start group">
        {/* Arrow */}
        <img
          src="/arrow-2.svg"
          alt="arrow"
          className="absolute z-20 top-[16%] right-[35%] w-20 h-auto animate-fadeIn"
        />

        {/* Floating Image */}
        <img
          src="/rectangle-12.svg"
          alt="Top testimonial"
          className="
            absolute top-[20%] right-[40%]
            transform translate-x-4
            rounded-xl shadow-lg
            animate-fadeIn delay-400
          "
        />

        {/* Testimonial Card */}
        <div
          className="
            absolute top-[30%] right-[0%]
            w-2/4
            transform transition duration-500
            group-hover:rotate-2
            group-hover:scale-105
            group-hover:shadow-2xl
            group-hover:translate-x-10
            rounded-[14px]
          "
        >
          <Card className="rounded-xl bg-white pt-6">
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">John Doe</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <img key={i} src="/star-1.svg" alt="star" className="w-4 h-4" />
                  ))}
                </div>
              </div>
              <p className="text-sm leading-snug">
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
  <div className="absolute bottom-[28%] right-[50%] w-20 h-auto transform -scale-x-100">
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
            absolute bottom-[20%] right-[10%]
            transform translate-x-4
            rounded-xl shadow-lg
            animate-fadeIn delay-300
          "
        />

        {/* Testimonial Card */}
        <div
          className="
            absolute bottom-[10%] right-[45%]
            w-2/4
            transform transition duration-500
            group-hover:translate-x-6
            group-hover:rotate-2
            group-hover:scale-105
            group-hover:shadow-2xl
            rounded-[14px]
          "
        >
          <Card className="rounded-xl bg-white pt-5">
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Alexa John</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <img key={i} src="/star-1.svg" alt="star" className="w-4 h-4" />
                  ))}
                </div>
              </div>
              <p className="text-sm leading-snug">
                Investie has truly elevated my investment journey.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Animations ─── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
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
          /* Removed rotate to avoid tilting parent/nav elements on mobile */
          from { transform: translateX(100px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
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
      `}</style>
    </div>
  );
};
