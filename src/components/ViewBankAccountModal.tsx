import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X as XIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import type { BankAccount } from "../types/BankAccount";

interface ViewBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccount;
  onRemove: () => void;
}

export const ViewBankAccountModal: React.FC<ViewBankAccountModalProps> = ({
  isOpen,
  onClose,
  account,
  onRemove,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
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
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>
          {/* Trick centering */}
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
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
              {/* Header */}
              <div className="flex justify-between items-center">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-gray-900"
                >
                  View Bank Account
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-black"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <p className="text-gray-600">Account Name</p>
                  <p className="font-medium text-black">
                    {account.accountName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Bank Account</p>
                  <p className="font-medium text-black">
                    {account.bank || account.bankAccount}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">IBAN</p>
                  <p className="font-medium text-black">{account.iban}</p>
                </div>
                <div>
                  <p className="text-gray-600">Account Number</p>
                  <p className="font-medium text-black">
                    {account.accountNumber}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600">SWIFT Code</p>
                  <p className="font-medium text-black">{account.swiftCode}</p>
                </div>
              </div>

              {/* Remove Button */}
              <div className="mt-8">
                <Button
                  variant="outline"
                  onClick={onRemove}
                  className="w-full"
                >
                  Remove
                </Button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};
