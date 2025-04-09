import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { MenuIcon, XIcon } from "lucide-react";

type NavbarProps = {
  showAuthButtons?: boolean;
  activePage?: "login" | "register";
  onBack?: () => void;
};

export const Navbar = ({ showAuthButtons = true, activePage, onBack }: NavbarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

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
    <nav className="w-full flex flex-col md:flex-row items-center justify-between px-6 py-4 relative z-50">
      {/* Logo and back */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="p-0">
            ←
          </Button>
        )}
        <img src="/group.png" alt="Logo" className="w-[132px] h-auto" />
      </div>

      {/* Mobile Hamburger */}
      <div className="md:hidden absolute right-6 top-6">
        <Button variant="ghost" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </Button>
      </div>

      {/* Nav Items */}
      <div
        className={`${
          mobileOpen ? "flex" : "hidden"
        } md:flex flex-col md:flex-row gap-4 md:gap-6 absolute md:static top-20 right-6 md:right-0 bg-white md:bg-transparent shadow-md md:shadow-none rounded-lg p-6 md:p-0 z-40`}
      >
        {navItems.map((item, index) => (
          <span
            key={index}
            className={`cursor-pointer font-['Mont-Regular',Helvetica] text-base ${item.color}`}
          >
            {item.name}
          </span>
        ))}
      </div>

      {/* Auth Section */}
      {showAuthButtons && (
        <div className="hidden md:flex items-center gap-4">
          {activePage === "register" ? (
            <Link to="/">
              <Button variant="ghost" className="text-black">
                Login
              </Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button className="bg-[#203863] text-white px-6 py-2 rounded-lg">
                Register
              </Button>
            </Link>
          )}

          <div className="flex items-center gap-2">
            <img className="w-7 h-[21px]" alt="Flag" src="/flag.png" />
            <span className="font-semibold text-black text-base">PH</span>
          </div>
        </div>
      )}
    </nav>
  );
};
