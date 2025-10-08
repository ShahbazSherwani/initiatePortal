import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X as XIcon, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

interface RiskStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const RiskStatementModal: React.FC<RiskStatementModalProps> = ({
  isOpen,
  onClose,
  onAccept,
}) => {
  const [hasRead, setHasRead] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Reset states when modal opens and check if scrolling is needed
  useEffect(() => {
    if (isOpen) {
      setHasRead(false);
      setHasScrolled(false);
      
      // Check if content needs scrolling after a brief delay to ensure rendering is complete
      setTimeout(() => {
        if (contentRef.current) {
          const element = contentRef.current;
          // If content doesn't need scrolling (content height <= container height), mark as scrolled
          const needsScrolling = element.scrollHeight > element.clientHeight;
          if (!needsScrolling) {
            setHasScrolled(true);
          }
        }
      }, 100);
    }
  }, [isOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (isNearBottom && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  const handleAccept = () => {
    if (hasRead && hasScrolled) {
      onAccept();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={() => {}} // Prevent closing by clicking outside
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
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          {/* Centering trick */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
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
            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <Dialog.Title
                    as="h2"
                    className="text-2xl font-bold leading-6 text-gray-900"
                  >
                    Risk Statement
                  </Dialog.Title>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-black transition-colors"
                  aria-label="Close"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Important Notice Banner */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
                <p className="text-sm font-semibold text-red-800">
                  ⚠️ Important: Please read this risk statement carefully before proceeding.
                </p>
              </div>

              {/* Scrollable Content */}
              <div
                ref={contentRef}
                className="overflow-y-auto max-h-[60vh] pr-4 space-y-4 text-gray-700 leading-relaxed"
                onScroll={handleScroll}
                style={{ scrollBehavior: 'smooth' }}
              >
                <p className="text-base">
                  Investing through debt and equity crowdfunding involves significant risks and is highly speculative. 
                  You may not earn dividends, interest, or regular returns, and there is a real possibility that you 
                  may lose part or all of the capital you invest. Unlike bank deposits or insured financial products, 
                  crowdfunded securities are not covered by deposit insurance or government guarantees, and their value 
                  may fluctuate or become worthless in the event of business failure.
                </p>

                <p className="text-base">
                  Crowdfunded securities may also be illiquid, meaning they are difficult or impossible to resell. 
                  There is currently no established secondary market for these instruments, and you should assume that 
                  you may need to hold your investment for an indefinite period of time. Furthermore, past performance 
                  of an issuer, its affiliates, or similar campaigns is not a guarantee of future results.
                </p>

                <p className="text-base">
                  While <span className="font-semibold">INITIATE PH</span> ensures that campaigns undergo eligibility 
                  checks and disclosures as required by law, such inclusion on the platform does not constitute an 
                  endorsement, recommendation, or guarantee of the issuer, its business model, or its likelihood of 
                  success. <span className="font-semibold">INITIATE PH</span> does not provide investment advice, and 
                  investors remain solely responsible for their investment decisions.
                </p>

                <p className="text-base">
                  Before investing, you are strongly advised to carefully review all information and risk acknowledgment 
                  disclosures provided by the issuer. Investments in crowdfunding campaigns should only be made with 
                  funds that you can afford to lose without affecting your financial stability.
                </p>

                <p className="text-base font-medium">
                  For a more detailed discussion of risks, investor responsibilities, and best practices, please refer 
                  to the Investor's Guide and other learning materials provided on the{" "}
                  <span className="font-semibold">INITIATE PH</span> platform.
                </p>

                {/* Scroll indicator */}
                {!hasScrolled && (
                  <div className="sticky bottom-0 left-0 right-0 py-3 bg-gradient-to-t from-white via-white to-transparent text-center">
                    <p className="text-sm text-gray-500 animate-pulse">
                      ↓ Please scroll to the bottom to continue ↓
                    </p>
                  </div>
                )}
              </div>

              {/* Acknowledgment Section */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3 mb-4">
                  <Checkbox
                    id="risk-acknowledgment"
                    checked={hasRead}
                    onCheckedChange={(checked) => setHasRead(checked === true)}
                    disabled={!hasScrolled}
                    className="mt-1"
                  />
                  <label
                    htmlFor="risk-acknowledgment"
                    className={`text-sm ${
                      hasScrolled ? 'text-gray-700 cursor-pointer' : 'text-gray-400'
                    }`}
                  >
                    I acknowledge that I have read, understood, and accept the risks associated with crowdfunding 
                    investments as outlined in this Risk Statement. I understand that I may lose part or all of my 
                    investment and that INITIATE PH does not provide investment advice or guarantees.
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 h-12 text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAccept}
                    disabled={!hasRead || !hasScrolled}
                    className={`flex-1 h-12 text-base ${
                      hasRead && hasScrolled
                        ? 'bg-[#0C4B20] hover:bg-[#8FB200]'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    I Accept & Continue
                  </Button>
                </div>

                {!hasScrolled && (
                  <p className="text-xs text-center text-gray-500 mt-3">
                    You must scroll through the entire statement to continue
                  </p>
                )}
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};
