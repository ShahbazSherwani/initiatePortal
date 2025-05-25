// src/screens/LogIn/BorrowReg.tsx
import React from "react";
import { Navbar } from "../components/Navigation/navbar";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "../components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export const BorrowerReg = (): JSX.Element => {
  const formSections = {
    identification: {
      title: "Personal Identification (Individual)",
      fields: [
        {
          name: "nationalId",
          label: "National/Government ID No.*",
          placeholder: "Enter here",
          note: "",
        },
        {
          name: "passport",
          label: "Passport Number",
          placeholder: "Enter here",
          note: "(required for funding of >Php100,000)",
        },
        {
          name: "tin",
          label: "TIN",
          placeholder: "Enter here",
          note: "(required for funding of >Php100,000)",
        },
      ],
    },
    address: {
      title: "Home Address",
      fields: [
        { name: "street", label: "Street",          type: "text",   placeholder: "Enter here" },
        { name: "barangay", label: "Barangay",      type: "text",   placeholder: "Enter here" },
        { name: "municipality", label: "Municipality", type: "text", placeholder: "Enter here" },
        { name: "province", label: "Province",      type: "text", placeholder: "Enter here" },
        { name: "city",  label: "City",       type: "select", placeholder: "Please select" },
        { name: "country",  label: "Country",       type: "select", placeholder: "Please select" },
        { name: "postalCode", label: "Postal Code", type: "text",   placeholder: "Enter here" },
      ],
    },
    documents: {
      fields: [
        { name: "proofOfBilling", label: "Upload Proof of Billing", type: "upload" },
        { name: "picture",        label: "Upload Picture",          type: "upload" },
      ],
    },
  };

  return (
    <div className="bg-white min-h-screen w-full relative overflow-hidden">
      {/* 1) Navbar sits at top */}
      <Navbar activePage="register" showAuthButtons />

      {/*
        2) Container: take full viewport minus navbar height.
           Replace 64px with your actual navbar height if needed.
      */}
      <div
        className="
flex flex-col md:flex-row h-[calc(100vh-64px)] px-4 md:px-20 py-10

        "
      >
        {/*
          3) Left: the form. Let it scroll vertically.
        */}
        <div className="md:w-2/3 overflow-y-auto pr-4">
          <div className="relative z-10 mx-auto max-w-2xl space-y-8 px-4">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#ffc00f] rounded-lg flex items-center justify-center">
                <img className="w-10 h-10" src="/debt-1.png" alt="Debt" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Issue/Borrow</h2>
            </div>

            {/* Option Selection */}
            <div>
              <p className="font-medium text-lg mb-2">Please select an option</p>
              <RadioGroup defaultValue="individual" className="flex flex-col sm:flex-row gap-4">
                {["individual", "msme"].map((val) => (
                  <label
                    key={val}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg border
                      ${val === "individual" ? "bg-[url('/radio-btns.svg')] bg-cover" : "bg-white"}
                    `}
                  >
                    <RadioGroupItem value={val} id={val} className="mr-2" />
                    <span className="capitalize">{val}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Identification Section */}
            <section className="space-y-4">
              <h3 className="text-xl md:text-2xl font-semibold">
                {formSections.identification.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formSections.identification.fields.map(({ name, label, placeholder, note }) => (
                  <div key={name} className="space-y-2">
                    <Label>{label}</Label>
                    <Input placeholder={placeholder} className="h-14 rounded-2xl" />
                    {note && <p className="text-sm text-gray-600">{note}</p>}
                  </div>
                ))}

                {/* Upload Buttons */}
                {formSections.documents.fields.map((field, idx) => (
                  <div key={field.name} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Button className="h-14 bg-[#ffc00f] flex items-center justify-center gap-2 rounded-2xl">
                      <img
                        className="w-5 h-5"
                        src={idx === 0 ? "/group-13-2.png" : "/group-13-3.png"}
                        alt="Upload icon"
                      />
                      Upload
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            {/* Address Section */}
            <section className="space-y-4">
              <h3 className="text-xl md:text-2xl font-semibold">
                {formSections.address.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formSections.address.fields.map(({ name, label, type, placeholder }) => (
                  <div key={name} className="space-y-2">
                    <Label>{label}</Label>
                    {type === "select" ? (
                      <Select>
                        <SelectTrigger className="h-14 rounded-2xl">
                          <SelectValue placeholder={placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="opt1">Option 1</SelectItem>
                          <SelectItem value="opt2">Option 2</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input placeholder={placeholder} className="h-14 rounded-2xl" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/*
          4) Right: testimonials, fixed full height of its column.
        */}
        <div className="hidden md:block md:w-1/3 flex-shrink-0">
          <div className="h-full">
            <Testimonials />
          </div>
        </div>
      </div>
    </div>
  );
};
