import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import type { BankAccount } from '../types/BankAccount';

interface AddBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BankAccount & {
    agreePenalty: boolean;
    agreeRisk: boolean;
  }) => void;
}

export const AddBankAccountModal: React.FC<AddBankAccountModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [accountName, setAccountName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountType, setAccountType] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [agreePenalty, setAgreePenalty] = useState(false);
  const [agreeRisk, setAgreeRisk] = useState(false);

  // Account type options matching registration forms
  const accountTypes = [
    "Savings Account",
    "Current Account", 
    "Business Account",
    "Others"
  ];

  const handleContinue = () => {
    // Basic validation
    if (!accountName || !bankAccount || !accountType || !accountNumber) {
      alert('Please fill in all required fields: Account Name, Bank, Account Type, and Account Number');
      return;
    }
    
    if (!agreePenalty || !agreeRisk) {
      alert('Please agree to both terms and conditions to continue');
      return;
    }

    onSubmit({
      accountName,
      bankAccount,
      accountType,
      accountNumber,
      iban,
      swiftCode,
      preferred: false,
      agreePenalty,
      agreeRisk,
    });
    // reset fields
    setAccountName(''); setBankAccount(''); setAccountType(''); setAccountNumber(''); setIban(''); setSwiftCode('');
    setAgreePenalty(false); setAgreeRisk(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
      <Dialog.Panel className="relative bg-white rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-lg p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <Dialog.Title className="text-lg sm:text-xl font-semibold mb-4 text-center">Add Another Bank Account</Dialog.Title>

        <form className="space-y-4">
          <div>
            <label className="block font-medium mb-1 text-sm sm:text-base">Account Name</label>
            <Input
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="Enter here"
              className="w-full text-sm sm:text-base px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-sm sm:text-base">Bank</label>
            <Input
              value={bankAccount}
              onChange={e => setBankAccount(e.target.value)}
              placeholder="Enter bank name"
              className="w-full text-sm sm:text-base px-3 py-2"
              aria-label="bank-name"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-sm sm:text-base">Account Type</label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger className="w-full text-sm sm:text-base px-3 py-2">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block font-medium mb-1 text-sm sm:text-base">Account Number</label>
            <Input
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="Enter here"
              className="w-full text-sm sm:text-base px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-sm sm:text-base">IBAN</label>
            <Input
              value={iban}
              onChange={e => setIban(e.target.value)}
              placeholder="Enter here"
              className="w-full text-sm sm:text-base px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-sm sm:text-base">SWIFT Code</label>
            <Input
              value={swiftCode}
              onChange={e => setSwiftCode(e.target.value)}
              placeholder="Enter here"
              className="w-full text-sm sm:text-base px-3 py-2"
            />
          </div>

          <div className="flex items-start gap-2">
            <div className="pt-1">
              <Checkbox
                checked={agreePenalty}
                onCheckedChange={val => setAgreePenalty(val === true)}
                id="penalty"
              />
            </div>
            <label htmlFor="penalty" className="ml-2 text-sm">
              I confirm and agree that I will be charged with penalty for delay of payments.
            </label>
          </div>

          <div className="flex items-start gap-2">
            <div className="pt-1">
              <Checkbox
                checked={agreeRisk}
                onCheckedChange={val => setAgreeRisk(val === true)}
                id="risk"
              />
            </div>
            <label htmlFor="risk" className="ml-2 text-sm">
              I confirm and agree to risks associated and consequences.
            </label>
          </div>

          <Button type="button" onClick={handleContinue} className="w-full mt-4 bg-[#0C4B20] hover:bg-[#8FB200] py-3 text-sm sm:text-base">
            Continue
          </Button>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
};

export default AddBankAccountModal;