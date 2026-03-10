import React, { useContext, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ArrowLeftIcon, ChevronLeftIcon, MenuIcon, UploadIcon } from "lucide-react";
import { useProjectForm } from "../contexts/ProjectFormContext";

interface Milestone {
  amount: string;
  percentage: string;
  date: Date | null;
  file: File | null;
  image?: string; // Add this property
}

export const AddMilestones: React.FC = () => {
  const { token } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { form, setForm } = useProjectForm();

  // Campaign date bounds — milestones must fall within the chosen project period
  const campaignMinDate = form.projectDetails?.campaignStartDate
    ? new Date(form.projectDetails.campaignStartDate)
    : undefined;
  const campaignMaxDate = form.projectDetails?.timeDuration
    ? new Date(form.projectDetails.timeDuration)
    : undefined;

  // start with one empty milestone
  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    if (form.milestones && form.milestones.length > 0) {
      return form.milestones.map((m: any) => ({
        amount: m.amount || "",
        percentage: m.percentage || "",
        date: m.date ? new Date(m.date) : null,
        file: m.file || null,
        image: m.image || undefined,
      }));
    }
    return [{ amount: "", percentage: "", date: null, file: null }];
  });

  if (!token) return <Navigate to="/login" />;

  const handleFieldChange = (
    idx: number,
    field: keyof Milestone,
    value: string | Date | File | null
  ) => {
    const updated = [...milestones];
    
    // Special handling for file uploads
    if (field === 'file' && value instanceof File) {
      const file = value as File;
      updated[idx][field] = file;
      
      // Convert the file to a data URL that can be displayed
      const reader = new FileReader();
      reader.onloadend = () => {
        // Store the data URL in the image property
        updated[idx].image = reader.result as string;
        setMilestones([...updated]);
        
        // Update the form context with the new milestones including image
        setForm(f => ({ ...f, milestones: [...updated] }));
        
        console.log("Image saved for milestone", idx, reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      // @ts-ignore
      updated[idx][field] = value;
      setMilestones(updated);
      setForm(f => ({ ...f, milestones: updated }));
    }
  };

  const addMilestone = () => {
    if (milestones.length >= 4) return;
    const updated = [
      ...milestones,
      { amount: "", percentage: "", date: null, file: null },
    ];
    setMilestones(updated);
    setForm(f => ({ ...f, milestones: updated }));
  };

  const removeMilestone = (idx: number) => {
    if (milestones.length <= 1) return;
    const updated = milestones.filter((_, i) => i !== idx);
    setMilestones(updated);
    setForm(f => ({ ...f, milestones: updated }));
  };

  const handleContinue = async () => {
    const totalPct = milestones.reduce(
      (sum, m) => sum + parseFloat(m.percentage || "0"),
      0
    );
    if (totalPct > 100) {
      alert("Total percentage cannot exceed 100%");
      return;
    }
    // milestones already saved in context
    navigate("/borrowROI");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* <Navbar activePage="create-project" showAuthButtons={false} /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop */}
        <div className="hidden md:block w-[325px]">
          <Sidebar activePage="My Issuer/Borrower" />
        </div>
        {/* Mobile sidebar toggle */}
        <div className="md:hidden">
          <button
            className="fixed top-4 left-4 z-50 p-2 rounded-full bg-white shadow"
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            {mobileMenuOpen ? (
              <ChevronLeftIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
          <div
            className={`fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white shadow transform transition-transform ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <Sidebar activePage="My Issuer/Borrower" />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-[90%] mx-auto bg-white rounded-t-[30px] p-4 md:p-8 md:w-full md:mx-0 min-h-screen flex flex-col animate-fadeIn delay-300">
            {/* Header */}
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </Button>
              <h1 className="ml-4 text-2xl md:text-3xl font-semibold">
                Milestones
              </h1>
            </div>

            {/* Add button */}
            <div className="mb-6 text-right">
              <Button
                onClick={addMilestone}
                disabled={milestones.length >= 4}
                className="bg-[#0C4B20] text-white"
              >
                Add Milestone
              </Button>
            </div>

            {/* Milestone forms */}
            <div className="space-y-8">
              {milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-2xl p-6 relative"
                >
                  {milestones.length > 1 && (
                    <button
                      onClick={() => removeMilestone(idx)}
                      className="absolute top-3 right-3 text-gray-500 hover:text-black"
                    >
                      Delete
                    </button>
                  )}
                  <h2 className="text-lg font-medium mb-4">
                    Milestone Condition {idx + 1}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-1 font-medium">Amount</label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={m.amount}
                          onChange={(e) =>
                            handleFieldChange(idx, "amount", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label className="block mb-1 font-medium">
                          Percentage %
                        </label>
                        <Input
                          placeholder="Enter percentage"
                          type="number"
                          value={m.percentage}
                          onChange={(e) =>
                            handleFieldChange(idx, "percentage", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label className="block mb-1 font-medium">
                          Milestone Release Date
                        </label>
                        <DatePicker
                          selected={m.date}
                          onChange={(d) => handleFieldChange(idx, "date", d)}
                          placeholderText="Select date"
                          className="w-full py-3 px-3 rounded-2xl border"
                          dateFormat="dd MMM yyyy"
                          popperClassName="z-50"
                          minDate={campaignMinDate}
                          maxDate={campaignMaxDate}
                        />
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-1 font-medium">
                          Picture of the Project*
                        </label>
                        <label className="cursor-pointer block">
                          <div className="w-full h-40 border-2 border-dashed rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50">
                            {m.image ? (
                              <img
                                src={m.image}
                                alt={`Milestone ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-center text-gray-600">
                                <UploadIcon className="w-8 h-8 mb-2 mx-auto" />
                                <div>Upload</div>
                              </div>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFieldChange(
                                idx,
                                "file",
                                e.target.files?.[0] || null
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue */}
            <div className="mt-8">
              <Button
                className="bg-[#0C4B20] text-white w-full"
                onClick={handleContinue}
              >
                Continue
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddMilestones;
