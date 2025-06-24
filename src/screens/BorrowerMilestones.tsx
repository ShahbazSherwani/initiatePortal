// src/screens/BorrowerMilestones.tsx
import React, { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { X as XIcon, Plus as PlusIcon, ChevronLeft as ChevronLeftIcon } from "lucide-react";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

export const BorrowerMilestones: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <Navbar activePage="my-projects" showAuthButtons={false} />

      <div className="flex flex-1 overflow-hidden">
        {/* desktop sidebar */}
        <div className="hidden md:block w-[325px]">
          <Sidebar activePage="My Issuer/Borrower" />
        </div>

        {/* mobile sidebar toggle omitted for brevity… */}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* header */}
          <div className="flex items-center mb-8">
            <ChevronLeftIcon
              className="w-6 h-6 cursor-pointer"
              onClick={() => navigate(-1)}
            />
            <h1 className="ml-4 text-2xl md:text-3xl font-semibold">
              Milestones
            </h1>
          </div>

          {/* empty state */}
          <div className="flex flex-col items-center justify-center mt-16">
            <img
              src="/16.png"
              alt="No milestones"
              className="w-full max-w-xs md:max-w-md"
            />
            <h2 className="mt-6 text-lg md:text-2xl font-semibold text-center">
              Looks like you don’t have any milestones yet!
            </h2>
            <Button
              className="mt-8 bg-[#ffc628] text-black px-6 py-3 rounded-lg flex items-center gap-2"
              onClick={() => setIsOpen(true)}
            >
              <PlusIcon className="w-5 h-5" /> Add Milestone
            </Button>
          </div>

          {/* add-milestone modal */}
          <Transition appear show={isOpen} as={Fragment}>
            <Dialog
              as="div"
              className="fixed inset-0 z-50 overflow-y-auto"
              onClose={() => setIsOpen(false)}
            >
              <div className="min-h-screen px-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Dialog className="fixed inset-0 bg-black bg-opacity-30" />
                </Transition.Child>

                {/* centering hack */}
                <span className="inline-block h-screen align-middle" aria-hidden="true">
                  &#8203;
                </span>

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
                    {/* modal header */}
                    <div className="flex justify-between items-center mb-4">
                      <Dialog.Title className="text-xl font-bold">
                        Add Milestone
                      </Dialog.Title>
                      <button onClick={() => setIsOpen(false)}>
                        <XIcon className="w-6 h-6 text-gray-500 hover:text-black" />
                      </button>
                    </div>

                    {/* form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <Input
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          placeholder="Milestone title"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            className="w-full pr-10"
                          />
                          {/* <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} /> */}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <Input
                          type="number"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <Textarea
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="Any details…"
                          className="w-full h-24 resize-none"
                        />
                      </div>
                    </div>

                    {/* footer */}
                    <div className="mt-6 flex justify-end">
                      <Button
                        variant="outline"
                        className="mr-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          // TODO: submit milestone to API…
                          setIsOpen(false);
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </Transition.Child>
              </div>
            </Dialog>
          </Transition>
        </main>
      </div>
    </div>
  );
};

export default BorrowerMilestones;
