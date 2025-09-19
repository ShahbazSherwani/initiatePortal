import React, { useContext, useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useRegistration } from "../contexts/RegistrationContext";
import { ChevronLeftIcon } from "lucide-react";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { AddBankAccountModal } from '../components/AddBankAccountModal';
import { ViewBankAccountModal } from "../components/ViewBankAccountModal";
import { authFetch } from "../lib/api";
import { API_BASE_URL } from '../config/environment';
import { toast } from 'react-hot-toast';
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
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

  // Fetch bank accounts from API
  const fetchBankAccounts = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/bank-accounts`);
      if (response.success) {
        setBankAccounts(response.accounts);
        console.log('🏦 Fetched bank accounts:', response.accounts);
      } else {
        console.error('Failed to fetch bank accounts:', response);
        setBankAccounts([]);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setBankAccounts([]);
      toast.error('Failed to load bank accounts');
    }
  };

  // Save bank account to API
  const saveBankAccount = async (accountData: any) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/bank-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(accountData)
      });
      
      if (response.success) {
        toast.success('Bank account added successfully!');
        fetchBankAccounts(); // Refresh the list
        return true;
      } else {
        toast.error(response.error || 'Failed to add bank account');
        return false;
      }
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast.error('Failed to save bank account');
      return false;
    }
  };

  // Load bank accounts on component mount
  useEffect(() => {
    fetchBankAccounts();
  }, []);

  // Monitor registration changes
  useEffect(() => {
    console.log('🔄 Registration state changed:', registration);
    console.log('🔄 Bank accounts updated:', registration.bankAccounts);
  }, [registration]);

  // Debug logging
  console.log('🏦 Current bank accounts:', bankAccounts);
  console.log('🏦 Registration object:', registration);



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
                    onSubmit={async data => {
                      console.log('🏦 Adding bank account:', data);
                      
                      // Save to backend API
                      const success = await saveBankAccount({
                        accountName: data.accountName,
                        bankAccount: data.bankAccount,
                        accountType: data.accountType,
                        accountNumber: data.accountNumber,
                        iban: data.iban,
                        swiftCode: data.swiftCode,
                        preferred: data.preferred || false
                      });
                      
                      if (success) {
                        // Also update local registration context for compatibility
                        const newAccount = { ...data, preferred: false };
                        setRegistration(prevReg => ({
                          ...prevReg,
                          bankAccounts: [...(prevReg.bankAccounts || []), newAccount]
                        }));
                        
                        setShowModal(false);
                      }
                      // If save failed, modal stays open so user can retry
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
                      {acct.accountType && (
                        <div>
                          <span className="font-medium text-gray-600">Account Type:</span>{" "}
                          <span>{acct.accountType}</span>
                        </div>
                      )}
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
