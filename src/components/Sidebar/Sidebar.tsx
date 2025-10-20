import React, { useState, ReactNode, useContext, Fragment } from "react";
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
  MessageCircle,
  PanelsTopLeft,
  HandCoins,
  Database,
  XIcon
} from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { AuthContext } from '../../contexts/AuthContext';
import { useAccount } from '../../contexts/AccountContext';
import { AccountSwitcher } from '../Navigation/AccountSwitcher';

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
    icon: <PanelsTopLeft className="w-5 h-5" />,
    label: "My Projects",
    to: '/borwMyProj',
    subItems: ["My Projects", "Create New Project"],
    key: 'my-projects',
  },
  {
    icon:<MessageCircle className="w-5 h-5" />,
    label: "Raise Tickets",
    to: '/borrow/request',
    key: 'initiate-request'
  },
];

// Investor navigation items
const investorNavItems: NavItem[] = [
  { icon: <HomeIcon className="w-5 h-5" />, label: "Home", to: '/borrowerHome', key: 'home' },
  { icon: <CalendarIcon className="w-5 h-5" />, label: "Calendar", to: '/investor/calendar', key: 'calendar' },
  {
    icon: <PanelsTopLeft className="w-5 h-5" />,
    label: "Projects",
    to: '/investor/discover',
    key: 'projects'
  },
  { icon: <WalletIcon className="w-5 h-5" />, label: "iFunds", to: '/borrowBank', key: 'wallet' },
  {
    icon:<HandCoins className="w-5 h-5" />,
    label: "My Investments",
    to: '/investor/investments',
    key: 'my-investments'
  },
  {
    icon:<MessageCircle className="w-5 h-5" />,
    label: "Raise Tickets",
    to: '/borrow/request',
    key: 'initiate-request'
  },
];

// Common navigation items for borrowers
const borrowerCommonNavItems: NavItem[] = [
  {
    icon: <Database className="w-5 h-5" />,
    label: "Donation",
    to: '/donation',
    key: 'donation'
  },
  { icon: <SettingsIcon className="w-5 h-5" />, label: "Settings", to: '/settings', key: 'settings' },
  { icon: <HelpCircleIcon className="w-5 h-5" />, label: "FAQs", to: '/help', key: 'help' },
];

