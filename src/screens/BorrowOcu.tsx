// BorrowerOccupation.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authFetch } from "../lib/api";
import { generateBorrowerCode } from "../lib/profileUtils";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "react-hot-toast";

export const BorrowerOccupation: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State variables
  const [selectedGroup, setSelectedGroup] = useState<string>("agriculture");
  const [borrowerCode, setBorrowerCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Generate borrower code automatically when component mounts
  useEffect(() => {
    if (user?.uid) {
      // Determine account type based on current user role or default to borrower
      const accountType = 'borrower'; // This should come from user context/role
      const code = generateBorrowerCode(user.uid, accountType);
      setBorrowerCode(code);
    }
  }, [user]);

  // Group type mapping for API (simplified - just for display)
  const groupTypeMapping: Record<string, string> = {
    "agriculture": "Agriculture",
    "hospitality": "Hospitality",
    "food": "Food & Beverages",
    "retail": "Retail",
    "medical": "Medical & Pharmaceutical",
    "construction": "Construction",
    "others": "Others"
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please log in to continue");
      return;
    }

    if (!borrowerCode) {
      toast.error("Borrower code not available. Please try refreshing the page.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authFetch('/api/profile/update-borrower-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industryType: groupTypeMapping[selectedGroup],
          borrowerCode: borrowerCode,
          industryKey: selectedGroup
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save borrower information');
      }

      toast.success("Borrower information saved successfully!");
      navigate("/borrowWallet");
    } catch (error) {
      console.error("Error saving borrower info:", error);
      toast.error("Failed to save borrower information. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupOptions = [
    { key: "agriculture", label: "Agriculture" },
    { key: "hospitality", label: "Hospitality" },
    { key: "food", label: "Food & Beverages" },
    { key: "retail", label: "Retail" },
    { key: "medical", label: "Medical & Pharmaceutical" },
    { key: "construction", label: "Construction" },
    { key: "others", label: "Others" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      
      <div className="px-4 py-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          
          <div className="max-w-md">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-yellow-400 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 10 5.16-.26 9-4.45 9-10V7l-10-5z"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-black">
                  Issue/Borrow
                </h1>
              </div>
            </div>

            <div className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Industry</h3>
                <div className="space-y-3">
                  {groupOptions.map((group) => (
                    <label
                      key={group.key}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="group"
                        value={group.key}
                        checked={selectedGroup === group.key}
                        onChange={() => setSelectedGroup(group.key)}
                        className="w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
                      />
                      <span className="text-gray-900">{group.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !borrowerCode}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {isSubmitting ? "Generating..." : "Submit and Generate Borrower/Issuer's Code"}
              </button>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Code will appear here</p>
                
                <div className="p-3 border border-gray-300 rounded-lg bg-white">
                  <p className="text-base font-mono text-gray-900">
                    {borrowerCode || "14D2347"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate("/borrowWallet")}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          <div className="hidden md:block">
            <Testimonials />
          </div>
        </div>
      </div>
    </div>
  );
};