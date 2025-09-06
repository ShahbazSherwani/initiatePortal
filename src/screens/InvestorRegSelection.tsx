import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { Button } from "../components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

export const InvestorRegSelection = (): JSX.Element => {
  const location = useLocation();
  const initialAccountType = location.state?.accountType || "individual";
  const [accountType, setAccountType] = useState("individual"); // Default to individual

  const { setRegistration } = useRegistration();
  const navigate = useNavigate();

  const handleAccountTypeSelect = (type: string) => {
    console.log("Account type selected:", type);
    setAccountType(type);
    setRegistration(reg => ({ ...reg, accountType: type }));
    
    // Navigate based on selection
    if (type === "individual") {
      navigate("/investor-reg-individual", { state: { accountType: type } });
    } else if (type === "non-individual") {
      navigate("/investor-reg-non-individual", { state: { accountType: type } });
    } else if (type === "direct-lender") {
      navigate("/investor-reg-direct-lender", { state: { accountType: type } });
    }
  };

  return (
    <div className="bg-white min-h-screen w-full relative overflow-hidden z-10">
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] px-4 md:px-20 py-10">
        {/* ─── CONTENT ─── */}
        <div className="md:w-2/4 overflow-y-auto pr-4 space-y-8">
          {/* Back Button */}
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </Button>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#ffc00f] rounded-lg flex items-center justify-center">
              <img className="w-10 h-10" src="/investor-1.png" alt="Investor" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Invest/Lender</h2>
          </div>

          {/* Option Selection */}
          <div>
            <p className="font-medium text-lg mb-2">Please select an option</p>
            <div className="flex flex-col sm:flex-row gap-4">
              {[
                { value: "individual", label: "Individual" },
                { value: "non-individual", label: "Non-Individual (Entity)" }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all
                    ${accountType === option.value
                      ? "bg-[#ffc00f] border-[#ffc00f] text-black font-semibold"
                      : "bg-white border-gray-300 hover:border-[#ffc00f]"}
                  `}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Button clicked:", option.value);
                    handleAccountTypeSelect(option.value);
                  }}
                >
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    accountType === option.value 
                      ? 'bg-black border-black' 
                      : 'border-gray-300'
                  }`}>
                    {accountType === option.value && (
                      <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
                    )}
                  </div>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Lender Separate Section */}
          <div className="border-t pt-6">
            <p className="font-medium text-lg mb-2">Or select Direct Lender</p>
            <button
              type="button"
              className={`
                flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-all w-full sm:w-auto
                ${accountType === "direct-lender"
                  ? "bg-[#ffc00f] border-[#ffc00f] text-black font-semibold"
                  : "bg-white border-gray-300 hover:border-[#ffc00f]"}
              `}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Button clicked: direct-lender");
                handleAccountTypeSelect("direct-lender");
              }}
            >
              <div className={`w-4 h-4 rounded-full border-2 ${
                accountType === "direct-lender" 
                  ? 'bg-black border-black' 
                  : 'border-gray-300'
              }`}>
                {accountType === "direct-lender" && (
                  <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5"></div>
                )}
              </div>
              <span>Direct Lender</span>
            </button>
          </div>
        </div>

        {/* ─── TESTIMONIALS ─── */}
        <div className="md:w-2/4 md:pl-8 mt-8 md:mt-0">
          <Testimonials />
        </div>
      </div>
    </div>
  );
};
