// src/screens/LogLogIn/BorrowerOccupation.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navigation/navbar";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { CheckIcon, ArrowLeftIcon } from "lucide-react";

/**
 * This screen shows:
 *  1) The site-wide Navbar at the very top, with "Login / Register" visible.
 *  2) Underneath it, a back arrow (←) that navigates back.
 *  3) A two-column layout on md+ screens:
 *       • Left: the "Issue/Borrow" form (occupation selection, generate code, Next).
 *       • Right: the existing <Testimonials /> component.
 *  4) On mobile (< md), it collapses into a single column (only the form), and the form’s
 *     “Group” and inputs are centered horizontally.
 */

export const BorrowerOccupation: React.FC = () => {
  const navigate = useNavigate();

  // Track which “Group” is selected
  const [selectedGroup, setSelectedGroup] = useState<string>("farmer");

  // Dummy “generated code”
  const [borrowerCode, setBorrowerCode] = useState<string>("");

  // Occupation options
  const occupations = [
    { id: "farmer", label: "Farmer/Fisherfolk/Grower" },
    { id: "lgu", label: "LGU Officer (Gov’t Official)" },
    { id: "teacher", label: "Teacher" },
    { id: "government", label: "Other Government Employee" },
    { id: "others", label: "Others" },
  ];

  const handleGenerateCode = () => {
    // In a real app, call your API here.
    setBorrowerCode("14D2347");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ─── 1) Navbar ─── */}
      <Navbar activePage="register" showAuthButtons={true} />

      {/* ─── 2) Back Arrow ─── */}
      <div className="px-4 md:px-20 py-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-200"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-6 h-6 text-black" />
        </button>
      </div>

      {/* ─── 3) Two-column layout ─── */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/** ─── LEFT (form) ─── */}
        <div
          className="
            flex flex-col
            items-center       /* Center children on mobile */
            md:items-start     /* Left-align on md+ */
            w-full md:w-2/4
            overflow-y-auto
            px-3 md:px-12     /* Extra horizontal padding on mobile (px-4) */
            py-8 md:py-12
          "
        >
          {/* Issue/Borrow header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#ffc00f] rounded-lg flex items-center justify-center">
              <img
                src="/debt-1.png"
                alt="Debt icon"
                className="w-6 h-6 object-contain"
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Issue/Borrow</h2>
          </div>

          {/* “Group” label */}
          <div className="mb-4">
            <span className="font-poppins font-medium text-lg">Group</span>
          </div>

          {/* Occupation/Group selection */}
          <div className="mb-8 flex flex-wrap justify-center md:justify-start gap-4">
            {occupations.map((opt) => {
              const isSelected = selectedGroup === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedGroup(opt.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer select-none
                    ${
                      isSelected
                        ? "bg-[#ffc00f] text-black"
                        : "border border-gray-300 text-gray-700"
                    }
                  `}
                >
                  {isSelected && <CheckIcon className="w-5 h-5 text-black" />}
                  <span className="font-poppins text-base">{opt.label}</span>
                </div>
              );
            })}
          </div>

          {/* Generate Code button */}
          <div className="mb-4 w-full md:w-1/2">
            <Button
              onClick={handleGenerateCode}
              className="
                w-full h-14 bg-[#ffc00f] rounded-2xl hover:bg-[#e6ad0e]
                font-poppins text-base font-medium text-black
                whitespace-normal text-center    /* Allow wrapping & center text */
                px-2                              /* extra horizontal padding */
              "
            >
              Submit and Generate Borrower/Issuer’s Code
            </Button>
          </div>

          {/* Code display */}
          <div className="mb-8 w-full md:w-1/2">
            <p className="font-poppins text-base mb-2">Code will appear here</p>
            <input
              type="text"
              readOnly
              value={borrowerCode}
              placeholder="—"
              className="
                w-full h-14 border border-gray-300 rounded-2xl px-4
                font-poppins text-base text-gray-900
              "
            />
          </div>

          {/* Next button */}
          <div className="pt-4 w-full md:w-1/3">
            <Button
              onClick={() => {
                navigate("/borrower/details");
              }}
              className="
                w-full h-14 bg-[#ffc00f] rounded-2xl
                font-poppins text-base font-medium text-black
                whitespace-normal text-center    /* Allow wrapping & center text */
                px-2                              /* extra horizontal padding */
              "
            >
              Next
            </Button>
          </div>
        </div>

        {/** ─── RIGHT (md: 1/3 width): Testimonials ─── */}
        <div className="hidden md:block md:w-1/3 flex-shrink-0">
          <Testimonials />
        </div>
      </div>
    </div>
  );
};

export default BorrowerOccupation;
