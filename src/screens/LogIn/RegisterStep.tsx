import {
    ArrowLeftIcon,
    EyeIcon,
    EyeOffIcon,
    LockIcon,
    MailIcon,
    UserIcon,
  } from "lucide-react";
  import React from "react";
  import { Button } from "../../components/ui/button";
  import { Card, CardContent } from "../../components/ui/card";
  import { Checkbox } from "../../components/ui/checkbox";
  import { Input } from "../../components/ui/input";
  
  export const RegisterStep = (): JSX.Element => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
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
  
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className={`absolute w-[346px] h-[${testimonial.height}]`}
                  style={{
                    top: testimonial.position.top,
                    left: testimonial.position.left,
                  }}
                >
                  <Card className="relative w-[342px] h-full rounded-[14px]">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center mb-4">
                        <div className="font-medium text-[17px] font-['Poppins',Helvetica]">
                          {testimonial.name}
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <img
                              key={i}
                              className="w-[21px] h-5"
                              alt="Star"
                              src="/star-4.svg"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="font-normal text-[15px] font-['Poppins',Helvetica]">
                        {testimonial.text}
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
                      className={`relative whitespace-nowrap font-['Mont-Regular',Helvetica] font-normal ${item.color} text-base tracking-[0] leading-[normal]`}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
  
                <div className="inline-flex items-center justify-center gap-[15px] relative flex-[0_0_auto]">
                  <div className="relative w-11 h-[17px] font-['Mont-Regular',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal] whitespace-nowrap">
                    Login
                  </div>
  
                  <Button className="px-[30px] py-[15px] bg-[#203863] rounded-lg">
                    <div className="relative w-[66px] h-[17px] mt-[-1.00px] font-['Mont-Regular',Helvetica] font-normal text-white text-base tracking-[0] leading-[normal] whitespace-nowrap">
                      Register
                    </div>
                  </Button>
                </div>
  
                <div className="relative w-[65px] h-6 mr-[-0.52px]">
                  <div className="absolute h-[21px] top-0.5 left-[43px] font-['Mont-SemiBold',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal]">
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
  
            <div className="absolute top-[142px] left-[432px] font-['Poppins',Helvetica] font-medium text-transparent text-xl text-right tracking-[0] leading-[normal] whitespace-nowrap">
              <span className="text-black">Already a member? </span>
              <span className="text-[#ffc628] cursor-pointer">Sign In</span>
            </div>
  
            <Button
              variant="ghost"
              className="absolute top-[126px] left-0 p-0 h-12 w-12"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-12 w-12" />
            </Button>
  
            <div className="absolute top-[218px] left-px font-['Poppins',Helvetica] font-bold text-black text-[32px] tracking-[0] leading-[normal] whitespace-nowrap">
              Register a New Account
            </div>
  
            <div className="absolute top-[272px] left-0 font-['Poppins',Helvetica] font-normal text-[#505050] text-base tracking-[0] leading-[normal] whitespace-nowrap">
              Enter your details to create your account
            </div>
  
            <div className="absolute w-[585px] h-[86px] top-[332px] left-0">
              <div className="absolute top-0 left-0 font-['Poppins',Helvetica] font-medium text-black text-[17px] tracking-[0] leading-[normal] whitespace-nowrap">
                Email Address
              </div>
              <div className="absolute w-[581px] h-[58px] top-7 left-0">
                <div className="relative">
                  <Input
                    className="h-[58px] rounded-2xl border border-solid border-black pl-[74px]"
                    placeholder="Enter here"
                  />
                  <MailIcon className="absolute w-7 h-[22px] top-[17px] left-[23px] text-black" />
                </div>
              </div>
            </div>
  
            <div className="absolute w-[585px] h-[86px] top-[440px] left-0">
              <div className="absolute top-0 left-0 font-['Poppins',Helvetica] font-medium text-black text-[17px] tracking-[0] leading-[normal] whitespace-nowrap">
                Full Name
              </div>
              <div className="absolute w-[581px] h-[58px] top-7 left-0">
                <div className="relative">
                  <Input
                    className="h-[58px] rounded-2xl border border-solid border-black pl-[74px]"
                    placeholder="Enter here"
                  />
                  <UserIcon className="absolute w-[18px] h-[26px] top-[15px] left-7 text-black" />
                </div>
              </div>
            </div>
  
            <div className="absolute w-[585px] h-[86px] top-[548px] left-0">
              <div className="absolute top-0 left-0 font-['Poppins',Helvetica] font-medium text-black text-[17px] tracking-[0] leading-[normal] whitespace-nowrap">
                Password
              </div>
              <div className="absolute w-[581px] h-[58px] top-7 left-0">
                <div className="relative">
                  <Input
                    className="h-[58px] rounded-2xl border border-solid border-black pl-[74px]"
                    placeholder="Enter here"
                    type={showPassword ? "text" : "password"}
                  />
                  <LockIcon className="absolute w-5 h-[26px] top-[15px] left-[27px] text-black" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-3 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-6 w-6" />
                    ) : (
                      <EyeIcon className="h-6 w-6" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
  
            <div className="absolute w-[585px] h-[86px] top-[656px] left-0">
              <div className="absolute top-0 left-0 font-['Poppins',Helvetica] font-medium text-black text-[17px] tracking-[0] leading-[normal] whitespace-nowrap">
                Re-type Password
              </div>
              <div className="absolute w-[581px] h-[58px] top-7 left-0">
                <div className="relative">
                  <Input
                    className="h-[58px] rounded-2xl border border-solid border-black pl-[74px]"
                    placeholder="Enter here"
                    type={showConfirmPassword ? "text" : "password"}
                  />
                  <LockIcon className="absolute w-5 h-[26px] top-[15px] left-[27px] text-black" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-3 h-8 w-8"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-6 w-6" />
                    ) : (
                      <EyeIcon className="h-6 w-6" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
  
            <div className="absolute top-[771px] left-0 flex items-center space-x-2">
              <Checkbox
                id="terms"
                className="rounded-[5px] border border-solid border-black"
              />
              <label
                htmlFor="terms"
                className="font-['Poppins',Helvetica] font-normal text-black text-base leading-normal cursor-pointer"
              >
                I have reviewed and agreed to Investie's{" "}
                <span className="text-[#203863] underline">Terms of Use</span> and{" "}
                <span className="text-[#203863] underline">Privacy Policy</span>
              </label>
            </div>
  
            <div className="absolute top-[836px] left-0 flex items-center space-x-4">
              <Button className="w-[266px] h-[58px] bg-[#ffc00f] rounded-2xl text-black">
                <span className="font-['Poppins',Helvetica] font-medium text-lg">
                  Register
                </span>
              </Button>
  
              <span className="font-['Poppins',Helvetica] font-normal text-black text-base">
                Or
              </span>
  
              <Button
                variant="outline"
                className="w-[107px] h-[58px] bg-[#ebeaea] rounded-2xl border-none"
              >
                <img
                  className="w-[33px] h-[34px] object-cover"
                  alt="Google sign in"
                  src="/image-3.png"
                />
              </Button>
  
              <Button
                variant="outline"
                className="w-[107px] h-[58px] bg-[#ebeaea] rounded-2xl border-none"
              >
                <img
                  className="w-[33px] h-[34px] object-cover"
                  alt="Facebook sign in"
                  src="/image-6.png"
                />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  