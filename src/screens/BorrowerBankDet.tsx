import React, { useContext, useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useRegistration } from "../contexts/RegistrationContext";
import { ChevronLeftIcon } from "lucide-react";
import { Navbar } from "../components/Navigation/navbar";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { AddBankAccountModal } from '../components/AddBankAccountModal';
import { ViewBankAccountModal } from "../components/ViewBankAccountModal";
import type { BankAccount } from "../types/BankAccount";



// Bank account data
// const bankAccounts: BankAccount[] = [
//   {
//     accountName: "Alexa John",
//     bank: "...",
//     bankAccount: "...",
//     accountNumber: "084008124",
//     iban: "...",
//     swiftCode: "...",
//     preferred: true
//   },
//   {
//     accountName: "Alexa John",
//     bank: "...",
//     bankAccount: "...",
//     accountNumber: "084008124",
//     iban: "...",
//     swiftCode: "...",
//     preferred: false
//   }
// ];




export const BorrowerBankDet: React.FC = () => {
  const { token } = useContext(AuthContext)!;
  const { registration, setRegistration } = useRegistration();
  const bankAccounts = registration.bankAccounts || [];
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render

  // Monitor registration changes
  useEffect(() => {
    console.log('🔄 Registration state changed:', registration);
    console.log('🔄 Bank accounts updated:', registration.bankAccounts);
  }, [registration]);

  // Debug logging
  console.log('🏦 Current bank accounts:', bankAccounts);
  console.log('🏦 Registration object:', registration);
  console.log('🏦 Refresh key:', refreshKey);



  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <DashboardLayout activePage="wallet">
      <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-200"
              aria-label="Go back"
            >
              <ChevronLeftIcon className="w-6 h-6 text-black" />
            </button>
            <h1 className="ml-4 text-2xl md:text-3xl font-bold">iFunds</h1>
            <Button onClick={() => setShowModal(true)} className="ml-auto bg-[#0C4B20] text-white px-4 py-2 rounded-lg">
              Add Another Bank Account
            </Button>
                <AddBankAccountModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onSubmit={data => {
                      console.log('🏦 Adding bank account:', data);
                      console.log('🏦 Current registration before update:', registration);
                      
                      const newAccount = { ...data, preferred: false };
                      
                      // Use functional update with more explicit logging
                      setRegistration(prevReg => {
                        console.log('🏦 Previous registration state:', prevReg);
                        const currentBankAccounts = prevReg.bankAccounts || [];
                        console.log('🏦 Current bank accounts array:', currentBankAccounts);
                        
                        const updatedBankAccounts = [...currentBankAccounts, newAccount];
                        console.log('🏦 Updated bank accounts array:', updatedBankAccounts);
                        
                        const updatedReg = {
                          ...prevReg,
                          bankAccounts: updatedBankAccounts
                        };
                        
                        console.log('🏦 Complete updated registration:', updatedReg);
                        return updatedReg;
                      });
                      
                      // Use setTimeout to force a re-render after state update
                      setTimeout(() => {
                        setRefreshKey(prev => prev + 1);
                        console.log('🏦 Forced re-render triggered');
                      }, 100);
                      
                      setShowModal(false);
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
                        <span className="font-medium text-black">{acct.bank || acct.bankAccount}</span>
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
className="flex-1 bg-[#0C4B20] text-white py-2 rounded-lg"
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
                      <Button
                        variant="outline"
                        className="flex-1 py-2 rounded-lg"
                        onClick={() => {
                          setRegistration(reg => ({
                            ...reg,
                            bankAccounts: (reg.bankAccounts || []).filter((_, idx) => idx !== i)
                          }));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>




        </div>

        {/* Modals are rendered inline where they are used above (Add modal in the header, View modal inside each card) */}
    </DashboardLayout>
  );
};

export default BorrowerBankDet;
