import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { AlertTriangleIcon, XIcon } from 'lucide-react';

interface SuspendUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (suspensionData: SuspensionData) => Promise<void>;
  userName: string;
  loading?: boolean;
}

export interface SuspensionData {
  reason: string;
  scope: 'full_account' | 'borrower' | 'investor';
  duration: 'permanent' | 'temporary';
  endDate?: string;
}

export const SuspendUserModal: React.FC<SuspendUserModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  loading = false
}) => {
  const [reason, setReason] = useState('');
  const [scope, setScope] = useState<'full_account' | 'borrower' | 'investor'>('full_account');
  const [duration, setDuration] = useState<'permanent' | 'temporary'>('permanent');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Validate reason
    if (!reason.trim()) {
      setError('Please provide a reason for suspension');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    // Validate end date for temporary suspension
    if (duration === 'temporary') {
      if (!endDate) {
        setError('Please select an end date for temporary suspension');
        return;
      }

      const selectedDate = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate <= today) {
        setError('End date must be in the future');
        return;
      }
    }

    setError('');
    await onConfirm({
      reason: reason.trim(),
      scope,
      duration,
      endDate: duration === 'temporary' ? endDate : undefined
    });
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setScope('full_account');
      setDuration('permanent');
      setEndDate('');
      setError('');
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100">
                      <AlertTriangleIcon className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-xl font-bold text-gray-900">
                        Suspend User Account
                      </Dialog.Title>
                      <p className="text-sm text-gray-600 mt-1">
                        Suspend {userName}'s account
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Reason Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Suspension <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain why this user is being suspended..."
                      rows={4}
                      disabled={loading}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This reason will be visible to the user
                    </p>
                  </div>

                  {/* Scope Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suspension Scope
                    </label>
                    <select
                      value={scope}
                      onChange={(e) => setScope(e.target.value as any)}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full_account">Full Account</option>
                      <option value="borrower">Borrower Role Only</option>
                      <option value="investor">Investor Role Only</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose which parts of the account to restrict
                    </p>
                  </div>

                  {/* Duration Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="permanent"
                          checked={duration === 'permanent'}
                          onChange={(e) => setDuration(e.target.value as any)}
                          disabled={loading}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          Until further notice (Permanent)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="temporary"
                          checked={duration === 'temporary'}
                          onChange={(e) => setDuration(e.target.value as any)}
                          disabled={loading}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          Temporary (Until specific date)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* End Date (shown only for temporary) */}
                  {duration === 'temporary' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Suspension End Date <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={loading}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Warning Message */}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> The user will be immediately blocked from:
                    </p>
                    <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc space-y-1">
                      <li>Logging into their account</li>
                      <li>Creating or editing projects</li>
                      <li>Making investments</li>
                      <li>Processing top-ups and withdrawals</li>
                    </ul>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="flex-1"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Suspending...
                      </>
                    ) : (
                      'Suspend User'
                    )}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
