import React, { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { getWalletBalance } from "../lib/wallet";

// Icons
import {
  BellIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HelpCircleIcon,
  HomeIcon,
  LogOutIcon,
  SettingsIcon,
  WalletIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";


// ---------------------------------------------
// Dummy calendar data (you can replace this
// with real API calls or dynamic logic later)
// ---------------------------------------------
const calendarDays = [
  { day: "SUN", short: "S" },
  { day: "MON", short: "M" },
  { day: "TUES", short: "T" },
  { day: "WED", short: "W" },
  { day: "THURS", short: "T" },
  { day: "FRI", short: "F" },
  { day: "SAT", short: "S" },
];

const weeks = [
  [
    { day: 1, currentMonth: true },
    { day: 2, currentMonth: true, highlighted: true },
    { day: 3, currentMonth: true },
    { day: 4, currentMonth: true },
    { day: 5, currentMonth: true },
    { day: 6, currentMonth: true },
    { day: 7, currentMonth: true },
  ],
  [
    { day: 8, currentMonth: true },
    { day: 9, currentMonth: true },
    { day: 10, currentMonth: true },
    { day: 11, currentMonth: true },
    { day: 12, currentMonth: true },
    { day: 13, currentMonth: true },
    { day: 14, currentMonth: true },
  ],
  [
    { day: 15, currentMonth: true },
    { day: 16, currentMonth: true },
    { day: 17, currentMonth: true },
    { day: 18, currentMonth: true },
    { day: 19, currentMonth: true },
    { day: 20, currentMonth: true },
    { day: 21, currentMonth: true },
  ],
  [
    { day: 22, currentMonth: true },
    { day: 23, currentMonth: true },
    { day: 24, currentMonth: true },
    { day: 25, currentMonth: true },
    { day: 26, currentMonth: true },
    { day: 27, currentMonth: true },
    { day: 28, currentMonth: true },
  ],
  [
    { day: 29, currentMonth: true },
    { day: 30, currentMonth: true },
    { day: 31, currentMonth: true },
    { day: 1, currentMonth: false },
    { day: 2, currentMonth: false },
    { day: 3, currentMonth: false },
    { day: 4, currentMonth: false },
  ],
  [
    { day: 5, currentMonth: false },
    { day: 6, currentMonth: false },
    { day: 7, currentMonth: false },
    { day: 8, currentMonth: false },
    { day: 9, currentMonth: false },
    { day: 10, currentMonth: false },
    { day: 11, currentMonth: false },
  ],
];

const events = [
  {
    id: 1,
    title: "Passa Sustainable Agriculture",
    date: "10 July, 10:00 AM",
    image: "/rectangle-8.png",
  },
  {
    id: 2,
    title: "Securing Farming Funding for Growth and Sustainability",
    date: "10 July, 10:00 AM",
    image: "/rectangle-13.png",
  },
];

const navItems = [
  { name: "Borrow", href: "/borrow" },
  { name: "Invest", href: "/invest" },
  { name: "Donate", href: "/donate" },
  { name: "About us", href: "/about" },
  { name: "Farming & Livestock", href: "/farming-livestock" },
  { name: "MSME", href: "/msme" },
  { name: "Microlending", href: "/microlending" },
  { name: "Skills & Creators", href: "/skills-creators" },
  { name: "Unity", href: "/unity" },
];

// -------------------------------------------------------------------
// BorrowerCalender: wraps content in Navbar + Sidebar + main content
// -------------------------------------------------------------------
export const BorrowerCalender: React.FC = () => {
  const { profile, token, logout } = useContext(AuthContext)!;
  const [balance, setBalance] = useState<number | null>(null);
  const navigate = useNavigate();

  // Fetch wallet balance on mount (same as BorrowerHome)
  useEffect(() => {
    if (token) {
      getWalletBalance(token)
        .then((b) => setBalance(b))
        .catch(console.error);
    }
  }, [token]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is not logged in, redirect to /login
  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* ─── 1) Top Navbar ─── */}
      <Navbar activePage="login" showAuthButtons={true} />

      {/* ─── 2) Sidebar + Main Container ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── 2a) Sidebar (always hidden on small, toggled via button) ─── */}
        <div className="md:flex hidden">
          <Sidebar />
        </div>
        <div className="md:hidden">
          {/** Sidebar toggle button in mobile */}
          <div className="fixed top-4 left-4 z-50">
            <Button
              variant="outline"
              size="icon"
              className="p-2 rounded-full shadow"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              {mobileMenuOpen ? (
                <ChevronLeftIcon className="w-6 h-6 text-black" />
              ) : (
                <ChevronRightIcon className="w-6 h-6 text-black" />
              )}
            </Button>
          </div>

          {/* Slide-out menu */}
          <div
            className={`fixed top-0 left-0 h-full w-[75%] max-w-xs bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar />
          </div>
        </div>

        {/* ─── 2b) Main Content Area ─── */}
        <main className="flex-1 overflow-y-auto">
          {/* ─── Inner “card” (white background) ─── */}
          <Card className="rounded-[30px_0px_0px_0px] border-none shadow-none bg-white">
            <CardContent className="p-0">
              <div className="p-4 md:p-8">
                {/* ─── Header (“Calendar”) ─── */}
                <div className="flex items-center mb-6">
                  <img
                    src="/group-1.png"
                    alt="Calendar"
                    className="w-9 h-9 mr-4"
                  />
                  <h2 className="font-poppins font-semibold text-[28px] md:text-[32px]">
                    Calendar
                  </h2>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  {/* ─── 3a) Events List (left on lg, top on mobile) ─── */}
                  <div className="flex-1 mb-8 lg:mb-0">
                    <h3 className="font-poppins font-semibold text-[26px] mb-4">
                      Upcoming Event
                    </h3>

                    <div className="space-y-8">
                      {events.map((event, idx) => (
                        <div key={event.id} className="space-y-4">
                          <p className="font-poppins font-medium text-lg">
                            {event.date}
                          </p>
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full max-w-[426px] h-[216px] object-cover rounded-md"
                          />
                          <h4 className="font-poppins font-medium text-[22px]">
                            {event.title}
                          </h4>
                          <div className="flex gap-4 flex-wrap">
                            <Button className="bg-[#ffc628] text-black hover:bg-[#e6b324] font-poppins font-medium text-lg px-[70px] py-[18px] rounded-[10px]">
                              Interested
                            </Button>
                            <Button variant="outline" className="bg-[#d9d9d9] hover:bg-[#c5c5c5] border-none text-black font-poppins font-medium text-lg px-[30px] py-[18px] rounded-[10px]">
                              View Details
                            </Button>
                          </div>
                          {idx !== events.length - 1 && (
                            <Separator className="my-4 max-w-[426px]" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ─── 3b) Calendar Grid (right on lg, bottom on mobile) ─── */}
                  <div className="w-full lg:max-w-[582px]">
                    <div className="flex flex-col items-center p-2">
                      {/* Month navigation */}
                      <div className="flex items-center justify-center w-full px-4 py-2">
                        <Button variant="ghost" size="icon" className="p-0">
                          <ChevronLeftIcon className="w-6 h-6" />
                        </Button>
                        <h3 className="flex-1 text-center font-poppins font-semibold text-xl">
                          October
                        </h3>
                        <Button variant="ghost" size="icon" className="p-0">
                          <ChevronRightIcon className="w-6 h-6" />
                        </Button>
                      </div>

                      <Separator className="w-[90%] my-2" />

                      {/* Weekday headers */}
                      <div className="grid grid-cols-7 text-center py-2 w-[90%]">
                        {calendarDays.map((day) => (
                          <div key={day.day} className="px-1 py-0.5">
                            <span className="font-poppins text-xs tracking-[0.36px] leading-3">
                              {day.day}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Calendar days */}
                      <div className="w-[90%]">
                        {weeks.map((week, weekIndex) => (
                          <div key={weekIndex} className="grid grid-cols-7 text-center py-1">
                            {week.map((day, dayIndex) => (
                              <div
                                key={`${weekIndex}-${dayIndex}`}
                                className="h-[42px] flex items-center justify-center"
                              >
                                <div
                                  className={`
                                    w-[35px] h-[35px] flex items-center justify-center rounded-full
                                    ${day.highlighted ? "bg-[#ffc628]" : ""}
                                    ${!day.currentMonth ? "text-[#00000066]" : "text-black"}
                                    ${weekIndex === 5 ? "opacity-40" : ""}
                                  `}
                                >
                                  <span className="font-poppins font-medium text-lg">
                                    {day.day}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default BorrowerCalender;
