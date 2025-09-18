import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProjectForm } from "../contexts/ProjectFormContext";
import { useProjects } from "../contexts/ProjectsContext";
import { Button } from "../components/ui/button";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import type { Milestone } from "../types/Milestone";
import { toast, Toaster } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from '../config/environment';

const TABS = ["Details", "Milestones", "ROI (Expense)", "ROI (Sales)", "Payout Schedule"];

const BorwEditProjectLend: React.FC = () => {
  const { form, setForm, loadProject } = useProjectForm();
  const { updateProject, projects } = useProjects();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState("Details");
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // ALL useState hooks must be at the top level - before any conditional logic
  // Details state - Initialize with empty values, will be populated when project loads
  const [loanAmount, setLoanAmount] = useState("");
  const [projectRequirements, setProjectRequirements] = useState("");
  const [investorPercentage, setInvestorPercentage] = useState("");
  const [timeDuration, setTimeDuration] = useState("");
  const [product, setProduct] = useState("");
  const [location, setLocation] = useState("");
  const [overview, setOverview] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Milestone state (example for first milestone)
  const [milestoneAmount, setMilestoneAmount] = useState("");
  const [milestonePercentage, setMilestonePercentage] = useState("");
  const [milestoneDate, setMilestoneDate] = useState<Date | null>(null);
  const [milestoneImage, setMilestoneImage] = useState<string | null>(null);
  const [milestoneFile, setMilestoneFile] = useState<File | null>(null);

  // ROI (Expense) state
  const [expenseDetail, setExpenseDetail] = useState("");
  const [expensePricePerUnit, setExpensePricePerUnit] = useState("");
  const [expenseUnitOfMeasure, setExpenseUnitOfMeasure] = useState("");
  const [expenseTotalAmount, setExpenseTotalAmount] = useState("");

  // ROI (Sales) state
  const [incomeDetail, setIncomeDetail] = useState("");
  const [salesPricePerUnit, setSalesPricePerUnit] = useState("");
  const [salesUnitMeasure, setSalesUnitMeasure] = useState("");
  const [totalSales, setTotalSales] = useState("");
  const [unitsSold, setUnitsSold] = useState("");

  // Payout Schedule state
  const [totalPayoutReq, setTotalPayoutReq] = useState("");
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [scheduleAmount, setScheduleAmount] = useState("");
  const [payoutPercent, setPayoutPercent] = useState("");
  const [netIncome, setNetIncome] = useState("");
  const [penaltyAgree, setPenaltyAgree] = useState(false);
  const [legalAgree, setLegalAgree] = useState(false);

  // Track if we've already loaded the project data to avoid infinite updates
  const [hasLoadedProject, setHasLoadedProject] = useState(false);

  // Update state when form data changes (after project loads)
  useEffect(() => {
    // Only update if we have project data and haven't loaded it yet
    if (form.projectId && !hasLoadedProject) {
      console.log("Form data changed, updating state:", form);
      
      // Update Details state - convert numbers to strings for input fields
      setLoanAmount(form.projectDetails?.loanAmount?.toString() || "");
      setProjectRequirements(form.projectDetails?.projectRequirements || "");
      setInvestorPercentage(form.projectDetails?.investorPercentage?.toString() || "");
      setTimeDuration(form.projectDetails?.timeDuration || "");
      setProduct(form.projectDetails?.product || "");
      setLocation(form.projectDetails?.location || "");
      setOverview(form.projectDetails?.overview || "");
      setVideoLink(form.projectDetails?.videoLink || "");
      setImagePreview(form.projectDetails?.image || null);

      // Update Milestone state
      setMilestoneAmount(form.milestones?.[0]?.amount || "");
      setMilestonePercentage(form.milestones?.[0]?.percentage || "");
      setMilestoneDate(form.milestones?.[0]?.date ? new Date(form.milestones[0].date) : null);
      setMilestoneImage((form.milestones?.[0] as any)?.image || null);

      // Update ROI (Expense) state
      setExpenseDetail(form.roi?.description || "");
      setExpensePricePerUnit(form.roi?.pricePerUnit?.toString() || "");
      setExpenseUnitOfMeasure(form.roi?.unitOfMeasure || "");
      setExpenseTotalAmount(form.roi?.totalAmount?.toString() || "");

      // Update ROI (Sales) state  
      setIncomeDetail(form.sales?.description || "");
      setSalesPricePerUnit(form.sales?.salesPricePerUnit?.toString() || "");
      setSalesUnitMeasure(form.sales?.unitMeasure || "");
      setTotalSales(form.sales?.totalSales?.toString() || "");
      setUnitsSold(form.sales?.unitsSold?.toString() || "");

      // Update Payout Schedule state
      setTotalPayoutReq(form.payoutSchedule?.totalPayoutReq?.toString() || "");
      setScheduleDate(form.payoutSchedule?.scheduleDate ? new Date(form.payoutSchedule.scheduleDate) : null);
      setScheduleAmount(form.payoutSchedule?.scheduleAmount?.toString() || "");
      setPayoutPercent(form.payoutSchedule?.payoutPercent?.toString() || "");
      setNetIncome(form.payoutSchedule?.netIncome?.toString() || "");
      setPenaltyAgree(form.payoutSchedule?.penaltyAgree || false);
      setLegalAgree(form.payoutSchedule?.legalAgree || false);

      setHasLoadedProject(true);
    }
  }, [form, hasLoadedProject]);

  // Check ownership when component mounts or project data changes
  useEffect(() => {
    const checkOwnership = async () => {
      if (!projectId || !profile) {
        console.log("Missing projectId or profile:", { projectId, profile: !!profile });
        setIsAuthorized(false);
        return;
      }

      // Prevent repeated calls if already authorized
      if (isAuthorized === true) {
        console.log("Already authorized, skipping check");
        return;
      }

      try {
        console.log("=== EDIT AUTHORIZATION CHECK ===");
        console.log("Project ID:", projectId);
        console.log("User ID:", profile.id);
        
        // Use authFetch which automatically handles token refresh
        const { authFetch } = await import('../lib/api');
        
        try {
          // Check project ownership using authFetch
          const projectData = await authFetch(`${API_BASE_URL}/projects/${projectId}?edit=true`);
          
          console.log("✅ Project loaded successfully, user is authorized");
          console.log("Project owner:", projectData.firebase_uid, "Current user:", profile.id);
          console.log("Full project data:", projectData);
          
          // Load the project into the form context
          try {
            console.log("Loading project data into form:", projectData);
            loadProject(projectData);
            console.log("✅ Project loaded into form successfully");
            setIsAuthorized(true);
          } catch (loadError) {
            console.error("⚠️ Error loading project into form:", loadError);
            // Still authorize since the user owns it, just couldn't load into form
            setIsAuthorized(true);
          }
        } catch (fetchError: any) {
          console.error("❌ Authorization check failed:", fetchError);
          
          if (fetchError.message?.includes('403')) {
            console.log("❌ User not authorized to edit this project");
          } else if (fetchError.message?.includes('401')) {
            console.log("❌ Authentication failed");
          } else {
            console.log("❌ Project not found or other error");
          }
          
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Error checking project ownership:", error);
        setIsAuthorized(false);
      }
    };

    checkOwnership();
  }, [projectId, profile]); // Removed loadProject from dependencies

  // Show loading while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Show unauthorized message if user doesn't own the project
  if (isAuthorized === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Unauthorized Access</h2>
          <p className="text-gray-600 mb-4">You can only edit projects that you created.</p>
          <Button onClick={() => navigate("/borwMyProj")}>
            Go to My Projects
          </Button>
        </div>
      </div>
    );
  }

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
  const handleSaveDetails = async () => {
    if (!projectId) {
      toast.error("Project ID not found");
      return;
    }

    try {
      // Create the details object with current values, converting strings to numbers where needed
      const detailsData = {
        loanAmount: loanAmount ? parseFloat(loanAmount) : undefined,
        projectRequirements,
        investorPercentage: investorPercentage ? parseFloat(investorPercentage) : undefined,
        timeDuration,
        product,
        location,
        overview,
        videoLink,
        image: imagePreview || undefined, // Convert null to undefined
      };

      // Update the project - context will handle deep merging
      await updateProject(projectId, {
        details: detailsData,
      });

      // Show success feedback
      toast.success("Project details saved successfully!");
      
      // Navigate back to projects page
      navigate("/borwMyProj");
    } catch (error) {
      console.error("Failed to save project details:", error);
      toast.error("Failed to save project details");
    }
  };

  // Save Milestone
  const handleSaveMilestone = async () => {
    if (!projectId) {
      toast.error("Project ID not found");
      return;
    }

    try {
      // Create the milestones array with current state variables
      const updatedMilestones = [{
        id: "milestone-1", // Add required id
        name: "Milestone 1", // Add required name
        amount: milestoneAmount,
        percentage: milestonePercentage,
        date: milestoneDate,
        image: milestoneImage || "", // Ensure image is a string, not null
        file: milestoneFile // Include the file property
      }];
      
      // Update the project directly with just milestones data
      await updateProject(projectId, {
        milestones: updatedMilestones
      });
      
      toast.success("Milestone saved successfully!");
    } catch (error) {
      console.error("Failed to save milestone:", error);
      toast.error("Failed to save milestone");
    }
  };

  // Save ROI (Expense)
  const handleSaveExpense = async () => {
    if (!projectId) {
      toast.error("Project ID not found");
      return;
    }

    try {
      // Create the ROI data object with proper type conversions
      const roiData = {
        description: expenseDetail,
        pricePerUnit: expensePricePerUnit ? parseFloat(expensePricePerUnit) : undefined,
        unitOfMeasure: expenseUnitOfMeasure,
        totalAmount: expenseTotalAmount ? parseFloat(expenseTotalAmount) : undefined
      };
      
      // Send the data to the server
      await updateProject(projectId, { roi: roiData });
      toast.success("ROI expenses saved successfully!");
      // Only navigate after successful update
      navigate("/borwMyProj");
    } catch (error) {
      console.error("Failed to save ROI expenses:", error);
      toast.error("Failed to save ROI expenses");
    }
  };

  // Save ROI (Sales)
  const handleSaveSales = async () => {
    if (!projectId) {
      toast.error("Project ID not found");
      return;
    }

    try {
      const salesData = {
        description: incomeDetail,
        salesPricePerUnit: salesPricePerUnit ? parseFloat(salesPricePerUnit) : undefined,
        unitMeasure: salesUnitMeasure,
        totalSales: totalSales ? parseFloat(totalSales) : undefined,
        unitsSold: unitsSold ? parseFloat(unitsSold) : undefined
      };
      
      // Send only sales data to API
      await updateProject(projectId, { sales: salesData });
      toast.success("ROI sales saved successfully!");
    } catch (error) {
      console.error("Failed to save ROI sales:", error);
      toast.error("Failed to save ROI sales");
    }
  };

  // Save Payout Schedule
  const handleSavePayoutSchedule = async () => {
    if (!projectId) {
      toast.error("Project ID not found");
      return;
    }

    try {
      const payoutData = {
        totalPayoutReq: totalPayoutReq ? parseFloat(totalPayoutReq) : undefined,
        scheduleDate: scheduleDate ? scheduleDate.toISOString() : undefined,
        scheduleAmount: scheduleAmount ? parseFloat(scheduleAmount) : undefined,
        payoutPercent: payoutPercent ? parseFloat(payoutPercent) : undefined,
        netIncome: netIncome ? parseFloat(netIncome) : undefined,
        penaltyAgree: penaltyAgree,
        legalAgree: legalAgree
      };
      
      // Send only payout data to API
      await updateProject(projectId, { payoutSchedule: payoutData });
      toast.success("Payout schedule saved successfully!");
    } catch (error) {
      console.error("Failed to save payout schedule:", error);
      toast.error("Failed to save payout schedule");
    }
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
                  className={`px-4 py-2 rounded-lg font-semibold ${activeTab === tab ? "bg-[#0C4B20] text-white" : "bg-gray-200"}`}
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
                <Button className="mt-8 w-full bg-[#0C4B20] text-white" onClick={handleSaveDetails}>
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
                <Button className="mt-8 w-full bg-[#0C4B20] hover:bg-[#8FB200] text-white" onClick={handleSaveMilestone}>
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

                <Button className="mt-8 w-full bg-[#0C4B20] hover:bg-[#8FB200] text-white" onClick={handleSaveExpense}>
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

                <Button className="mt-8 w-full bg-[#0C4B20] hover:bg-[#8FB200] text-white" onClick={handleSaveSales}>
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

                <Button className="mt-8 w-full bg-[#0C4B20] hover:bg-[#8FB200] text-white" onClick={handleSavePayoutSchedule}>
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