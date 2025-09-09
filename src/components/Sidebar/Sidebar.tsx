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
  TrendingUpIcon,
} from "lucide-react";
import { AuthContext } from '../../contexts/AuthContext';
import { useAccount } from '../../contexts/AccountContext';

interface NavItem {
  icon: ReactNode;
  label: string;
  to?: string;
  subItems?: string[];
  key: string;
}

// Borrower navigation items
const borrowerNavItems: NavItem[] = [
  { icon: <HomeIcon className="w-5 h-5" />, label: "Home", to: '/borrow', key: 'home' },
  { icon: <CalendarIcon className="w-5 h-5" />, label: "Calendar", to: '/borrowCalendar', key: 'calendar' },
  { icon: <WalletIcon className="w-5 h-5" />, label: "iFunds", to: '/borrowBank', key: 'wallet' },
  {
    icon: <img src="/group-23.png" alt="Issuer" className="w-5 h-5" />,
    label: "My Projects",
    to: '/borwMyProj',
    subItems: ["My Projects", "Create New Project"],
    key: 'my-projects',
  },
  {
    icon: <img src="/vector-2.svg" alt="Request" className="w-5 h-5" />,
    label: "Raise Tickets",
    to: '/request',
    key: 'initiate-request'
  },
];

// Investor navigation items
const investorNavItems: NavItem[] = [
  { icon: <TrendingUpIcon className="w-5 h-5" />, label: "Discover", to: '/investor/discover', key: 'discover' },
  { icon: <CalendarIcon className="w-5 h-5" />, label: "Calendar", to: '/investor/calendar', key: 'calendar' },
  { icon: <WalletIcon className="w-5 h-5" />, label: "iFunds", to: '/borrowBank', key: 'wallet' },

  {
    icon: <img src="/investor-1.png" alt="Investment" className="w-5 h-5" />,
    label: "My Investments",
    to: '/investor/investments',
    key: 'my-investments'
  },
];

// Common navigation items for all accounts
const commonNavItems: NavItem[] = [
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

export const Sidebar: React.FC<SidebarProps> = () => {
  const authContext = useContext(AuthContext);
  const { currentAccountType, canCreateNewProject } = useAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get navigation items based on current account type
  const getNavItems = () => {
    let accountSpecificItems: NavItem[] = [];
    
    if (currentAccountType === 'borrower') {
      accountSpecificItems = [...borrowerNavItems];
      
      // Modify the "My Projects" item based on project creation ability
      const projectsItem = accountSpecificItems.find(item => item.key === 'my-projects');
      if (projectsItem && !canCreateNewProject) {
        projectsItem.subItems = ["My Projects"]; // Remove "Create New Project" if can't create
      }
    } else {
      accountSpecificItems = [...investorNavItems];
    }
    
    // Combine account-specific items with common items
    const baseItems = [...accountSpecificItems, ...commonNavItems];
    
    // Add admin-specific items if user is admin
    if (authContext?.profile?.isAdmin) {
      baseItems.push(
        {
          icon: <SettingsIcon className="w-5 h-5" />,
          label: "Admin Projects",
          to: '/admin/projects',
          key: 'admin-projects'
        },
        {
          icon: <WalletIcon className="w-5 h-5" />,
          label: "Top-up Requests",
          to: '/admin/topup-requests',
          key: 'admin-topup'
        },
        {
          icon: <TrendingUpIcon className="w-5 h-5" />,
          label: "Investment Requests",
          to: '/admin/investment-requests',
          key: 'admin-investments'
        }
      );
    }
    
    return baseItems;
  };

  // Check if current path matches nav item
  const isActiveNavItem = (navItem: NavItem): boolean => {
    if (!navItem.to) return false;
    
    // Exact match for specific paths
    if (location.pathname === navItem.to) return true;
    
    // Handle special cases for dynamic routes
    if (navItem.key === 'my-projects' && location.pathname.startsWith('/borw')) return true;
    if (navItem.key === 'discover' && location.pathname.startsWith('/investor')) return true;
    if (navItem.key === 'my-investments' && location.pathname.includes('invest')) return true;
    if (navItem.key === 'home' && currentAccountType === 'borrower' && location.pathname === '/borrow') return true;
    
    return false;
  };

  const currentNavItems = getNavItems();
  
  // Highlight based on current route using our improved logic
  const selectedIdx = currentNavItems.findIndex(isActiveNavItem);

  const handleLogout = () => {
    authContext?.logout();
    navigate('/');
  };

  const renderNav = (isMobile = false) => (
    <nav className={`flex flex-col ${isMobile ? "space-y-4 px-6 pt-20" : "space-y-4"}`}>
      {currentNavItems.map((item, idx) => {
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
                      // Add navigation for sub-items based on account type and permissions
                      if (currentAccountType === 'borrower') {
                        if (subItem === "My Projects") navigate("/borwMyProj");
                        if (subItem === "Create New Project" && canCreateNewProject) navigate("/borwNewProj");
                      } else if (currentAccountType === 'investor') {
                        if (subItem === "My Investments") navigate("/investor/investments");
                        if (subItem === "Investment History") navigate("/investor/history");
                      }
                      if (isMobile) setMobileOpen(false);
                    }}
                  >
                    <span className={`font-poppins font-medium text-black text-[14.8px] ${
                      subItem === "Create New Project" && !canCreateNewProject 
                        ? "opacity-50 cursor-not-allowed" 
                        : ""
                    }`}>
                      {subItem}
                      {subItem === "Create New Project" && !canCreateNewProject && (
                        <span className="text-xs text-gray-500 ml-2">(Complete current project first)</span>
                      )}
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
