import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
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
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [agreePenalty, setAgreePenalty] = useState(false);
  const [agreeRisk, setAgreeRisk] = useState(false);

  const handleContinue = () => {
    // Basic validation
    if (!accountName || !bankAccount || !accountNumber) {
      alert('Please fill in all required fields: Account Name, Bank, and Account Number');
      return;
    }
    
    if (!agreePenalty || !agreeRisk) {
      alert('Please agree to both terms and conditions to continue');
      return;
    }

    onSubmit({
      accountName,
      bankAccount,
      accountNumber,
      iban,
      swiftCode,
      preferred: false,
      agreePenalty,
      agreeRisk,
    });
    // reset fields
    setAccountName(''); setBankAccount(''); setAccountNumber(''); setIban(''); setSwiftCode('');
    setAgreePenalty(false); setAgreeRisk(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
      <Dialog.Panel className="relative bg-white rounded-2xl w-full max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <Dialog.Title className="text-xl font-semibold mb-4">Add Another Bank Account</Dialog.Title>

        <form className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Account Name</label>
            <Input
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="Enter here"
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Bank Account</label>
            <Select value={bankAccount} onValueChange={setBankAccount}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Please select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank1">Bank 1</SelectItem>
                <SelectItem value="bank2">Bank 2</SelectItem>
                <SelectItem value="bank3">Bank 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block font-medium mb-1">Account Number</label>
            <Input
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="Enter here"
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">IBAN</label>
            <Input
              value={iban}
              onChange={e => setIban(e.target.value)}
              placeholder="Enter here"
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">SWIFT Code</label>
            <Input
              value={swiftCode}
              onChange={e => setSwiftCode(e.target.value)}
              placeholder="Enter here"
              className="w-full"
            />
          </div>

          <div className="flex items-center">
            <Checkbox
              checked={agreePenalty}
              onCheckedChange={val => setAgreePenalty(val === true)}
              id="penalty"
            />
            <label htmlFor="penalty" className="ml-2 text-sm">
              I confirm and agree that I will be charged with penalty for delay of payments.
            </label>
          </div>

          <div className="flex items-center">
            <Checkbox
              checked={agreeRisk}
              onCheckedChange={val => setAgreeRisk(val === true)}
              id="risk"
            />
            <label htmlFor="risk" className="ml-2 text-sm">
              I confirm and agree to risks associated and consequences.
            </label>
          </div>

          <Button type="button" onClick={handleContinue} className="w-full mt-4 bg-[#0C4B20] hover:bg-[#8FB200]">
            Continue
          </Button>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
};

export default AddBankAccountModal;