// src/components/RiskFooter.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

export const RiskFooter: React.FC = () => {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("riskFooterDismissed") === "true"
  );

  const handleDismiss = () => {
    sessionStorage.setItem("riskFooterDismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div
      className="fixed bottom-0 left-0 w-full z-50"
      style={{ background: "rgba(255, 248, 225, 0.97)", borderTop: "1px solid #F9A825" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-3 text-gray-500 hover:text-gray-800 text-lg font-light leading-none"
          aria-label="Dismiss risk warning"
        >
          &times;
        </button>

        {/* Title */}
        <p className="text-center text-sm font-bold mb-1 tracking-wide" style={{ color: "#E65100" }}>
          RISK WARNING
        </p>

        {/* Body */}
        <p className="text-center text-xs leading-relaxed max-w-4xl mx-auto" style={{ color: "#5D4037" }}>
          Investing through crowdfunding platform involves significant risks,
          including the possible loss of your entire investment.
          Securities offered on this platform are typically issued by early-stage or growing
          companies and may carry a higher risk compared to traditional investments.
          These investments are generally illiquid and may not be easily sold or transferred.
          Returns are not guaranteed, and past performance or projections do not assure
          future results. Investors should carefully review all available information and
          invest only funds they can afford to lose.{" "}
          <Link to="/risk-disclosure-and-disclaimer-policy" className="underline hover:opacity-80" style={{ color: "#E65100" }}>
            Risk Warnings.
          </Link>
        </p>

        {/* Dismiss hint */}
        <p className="text-center text-[10px] text-gray-500 mt-1">
          (Click <strong>&times;</strong> to hide this Notification)
        </p>
      </div>
    </div>
  );
};
