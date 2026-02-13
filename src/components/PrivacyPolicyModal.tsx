import React, { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X as XIcon, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
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
                  <Shield className="w-8 h-8 text-[#0C4B20]" />
                  <Dialog.Title
                    as="h2"
                    className="text-2xl font-bold leading-6 text-gray-900"
                  >
                    Privacy Policy
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
              <div className="bg-green-50 border-l-4 border-[#0C4B20] p-4 mb-4 rounded">
                <p className="text-sm font-semibold text-[#0C4B20]">
                  🔒 Your privacy is important to us. Please review how we collect and use your information.
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
                  <strong>Privacy Notice of Initiate PH</strong><br />
                  Initiate PH values and respects your privacy. As the world’s first all-in-one crowdfunding platform, we are committed to protecting the personal data of our users, including donors, investors, fundraisers, MSMEs, startups, farmers, and individuals.
                </p>
                <p className="text-base">
                  This Privacy Notice is issued in compliance with the Data Privacy Act of 2012 (RA 10173), its Implementing Rules and Regulations, and issuances of the National Privacy Commission (NPC).
                </p>

                <h3 className="text-lg font-semibold text-gray-900">1. Categories of Personal Data We Collect and Process</h3>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a. Basic Identifiers such as name, gender, date of birth, nationality, address, contact numbers, email.</li>
                  <li>b. Government-issued Identifiers such as TIN, SSS, UMID, passport, driver’s license, etc. (as may be required for KYC and regulatory compliance).</li>
                  <li>c. Financial Information such as investment preferences, crowdfunding contributions, payment history.</li>
                  <li>d. Employment/Business Information such as company or business name, position, source of funds, proof of income, SEC/DTI registration for MSMEs.</li>
                  <li>e. Sensitive Personal Information such as medical records or emergency details (for donation-based campaigns in health or life emergencies).</li>
                  <li>f. Platform Usage Data such as login credentials, transaction logs, device information, IP addresses, cookies, and usage statistics.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">2. Purpose of Processing</h3>
                <p className="text-base">We process your personal data only for legitimate and lawful purposes, including:</p>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a. Facilitating debt, equity, or donation-based crowdfunding campaigns.</li>
                  <li>b. Verifying identities and conducting Know Your Customer (KYC) and anti-money laundering (AML) checks.</li>
                  <li>c. Processing investments, donations, withdrawals, and payouts.</li>
                  <li>d. Ensuring compliance with government and regulatory requirements.</li>
                  <li>e. Providing customer support and maintaining your account.</li>
                  <li>f. Conducting research, analytics, and platform improvements.</li>
                  <li>g. Protecting our users, preventing fraud, and securing transactions.</li>
                </ul>
                <p className="text-base">All processing is compatible with our business purpose and limited to what is necessary and proportional.</p>

                <h3 className="text-lg font-semibold text-gray-900">3. When We Collect Personal Data</h3>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a. Registration and Account Creation – when you sign up as an investor, donor, or fundraiser.</li>
                  <li>b. KYC/Verification – when you provide documents or IDs for identity verification and regulatory compliance.</li>
                  <li>c. Campaign Creation and Fundraising – when you launch a fundraising campaign or apply for equity/debt financing.</li>
                  <li>d. Transactions and Payments – when you invest, donate, withdraw, or receive funds.</li>
                  <li>e. Platform Usage – when you access our website, dashboard, or mobile application (cookies, IP address, device info).</li>
                  <li>f. Customer Support and Communication – when you contact us for inquiries, assistance, or feedback.</li>
                  <li>g. Third-Party Integration – when you use linked services (payment processors, banks, e-wallets) that provide data to us.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">3. Legitimate Criteria for Processing</h3>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a. Consent - we obtain your informed and voluntary consent when you register on our platform, create an account, participate in campaigns, or agree to specific uses of your data</li>
                  <li>b. Contract - Processing is necessary for the performance of a contract or to take steps prior to entering into one. This includes activities such as account creation, campaign participation, donation and investment processing, disbursement of funds, and resolution of disputes between users.</li>
                  <li>c. Legal Obligation -we process data to comply with laws, regulations, and government requirements, including those under: Anti-Money Laundering Act (AMLA), Securities Regulation Code (SRC) and SEC rules, Tax laws (BIR compliance), and Other applicable financial, corporate, and regulatory laws.</li>
                  <li>d. Legitimate Interests - Processing is necessary for our legitimate business interests, provided that such interests do not override the fundamental rights and freedoms of data subjects. This includes activities such as: Fraud detection and prevention, Platform and account security, Internal business analytics and reporting and Improving services and user experience.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">4. Data Sharing and Transfers</h3>
                <p className="text-base">We recognize that your personal data is confidential and will only be shared under strict conditions. Data sharing is limited to what is necessary, proportional, and consistent with the declared purposes of processing.</p>

                <h4 className="text-base font-semibold">4.1 Authorized Third Parties</h4>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a. Payment Processors and Partner Banks – to facilitate deposits, withdrawals, investments, and donation transfers.</li>
                  <li>b. Regulatory and Government Authorities – such as the SEC, BIR, AMLC, or other agencies as may be required by law.</li>
                  <li>c. Auditors, Legal Advisors, and Compliance Partners – for financial audits, legal due diligence, dispute resolution, or regulatory compliance.</li>
                  <li>d. Technology and Cloud Service Providers – for platform hosting, data storage, and system maintenance.</li>
                  <li>e. Independent Service Providers – including customer support contractors, marketing platforms, and analytics providers.</li>
                  <li>f. Partner Companies – for joint initiatives, co-branded services, or partnership-related purposes.</li>
                  <li>g. Investors – for purposes consistent with corporate governance, reporting, and due diligence.</li>
                </ul>
                <p className="text-base">All recipients are bound by strict confidentiality and data protection obligations consistent with the Data Privacy Act of 2012.</p>

                <h4 className="text-base font-semibold">4.2 Conditions for Data Sharing</h4>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a. Data will only be shared on a need-to-know basis and limited to the minimum information required.</li>
                  <li>b. Prior to data sharing, we ensure that third parties have implemented appropriate organizational, physical, and technical security measures.</li>
                  <li>c. We enter into Data Sharing Agreements (DSAs) or Data Processing Agreements (DPAs) with all partners, in compliance with NPC Circulars.</li>
                </ul>

                <h4 className="text-base font-semibold">4.3 Cross-Border Data Transfers</h4>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a. Some personal data may be stored or processed in systems located outside the Philippines (e.g., cloud hosting or global service providers).</li>
                  <li>b. Any transfer outside the Philippines will be carried out in accordance with the DPA and NPC rules, with adequate safeguards such as:
                    <ul className="list-disc ml-6">
                      <li>• Binding corporate rules,</li>
                      <li>• Standard contractual clauses, or</li>
                      <li>• Equivalent protective mechanisms recognized under the law.</li>
                    </ul>
                  </li>
                  <li>• Users will be informed if their data is subject to international transfer.</li>
                </ul>

                <h4 className="text-base font-semibold">4.4 No Unauthorized Disclosure</h4>
                <p className="text-base">We will never sell, lease, or trade your personal data to unrelated third parties. Sharing will always be aligned with our business purpose and lawful basis for processing.</p>

                <h3 className="text-lg font-semibold text-gray-900">5. Data Security</h3>
                <p className="text-base">We adopt reasonable and appropriate organizational, physical, and technical measures to ensure the confidentiality, integrity, and availability of your personal data. These safeguards are designed to protect against loss, unauthorized access, alteration, disclosure, or misuse of information.</p>

                <h4 className="text-base font-semibold">5.1 Organizational Measures</h4>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a. Appointment of a Data Protection Officer (DPO) to oversee compliance with the Data Privacy Act.</li>
                  <li>a. Implementation of privacy policies and internal data handling protocols.</li>
                  <li>b. Conduct of regular training and awareness sessions for employees and contractors on data protection obligations.</li>
                  <li>c. Role-based access controls to ensure that only authorized personnel may access personal data.</li>
                  <li>d. Execution of confidentiality agreements with staff and third-party service providers.</li>
                  <li>e. Implementation of incident response and breach notification procedures, including immediate reporting to the NPC and affected data subjects in case of a serious data breach.</li>
                </ul>

                <h4 className="text-base font-semibold">5.2 Physical Measures</h4>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a. Secure office premises with controlled entry points, visitor logs, and CCTV surveillance.</li>
                  <li>b. Storage of physical records in locked filing cabinets accessible only to authorized staff.</li>
                  <li>c. Separation of sensitive documents from general records.</li>
                  <li>d. Restrictions on the use of portable storage devices and personal gadgets in sensitive areas.</li>
                  <li>e. Disaster recovery planning, including backup facilities in case of fire, natural disaster, or technical failure.</li>
                </ul>

                <h4 className="text-base font-semibold">5.3 Technical Measures</h4>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a. Use of encryption (both at rest and in transit) for sensitive data and transactions.</li>
                  <li>b. Deployment of firewalls, anti-malware software, intrusion detection, and intrusion prevention systems.</li>
                  <li>c. Secure Socket Layer (SSL) protocols for all communications with the platform.</li>
                  <li>d. Multi-Factor Authentication (MFA) for account logins and administrative access.</li>
                  <li>e. Regular system vulnerability assessments and penetration testing to identify and address risks.</li>
                  <li>f. Automated log monitoring and anomaly detection to flag suspicious activities.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">6. Risks in Processing and Mitigation Practices</h3>
                <p className="text-base">While we adopt strict safeguards, the processing of personal data inherently carries certain risks. Initiate PH acknowledges these risks and implements corresponding mitigation measures to protect our users.</p>

                <h4 className="text-base font-semibold">6.1 Possible Risks</h4>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a. Unauthorized Access – attempts by hackers or unauthorized individuals to gain entry into systems or accounts.</li>
                  <li>b. Phishing and Social Engineering – fraudulent emails, messages, or websites designed to trick users into revealing personal data.</li>
                  <li>c. Fraudulent Transactions – misuse of identities or financial data for unauthorized investments, withdrawals, or donations.</li>
                  <li>d. Data Loss or Corruption – accidental deletion, alteration, or corruption of records due to system errors or human mistakes.</li>
                  <li>e. Accidental Disclosure – inadvertent sharing of data beyond authorized personnel or partners.</li>
                  <li>f. Service Disruption – downtime or denial-of-service attacks that may compromise data availability.</li>
                </ul>

                <h4 className="text-base font-semibold">6.2 Mitigation Practices</h4>
                <p className="text-base">To address these risks, Initiate PH implements the following measures:</p>
                <ul className="list-none space-y-2 text-base ml-4">
                  <li>a. Access Controls and Authentication – strict role-based permissions, strong password policies, and multi-factor authentication (MFA) for both users and staff.</li>
                  <li>b. Encryption – sensitive data is encrypted both in storage and during transmission, making it unreadable to unauthorized parties.</li>
                  <li>c. Network and System Security – firewalls, intrusion detection systems (IDS), intrusion prevention systems (IPS), and anti-malware defenses are continuously updated.</li>
                  <li>d. Regular Monitoring – continuous log monitoring, anomaly detection, and fraud-detection algorithms to identify and block suspicious activity.</li>
                  <li>e. User Awareness Programs – education campaigns on phishing, safe password practices, and account security tips to minimize social engineering risks.</li>
                  <li>f. Incident Response and Breach Protocols – a dedicated incident response team that follows a structured process:
                    <ul className="list-disc ml-6">
                      <li>• Detection of breach or suspicious activity.</li>
                      <li>• Containment of the threat.</li>
                      <li>• Assessment and Mitigation of impact.</li>
                      <li>• Notification to the NPC and affected data subjects, as required by law.</li>
                      <li>• Remediation and Review to prevent recurrence.</li>
                    </ul>
                  </li>
                  <li>• Backups and Disaster Recovery – secure, regular data backups and tested recovery plans ensure business continuity in case of accidental loss or system failure.</li>
                  <li>• Third-Party Risk Management – due diligence, contractual safeguards, and compliance monitoring for partners and service providers handling data.</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900">7. Retention and Disposal</h3>
                <p className="text-base">We retain personal data only as long as necessary to fulfill the purposes for which it was collected or as required by law/regulation.</p>
                <p className="text-base">Financial transaction records are kept in line with BSP/SEC/BIR recordkeeping requirements.</p>
                <p className="text-base">Once retention periods lapse, we dispose of data through secure deletion or destruction of physical records.</p>

                <h3 className="text-lg font-semibold text-gray-900">8. Data Subject Rights</h3>
                <p className="text-base">As a data subject, you are entitled to the following rights under the Data Privacy Act of 2012 (DPA):</p>

                <h4 className="text-base font-semibold">8.1 Right to be Informed</h4>
                <p className="text-base">You have the right to know when and how your personal data is collected, processed, shared, or stored. Initiate PH provides this information through this Privacy Notice, consent forms, and notifications for any significant changes in processing activities.</p>

                <h4 className="text-base font-semibold">8.2 Right to Access</h4>
                <p className="text-base">You may request confirmation on whether your personal data is being processed and obtain a copy of such data, subject to reasonable administrative fees and verification procedures.</p>

                <h4 className="text-base font-semibold">8.3 Right to Rectification</h4>
                <p className="text-base">You have the right to correct or update any inaccurate, incomplete, or outdated personal data.</p>

                <h4 className="text-base font-semibold">8.4 Right to Erasure or Blocking</h4>
                <p className="text-base">You may request the deletion or blocking of personal data if: It is no longer necessary for the purpose for which it was collected; Consent has been withdrawn; or Processing is unlawful.</p>

                <h4 className="text-base font-semibold">8.5 Right to Object to Processing</h4>
                <p className="text-base">You may object to the processing of your personal data for direct marketing, profiling, or other processing not based on legal or contractual grounds.</p>

                <h4 className="text-base font-semibold">8.6 Right to Data Portability</h4>
                <p className="text-base">You may request that your personal data be provided in a structured, commonly used, and machine-readable format, and transmitted to another service provider where technically feasible.</p>

                <h4 className="text-base font-semibold">8.7 Right to Damages</h4>
                <p className="text-base">You are entitled to claim compensation if you suffer damage due to inaccurate, incomplete, outdated, false, unlawfully obtained, or unauthorized use of personal data.</p>

                <h4 className="text-base font-semibold">8.8 How to Exercise Your Rights</h4>
                <p className="text-base">To exercise any of these rights, you may contact our Data Protection Officer (DPO) through the contact details provided in Section 9 of this Privacy Notice.</p>

                <h3 className="text-lg font-semibold text-gray-900">9. Contact Information</h3>
                <p className="text-base">For questions, concerns, or requests regarding your personal data, please contact:</p>
                <p className="text-base font-medium">
                  Data Protection Officer (DPO): Boncarlo R. Uneta<br />
                  Email: dataprivacyofficer@initiate.ph
                </p>

                <p className="text-base font-medium mt-6">
                  By clicking "I Accept & Continue," you acknowledge that you have read, understood, and agree to this Privacy Notice and consent to the collection, use, and disclosure of your personal information as described herein.
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
                    id="privacy-acknowledgment"
                    checked={hasRead}
                    onCheckedChange={(checked) => setHasRead(checked === true)}
                    disabled={!hasScrolled}
                    className="mt-1"
                  />
                  <label
                    htmlFor="privacy-acknowledgment"
                    className={`text-sm ${
                      hasScrolled ? 'text-gray-700 cursor-pointer' : 'text-gray-400'
                    }`}
                  >
                    I acknowledge that I have read, understood, and agree to this Privacy Policy. I consent to the 
                    collection, use, and disclosure of my personal information as described in this policy.
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
