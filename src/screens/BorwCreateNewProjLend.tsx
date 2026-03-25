import React, { useContext, useState, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  MenuIcon,
  UploadIcon,
  ChevronRightIcon,
  Info,
} from "lucide-react";
import { useProjectForm } from "../contexts/ProjectFormContext";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { format, addDays, differenceInDays } from "date-fns";
import { IssuerFormDigital, defaultIssuerFormData, validateIssuerForm } from "../components/IssuerFormDigital";
import type { IssuerFormData } from "../components/IssuerFormDigital";

export const BorrowerCreateNew: React.FC = (): JSX.Element => {
  const { token } = useContext(AuthContext)!;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { form, setForm } = useProjectForm();

  // Local state for form fields (or use controlled components directly)
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [projectRequirements, setProjectRequirements] = useState("");
  const [minimumTarget, setMinimumTarget] = useState("");
  const [investorPercentage, setInvestorPercentage] = useState("");
  const [timeDuration, setTimeDuration] = useState("");
  const [product, setProduct] = useState("");
  const [location, setLocation] = useState("");
  const [overview, setOverview] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [issuerFormData, setIssuerFormData] = useState<IssuerFormData>(
    form.issuerForm || { ...defaultIssuerFormData }
  );
  const [issuerFormErrors, setIssuerFormErrors] = useState<string[]>([]);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [showInterestInfo, setShowInterestInfo] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickerStage, setPickerStage] = useState<'start' | 'end'>('start');
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Handle upload click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = () => {
    // Validate issuer form
    const errors = validateIssuerForm(issuerFormData);
    if (errors.length > 0) {
      setIssuerFormErrors(errors);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIssuerFormErrors([]);

    setForm(f => ({
      ...f,
      selectedType: "lending",
      issuerForm: issuerFormData,
      projectDetails: {
        ...f.projectDetails,
        projectRequirements,
        minimumTarget: projectRequirements ? parseFloat(projectRequirements) : '',
        investorPercentage,
        timeDuration,
        campaignStartDate: selectedStartDate ? selectedStartDate.toISOString() : new Date().toISOString(),
        product,
        location,
        overview,
        videoLink,
      },
    }));
    navigate("/borwMilestones");
  };

  // When user selects a file:
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setForm((f) => ({
          ...f,
          projectDetails: {
            ...f.projectDetails,
            image: reader.result, // <-- This is critical!
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* Top navbar */}
      {/* <Navbar activePage="create-project" showAuthButtons={false} /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-[325px]">
          <Sidebar activePage="My Issuer/Borrower" />
        </div>

        {/* Mobile sidebar toggle */}
        <div className="md:hidden">
          <button
            className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white shadow"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <ChevronLeftIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
          <div
            className={`fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white shadow transform transition-transform duration-200 ease-in-out ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar activePage="My Issuer/Borrower" />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-[90%] mx-auto bg-white rounded-t-[30px] p-4 md:p-8 md:w-full md:mx-0 min-h-screen flex flex-col animate-fadeIn delay-300">
            {/* Header with back button */}
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </Button>
              <h1 className="ml-4 text-2xl md:text-3xl font-semibold font-poppins">
                Create New Project
              </h1>
            </div>

            {/* Form container with horizontal scroll on narrow */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              {/* Left column */}
              <div className="space-y-6">
                {/* Loan Amount Toggle */}
                {/* Total Funding Target */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Total Funding Target
                  </label>
                  <Input
                    placeholder="Enter total amount needed (e.g. 500000)"
                    type="number"
                    min={0}
                    className="w-full py-3 pl-3 rounded-2xl border"
                    value={projectRequirements}
                    onChange={(e) => setProjectRequirements(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-400">Total amount you wish to raise in this campaign.</p>
                  {projectRequirements && parseFloat(projectRequirements) > 0 && (
                    <p className="mt-1 text-xs text-green-600">
                      ✓ Milestone amounts must not exceed ₱{parseFloat(projectRequirements).toLocaleString()}.
                    </p>
                  )}
                </div>

                {/* Monthly Interest Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-black text-base">
                      Desired Interest Rate
                      <span className="ml-1.5 text-xs font-normal text-gray-400">/ month</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInterestInfo(v => !v)}
                      className="flex items-center gap-1 text-xs text-[#0C4B20] hover:underline"
                    >
                      <Info className="w-3.5 h-3.5" />
                      {showInterestInfo ? 'Hide info' : 'How does this work?'}
                    </button>
                  </div>
                  {showInterestInfo && (
                    <div className="mb-3 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-gray-700 leading-relaxed">
                      <p className="font-semibold text-[#0C4B20] mb-1">Borrower vs. Investor view</p>
                      <p>As a borrower, you set the monthly interest rate you're comfortable paying each month. For investors,  the platform automatically converts this into an
                      <span className="font-semibold">Annual Percentage Rate (APR)</span>, so they can easily understand the potential return on their investment. </p>
                      <p className="mt-1 text-gray-500">For Example, 1.5% per month = <strong>18% per year (APR) as shown to investors. </strong>
                      Higher monthly interest rates may attract more investors and increase the chances of funding, but they will also increase your total repayment obligation over time. Choose a rate that balances investor attractiveness and sustainable repayment.”</p>
                    </div>
                  )}
                  <Input
                    placeholder="e.g. 1% - 5%"
                    type="number"
                    min={1}
                    max={5}
                    step={0.1}
                    className="w-full py-3 px-3 rounded-2xl border"
                    value={investorPercentage}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (e.target.value === '' || e.target.value === '-') {
                        setInvestorPercentage('');
                      } else if (val > 5) {
                        setInvestorPercentage('5');
                      } else {
                        setInvestorPercentage(e.target.value);
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val < 1) setInvestorPercentage('1');
                    }}
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Allowed range: <span className="font-semibold text-[#0C4B20]">1%–5%</span> per month. Maximum allowed: <span className="font-semibold">5%</span>.
                  </p>

                  {/* Dual Rate Display */}
                  {investorPercentage && parseFloat(investorPercentage) >= 1 && (
                    <div className="mt-3 rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="grid grid-cols-2 divide-x divide-gray-200">
                        <div className="px-4 py-3 bg-[#0C4B20]/5 text-center">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5 font-medium">You pay (monthly)</p>
                          <p className="text-2xl font-bold text-[#0C4B20] leading-none">{parseFloat(investorPercentage).toFixed(1)}%</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">per month</p>
                        </div>
                        <div className="px-4 py-3 bg-blue-50 text-center">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5 font-medium">Investors see (annual)</p>
                          <p className="text-2xl font-bold text-blue-700 leading-none">{(parseFloat(investorPercentage) * 12).toFixed(1)}%</p>
                          <p className="text-[10px] text-blue-400 mt-0.5">per annum (APR)</p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400">
                          At <span className="font-semibold text-gray-600">{parseFloat(investorPercentage).toFixed(1)}%/mo</span>, investors earn <span className="font-semibold text-blue-600">{(parseFloat(investorPercentage) * 12).toFixed(1)}% APR</span> — more attractive than most savings products.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Interest Demand Indicator */}
                  {investorPercentage && parseFloat(investorPercentage) >= 1 && (() => {
                    const r = Math.min(5, Math.max(1, parseFloat(investorPercentage)));
                    const demandAt = (rate: number) => Math.max(5, Math.round(10 + (Math.max(1, Math.min(5, rate)) - 1) * 16));
                    const maxDemand = demandAt(5);
                    const lower = parseFloat(Math.max(1, r - 0.3).toFixed(1));
                    const higher = parseFloat(Math.min(5, r + 0.3).toFixed(1));
                    const rows = [
                      { rate: lower, count: demandAt(lower), label: 'Lower rate', color: 'bg-amber-400', textColor: 'text-amber-700', bg: 'bg-amber-50' },
                      { rate: parseFloat(r.toFixed(1)), count: demandAt(r), label: 'Your rate', color: 'bg-[#0C4B20]', textColor: 'text-[#0C4B20]', bg: 'bg-green-50', highlight: true },
                      { rate: higher, count: demandAt(higher), label: 'Higher rate', color: 'bg-blue-400', textColor: 'text-blue-700', bg: 'bg-blue-50' },
                    ].filter((row, i, arr) => i === 0 || row.rate !== arr[i-1].rate);
                    return (
                      <div className="mt-3 rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700">Investor Demand Indicator</span>
                          <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Live estimate</span>
                        </div>
                        <div className="px-4 py-2 space-y-2">
                          {rows.map((row) => (
                            <div key={row.rate} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${row.bg} ${row.highlight ? 'ring-1 ring-[#0C4B20]/30' : ''}`}>
                              <div className="w-16 shrink-0">
                                <span className={`text-sm font-bold ${row.textColor}`}>{row.rate.toFixed(1)}%</span>
                                <span className="text-[10px] text-gray-400 block leading-none">/mo</span>
                              </div>
                              <div className="flex-1 bg-white/60 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${row.color}`}
                                  style={{ width: `${Math.round((row.count / maxDemand) * 100)}%` }}
                                />
                              </div>
                              <div className="w-24 text-right shrink-0">
                                <span className={`text-xs font-semibold ${row.textColor}`}>{row.count} investors</span>
                                {row.highlight && <span className="block text-[10px] text-[#0C4B20]/70 font-medium">← your rate</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-4 pb-3 pt-1">
                          {parseFloat(investorPercentage) < 5 && (
                            <p className="text-[10px] text-gray-400">
                              💡 Offering <span className="font-semibold">{Math.min(5, parseFloat(investorPercentage) + 0.3).toFixed(1)}%/mo</span> could attract <span className="font-semibold text-blue-600">{demandAt(Math.min(5, r + 0.3)) - demandAt(r)} more investors</span> to your campaign.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Select Time Duration */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">Campaign Duration</label>

                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full py-3 px-4 rounded-2xl border border-gray-200 flex justify-between items-center bg-white hover:bg-gray-50 focus:ring-2 focus:ring-[#0C4B20] text-left font-normal"
                        onClick={() => { setCalendarOpen(true); setPickerStage(selectedStartDate && !selectedDate ? 'end' : 'start'); }}
                      >
                        <span className={selectedStartDate ? 'text-gray-900' : 'text-gray-400'}>
                          {selectedStartDate && selectedDate
                            ? `${format(selectedStartDate, 'MMM d')} → ${format(selectedDate, 'MMM d, yyyy')}  ·  ${differenceInDays(selectedDate, selectedStartDate)} days`
                            : selectedStartDate
                            ? `Starts ${format(selectedStartDate, 'MMM d, yyyy')} → pick end date`
                            : 'Select campaign start & end date'}
                        </span>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white shadow-xl rounded-2xl border-0" align="start">
                      <div className="p-5 w-[340px]">
                        {/* Step indicators */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${pickerStage === 'start' ? 'bg-[#0C4B20] text-white' : 'bg-green-100 text-[#0C4B20]'}`}>
                            <span>{pickerStage !== 'start' || selectedStartDate ? '✓' : '1'}</span>
                            Start{selectedStartDate && <span className="opacity-80"> · {format(selectedStartDate, 'MMM d')}</span>}
                          </div>
                          <div className="flex-1 h-px bg-gray-200" />
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${pickerStage === 'end' ? 'bg-[#0C4B20] text-white' : selectedDate ? 'bg-green-100 text-[#0C4B20]' : 'bg-gray-100 text-gray-400'}`}>
                            <span>{selectedDate ? '✓' : '2'}</span>
                            End{selectedDate && <span className="opacity-80"> · {format(selectedDate, 'MMM d')}</span>}
                          </div>
                          {(selectedStartDate || selectedDate) && (
                            <button className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1"
                              onClick={() => { setSelectedStartDate(null); setSelectedDate(null); setTimeDuration(''); setPickerStage('start'); }}>
                              Reset
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                          {pickerStage === 'start' ? '↓ Click a date to set campaign start' : '↓ Click a date to set campaign end (max 90 days)'}
                        </p>

                        {/* Month navigation */}
                        <div className="flex justify-between items-center mb-3">
                          <button className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                            onClick={() => setCurrentDate(p => new Date(p.getFullYear(), p.getMonth() - 1, 1))}>
                            <ChevronLeftIcon className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-semibold">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                          <button className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                            onClick={() => setCurrentDate(p => new Date(p.getFullYear(), p.getMonth() + 1, 1))}>
                            <ChevronRightIcon className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 mb-1">
                          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                            <div key={d} className="h-8 flex items-center justify-center text-xs text-gray-400 font-medium">{d}</div>
                          ))}
                        </div>

                        {/* Calendar days */}
                        <div className="grid grid-cols-7">
                          {(() => {
                            const today = new Date(); today.setHours(0,0,0,0);
                            const year = currentDate.getFullYear();
                            const month = currentDate.getMonth();
                            const firstDay = new Date(year, month, 1);
                            const gridStart = new Date(firstDay);
                            gridStart.setDate(gridStart.getDate() - firstDay.getDay());
                            const startNorm = selectedStartDate ? new Date(selectedStartDate.getFullYear(), selectedStartDate.getMonth(), selectedStartDate.getDate()) : null;
                            const endNorm = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) : null;
                            const maxEnd = startNorm ? addDays(startNorm, 90) : addDays(today, 90);

                            return Array.from({ length: 35 }, (_, i) => {
                              const day = new Date(gridStart);
                              day.setDate(gridStart.getDate() + i);
                              const dn = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                              const isDisabled = pickerStage === 'start' ? dn < today : (startNorm ? dn <= startNorm || dn > maxEnd : dn < today);
                              const isCurrentMonth = day.getMonth() === month;
                              const isToday = dn.getTime() === today.getTime();
                              const isStart = startNorm && dn.getTime() === startNorm.getTime();
                              const isEnd = endNorm && dn.getTime() === endNorm.getTime();
                              const hoverNorm = hoveredDate ? new Date(hoveredDate.getFullYear(), hoveredDate.getMonth(), hoveredDate.getDate()) : null;
                              const isInRange = startNorm && (endNorm || hoverNorm) && dn > startNorm && dn < (endNorm || hoverNorm!);
                              const isHoverEnd = !endNorm && hoverNorm && dn.getTime() === hoverNorm.getTime() && startNorm && dn > startNorm;

                              return (
                                <div key={i}
                                  className={`relative h-9 flex items-center justify-center
                                    ${isInRange ? 'bg-green-100' : ''}
                                    ${(isStart && (endNorm || hoverNorm)) ? 'rounded-l-full bg-green-100' : ''}
                                    ${(isEnd || isHoverEnd) ? 'rounded-r-full bg-green-100' : ''}
                                    ${isStart && !endNorm && !hoverNorm ? 'rounded-full' : ''}
                                  `}
                                  onMouseEnter={() => { if (!isDisabled && pickerStage === 'end' && startNorm) setHoveredDate(day); }}
                                  onMouseLeave={() => setHoveredDate(null)}
                                  onClick={() => {
                                    if (isDisabled) return;
                                    if (pickerStage === 'start') {
                                      setSelectedStartDate(day); setSelectedDate(null); setTimeDuration('');
                                      setPickerStage('end'); setCurrentDate(new Date(day.getFullYear(), day.getMonth(), 1));
                                    } else {
                                      setSelectedDate(day); setTimeDuration(day.toISOString()); setHoveredDate(null);
                                    }
                                  }}
                                >
                                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium z-10
                                    ${isStart || isEnd || isHoverEnd ? 'bg-[#0C4B20] text-white shadow-sm' : ''}
                                    ${!isStart && !isEnd && !isHoverEnd && isToday ? 'ring-2 ring-[#0C4B20] text-[#0C4B20]' : ''}
                                    ${!isStart && !isEnd && !isHoverEnd && !isToday && isDisabled ? 'text-gray-300' : ''}
                                    ${!isStart && !isEnd && !isHoverEnd && !isToday && !isDisabled && isCurrentMonth ? 'text-gray-700 hover:bg-green-200 cursor-pointer' : ''}
                                    ${!isCurrentMonth && !isDisabled ? 'text-gray-400' : ''}
                                  `}>
                                    {day.getDate()}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {/* Confirm — shown after both dates picked */}
                        {selectedStartDate && selectedDate && (
                          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                            <div className="bg-green-50 rounded-xl px-4 py-2.5 text-center">
                              <p className="text-sm font-semibold text-[#0C4B20]">
                                {format(selectedStartDate, 'MMM d')} → {format(selectedDate, 'MMM d, yyyy')} · {differenceInDays(selectedDate, selectedStartDate)} days
                              </p>
                            </div>
                            <button className="w-full py-2.5 bg-[#0C4B20] text-white rounded-xl text-sm font-semibold hover:bg-[#0C4B20]/90 transition-colors"
                              onClick={() => setCalendarOpen(false)}>
                              Confirm Dates
                            </button>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Product */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Product
                  </label>
                  <Input
                    placeholder="Enter here"
                    className="w-full py-3 px-3 rounded-2xl border"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                  />
                </div>

                {/* Issuer Form 3 — Digital Form */}
                <div>
                  <IssuerFormDigital
                    data={issuerFormData}
                    onChange={setIssuerFormData}
                    errors={issuerFormErrors}
                  />
                </div>

                {/* Project Overview */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Project Overview
                  </label>
                  <Textarea
                    placeholder="Enter details"
                    className="w-full py-3 px-3 rounded-2xl border resize-none h-36"
                    value={overview}
                    onChange={(e) => setOverview(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full bg-[#0C4B20] hover:bg-[#8FB200] text-white py-3 rounded-lg font-medium"
                  onClick={onSubmit}
                >
                  Continue
                </Button>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {/* Upload Picture */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Upload Picture*
                  </label>
                  <div 
                    className={`w-full border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${
                      imagePreview ? 'min-h-40 p-4' : 'h-40'
                    }`}
                    onClick={handleUploadClick}
                  >
                    {imagePreview ? (
                      <div className="w-full">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-auto rounded-lg object-contain max-h-96"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <UploadIcon className="w-8 h-8 mb-2 text-gray-400" />
                        <span className="font-medium text-black text-base">
                          + Upload
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Video Attestation */}
                <div>
                  <label className="font-medium text-black text-base block mb-2">
                    Video Attestation
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Video Link"
                      className="w-full py-3 px-3 rounded-2xl border"
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                    />
                    <ChevronRightIcon className="absolute right-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BorrowerCreateNew;
