import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

/**
 * TopUpModal - Modal component for handling wallet top-up requests
 * 
 * TESTING MODE: This component is configured to always show consistent test bank accounts
 * for testing purposes, regardless of what's stored in the user's profile database.
 * This ensures predictable testing experience across all users.
 * 
 * Test Accounts:
 * - John Doe (BDO): 123456789012 
 * - Jane Smith (BPI): 987654321098
 * - Mike Johnson (Metrobank): 456789123456
 */

interface Account {
  id: number;
  accountName: string;
  bank: string;
  accountNumber: string;
  isDefault: boolean;
}

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'accounts' | 'form'>('accounts');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'PHP',
    transferDate: '',
    reference: '',
    proofOfTransfer: ''
  });

  // Fetch user bank accounts
  useEffect(() => {
    if (isOpen) {
      fetchBankAccounts();
    }
  }, [isOpen]);

  const fetchBankAccounts = async () => {
    setLoadingAccounts(true);
    try {
      // For testing purposes, always use default test accounts
      // This ensures consistent testing experience
      console.log('📝 Using default test accounts for testing');
      const defaultAccounts = [
        {
          id: 1,
          accountName: 'Initiate - for Testing only',
          bank: 'BDO',
          accountNumber: '123456789012',
          isDefault: true
        },
        {
          id: 2,
          accountName: 'Initiate - for Testing only',
          bank: 'BPI',
          accountNumber: '987654321098',
          isDefault: false
        },
        {
          id: 3,
          accountName: 'Initiate - for Testing only',
          bank: 'Metrobank',
          accountNumber: '456789123456',
          isDefault: false
        }
      ];
      setAccounts(defaultAccounts);
      
      // Optional: Still fetch real accounts but don't use them (for debugging)
      try {
        const response = await authFetch(`${API_BASE_URL}/bank-accounts`);
        if (response.success && response.accounts.length > 0) {
          console.log('📊 Real accounts found but using test accounts for testing:', response.accounts.length);
        }
      } catch (error) {
        console.log('📋 No real accounts found, using test accounts');
      }
      
    } catch (error) {
      console.error('Error in fetchBankAccounts:', error);
      // Fallback to default test accounts
      const defaultAccounts = [
        {
          id: 1,
          accountName: 'Test Account',
          bank: 'BDO',
          accountNumber: '123456789012',
          isDefault: true
        },
        {
          id: 2,
          accountName: 'Demo Account',
          bank: 'BPI',
          accountNumber: '987654321098',
          isDefault: false
        }
      ];
      setAccounts(defaultAccounts);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount || !formData.amount || !formData.transferDate || !formData.reference) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await authFetch(`${API_BASE_URL}/topup/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          transferDate: formData.transferDate,
          accountName: selectedAccount.accountName,
          accountNumber: selectedAccount.accountNumber,
          bankName: selectedAccount.bank,
          reference: formData.reference,
          proofOfTransfer: formData.proofOfTransfer
        })
      });
      
      if (response.success) {
        toast.success(response.message || 'Top-up request submitted successfully!');
        onSuccess();
        onClose();
        // Reset form
        setStep('accounts');
        setSelectedAccount(null);
        setFormData({
          amount: '',
          currency: 'PHP',
          transferDate: '',
          reference: '',
          proofOfTransfer: ''
        });
      } else {
        toast.error(response.error || 'Failed to submit top-up request');
      }
    } catch (error) {
      console.error('Error submitting top-up request:', error);
      toast.error('Failed to submit top-up request');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          proofOfTransfer: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {step === 'form' && (
              <button 
                onClick={() => setStep('accounts')} 
                className="mr-4 hover:bg-[#8FB200] hover:text-white p-1 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {step === 'accounts' && (
              <button 
                onClick={onClose} 
                className="mr-4 hover:text-white hover:bg-[#8FB200] p-1 rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-semibold">Top Up</h2>
          </div>
          {/* Close button */}
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-[#8FB200] p-1 rounded"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'accounts' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Deposit to:</h3>
            
            {loadingAccounts ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-[#0C4B20]">Loading bank accounts...</div>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-[#0C4B20] mb-4">No bank accounts found</div>
                <div className="text-sm [#0C4B20]">
                  Please add a bank account in your profile settings to enable top-up functionality.
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div 
                      key={account.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        account.isDefault ? 'border-[#0C4B20] bg-[#8FB200] bg-opacity-50' : 'border-[#0C4B20] hover:bg-[#8FB200]'
                      }`}
                      onClick={() => handleAccountSelect(account)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center mb-2">
                            <span className="font-medium">Dummy Account {account.id}</span>
                            {account.isDefault && (
                              <span className="ml-2 bg-white text-[#0C4B20] text-xs px-2 py-1 rounded">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-[#0C4B20]">
                            <div>Account Name: {account.accountName}</div>
                            <div>Bank: {account.bank}</div>
                            <div>Bank Account: {account.accountNumber}</div>
                          </div>
                        </div>
                        <Button className="bg-[#0C4B20] hover:bg-[#8FB200] text-white">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <Button 
                    className="w-full bg-[#0C4B20] hover:bg-[#8FB200] text-white"
                    onClick={() => handleAccountSelect(accounts[0])}
                    disabled={accounts.length === 0}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'form' && selectedAccount && (
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Amount Transferred</h3>
              
              {/* Fee Structure */}
              <div className="bg-[#8FB200]/25 rounded-lg p-4 mb-6">
                <h4 className="font-medium mb-2">Fee Structure:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>PHP {formData.amount || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction Fees (2%):</span>
                    <span>PHP {formData.amount ? (parseFloat(formData.amount) * 0.02).toFixed(2) : '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Notarization Fee:</span>
                    <span>PHP 500.000</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total Amount:</span>
                    <span>PHP {formData.amount ? (parseFloat(formData.amount) + (parseFloat(formData.amount) * 0.02) + 500).toFixed(2) : '500.00'}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select 
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    <option value="PHP">Philippine Peso (Php)</option>
                    <option value="USD">US Dollar (USD)</option>
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-1">Enter Amount</label>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>

                {/* Transfer Date */}
                <div>
                  <label className="block text-sm font-medium mb-1">Transfer Date</label>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Select Time</label>
                    <Input
                      type="date"
                      value={formData.transferDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, transferDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Transferred to Account */}
                <div>
                  <label className="block text-sm font-medium mb-1">Transferred to (Account)</label>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Select an option</label>
                    <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                      <div className="text-sm">
                        <div>{selectedAccount.accountName}</div>
                        <div className="text-gray-600">{selectedAccount.bank}</div>
                        <div className="text-gray-600">{selectedAccount.accountNumber}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-sm font-medium mb-1">Reference Number</label>
                  <div>
                    {/* <label className="block text-xs text-gray-500 mb-1">Reference Number</label> */}
                    <Input
                      type="text"
                      placeholder="Enter here"
                      value={formData.reference}
                      onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Upload Proof */}
                <div>
                  <label className="block text-sm font-medium mb-1">Upload Proof of Transfer</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="mb-4">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="proof-upload"
                    />
                    <label htmlFor="proof-upload" className="cursor-pointer">
                      <span className="text-[#8FB200] font-medium">Upload</span>
                    </label>
                    {formData.proofOfTransfer && (
                      <div className="mt-2 text-[#0C4B20] text-sm">✓ File uploaded</div>
                    )}
                  </div>
                </div>

                {/* Terms */}
                {/* <div className="space-y-2">
                  <label className="flex items-start">
                    <input type="checkbox" className="mt-1 mr-2" required />
                    <span className="text-sm">
                      I agree to Investie's Risk Disclosure and Limitations and Terms and Conditions
                    </span>
                  </label>
                  
                  <label className="flex items-start">
                    <input type="checkbox" className="mt-1 mr-2" required />
                    <span className="text-sm">
                      By confirming, I confirm that all details provided are accurate, and have read 
                      the Risk Disclosure and Limitations, and the accompanying Terms and 
                      Conditions of Investie.
                    </span>
                  </label>
                </div> */}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-[#0C4B20] hover:bg-[#8FB200] text-white"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
