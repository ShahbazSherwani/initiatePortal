import React, { useContext, useState, useRef } from "react";
import { Navigate, useNavigate, } from "react-router-dom";
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
import { Clock } from "lucide-react";
import { IssuerFormDigital, defaultIssuerFormData, validateIssuerForm } from "../components/IssuerFormDigital";
import type { IssuerFormData } from "../components/IssuerFormDigital";

export const BorrowerCreateNewEq: React.FC = (): JSX.Element => {
  const { token } = useContext(AuthContext)!;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { form, setForm } = useProjectForm();

  // Local state for form fields
  const [projectRequirements, setProjectRequirements] = useState("");
  const [minimumTarget, setMinimumTarget] = useState("");
  const [investorPercentage, setInvestorPercentage] = useState("");
  const [dividendFrequency, setDividendFrequency] = useState("");
  const [dividendOther, setDividendOther] = useState("");
  const [product, setProduct] = useState("");
  const [timeDuration, setTimeDuration] = useState("");
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickerStage, setPickerStage] = useState<'start' | 'end'>('start');
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [showEquityInfo, setShowEquityInfo] = useState(false);

  const onSubmit = () => {
    // Validate issuer form
    const errors = validateIssuerForm(issuerFormData);
    if (errors.length > 0) {
      setIssuerFormErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIssuerFormErrors([]);

    setForm(f => ({
      ...f,
      selectedType: "equity",
      issuerForm: issuerFormData,
      projectDetails: {
        ...f.projectDetails,
        projectRequirements,
        minimumTarget: projectRequirements ? parseFloat(projectRequirements) : '',
        investorPercentage,
        dividendFrequency,
        dividendOther,
        product,
        timeDuration,
        campaignStartDate: selectedStartDate ? selectedStartDate.toISOString() : new Date().toISOString(),
        location,
        overview,
        videoLink,
      },
    }));
    navigate("/borwMilestones");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // When user selects a file:
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setForm(f => ({
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

const [showAmountTooltip, setShowAmountTooltip] = useState(false);
const [showPercentageTooltip, setShowPercentageTooltip] = useState(false);

const amountPattern = /^\d*(\.\d{0,2})?$/;
const percentagePattern = /^(100(\.0{0,2})?|(\d{1,2})(\.\d{0,2})?)$/;

const handleProjectRequirements = (event: React.ChangeEvent<HTMLInputElement>) => {
  const rawValue = event.target.value;
  const cleanedValue = rawValue.replace(/[^\d.]/g, "");
  const isValid = cleanedValue === rawValue && amountPattern.test(cleanedValue);

  setProjectRequirements(cleanedValue);
  setShowAmountTooltip(!isValid && rawValue !== "");
};

const handleInvestorPercentage = (event: React.ChangeEvent<HTMLInputElement>) => {
  const rawValue = event.target.value;
  const cleanedValue = rawValue.replace(/[^\d.]/g, "");
  const isValid =
    cleanedValue === rawValue &&
    cleanedValue !== "" &&
    percentagePattern.test(cleanedValue);

  setInvestorPercentage(cleanedValue);
  setShowPercentageTooltip(!isValid);
};

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
              <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
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
                  {/* Please Select */}
                    {/* Project Requirements */}
                  <div>
                    <label className="font-medium text-black text-base block mb-2">
                      Maximum Funding Target
                    </label>
                        <div className="relative">
                          <Input
                            placeholder="Enter total amount needed (e.g. 500000)"
                            type="text"
                            inputMode="decimal"
                            className="w-full py-3 pl-3 rounded-2xl border"
                            value={projectRequirements}
                            onChange={handleProjectRequirements}
                            onBlur={() => setShowAmountTooltip(false)}
                            aria-invalid={showAmountTooltip}
                          />
                          {showAmountTooltip && (
                            <div className="pointer-events-none absolute left-3 top-full z-20 mt-1 rounded bg-red-600 px-2 py-1 text-xs text-white shadow">
                              Please enter a number
                            </div>
                          )}
                        </div>
                    <p className="mt-1 text-xs text-gray-400">Maximum amount you wish to raise in this campaign.</p>
                  </div>

                  {/* Minimum Funding Target */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-black text-base">Minimum Funding Target</label>
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 font-medium"></span>
                    </div>
                    <Input
                      placeholder="Enter minimum amount to proceed (e.g. 100000)"
                      type="number"
                      min={0}
                      className="w-full py-3 pl-3 rounded-2xl border"
                      value={minimumTarget}
                      onChange={(e) => setMinimumTarget(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      If total pledges don’t reach this amount by campaign end, all investors are automatically refunded. Must be ≤ maximum target.
                    </p>
                    {minimumTarget && projectRequirements && parseFloat(minimumTarget) > parseFloat(projectRequirements) && (
                      <p className="mt-1 text-xs text-red-500 font-medium">⚠ Minimum target cannot exceed maximum target.</p>
                    )}
                    {minimumTarget && projectRequirements && parseFloat(minimumTarget) <= parseFloat(projectRequirements) && (
                      <p className="mt-1 text-xs text-green-600">
                        ✓ Campaign proceeds if ₱{parseFloat(minimumTarget).toLocaleString()} or more is raised.
                      </p>
                    )}
                  </div>

                  {/* Investor Percentage */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-black text-base">Investor Percentage (%)</label>
                      <button type="button" onClick={() => setShowEquityInfo(v => !v)}
                        className="flex items-center gap-1 text-xs text-[#0C4B20] hover:underline">
                        <Info className="w-3.5 h-3.5" />
                        {showEquityInfo ? 'Hide info' : 'What is this?'}
                      </button>
                    </div>
                    {showEquityInfo && (
                      <div className="mb-3 bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-gray-700 leading-relaxed">
                        <p className="font-semibold text-[#0C4B20] mb-1">How equity percentage works</p>
                        <p>This is the share of profits or dividends investors collectively receive. A higher percentage attracts more investment but reduces your retained earnings. Balance generosity with long-term project sustainability.</p>
                        <p className="mt-1 text-gray-500">Example: 5% equity share means investors collectively receive 5% of all declared dividends.</p>
                      </div>
                    )}
                    <Input
                      placeholder="Enter investor equity share (e.g., 5%)"
                      className="w-full py-3 px-3 rounded-2xl border"
                      value={investorPercentage}
                      onChange={e => setInvestorPercentage(e.target.value)}
                    />
                    <p className="mt-1.5 text-xs text-gray-500">Typical equity campaigns offer <span className="font-semibold text-[#0C4B20]">1%–5%</span> to investors depending on funding needs.</p>
                  </div>

                  {/* Dividend Frequency */}
                  <div>
                    <label className="font-medium text-black text-base block mb-2">
                      Dividend Frequency
                    </label>
                    <Select
                      value={dividendFrequency}
                      onValueChange={setDividendFrequency}
                    >
                      <SelectTrigger className="w-full py-3 px-3 rounded-2xl border">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* If Others, specify */}
                  {dividendFrequency === "other" && (
                    <div>
                      <label className="font-medium text-black text-base block mb-2">
                        If Others, specify
                      </label>
                      <Input
                        placeholder="Enter here"
                        className="w-full py-3 px-3 rounded-2xl border"
                        value={dividendOther}
                        onChange={e => setDividendOther(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Product */}
                  <div>
                    <label className="font-medium text-black text-base block mb-2">
                      Product
                    </label>
                    <Input
                      placeholder="Enter here"
                      className="w-full py-3 px-3 rounded-2xl border"
                      value={product}
                      onChange={e => setProduct(e.target.value)}
                    />
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

                          {/* Time + confirm — shown after end date picked */}
                          {selectedStartDate && selectedDate && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                              <div className="flex items-center gap-3">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">End Time</span>
                                <select
                                  className="ml-auto h-9 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:ring-2 focus:ring-[#0C4B20] focus:outline-none"
                                  defaultValue="09:00"
                                  onChange={(e) => {
                                    const date = new Date(timeDuration || selectedDate.toISOString());
                                    const [h, m] = e.target.value.split(':');
                                    date.setHours(parseInt(h), parseInt(m));
                                    setTimeDuration(date.toISOString());
                                  }}>
                                  <option value="09:00">9:00 AM</option>
                                  <option value="12:00">12:00 PM</option>
                                  <option value="15:00">3:00 PM</option>
                                  <option value="18:00">6:00 PM</option>
                                  <option value="21:00">9:00 PM</option>
                                </select>
                              </div>
                              <div className="bg-green-50 rounded-xl px-4 py-2.5 text-center">
                                <p className="text-sm font-semibold text-[#0C4B20]">
                                  {format(selectedStartDate, 'MMM d')} → {format(selectedDate, 'MMM d, yyyy')} · {differenceInDays(selectedDate, selectedStartDate)} days
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">Per SEC policy, max 90 days. Extensions subject to approval.</p>
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

                  {/* Project Overview */}
                  <div>
                    <label className="font-medium text-black text-base block mb-2">
                      Project Overview
                    </label>
                    <Textarea
                      placeholder="Enter details"
                      className="w-full py-3 px-3 rounded-2xl border resize-none h-36"
                      value={overview}
                      onChange={e => setOverview(e.target.value)}
                    />
                  </div>
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
                        onChange={e => setVideoLink(e.target.value)}
                      />
                      <ChevronRightIcon className="absolute right-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Issuer Form 3 — Full Width */}
            <div className="mt-8">
              <IssuerFormDigital
                data={issuerFormData}
                onChange={setIssuerFormData}
                errors={issuerFormErrors}
              />
            </div>

            <Button
              className="w-full mt-8 bg-[#0C4B20] text-white py-3 rounded-lg font-medium"
              onClick={onSubmit}
            >
              Continue
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BorrowerCreateNewEq;
