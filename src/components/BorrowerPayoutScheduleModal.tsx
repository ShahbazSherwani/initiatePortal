import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X as XIcon, UploadCloud as UploadIcon } from "lucide-react"

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";

interface BorrowerPayoutScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (data: {
    guarantorCode: string;
    fromList: string;
    collateralDetails: string;
    insuranceProvider: string;
    agreedTOS: boolean;
    agreedRisk: boolean;
  }) => void;
}

export const BorrowerPayoutScheduleModal: React.FC<BorrowerPayoutScheduleModalProps> = ({
  open,
  onOpenChange,
  onContinue,
}) => {
  const [guarantorCode, setGuarantorCode] = useState("");
  const [fromList, setFromList] = useState("");
  const [collateralDetails, setCollateralDetails] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [agreedTOS, setAgreedTOS] = useState(false);
  const [agreedRisk, setAgreedRisk] = useState(false);

  const handleSubmit = () => {
    onContinue({
      guarantorCode,
      fromList,
      collateralDetails,
      insuranceProvider,
      agreedTOS,
      agreedRisk,
    });
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={() => onOpenChange(false)}>
        <div className="min-h-screen px-4 text-center">
          {/* backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-60"
            leave="ease-in duration-150"
            leaveFrom="opacity-60"
            leaveTo="opacity-0"
          >
           <div className="fixed inset-0 bg-black" aria-hidden="true" />
          </Transition.Child>

          {/* center hack */}
          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>

          {/* panel */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-2xl shadow-xl">
              {/* header */}
              <div className="flex justify-between items-center mb-4">
                <Dialog.Title as="h3" className="text-xl font-bold">
                  Enter your Guarantor Code
                </Dialog.Title>
                <button onClick={() => onOpenChange(false)}>
                  <XIcon className="w-6 h-6 text-gray-500 hover:text-gray-800" />
                </button>
              </div>

              {/* body */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block mb-1 font-medium">Enter here</label>
                    <Input
                      placeholder="Enter here"
                      value={guarantorCode}
                      onChange={(e) => setGuarantorCode(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 font-medium">Choose from list</label>
                    <Select onValueChange={setFromList}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="codeA">Code A</SelectItem>
                        <SelectItem value="codeB">Code B</SelectItem>
                        <SelectItem value="codeC">Code C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Collateral Details</label>
                  <Textarea
                    placeholder="Enter here"
                    value={collateralDetails}
                    onChange={(e) => setCollateralDetails(e.target.value)}
                    className="w-full"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Document</label>
                  <div className="w-full h-28 border-2 border-dashed rounded-2xl flex items-center justify-center">
                    <UploadIcon className="w-8 h-8 text-gray-500" />
                    <span className="ml-2 font-medium text-gray-700">Upload</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500">
                  Required only after 100% funding. Before the release of the funds. Input if already available.
                </p>

                <div>
                  <label className="block mb-1 font-medium">Insurance Provider</label>
                  <Select onValueChange={setInsuranceProvider}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="provider1">Provider 1</SelectItem>
                      <SelectItem value="provider2">Provider 2</SelectItem>
                      <SelectItem value="provider3">Provider 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Checkbox
                    id="tos"
                    checked={agreedTOS}
                    onCheckedChange={(v) => setAgreedTOS(Boolean(v))}
                  />
                  <label htmlFor="tos" className="ml-2">
                    I agree to <a href="#" className="underline">Terms & Conditions</a>
                  </label>

                  <Checkbox
                    id="risk"
                    checked={agreedRisk}
                    onCheckedChange={(v) => setAgreedRisk(Boolean(v))}
                  />
                  <label htmlFor="risk" className="ml-2">
                    I confirm and agree to <a href="#" className="underline">risks associated and consequences</a>
                  </label>
                </div>
              </div>

              {/* footer */}
              <div className="mt-6">
                <Button
                  className="w-full bg-[#ffc628] text-black"
                  onClick={handleSubmit}
                  disabled={!guarantorCode || !agreedTOS || !agreedRisk}
                >
                  Continue
                </Button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};