// Common navigation items for investors (no donation)
const investorCommonNavItems: NavItem[] = [
  { icon: <SettingsIcon className="w-5 h-5" />, label: "Settings", to: '/settings', key: 'settings' },
  { icon: <HelpCircleIcon className="w-5 h-5" />, label: "FAQs", to: '/help', key: 'help' },
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
  const [showProjectTypeModal, setShowProjectTypeModal] = useState(false);
  const [selectedType, setSelectedType] = useState<"equity" | "lending" | "donation" | "rewards" | null>(null);

  // Get navigation items based on current account type
  const getNavItems = () => {
    let accountSpecificItems: NavItem[] = [];
    let commonItems: NavItem[] = [];
    
    if (currentAccountType === 'borrower') {
      accountSpecificItems = [...borrowerNavItems];
      commonItems = [...borrowerCommonNavItems];
      
      // Modify the "My Projects" item based on project creation ability
      const projectsItem = accountSpecificItems.find(item => item.key === 'my-projects');
      if (projectsItem && !canCreateNewProject) {
        projectsItem.subItems = ["My Projects"]; // Remove "Create New Project" if can't create
      }
    } else {
      accountSpecificItems = [...investorNavItems];
      commonItems = [...investorCommonNavItems];
    }
    
    // Combine account-specific items with common items
    const baseItems = [...accountSpecificItems, ...commonItems];
    
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
    if (navItem.key === 'home' && currentAccountType === 'investor' && location.pathname === '/borrowerHome') return true;
    if (navItem.key === 'calendar' && currentAccountType === 'investor' && location.pathname === '/investor/calendar') return true;
    if (navItem.key === 'wallet' && currentAccountType === 'investor' && location.pathname === '/borrowBank') return true;
    if (navItem.key === 'my-investments' && location.pathname === '/investor/investments') return true;
    if (navItem.key === 'raise-tickets' && location.pathname === '/request') return true;
    if (navItem.key === 'home' && currentAccountType === 'borrower' && location.pathname === '/borrow') return true;
    if (navItem.key === 'calendar' && currentAccountType === 'borrower' && location.pathname === '/borrowCalendar') return true;
    if (navItem.key === 'wallet' && currentAccountType === 'borrower' && location.pathname === '/borrowBank') return true;
    
    return false;
  };

  const currentNavItems = getNavItems();
  
  // Highlight based on current route using our improved logic
  const selectedIdx = currentNavItems.findIndex(isActiveNavItem);

  const handleLogout = () => {
    authContext?.logout();
    navigate('/');
  };

  const handleProjectTypeSelection = () => {
    setShowProjectTypeModal(false);
    if (selectedType === "equity") {
      navigate("/borwNewProjEq");
    } else if (selectedType === "lending") {
      navigate("/borwNewProj");
    } else if (selectedType === "donation") {
      navigate("/borwNewProjDonation");
    } else if (selectedType === "rewards") {
      navigate("/borwNewProjRewards");
    }
    setSelectedType(null); // Reset after navigation
  };

  const renderNav = (isMobile = false) => (
    <nav className={`flex flex-col  ${isMobile ? "space-y-4 px-6 pt-20" : "space-y-4"}`}>
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
                ? "bg-[#0C4B20] hover:bg-[#8FB200] rounded-[12.49px] h-[49px] text-white" // ✅ Green background + white text
                : "bg-transparent opacity-100 p-2 text-[#0C4B20]")     // ✅ Non-selected gets #8FB200
            }
          >
            {item.icon}
            <span
              className={`font-poppins font-medium text-[17.8px] ${
                isSelected ? "text-white" : "text-[#0C4B20]"}`
              }
            >
              {item.label}
            </span>
            {item.subItems && <ChevronDownIcon className="w-4 h-4 ml-auto" />}
          </Button>


            {item.subItems && isSelected && (
              <div className={`ml-8 mt-2 space-y-1 ${isMobile ? "ml-6" : ""}`}>
                {item.subItems.map((subItem, subIdx) => (
                  <Button
                    key={subIdx}
                    variant="ghost"
                    className={`w-full justify-start pl-4 py-2 h-auto rounded-lg transition-all duration-200 ${
                      subItem === "Create New Project" && !canCreateNewProject
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                        : "bg-[#8FB200]/20 text-[#0C4B20] hover:bg-[#8FB200]/40"
                    }`}
                    onClick={() => {
                      // Add navigation for sub-items based on account type and permissions
                      if (currentAccountType === 'borrower') {
                        if (subItem === "My Projects") {
                          navigate("/borwMyProj");
                          if (isMobile) setMobileOpen(false);
                        }
                        if (subItem === "Create New Project" && canCreateNewProject) {
                          setShowProjectTypeModal(true);
                        }
                      } else if (currentAccountType === 'investor') {
                        if (subItem === "My Investments") {
                          navigate("/investor/investments");
                          if (isMobile) setMobileOpen(false);
                        }
                        if (subItem === "Investment History") {
                          navigate("/investor/history");
                          if (isMobile) setMobileOpen(false);
                        }
                      }
                    }}
                    disabled={subItem === "Create New Project" && !canCreateNewProject}
                  >
                    <span className="font-poppins font-medium text-[14px]">
                      {subItem}
                    </span>
                    {subItem === "Create New Project" && !canCreateNewProject && (
                      <span className="text-xs text-gray-400 ml-2">(Complete project first)</span>
                    )}
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
      {/* Mobile Menu Tab - Fixed on Left Side */}
      <div className="md:hidden fixed left-0 top-25 z-50">
        <Button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="bg-[#0C4B20] hover:bg-[#8FB200] text-white font-poppins px-2 py-10 rounded-r-xl shadow-lg flex flex-col items-center gap-1 transition-all duration-200 border-r-4 border-[#8FB200]"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          {mobileOpen ? (
            <>
              <ChevronLeftIcon className="w-5 h-5 rotate-0" style={{ writingMode: 'horizontal-tb' }} />
              <span className="font-bold text-sm tracking-wider">CLOSE</span>
            </>
          ) : (
            <>
              <ChevronRightIcon className="w-5 h-5 rotate-0" style={{ writingMode: 'horizontal-tb' }} />
              <span className="font-bold text-sm tracking-wider">MENU</span>
            </>
          )}
        </Button>
      </div>

      {/* Mobile Slide-out Menu */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-[75%] max-w-xs bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-40 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Account Switcher at top of mobile menu */}
        <div className="p-4 border-b border-gray-200">
          <AccountSwitcher />
        </div>
        {renderNav(true)}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[325px] pl-20 pr-4 py-4">
        {renderNav()}
      </aside>

      {/* Project Type Selection Modal */}
      <Transition appear show={showProjectTypeModal} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={() => {
            setShowProjectTypeModal(false);
            setSelectedType(null);
          }}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
            </Transition.Child>

            <span className="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-bold text-[#0C4B20]">
                    Select Project Type
                  </Dialog.Title>
                  <button
                    onClick={() => {
                      setShowProjectTypeModal(false);
                      setSelectedType(null);
                    }}
                  >
                    <XIcon className="w-6 h-6 text-gray-500 hover:text-black" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setSelectedType("equity")}
                    className={`py-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedType === "equity"
                        ? "bg-[#0C4B20] text-white border-[#0C4B20]"
                        : "bg-white text-[#0C4B20] border-gray-300 hover:border-[#0C4B20]"
                    }`}
                  >
                    <span className="font-semibold">Equity</span>
                  </button>
                  <button
                    onClick={() => setSelectedType("lending")}
                    className={`py-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedType === "lending"
                        ? "bg-[#0C4B20] text-white border-[#0C4B20]"
                        : "bg-white text-[#0C4B20] border-gray-300 hover:border-[#0C4B20]"
                    }`}
                  >
                    <span className="font-semibold">Lending</span>
                  </button>
                  {/* Donation and Rewards options hidden */}
                </div>

                <Button
                  className="w-full bg-[#0C4B20] text-white py-3 rounded-lg hover:bg-[#8FB200] transition-colors duration-200"
                  onClick={handleProjectTypeSelection}
                  disabled={!selectedType}
                >
                  Continue
                </Button>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
