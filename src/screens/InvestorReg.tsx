// src/screens/InvestorReg.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAccount } from "../contexts/AccountContext";
import { TrendingUpIcon, ArrowLeftIcon } from "lucide-react";

export const InvestorReg: React.FC = () => {
  const navigate = useNavigate();
  const { createAccount } = useAccount();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    location: "",
    phoneNumber: "",
    experience: "",
    investmentPreference: "",
    riskTolerance: "",
    portfolioValue: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createAccount('investor', {
        ...formData,
        portfolioValue: formData.portfolioValue ? parseFloat(formData.portfolioValue) : 0,
        isComplete: true
      });

      // Navigate to investor dashboard
      navigate('/investor/discover');
    } catch (error) {
      console.error('Error creating investor account:', error);
      // Handle error - show toast or error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUpIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Create Investor Account</CardTitle>
            <p className="text-gray-600 mt-2">
              Set up your investor profile to start discovering investment opportunities
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="City, Country"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="experience">Investment Experience</Label>
                <Select onValueChange={(value) => handleInputChange("experience", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your investment experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="investmentPreference">Investment Preference</Label>
                <Select onValueChange={(value) => handleInputChange("investmentPreference", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your investment preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lending">Lending Projects</SelectItem>
                    <SelectItem value="equity">Equity Investments</SelectItem>
                    <SelectItem value="both">Both Lending & Equity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                <Select onValueChange={(value) => handleInputChange("riskTolerance", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your risk tolerance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="portfolioValue">Expected Investment Amount (PHP)</Label>
                <Input
                  id="portfolioValue"
                  type="number"
                  value={formData.portfolioValue}
                  onChange={(e) => handleInputChange("portfolioValue", e.target.value)}
                  placeholder="Enter expected investment amount"
                  min="0"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ffc628] hover:bg-[#ffc628]/90 text-black"
              >
                {loading ? "Creating Account..." : "Create Investor Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
