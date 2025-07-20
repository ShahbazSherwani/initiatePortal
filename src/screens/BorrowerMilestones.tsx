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
import { AddMilestones } from "../screens/AddMilestones";

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

        <main className="flex-1 overflow-y-auto">
          <div className="w-[90%] mx-auto bg-white rounded-t-[30px] p-4 md:p-8 md:w-full md:mx-0 min-h-screen flex flex-col animate-fadeIn delay-300">
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
                onClick={() => {navigate("/addMilestones");}}
              >
                <PlusIcon className="w-5 h-5" /> Add Milestone
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BorrowerMilestones;
