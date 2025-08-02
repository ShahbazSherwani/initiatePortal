import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProjectForm } from "../contexts/ProjectFormContext";
import { useProjects } from "../contexts/ProjectsContext";
import { Button } from "../components/ui/button";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import type { Milestone } from "../types/Milestone";
import { toast, Toaster } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const TABS = ["Details", "Milestones", "ROI (Expense)", "ROI (Sales)", "Payout Schedule"];

const BorwEditProjectLend: React.FC = () => {
  const { form, setForm, loadProject } = useProjectForm();
  const { updateProject } = useProjects();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Details");

  // Details state
  const [loanAmount, setLoanAmount] = useState(form.projectDetails.loanAmount || "");
  const [projectRequirements, setProjectRequirements] = useState(form.projectDetails.projectRequirements || "");
  const [investorPercentage, setInvestorPercentage] = useState(form.projectDetails.investorPercentage || "");
  const [timeDuration, setTimeDuration] = useState(form.projectDetails.timeDuration || "");
  const [product, setProduct] = useState(form.projectDetails.product || "");
  const [location, setLocation] = useState(form.projectDetails.location || "");
  const [overview, setOverview] = useState(form.projectDetails.overview || "");
  const [videoLink, setVideoLink] = useState(form.projectDetails.videoLink || "");
  const [imagePreview, setImagePreview] = useState<string | null>(form.projectDetails.image || null);

  // Milestone state (example for first milestone)
  const [milestoneAmount, setMilestoneAmount] = useState(form.milestones?.[0]?.amount || "");
  const [milestonePercentage, setMilestonePercentage] = useState(form.milestones?.[0]?.percentage || "");
  const [milestoneDate, setMilestoneDate] = useState<Date | null>(
    form.milestones?.[0]?.date ? new Date(form.milestones[0].date) : null
  );
  const [milestoneImage, setMilestoneImage] = useState<string | null>(form.milestones?.[0]?.image || null);
  const [milestoneFile, setMilestoneFile] = useState<File | null>(null); // <-- New state for file

  // ROI (Expense) state
  const [expenseDetail, setExpenseDetail] = useState(form.roi?.expenseDetail || "");
  const [expensePricePerUnit, setExpensePricePerUnit] = useState(form.roi?.pricePerUnit || "");
  const [expenseUnitOfMeasure, setExpenseUnitOfMeasure] = useState(form.roi?.unitOfMeasure || "");
  const [expenseTotalAmount, setExpenseTotalAmount] = useState(form.roi?.totalAmount || "");

  // ROI (Sales) state
  const [incomeDetail, setIncomeDetail] = useState(form.sales?.incomeDetail || "");
  const [salesPricePerUnit, setSalesPricePerUnit] = useState(form.sales?.pricePerUnit || "");
  const [salesUnitMeasure, setSalesUnitMeasure] = useState(form.sales?.unitMeasure || "");
  const [totalSales, setTotalSales] = useState(form.sales?.totalSales || "");
  const [unitsSold, setUnitsSold] = useState(form.sales?.unitsSold || "");

  // Payout Schedule state
  const [totalPayoutReq, setTotalPayoutReq] = useState(form.payoutSchedule?.totalPayoutReq || "");
  const [scheduleDate, setScheduleDate] = useState<Date | null>(
    form.payoutSchedule?.scheduleDate ? new Date(form.payoutSchedule.scheduleDate) : null
  );
  const [scheduleAmount, setScheduleAmount] = useState(form.payoutSchedule?.scheduleAmount || "");
  const [payoutPercent, setPayoutPercent] = useState(form.payoutSchedule?.payoutPercent || "");
  const [netIncome, setNetIncome] = useState(form.payoutSchedule?.netIncome || "");
  const [penaltyAgree, setPenaltyAgree] = useState(form.payoutSchedule?.penaltyAgree || false);
  const [legalAgree, setLegalAgree] = useState(form.payoutSchedule?.legalAgree || false);

  // Handle image upload for details
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setForm(f => ({
          ...f,
          projectDetails: {
            ...f.projectDetails,
            image: reader.result,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload for milestone
  const handleMilestoneImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMilestoneFile(file); // <-- Store the File object

      const reader = new FileReader();
      reader.onloadend = () => {
        setMilestoneImage(reader.result as string); // <-- Store the image data URL
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Details
  const handleSaveDetails = () => {
    // First, update form state
    setForm(f => ({
      ...f,
      projectDetails: {
        ...f.projectDetails,
        loanAmount,
        projectRequirements,
        investorPercentage,
        timeDuration,
        product,
        location,
        overview,
        videoLink,
        image: imagePreview,
      },
    }));

    // Then update the actual project
    updateProject(form.projectId, {
      details: {
        ...form.projectDetails,
        loanAmount,
        projectRequirements,
        investorPercentage,
        timeDuration,
        product,
        location,
        overview,
        videoLink,
        image: imagePreview,
      },
    });

    // Show success feedback
    toast.success("Project details saved successfully!");
    
    // Navigate back to projects page
    navigate("/borwMyProj");
  };

  // Save Milestone
  const handleSaveMilestone = () => {
    // First update the form state with current state variables
    const updatedMilestones = [{
      amount: milestoneAmount,
      percentage: milestonePercentage,
      date: milestoneDate,
      image: milestoneImage
    }];
    
    setForm(f => ({
      ...f,
      milestones: updatedMilestones
    }));
    
    // Then update the project directly with just milestones data
    updateProject(form.projectId, {
      milestones: updatedMilestones
    })
    .then(() => {
      toast.success("Milestone saved successfully!");
    })
    .catch(error => {
      console.error("Failed to save milestone:", error);
      toast.error("Failed to save milestone");
    });
  };

  // Save ROI (Expense)
  const handleSaveExpense = () => {
    // First create the ROI data object
    const roiData = {
      expenseDetail,
      pricePerUnit: expensePricePerUnit,
      unitOfMeasure: expenseUnitOfMeasure,
      totalAmount: expenseTotalAmount
    };
    
    // Update the form state
    setForm(f => ({
      ...f,
      roi: roiData
    }));
    
    // IMPORTANT: Send the data to the server before navigating
    updateProject(form.projectId, { roi: roiData })
      .then(() => {
        toast.success("ROI expenses saved successfully!");
        // Only navigate after successful update
        navigate("/borwMyProj");
      })
      .catch(error => {
        console.error("Failed to save ROI expenses:", error);
        toast.error("Failed to save ROI expenses");
      });
  };

  // Save ROI (Sales)
  const handleSaveSales = () => {
    const salesData = {
      incomeDetail: incomeDetail,
      pricePerUnit: salesPricePerUnit,
      unitMeasure: salesUnitMeasure,
      totalSales: totalSales,
      unitsSold: unitsSold
    };
    
    setForm(f => ({
      ...f,
      sales: salesData
    }));
    
    // Send only sales data to API
    updateProject(form.projectId, { sales: salesData })
    .then(() => {
      toast.success("ROI sales saved successfully!");
    })
    .catch(error => {
      console.error("Failed to save ROI sales:", error);
      toast.error("Failed to save ROI sales");
    });
  };

  // Save Payout Schedule
  const handleSavePayoutSchedule = () => {
    const payoutData = {
      totalPayoutReq: totalPayoutReq,
      scheduleDate: scheduleDate ? scheduleDate.toISOString() : null,
      scheduleAmount: scheduleAmount,
      payoutPercent: payoutPercent,
      netIncome: netIncome,
      penaltyAgree: penaltyAgree,
      legalAgree: legalAgree
    };
    
    setForm(f => ({
      ...f,
      payoutSchedule: payoutData
    }));
    
    // Send only payout data to API
    updateProject(form.projectId, { payoutSchedule: payoutData })
    .then(() => {
      toast.success("Payout schedule saved successfully!");
    })
    .catch(error => {
      console.error("Failed to save payout schedule:", error);
      toast.error("Failed to save payout schedule");
    });
  };

  // Example of updating milestones in the form
  const handleMilestoneChange = (index, field, value) => {
    const updatedMilestones = [...form.milestones];
    updatedMilestones[index][field] = value;
    
    setForm({
      ...form,
      milestones: updatedMilestones
    });
  };

  // Example of updating ROI in the form
  const handleROIChange = (field, value) => {
    setForm({
      ...form,
      roi: {
        ...form.roi,
        [field]: value
      }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* <Navbar activePage="my-projects" showAuthButtons={false} /> */}
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block w-[325px]">
          <Sidebar activePage="My Issuer/Borrower" />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Edit Project</h2>
            {/* Tabs */}
            <div className="flex gap-2 mb-8">
              {TABS.map(tab => (
                <button
                  key={tab}
                  className={`px-4 py-2 rounded-lg font-semibold ${activeTab === tab ? "bg-[#ffc628] text-black" : "bg-gray-200"}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "Details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-medium">Project Requirements</label>
                  <input className="input" value={projectRequirements} onChange={e => setProjectRequirements(e.target.value)} />
                  <label className="block mt-4 mb-2 font-medium">Loan Amount</label>
                  <input className="input" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} />
                  <label className="block mt-4 mb-2 font-medium">Investor Percentage</label>
                  <input className="input" value={investorPercentage} onChange={e => setInvestorPercentage(e.target.value)} />
                  <label className="block mt-4 mb-2 font-medium">Time Duration</label>
                  <input className="input" value={timeDuration} onChange={e => setTimeDuration(e.target.value)} />
                  <label className="block mt-4 mb-2 font-medium">Product</label>
                  <input className="input" value={product} onChange={e => setProduct(e.target.value)} />
                  <label className="block mt-4 mb-2 font-medium">Location</label>
                  <input className="input" value={location} onChange={e => setLocation(e.target.value)} />
                  <label className="block mt-4 mb-2 font-medium">Project Overview</label>
                  <textarea className="input" value={overview} onChange={e => setOverview(e.target.value)} />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Upload Picture</label>
                  <div className="border-dashed border-2 border-gray-300 rounded-lg p-4 flex flex-col items-center">
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                    {imagePreview && <img src={imagePreview} alt="Preview" className="w-40 h-40 object-cover mt-4 rounded-lg" />}
                  </div>
                  <label className="block mt-4 mb-2 font-medium">Video Attestation</label>
                  <input className="input" value={videoLink} onChange={e => setVideoLink(e.target.value)} />
                </div>
                <Button className="mt-8 w-full bg-[#ffc628] text-black" onClick={handleSaveDetails}>
                  Save & Continue
                </Button>
              </div>
            )}

            {activeTab === "Milestones" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Milestone Condition 1</h3>
                <label className="block mb-2 font-medium">Amount</label>
                <input className="input" value={milestoneAmount} onChange={e => setMilestoneAmount(e.target.value)} />
                <label className="block mt-4 mb-2 font-medium">Percentage %</label>
                <input className="input" value={milestonePercentage} onChange={e => setMilestonePercentage(e.target.value)} />
                <label className="block mt-4 mb-2 font-medium">Milestone Release Date</label>
                <input
                  className="input"
                  type="date"
                  value={milestoneDate ? milestoneDate.toISOString().substring(0, 10) : ""}
                  onChange={e => setMilestoneDate(e.target.value ? new Date(e.target.value) : null)}
                />
                <label className="block mt-4 mb-2 font-medium">Picture of the Project</label>
                <div className="border-dashed border-2 border-gray-300 rounded-lg p-4 flex flex-col items-center">
                  <input type="file" accept="image/*" onChange={handleMilestoneImageUpload} />
                  {milestoneImage && <img src={milestoneImage} alt="Milestone" className="w-40 h-40 object-cover mt-4 rounded-lg" />}
                </div>
                <Button className="mt-8 w-full bg-[#ffc628] text-black" onClick={handleSaveMilestone}>
                  Save & Continue
                </Button>
              </div>
            )}

            {activeTab === "ROI (Expense)" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Expense</h3>
                <label className="block mb-2 font-medium">Expense Detail</label>
                <textarea
                  className="input w-full"
                  value={expenseDetail}
                  onChange={e => setExpenseDetail(e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block mb-2 font-medium">Price per unit</label>
                    <input
                      className="input w-full"
                      value={expensePricePerUnit}
                      onChange={e => setExpensePricePerUnit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium">Unit of Measure</label>
                    <input
                      className="input w-full"
                      value={expenseUnitOfMeasure}
                      onChange={e => setExpenseUnitOfMeasure(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium">Total Amount</label>
                    <input
                      className="input w-full"
                      value={expenseTotalAmount}
                      onChange={e => setExpenseTotalAmount(e.target.value)}
                    />
                  </div>
                </div>

                <Button className="mt-8 w-full bg-[#ffc628] text-black" onClick={handleSaveExpense}>
                  Save & Continue
                </Button>
              </div>
            )}

            {activeTab === "ROI (Sales)" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Sales</h3>
                <label className="block mb-2 font-medium">Income Detail</label>
                <textarea
                  className="input w-full"
                  value={incomeDetail}
                  onChange={e => setIncomeDetail(e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block mb-2 font-medium">Price per unit</label>
                    <input
                      className="input w-full"
                      value={salesPricePerUnit}
                      onChange={e => setSalesPricePerUnit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium">Unit Measure</label>
                    <input
                      className="input w-full"
                      value={salesUnitMeasure}
                      onChange={e => setSalesUnitMeasure(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium">Units Sold</label>
                    <input
                      className="input w-full"
                      value={unitsSold}
                      onChange={e => setUnitsSold(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block mb-2 font-medium">Total Sales</label>
                  <input
                    className="input w-full"
                    value={totalSales}
                    onChange={e => setTotalSales(e.target.value)}
                  />
                </div>

                <Button className="mt-8 w-full bg-[#ffc628] text-black" onClick={handleSaveSales}>
                  Save & Continue
                </Button>
              </div>
            )}

            {activeTab === "Payout Schedule" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Payout Schedule</h3>
                <label className="block mb-2 font-medium">Total Payout Request</label>
                <input
                  className="input w-full"
                  value={totalPayoutReq}
                  onChange={e => setTotalPayoutReq(e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block mb-2 font-medium">Schedule Date</label>
                    <input
                      className="input w-full"
                      type="date"
                      value={scheduleDate ? scheduleDate.toISOString().substring(0, 10) : ""}
                      onChange={e => setScheduleDate(e.target.value ? new Date(e.target.value) : null)}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium">Schedule Amount</label>
                    <input
                      className="input w-full"
                      value={scheduleAmount}
                      onChange={e => setScheduleAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block mb-2 font-medium">Payout Percentage</label>
                    <input
                      className="input w-full"
                      value={payoutPercent}
                      onChange={e => setPayoutPercent(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-medium">Net Income</label>
                    <input
                      className="input w-full"
                      value={netIncome}
                      onChange={e => setNetIncome(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-start mb-4">
                    <input
                      type="checkbox"
                      id="penaltyAgree"
                      className="mt-1"
                      checked={penaltyAgree}
                      onChange={e => setPenaltyAgree(e.target.checked)}
                    />
                    <label htmlFor="penaltyAgree" className="ml-2">
                      I agree to the penalty clause if the project does not meet its milestones.
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="legalAgree"
                      className="mt-1"
                      checked={legalAgree}
                      onChange={e => setLegalAgree(e.target.checked)}
                    />
                    <label htmlFor="legalAgree" className="ml-2">
                      I have read and agree to the legal terms and conditions.
                    </label>
                  </div>
                </div>

                <Button className="mt-8 w-full bg-[#ffc628] text-black" onClick={handleSavePayoutSchedule}>
                  Save & Continue
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

export default BorwEditProjectLend;