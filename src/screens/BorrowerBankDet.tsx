import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  BellIcon,
  ChevronLeftIcon,
} from "lucide-react";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { AddBankAccountModal } from '../components/AddBankAccountModal';
import { ViewBankAccountModal } from "../components/ViewBankAccountModal";



// Bank account data
const bankAccounts: BankAccount[] = [
  { accountName: "Alexa John", bank: "...", accountNumber: "084008124", preferred: true },
  { accountName: "Alexa John", bank: "...", accountNumber: "084008124", preferred: false },
];


// Payment options data
const paymentOptions = [
  { name: "Gcash", image: "/image-3.png", selected: false },
  { name: "Pay Maya", image: "/image-4.png", selected: false },
  { name: "Paypal", image: "/image-5.png", selected: true },
];

export const BorrowerBankDet: React.FC = () => {
  const { token } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);



  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <Navbar activePage="wallet" showAuthButtons={false} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="md:block">
          <Sidebar activePage="Wallet"  />
        </div>

        {/* Mobile sidebar toggle */}
        <div className="hidden md:hidden">
          <button
            className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white shadow"
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            {mobileMenuOpen ? (
              <ChevronLeftIcon className="w-6 h-6 text-black" />
            ) : (
              <BellIcon className="w-6 h-6 text-black" />
            )}
          </button>
          <div
            className={`fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white shadow transform transition-transform ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar activePage="wallet"  />
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-200"
              aria-label="Go back"
            >
              <ChevronLeftIcon className="w-6 h-6 text-black" />
            </button>
            <h1 className="ml-4 text-2xl md:text-3xl font-bold">Wallet</h1>
            <Button onClick={() => setShowModal(true)} className="ml-auto bg-[#ffc628] text-black px-4 py-2 rounded-lg">
              Add Another Bank Account
            </Button>
                <AddBankAccountModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSubmit={data => {
                    // handle saving new account
                    }}
                />
          </div>

          {/* Bank Details */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Bank Details</h2>
            <div className="flex flex-col gap-4 md:flex-row md:space-x-4">
              {bankAccounts.map((acct, i) => (
                <Card key={i} className="flex-1 rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-center mb-4">
                      <Checkbox id={`acct-${i}`} checked={acct.preferred} />
                      <label htmlFor={`acct-${i}`} className="ml-2">
                        Preferred Bank Account
                      </label>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Account Name:</span>{" "}
                        <span>{acct.accountName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Bank:</span>{" "}
                        <span>{acct.bank}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Account #:</span>{" "}
                        <span>{acct.accountNumber}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
 <Button
onClick={() => {
setSelectedAccount(acct);
setViewModalOpen(true);
}}
className="flex-1 bg-[#ffc628] text-black py-2 rounded-lg"
>
View Details
</Button>
{/* only render the modal once we've selected an account */}
{selectedAccount && (
<ViewBankAccountModal
isOpen={viewModalOpen}
onClose={() => setViewModalOpen(false)}
account={selectedAccount}
onRemove={() => {
// do your remove logic here...
setViewModalOpen(false);
}}
/>
)}
                      <Button variant="outline" className="flex-1 py-2 rounded-lg">
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Connect Crypto-Wallet */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Connect Crypto-Wallet</h2>
                <p className="text-sm text-gray-600">Looks like you haven't connected any wallet.</p>
              </div>
              <Button className="bg-[#ffc628] text-black py-2 px-4 rounded-lg">
                Connect Wallet
              </Button>
            </div>
          </section>

          {/* Other Payment Options */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Other Payment Options</h2>
              <div className="flex items-center text-sm text-gray-600">
                <Checkbox checked /> Connected
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {paymentOptions.map((opt, i) => (
                <Card
                  key={i}
                  className={`flex items-center p-4 rounded-2xl w-full sm:w-auto ${
                    opt.selected ? "bg-[#ffc628]" : "bg-gray-100"
                  }`}
                >
                  <img src={opt.image} alt={opt.name} className="w-10 h-10" />
                  <span className="ml-4 font-medium">{opt.name}</span>
                </Card>
              ))}
            </div>
            {paymentOptions.some((o) => o.selected) && (
              <div className="mt-4 text-right">
                <Button variant="outline" className="px-4 py-2 rounded-lg">
                  Disconnect
                </Button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default BorrowerBankDet;
