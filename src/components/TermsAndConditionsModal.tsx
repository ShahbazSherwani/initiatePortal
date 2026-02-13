import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X as XIcon, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({
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
                  <FileText className="w-8 h-8 text-[#0C4B20]" />
                  <Dialog.Title
                    as="h2"
                    className="text-2xl font-bold leading-6 text-gray-900"
                  >
                    Terms and Conditions
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
              <div className="bg-blue-50 border-l-4 border-[#0C4B20] p-4 mb-4 rounded">
                <p className="text-sm font-semibold text-[#0C4B20]">
                  📋 Please read these terms and conditions carefully before using our platform.
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
                  Welcome to <strong>INITIATE PH</strong>, a crowdfunding intermediary registered in the Philippines. 
                  By accessing or using the INITIATE PH platform (the "Platform"), you ("User," "Investor," "Issuer," 
                  or "Debtor") acknowledge that you have read, understood, and agreed to these Terms and 
                  Conditions ("Terms"), along with our Privacy Policy, Risk Statement, and other applicable policies.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">1. Acceptance of Terms</h3>
                <p className="text-base">
                  By registering for an account, accessing, or using the Platform, you agree to be bound by these Terms. 
                  You also agree to comply with all applicable laws, rules, and regulations, including those issued by 
                  the Securities and Exchange Commission (SEC), the Bangko Sentral ng Pilipinas (BSP), the Anti-Money 
                  Laundering Council (AMLC), and other competent authorities.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">2. Definitions</h3>
                <ul className="list-none space-y-2 text-base">
                  <li><strong>a) "Platform"</strong> – the INITIATE PH website, mobile application, and related services.</li>
                  <li><strong>b) "User"</strong> – any individual or entity that registers or accesses the Platform.</li>
                  <li><strong>c) "Investor"</strong> – a User who commits funds to securities or debt instruments through the Platform.</li>
                  <li><strong>d) "Issuer"</strong> – a corporate User raising capital by offering securities (e.g., shares, bonds, notes) through the Platform.</li>
                  <li><strong>e) "Debtor"</strong> – a User (corporation or entity) that borrows funds through debt crowdfunding and undertakes repayment under agreed terms.</li>
                  <li><strong>f) "Securities"</strong> – investment instruments offered by Issuers, including shares, bonds, or notes, as permitted by law.</li>
                  <li><strong>g) "Loans"</strong> – debt instruments executed between Investors and Debtors under a crowdfunding arrangement facilitated by the Platform.</li>
                  <li><strong>h) "Campaign"</strong> – a fundraising activity initiated by an Issuer or Debtor through the Platform.</li>
                  <li><strong>i) "Funding Commitment"</strong> – the investment or loan pledged by an Investor to an Issuer or Debtor.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">3. Eligibility</h3>
                <p className="text-base font-semibold">3.1 Investors</p>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a) Must be at least 18 years old, with full legal capacity.</li>
                  <li>b) Must complete the risk acknowledgment and suitability assessment.</li>
                  <li>c) Must comply with investment limits prescribed by the SEC.</li>
                  <li>d) Must not be disqualified under securities, finance, or banking laws.</li>
                </ul>
                <p className="text-base font-semibold mt-3">3.2 Issuers and Debtors</p>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a) Must be duly organized under Philippine law and authorized to raise funds.</li>
                  <li>b) Must comply with all SEC registration, disclosure, and reporting requirements.</li>
                  <li>c) Must submit complete and truthful information, including business plans, financials, and risk disclosures.</li>
                  <li>d) Must not exceed the fundraising limits imposed by law or the SEC.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">4. User Obligations</h3>
                <p className="text-base">Users agree to:</p>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a) Provide accurate, current, and complete information.</li>
                  <li>b) Maintain confidentiality of account credentials.</li>
                  <li>c) Use the Platform for lawful purposes only.</li>
                  <li>d) Refrain from fraud, misrepresentation, or unlawful conduct.</li>
                  <li>e) Report any suspicious or unauthorized activity.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">5. Role of INITIATE PH</h3>
                <p className="text-base">INITIATE PH acts solely as a neutral crowdfunding intermediary and does not:</p>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a) Guarantee returns, repayment, or profitability of any campaign.</li>
                  <li>b) Provide investment, lending, legal, or tax advice.</li>
                  <li>c) Endorse or recommend any Issuer, Debtor, or Investor.</li>
                  <li>d) Assume responsibility for repayment of loans or performance of securities.</li>
                </ul>
                <p className="text-base mt-3">INITIATE PH's role is limited to:</p>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a) Hosting campaigns in accordance with applicable law.</li>
                  <li>b) Conducting eligibility and due diligence checks as required by the SEC.</li>
                  <li>c) Facilitating payment and fund transfers through authorized partners.</li>
                  <li>d) Providing disclosures and risk acknowledgments.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">6. Investments, Loans, and Risks</h3>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a) All investments and loans made through the Platform are high risk and speculative.</li>
                  <li>b) Investors may lose part or all of their capital.</li>
                  <li>c) Securities and loans offered are not insured, not guaranteed, and may be illiquid.</li>
                  <li>d) There is no assurance of dividends, interest, or repayment.</li>
                  <li>e) Past performance of an Issuer or Debtor is not a guarantee of future results.</li>
                  <li>f) Investors are responsible for reviewing disclosures and making independent decisions.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">7. Issuer and Debtor Obligations</h3>
                <p className="text-base">Issuers and Debtors agree to:</p>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a) Provide accurate, complete, and updated disclosures.</li>
                  <li>b) Use funds strictly for the stated purpose of the campaign.</li>
                  <li>c) Provide periodic updates and financial reports to the Platform and Investors.</li>
                  <li>d) Repay loans or deliver securities according to the agreed terms.</li>
                  <li>e) Comply with anti-money laundering and other applicable laws.</li>
                </ul>
                <p className="text-base mt-2">
                  Failure to comply may result in suspension, delisting, legal action, and regulatory reporting.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">8. Fees and Charges</h3>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a) INITIATE PH may charge platform fees, transaction fees, servicing fees, and other charges as disclosed.</li>
                  <li>b) Fees may be deducted from the amounts raised or collected separately.</li>
                  <li>c) Users consent to such fees by continuing use of the Platform.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">9. Intellectual Property</h3>
                <p className="text-base">
                  All content, trademarks, software, and materials on the Platform are owned or licensed by INITIATE PH. 
                  Users may not copy, reproduce, or distribute them without prior consent.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">10. Data Privacy</h3>
                <p className="text-base">
                  Personal data is collected and processed in line with the Data Privacy Act of 2012 and the INITIATE PH 
                  Privacy Policy. Users consent to such processing for compliance, reporting, and transaction purposes.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">11. Prohibited Activities</h3>
                <p className="text-base">Users must not:</p>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a) Provide false or misleading information.</li>
                  <li>b) Engage in fraudulent, abusive, or unlawful conduct.</li>
                  <li>c) Attempt to hack or disrupt the Platform.</li>
                  <li>d) Use the Platform for money laundering or terrorist financing.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">12. Limitation of Liability</h3>
                <p className="text-base">
                  INITIATE PH is not liable for losses from investments or loans. INITIATE PH does not guarantee the 
                  performance or repayment of securities or loans.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">13. Amendments</h3>
                <p className="text-base">
                  INITIATE PH may amend these Terms at any time. Users will be notified of material changes. Continued 
                  use constitutes acceptance.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">14. Termination and Suspension</h3>
                <p className="text-base">
                  INITIATE PH may suspend or terminate User accounts for violations of these Terms or regulatory requirements. 
                  Users may request termination subject to settlement of outstanding obligations.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">15. Dispute Resolution</h3>
                <p className="text-base">
                  Parties shall first seek amicable settlement through negotiation. If unresolved, disputes shall be 
                  referred to mediation or arbitration in accordance with Philippine law. If litigation is necessary, 
                  jurisdiction shall lie with the proper courts of Taguig City.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">16. Governing Law</h3>
                <p className="text-base">
                  These Terms are governed by the laws of the Republic of the Philippines, including the Securities 
                  Regulation Code, the Financing Company Act, the Crowdfunding Rules of the SEC, and related regulations.
                </p>

                <h3 className="text-lg font-semibold text-gray-900">17. Contact Information</h3>
                <p className="text-base">For inquiries or concerns:</p>
                <p className="text-base font-medium">
                  <strong>INITIATE PH</strong><br />
                  Email: dataprivacyofficer@initiate.ph<br />
                  Address: Unit 1915 Capital House 9th Avenue, corner 34th Bonifacio Global City ‬Taguig City
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
                    id="terms-acknowledgment"
                    checked={hasRead}
                    onCheckedChange={(checked) => setHasRead(checked === true)}
                    disabled={!hasScrolled}
                    className="mt-1"
                  />
                  <label
                    htmlFor="terms-acknowledgment"
                    className={`text-sm ${
                      hasScrolled ? 'text-gray-700 cursor-pointer' : 'text-gray-400'
                    }`}
                  >
                    I acknowledge that I have read, understood, and agree to be bound by these Terms and Conditions. 
                    I understand that by using the INITIATE PH platform, I accept these terms in their entirety.
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
                    You must scroll through the entire document to continue
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
