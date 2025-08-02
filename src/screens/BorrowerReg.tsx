import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRegistration } from "../contexts/RegistrationContext";
import { Country, State, City } from "country-state-city";
import { Navbar } from "../components/Navigation/navbar";
import { Testimonials } from "../screens/LogIn/Testimonials";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";

export const BorrowerReg = (): JSX.Element => {
  const location = useLocation();
  const initialAccountType = location.state?.accountType || "individual";
  const [accountType, setAccountType] = useState(initialAccountType);

  // Identification
  const [nationalId, setNationalId] = useState("");
  const [passport, setPassport] = useState("");
  const [tin, setTin] = useState("");

  // Address
  const [street, setStreet] = useState("");
  const [barangay, setBarangay] = useState("");

  // Location selects
  const [countryIso, setCountryIso] = useState("");
  const [stateIso, setStateIso] = useState("");
  const [cityName, setCityName] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const countries = Country.getAllCountries();
  const states = countryIso ? State.getStatesOfCountry(countryIso) : [];
  const cities = stateIso ? City.getCitiesOfState(countryIso, stateIso) : [];

  const { setRegistration } = useRegistration();
  const navigate = useNavigate();

  const handleAccountTypeSelect = (type: string) => {
    setAccountType(type);
    setRegistration(reg => ({ ...reg, accountType: type }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegistration(reg => ({
      ...reg,
      accountType,
      details: {
        nationalId,
        passport,
        tin,
        street,
        barangay,
        countryIso,
        stateIso,
        cityName,
        postalCode,
      },
    }));
    navigate("/borrowocu");
  };

  return (
    <div className="bg-white min-h-screen w-full relative overflow-hidden z-10">
      {/* <Navbar activePage="register" showAuthButtons /> */}

      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] px-4 md:px-20 py-10">
        {/* ─── FORM ─── */}
        <form
          onSubmit={handleSubmit}
          className="md:w-2/4 overflow-y-auto pr-4 space-y-8"
          noValidate
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#ffc00f] rounded-lg flex items-center justify-center">
              <img className="w-10 h-10" src="/debt-1.png" alt="Debt" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Issue/Borrow</h2>
          </div>

          {/* Option */}
          <div>
            <p className="font-medium text-lg mb-2">Please select an option</p>
            <RadioGroup
              value={accountType}
              onValueChange={handleAccountTypeSelect}
              className="flex flex-col sm:flex-row gap-4"
            >
              {["individual", "msme"].map(val => (
                <label
                  key={val}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border
                    ${accountType === val
                      ? "bg-[url('/radio-btns.svg')] bg-cover"
                      : "bg-white"}
                  `}
                >
                  <RadioGroupItem value={val} id={val} className="mr-2" />
                  <span className="capitalize">{val}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Identification */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">
              Personal Identification (Individual)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* National ID */}
              <div className="space-y-2">
                <Label>National/Government ID No.*</Label>
                <Input
                  required
                  value={nationalId}
                  onChange={e => setNationalId(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Upload ID Copy */}
              <div className="space-y-2">
                <Label>Upload ID Copy</Label>
                <Button className="w-full h-14 bg-[#ffc00f] rounded-2xl flex items-center justify-center gap-2">
                  <span className="text-2xl">+</span> Upload
                </Button>
              </div>
              {/* Passport */}
              <div className="space-y-2">
                <Label>Passport Number*</Label>
                <Input
                  required
                  value={passport}
                  onChange={e => setPassport(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
                <p className="text-sm text-gray-600">
                  (required for funding of &gt;Php100,000)
                </p>
              </div>
              {/* Upload Passport */}
              <div className="space-y-2">
                <Label>Upload Passport Copy</Label>
                <Button className="w-full h-14 bg-[#ffc00f] rounded-2xl flex items-center justify-center gap-2">
                  <span className="text-2xl">+</span> Upload
                </Button>
              </div>
              {/* TIN */}
              <div className="sm:col-span-2 space-y-2">
                <Label>TIN*</Label>
                <Input
                  required
                  value={tin}
                  onChange={e => setTin(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="space-y-4">
            <h3 className="text-xl md:text-2xl font-semibold">Home Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Street */}
              <div className="space-y-2">
                <Label>Street*</Label>
                <Input
                  required
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Barangay */}
              <div className="space-y-2">
                <Label>Barangay*</Label>
                <Input
                  required
                  value={barangay}
                  onChange={e => setBarangay(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>
              {/* Country */}
              <div className="space-y-2">
                <Label>Country*</Label>
                <Select
                  required
                  value={countryIso}
                  onValueChange={iso => {
                    setCountryIso(iso);
                    setStateIso("");
                    setCityName("");
                  }}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.isoCode} value={c.isoCode}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* State/Province */}
              <div className="space-y-2">
                <Label>State / Province*</Label>
                <Select
                  required
                  value={stateIso}
                  onValueChange={iso => {
                    setStateIso(iso);
                    setCityName("");
                  }}
                  disabled={!countryIso}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(s => (
                      <SelectItem key={s.isoCode} value={s.isoCode}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* City */}
              <div className="space-y-2">
                <Label>City*</Label>
                <Select
                  value={cityName}
                  onValueChange={setCityName}
                  disabled={!stateIso}
                >
                  <SelectTrigger className="h-14 rounded-2xl">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(ci => (
                      <SelectItem key={ci.name} value={ci.name}>
                        {ci.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Postal Code */}
              <div className="space-y-2">
                <Label>Postal Code*</Label>
                <Input
                  required
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  placeholder="Enter here"
                  className="h-14 rounded-2xl"
                />
              </div>
            </div>
          </section>

          {/* Next */}
          <div className="pt-4">
            <Button type="submit" className="w-full md:w-1/3 h-14 bg-[#ffc00f] rounded-2xl font-medium">
              Next
            </Button>
          </div>
        </form>

        {/* ─── TESTIMONIALS ─── */}
        <div className="hidden md:block md:w-1/3 flex-shrink-0">
          <Testimonials />
        </div>
      </div>
    </div>
  );
};

export default BorrowerReg;