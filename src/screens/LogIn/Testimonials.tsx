import React from "react";
import { Card, CardContent } from "../../components/ui/card";

export const Testimonials = () => {
  const testimonials = [
    {
      name: "John Doe",
      text: "The real-time market data and personalized alerts keep me updated on market trends and help me seize opportunities.",
      image: "/rectangle-12.svg",
      arrow: "/arrow-2.svg",
      alignment: "top",
    },
    {
      name: "Alexa John",
      text: "Investie has truly elevated my investment journey.",
      image: "/rectangle-13.svg",
      arrow: "/arrow-2.svg",
      alignment: "bottom",
    },
  ];

  return (
    
<div className="hidden md:flex absolute z-10 top-0 right-0 h-full w-1/2 flex-col justify-between gap-6 px-8 py-16 fadeInGroup">

<div className="hidden md:block absolute top-0 right-0 w-[782px] h-[1024px] z-0">
        <img
          className="absolute w-full h-full object-cover rounded-[59px] animate-fadeIn"
          src="/rectangle-2.svg"
          alt="bg"
        />
        <img
          className="absolute w-full h-full object-cover rounded-[59px] animate-fadeIn delay-200"
          src="/mask-group.png"
          alt="mask"
        />

        <div className="absolute w-[942px] h-[509px] top-[665px] right-[0px] bg-[#203863] rounded-[59px] rotate-[-29.60deg] opacity-60 animate-slideIn delay-300" />
        <div className="absolute w-[942px] h-[509px] top-[885px] right-[0px] bg-[#27406d] rounded-[59px] rotate-[-45.88deg] opacity-40 animate-slideIn delay-500" />
      </div>
  {/* Top Section with Image & Testimonial */}
  {/* Right Content (Background + Testimonials) */}
  <div className="relative top-[20%] group perspective " >
  <img
        className="fixed top-[22vh] right-[27vw] w-[7vw] max-w-[80px] h-auto animate-fadeIn delay-500"
        src="/arrow-2.svg"
        alt="arrow"
        />
    <img
      className="w-[40%] h-auto rounded-xl object-cover animate-fadeIn delay-400 transform transform transition duration-500 group-hover:rotate-[-1deg] group-hover:scale-105 group-hover:shadow-xl group-hover:translate-y-[-5px]"
      src="/rectangle-12.svg"
      alt="Top"
    />
{/* Wrapper that allows overflow */}
<div className="absolute top-[10%] right-[15%] w-[50%] overflow-visible">
  {/* Hover wrapper for 3D effect */}
  <div className="transform transition duration-500 group-hover:rotate-[2deg] group-hover:scale-[1.02] group-hover:shadow-2xl rounded-[14px] bg-white">
    <Card className="rounded-[14px] w-full bg-white">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium text-[17px] font-poppins break-words">John Doe</div>
          <div className="flex gap-1 mr-2">
            {[...Array(5)].map((_, i) => (
              <img key={i} className="w-[20%] h-auto" src="/star-1.svg" alt="star" />
            ))}
          </div>
        </div>
        <div className="font-normal text-[1rem] font-poppins break-words">
          The real-time market data and personalized alerts keep me updated on market trends and help me seize opportunities.
        </div>
      </CardContent>
    </Card>
  </div>
</div>

  </div>

{/* Bottom Section with Image & Testimonial */}
<div className="relative mt-12 group w-full">
  <div className="relative w-fit mx-auto">
    {/* Flipped Arrow that stays with image */}
    {/* <img
      className="absolute top-[-10%] left-[-10%] w-[7vw] max-w-[80px] h-auto flipped-arrow animate-fadeInOnly animate-fadeIn delay-500"
      src="/arrow-2.svg"
      alt="arrow"
    /> */}
    <img
  className="absolute top-[-10%] left-[-10%] w-[7vw] max-w-[80px] h-auto flipped-arrow animate-fadeInOnly "
  src="/arrow-2.svg"
  alt="arrow"
/>


    {/* Image */}
    <img
      className="w-[80%] h-auto rounded-xl object-cover rounded-[20px] animate-fadeIn delay-300 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-[1deg]"
      src="/rectangle-13.svg"
      alt="Bottom"
    />

    {/* Testimonial Card */}
    <div className="absolute bottom-[25%] left-[-40%] w-[70%] transform transition duration-300 group-hover:scale-105 group-hover:rotate-[1deg]">
      <Card className="rounded-[14px] w-[80%] bg-white shadow-lg">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium text-[17px] font-poppins break-words">Alexa John</div>
            <div className="flex gap-1 mr-2">
              {[...Array(5)].map((_, i) => (
                <img key={i} className="w-[20%] h-auto" src="/star-1.svg" alt="star" />
              ))}
            </div>
          </div>
          <div className="font-normal text-[1rem] font-poppins break-words">
            Investie has truly elevated my investment journey.
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</div>
<style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease forwards;
        }
        .flipped-arrow {
        transform: scaleX(-1);
        }

        @keyframes slideIn {
          from { transform: translateX(100px) rotate(-30deg); opacity: 0; }
          to { transform: translateX(0) rotate(-30deg); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 1s ease-out forwards;
        }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-[600ms] { animation-delay: 0.6s; }
      `}</style>
</div>
  );
};
