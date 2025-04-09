import { ArrowLeftIcon, EyeIcon } from "lucide-react";
import React from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {Link } from "react-router-dom";

export const LogIn = (): JSX.Element => {
  // Testimonial data
  const testimonials = [
    {
      name: "John Doe",
      text: "The real-time market data and personalized alerts keep me updated on market trends and help me seize opportunities.",
      position: { top: "205px", left: "1098px" },
      height: "147px",
    },
    {
      name: "Alexa John",
      text: "Investie has truly elevated my investment journey.",
      position: { top: "774px", left: "799px" },
      height: "108px",
    },
  ];

  // Navigation items
  const navItems = [
    { name: "Borrow", color: "text-[#ffc00f]" },
    { name: "Invest", color: "text-[#ffc00f]" },
    { name: "Donate", color: "text-[#ffc00f]" },
    { name: "About us", color: "text-black" },
    { name: "Farming & Livestock", color: "text-black" },
    { name: "MSME", color: "text-black" },
    { name: "Microlending", color: "text-black" },
    { name: "Skills & Creators", color: "text-black" },
    { name: "Unity", color: "text-black" },
  ];

  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white overflow-hidden w-[1600px] h-[1024px]">
        <div className="relative w-[1736px] h-[1655px] left-20">
          {/* Background elements */}
          <div className="absolute w-[1736px] h-[1655px] top-0 left-0">
            <img
              className="absolute w-[782px] h-[1024px] top-0 left-[738px]"
              alt="Rectangle"
              src="/rectangle-2.svg"
            />

            <img
              className="absolute w-[782px] h-[1024px] top-0 left-[738px]"
              alt="Mask group"
              src="/mask-group.png"
            />

            <div className="absolute w-[942px] h-[509px] top-[665px] left-[654px] bg-[#203863] rounded-[59px] rotate-[-29.60deg]" />

            <div className="absolute w-[942px] h-[509px] top-[885px] left-[754px] bg-[#27406d] rounded-[59px] rotate-[-45.88deg]" />

            <img
              className="absolute w-[492px] h-[250px] top-[554px] left-[931px]"
              alt="Rectangle"
              src="/rectangle-13.svg"
            />

            <img
              className="absolute w-28 h-[124px] top-[150px] left-[1116px]"
              alt="Arrow"
              src="/arrow-1.svg"
            />

            <img
              className="absolute w-[314px] h-[328px] top-[184px] left-[890px] object-cover"
              alt="Rectangle"
              src="/rectangle-12.svg"
            />

            {/* Testimonial cards */}
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`absolute w-[346px] h-[${testimonial.height}]`}
                style={{
                  top: testimonial.position.top,
                  left: testimonial.position.left,
                }}
              >
                <Card
                  className={`relative w-[342px] h-[${testimonial.height}] rounded-[14px]`}
                >
                  <CardContent className="p-0">
                    <div className="absolute w-[114px] h-[22px] top-[15px] left-52">
                      {[...Array(5)].map((_, i) => (
                        <img
                          key={i}
                          className={`left-[${i * 23}px] absolute w-[21px] h-5 top-0`}
                          alt="Star"
                          src="/star-1.svg"
                        />
                      ))}
                    </div>

                    <div className="absolute w-[322px] top-[52px] left-3 font-normal text-black text-[15px] tracking-[0] leading-normal font-['Poppins',Helvetica]">
                      {testimonial.text}
                    </div>

                    <div className="absolute top-5 left-3 font-medium text-black text-[17px] tracking-[0] leading-normal whitespace-nowrap font-['Poppins',Helvetica]">
                      {testimonial.name}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

            <img
              className="absolute w-[77px] h-[73px] top-[149px] left-[1150px]"
              alt="Arrow"
              src="/arrow-2.svg"
            />

            {/* Header/Navigation */}
            <header className="flex w-[1440px] items-center justify-center gap-[62px] absolute top-[33px] left-0 bg-transparent">
              <div className="inline-flex flex-col items-start gap-2.5 relative flex-[0_0_auto] ml-[-0.52px]">
                <img
                  className="relative w-[132.05px] h-[26.05px]"
                  alt="Group"
                  src="/group.png"
                />
              </div>

              <div className="inline-flex items-center justify-center gap-[18px] relative flex-[0_0_auto]">
                {navItems.map((item, index) => (
                  <div
                    key={index}
                    className={`relative ${item.name === "About us" || item.name === "Farming & Livestock" || item.name === "Microlending" ? "h-[17px] mt-[-1.00px]" : item.name === "Skills & Creators" ? "h-2.5" : item.name === "MSME" ? "h-[11px]" : "h-3"} font-['Mont-Regular',Helvetica] font-normal ${item.color} text-base tracking-[0] leading-normal whitespace-nowrap`}
                    style={{ width: `${item.name.length * 8}px` }}
                  >
                    {item.name}
                  </div>
                ))}
              </div>

              <div className="inline-flex items-center justify-center gap-[15px] relative flex-[0_0_auto]">
                <div className="relative w-11 h-[17px] font-['Mont-Regular',Helvetica] font-normal text-black text-base tracking-[0] leading-normal whitespace-nowrap">
                  Login
                </div>

                <Link to="/register">
                <Button className="px-[30px] py-[15px] bg-[#203863] rounded-lg">
                  <div className="relative w-[66px] h-[17px] mt-[-1.00px] font-['Mont-Regular',Helvetica] font-normal text-white text-base tracking-[0] leading-normal whitespace-nowrap">
                    Register
                  </div>
                </Button>
                </Link>
              </div>

              <div className="relative w-[65px] h-6 mr-[-0.52px]">
                <div className="absolute h-[21px] top-0.5 left-[43px] font-['Mont-SemiBold',Helvetica] font-semibold text-black text-base tracking-[0] leading-normal">
                  PH
                </div>

                <img
                  className="absolute w-7 h-[21px] top-0 left-0 object-cover"
                  alt="Flag"
                  src="/flag.png"
                />
              </div>
            </header>
          </div>

          {/* Sign up link */}
          <div className="absolute top-[142px] left-96 font-['Poppins',Helvetica] font-medium text-transparent text-xl text-right tracking-[0] leading-normal whitespace-nowrap">
            <span className="text-black">Don&apos;t have an account? </span>
            <span className="text-[#ffc628]">Sign Up</span>
          </div>

          {/* Forgot password link */}
          <div className="absolute top-[564px] left-[403px] font-['Poppins',Helvetica] font-medium text-black text-xl text-right tracking-[0] leading-normal whitespace-nowrap">
            Forgot Password?
          </div>

          {/* Login form description */}
          <div className="absolute top-[272px] left-0 font-['Poppins',Helvetica] font-normal text-[#505050] text-base tracking-[0] leading-normal whitespace-nowrap">
            Enter your details to log in your account
          </div>

          {/* Login heading */}
          <div className="top-[218px] left-px font-bold text-[32px] absolute font-['Poppins',Helvetica] text-black tracking-[0] leading-normal whitespace-nowrap">
            Log In
          </div>

          {/* Back button */}
          <Button
            variant="ghost"
            className="absolute top-[126px] left-0 p-0 h-12 w-12"
          >
            <ArrowLeftIcon className="h-12 w-12" />
          </Button>

          {/* Email input */}
          <div className="absolute w-[585px] h-[86px] top-[332px] left-0">
            <div className="absolute top-0 left-0 font-['Poppins',Helvetica] font-medium text-black text-[17px] tracking-[0] leading-normal whitespace-nowrap">
              Email Address
            </div>

            <div className="absolute w-[581px] h-[58px] top-7 left-0 rounded-2xl border border-solid border-black">
              <div className="relative flex items-center h-full">
                <img
                  className="absolute w-7 h-[22px] left-[23px]"
                  alt="Email icon"
                  src="/group-2.png"
                />
                <Input
                  className="h-full pl-[74px] font-['Poppins',Helvetica] font-medium text-black text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Enter here"
                />
              </div>
            </div>
          </div>

          {/* Password input */}
          <div className="absolute w-[585px] h-[86px] top-[440px] left-0">
            <div className="absolute top-0 left-0 font-['Poppins',Helvetica] font-medium text-black text-[17px] tracking-[0] leading-normal whitespace-nowrap">
              Password
            </div>

            <div className="absolute w-[581px] h-[58px] top-7 left-0 rounded-2xl border border-solid border-black">
              <div className="relative flex items-center h-full">
                <img
                  className="absolute w-5 h-[26px] left-[27px]"
                  alt="Password icon"
                  src="/group-5.png"
                />
                <Input
                  type="password"
                  className="h-full pl-[74px] font-['Poppins',Helvetica] font-medium text-black text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Enter here"
                />
                <Button
                  variant="ghost"
                  className="absolute right-4 p-0 h-6 w-6"
                >
                  <EyeIcon className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>

          {/* Login button */}
          <Button className="absolute w-[266px] h-[58px] top-[649px] left-0 bg-[#ffc00f] rounded-2xl hover:bg-[#e6af0e] text-black">
            <span className="font-['Poppins',Helvetica] font-medium text-lg">
              Log In
            </span>
          </Button>

          {/* Social login buttons */}
          <div className="absolute top-[671px] left-[301px] font-['Poppins',Helvetica] font-normal text-black text-base tracking-[0] leading-normal whitespace-nowrap">
            Or
          </div>

          <Button
            variant="outline"
            className="absolute w-[107px] h-[58px] top-[649px] left-[354px] bg-[#ebeaea] rounded-2xl border-none hover:bg-[#dedede]"
          >
            <img
              className="w-[33px] h-[34px] object-cover"
              alt="Google login"
              src="/image-3.png"
            />
          </Button>

          <Button
            variant="outline"
            className="absolute w-[107px] h-[58px] top-[649px] left-[475px] bg-[#ebeaea] rounded-2xl border-none hover:bg-[#dedede]"
          >
            <img
              className="w-[33px] h-[34px] object-cover"
              alt="Facebook login"
              src="/image-6.png"
            />
          </Button>
        </div>
      </div>
    </div>
  );
};
