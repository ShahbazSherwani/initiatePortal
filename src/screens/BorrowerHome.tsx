import React, { useState } from "react";
import {
  BellIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  HelpCircleIcon,
  HomeIcon,
  LogOutIcon,
  SettingsIcon,
  WalletIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "../../src/components/ui/avatar";
import { Button } from "../../src/components/ui/button";
import { Card, CardContent } from "../../src/components/ui/card";
import { Navbar } from "../../src/components/Navigation/navbar";
import { Sidebar } from "../../src/components/Sidebar/Sidebar";

import "../../src/styles/animations.css";

export const BorrowerHome = (): JSX.Element => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // account‑type toggle
  const accountTypes = [
    { title: "Invest/Lender", image: "/investor-1.png" },
    { title: "Issue/Borrow", image: "/debt-1.png" },
    { title: "Guarantee", image: "/cashback-1.png" },
  ];
  const [selectedAccountIdx, setSelectedAccountIdx] = useState(1);

  // action cards (static)
  const actionCards = [
    { title: "Initiate Donation Campaign", image: "/donate-1.png" },
    { title: "Initiate Request",        image: "/leader-1.png" },
  ];

  return (
    <div className="bg-[#f0f0f0] flex flex-col md:flex-row w-full min-h-screen animate-fadeIn overflow-x-hidden">
      <div className="bg-[#f0f0f0] w-full  relative overflow-x-hidden">
        <Navbar activePage="login" showAuthButtons />

        {/* Sidebar + Main */}
        <div className="flex flex-col md:flex-row w-full max-w-[90%] h-[auto] mt-10 md:gap-x-10">
          <Sidebar />

          <main className="w-[90%] h-[90%] mx-auto my-4 bg-white rounded-t-[30px] p-4 md:p-8 md:w-full md:h-auto md:mx-0 md:my-0 animate-fadeIn delay-300 md:gap-x-6">
            {/* Header */}
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 md:px-20 pt-6 md:pt-9 gap-4 md:gap-0">
              <div className="flex items-center gap-4 ml-auto animate-fadeIn delay-300">
                <div className="relative">
                  <BellIcon className="w-6 md:w-7 h-6 md:h-8" />
                  <div className="absolute w-3 h-3 top-0 right-0 bg-[#ff0000] rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="w-[50px] md:w-[61px] h-[50px] md:h-[61px]">
                    <AvatarImage src="/ellipse-1.png" alt="User avatar" />
                    <AvatarFallback>AJ</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm md:text-lg opacity-70 font-poppins font-medium text-black">
                      Account:
                    </span>
                    <span className="font-poppins font-medium text-black text-base md:text-xl flex items-center">
                      Issue/Borrow
                      <ChevronDownIcon className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Profile / Wallet Section */}
          <section className="flex flex-col md:flex-row items-start md:items-center mb-12 gap-6">
            <Avatar className="w-[100px] md:w-[123px] h-[100px] md:h-[123px]">
                <AvatarImage src="/ellipse-1.png" alt="User profile" />
                <AvatarFallback>AJ</AvatarFallback>
              </Avatar>

              <div className="flex flex-col flex-1 w-full">
                <div className="flex justify-between items-center w-full">
                  {/* Legal Name */}
                  <div>
                    <div className="opacity-70 font-poppins font-medium text-black text-xl md:text-2xl">
                      Legal Name:
                    </div>
                    <h2 className="font-poppins font-medium text-black text-[22px] md:text-[28px]">
                      Alexa John
                    </h2>
                  </div>

                  {/* Wallet Balance & Actions */}
                  <div className="text-right">
                    <div className="font-poppins font-medium text-black text-xl md:text-2xl mb-2">
                      Wallet Balance: 0.00
                    </div>
                    <div className="flex gap-4 flex-wrap justify-end">
                      <Button variant="outline" className="rounded-xl px-6 py-3 text-sm md:text-xl">
                        Top‑up
                      </Button>
                      <Button className="bg-[#ffc628] text-black hover:bg-[#e6b324] rounded-xl px-6 py-3 text-sm md:text-xl">
                        Withdraw
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Username & Profile Code */}
                <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <div>
                    <div className="opacity-70 font-poppins font-medium text-black text-base md:text-xl">
                      Username:
                    </div>
                    <div className="font-poppins font-medium text-black text-base md:text-xl">
                      alexa_john
                    </div>
                  </div>

                  <div>
                    <div className="opacity-70 font-poppins font-medium text-black text-base md:text-xl">
                      Profile Code:
                    </div>
                    <div className="font-poppins font-medium text-black text-base md:text-xl">
                      554Xd1
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Account Type Selectors */}
            <section className="mt-12">
              <h3 className="font-poppins font-semibold text-black text-xl md:text-[26px] mb-6">
                Choose account type
              </h3>
              <div className="flex flex-wrap gap-6">
                {accountTypes.map((type, idx) => {
                  const isSelected = idx === selectedAccountIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedAccountIdx(idx)}
                      className="w-full sm:w-[216px] flex flex-col items-center focus:outline-none"
                    >
                      <Card
                        className={`w-full h-[158px] flex items-center justify-center rounded-2xl transition ${
                          isSelected
                            ? "bg-[#ffc628] border-none"
                            : "bg-white border border-black"
                        }`}
                      >
                        <CardContent className="p-0 flex items-center justify-center">
                          <img
                            className="w-[115px] h-[115px] object-cover"
                            src={type.image}
                            alt={type.title}
                          />
                        </CardContent>
                      </Card>
                      <span
                        className={`mt-4 font-poppins font-medium text-black text-base md:text-xl transition ${
                          isSelected ? "" : "opacity-70"
                        }`}>
                        {type.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Action Cards */}
            <section className="mt-12">
              <h4 className="font-poppins font-medium text-black text-lg md:text-[22px] mb-6">
                You can run the donation campaign or initiate a request also
              </h4>
              <div className="flex flex-wrap gap-6">
                {actionCards.map((card, idx) => (
                  <Card
                    key={idx}
                    className="w-full md:w-[337px] h-24 bg-white rounded-2xl border border-black flex items-center p-4 hover:shadow-lg transition-shadow duration-300"
                  >
                    <CardContent className="p-0 flex items-center">
                      <img
                        className="w-[62px] h-[62px] object-cover"
                        alt={card.title}
                        src={card.image}
                      />
                      <div className="ml-6 font-poppins font-medium text-black text-base md:text-xl">
                        {card.title}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default BorrowerHome;
