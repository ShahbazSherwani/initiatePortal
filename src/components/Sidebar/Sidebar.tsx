import React, { useState, ReactNode, useContext } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "../ui/button";
import {
  HomeIcon,
  CalendarIcon,
  WalletIcon,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { AuthContext } from '../../contexts/AuthContext';

interface NavItem {
  icon: ReactNode;
  label: string;
  to?: string;
  subItems?: string[];
  key: string;
}

const navItems: NavItem[] = [
  { icon: <HomeIcon className="w-5 h-5" />, label: "Home", to: '/borrow', key: 'home' },
  { icon: <CalendarIcon className="w-5 h-5" />, label: "Calendar", to: '/borrowCalendar', key: 'calendar' },
  { icon: <WalletIcon className="w-5 h-5" />, label: "Wallet", to: '/borrowBank', key: 'wallet' },
  {
    icon: <img src="/group-23.png" alt="Issuer" className="w-5 h-5" />,
    label: "My Issuer/Borrower",
    to: '/borwMyProj', // <-- Add this line to enable routing
    subItems: ["My Investments/Lending", "My Guarantees"],
    key: 'issuer-borrower',
  },
  {
    icon: <img src="/vector-2.svg" alt="Request" className="w-5 h-5" />,
    label: "Initiate Request",
    to: '/request',
    key: 'initiate-request'
  },
  {
    icon: <img src="/group-26.png" alt="Donation" className="w-3.5 h-5" />,
    label: "Donation",
    to: '/donation',
    key: 'donation'
  },
  { icon: <SettingsIcon className="w-5 h-5" />, label: "Settings", to: '/settings', key: 'settings' },
  { icon: <HelpCircleIcon className="w-5 h-5" />, label: "Help & Support", to: '/help', key: 'help' },
];

interface SidebarProps {
  activePage?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage }) =>  {
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Highlight based on current route
  const selectedIdx = navItems.findIndex((item) => {
    if (item.to && (location.pathname === item.to || location.pathname.startsWith(item.to + "/"))) {
      return true;
    }
    // Highlight parent if on any sub-page
    if (
      item.subItems &&
      (location.pathname.startsWith("/borwMyProj") ||
       location.pathname.startsWith("/borwMyProjects") ||
       location.pathname.startsWith("/borwNewProj") ||
       location.pathname.startsWith("/borwNewProjEq"))
    ) {
      return true;
    }
    return false;
  });

  const handleLogout = () => {
    authContext?.logout();
    navigate('/');
  };

  const renderNav = (isMobile = false) => (
    <nav className={`flex flex-col ${isMobile ? "space-y-4 px-6 pt-20" : "space-y-4"}`}>
      {navItems.map((item, idx) => {
        const isSelected = idx === selectedIdx;
        return (
          <div key={item.key}>
            <Button
              variant={isSelected ? "default" : "ghost"}
              onClick={() => {
                if (item.to) {
                  navigate(item.to);
                  if (isMobile) setMobileOpen(false);
                }
              }}
              className={
                `flex items-center justify-start w-full gap-3 text-left ` +
                (isSelected
                  ? "bg-[#ffc628] rounded-[12.49px] h-[49px]"
                  : "bg-transparent opacity-70 p-2")
              }
            >
              {item.icon}
              <span className="font-poppins font-medium text-black text-[17.8px]">
                {item.label}
              </span>
              {item.subItems && <ChevronDownIcon className="w-4 h-4 ml-auto" />}
            </Button>

            {item.subItems && isSelected && (
              <div className={`ml-10 mt-2 space-y-2 ${isMobile ? "ml-6" : ""}`}>
                {item.subItems.map((subItem, subIdx) => (
                  <Button
                    key={subIdx}
                    variant="ghost"
                    className="opacity-70 p-0 h-auto flex justify-start"
                    onClick={() => {
                      // Add navigation for sub-items if needed
                      if (subItem === "My Investments/Lending") navigate("/borwMyProj");
                      if (subItem === "My Guarantees") navigate("/borwMyProjects");
                      if (isMobile) setMobileOpen(false);
                    }}
                  >
                    <span className="font-poppins font-medium text-black text-[14.8px]">
                      {subItem}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className={`${isMobile ? "mt-4" : "mt-auto pt-20"}`}>
        <Button
          variant="ghost"
          className="flex items-center justify-start w-full gap-3 text-left opacity-70 p-2"
          onClick={handleLogout}
        >
          <LogOutIcon className="w-5 h-5" />
          <span className="font-poppins font-medium text-black text-[17.8px]">
            Log Out
          </span>
        </Button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="text-black font-poppins p-2 rounded-full shadow"
        >
          {mobileOpen ? <ChevronLeftIcon className="w-6 h-6" /> : <ChevronRightIcon className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Slide-out Menu */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-[75%] max-w-xs bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-40 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderNav(true)}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[325px] pl-20 pr-4 py-4">
        {renderNav()}
      </aside>
    </>
  );
};