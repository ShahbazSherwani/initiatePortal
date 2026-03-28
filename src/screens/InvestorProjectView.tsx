// src/screens/InvestorProjectView.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from '../config/environment';
import { authFetch } from '../lib/api';
import { createPaymentCheckout } from '../lib/paymongo';
import { InvestorEducationModal } from '../components/InvestorEducationModal';
// @ts-ignore - JSX component without type declarations
import CampaignPage from './Updated Campaign Page/CampaignPage';

// Interface for insufficient funds error (kept for reference, not used with PayMongo)
interface InsufficientFundsError {
  show: boolean;
  currentBalance: number;
  requiredAmount: number;
  shortfall: number;
}

export const InvestorProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { profile } = React.useContext(AuthContext)!;
  const navigate = useNavigate();
  
  console.log("🎯 InvestorProjectView loaded with projectId:", projectId);
  
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);
  const [educationCompleted, setEducationCompleted] = useState<boolean | null>(null);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [reconfirmLoading, setReconfirmLoading] = useState(false);
  const [cancelInvestmentLoading, setCancelInvestmentLoading] = useState(false);
  // const [showTopUpModal, setShowTopUpModal] = useState(false); // Disabled for PayMongo
  const [insufficientFundsError, setInsufficientFundsError] = useState<InsufficientFundsError>({
    show: false,
    currentBalance: 0,
    requiredAmount: 0,
    shortfall: 0
  });

  // Disclosure form states
  const [declarationForm, setDeclarationForm] = useState<{ name: string; data: string } | null>(null);
  const [investmentLimitForm, setInvestmentLimitForm] = useState<{ name: string; data: string } | null>(null);
  const [riskAcknowledgementForm, setRiskAcknowledgementForm] = useState<{ name: string; data: string } | null>(null);
  const declarationFormRef = useRef<HTMLInputElement>(null);
  const investmentLimitFormRef = useRef<HTMLInputElement>(null);
  const riskAcknowledgementFormRef = useRef<HTMLInputElement>(null);
  const allDisclosureFormsUploaded = !!declarationForm && !!investmentLimitForm && !!riskAcknowledgementForm;
  
  // Helper function to format duration
  const formatDuration = (duration: string) => {
    if (!duration) return "N/A";
    
    try {
      const date = new Date(duration);
      if (isNaN(date.getTime())) return duration; // Return original if not a valid date
      
      // Format as user-friendly date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return duration; // Return original if formatting fails
    }
  };
  
  // Check if user is trying to invest in their own project
  const isOwnProject = project?.firebase_uid === profile?.id;
  
  // Check if user already has an investment in this project
  const investorRequests = project?.project_data?.investorRequests || [];
  const userInvestment = investorRequests.find((req: any) => req.investorId === profile?.id);
  const hasExistingInvestment = !!userInvestment;
  
  console.log("🔍 InvestorProjectView - Project owner:", project?.firebase_uid);
  console.log("🔍 InvestorProjectView - Current user:", profile?.id);
  console.log("🔍 InvestorProjectView - Is own project:", isOwnProject);
  console.log("🔍 InvestorProjectView - Investor requests:", investorRequests);
  console.log("🔍 InvestorProjectView - User investment:", userInvestment);
  console.log("🔍 InvestorProjectView - Has existing investment:", hasExistingInvestment);
  
  // Fetch project data directly from API
  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log("InvestorProjectView - fetching project with ID:", projectId);
        const projectData = await authFetch(`${API_BASE_URL}/projects/${projectId}`);
        console.log("InvestorProjectView - fetched project data:", projectData);
        console.log("InvestorProjectView - project details:", projectData?.project_data?.details);
        setProject(projectData);
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Fetch investor classification + remaining limit
  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        const data = await authFetch(`${API_BASE_URL}/user/investment-eligibility`);
        setEligibility(data);
      } catch (e) {
        // non-blocking
      }
    };
    fetchEligibility();
  }, []);

  // Fetch investor education status
  useEffect(() => {
    const checkEducation = async () => {
      try {
        const data = await authFetch(`${API_BASE_URL}/user/education-status`);
        setEducationCompleted(data.completed === true);
      } catch {
        setEducationCompleted(false);
      }
    };
    checkEducation();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Loading project...</div>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-500">Project not found</div>
      </div>
    );
  }
  
  const projectData = project.project_data || {};
  const details = projectData.details || {};
  
  // Disclosure form download handlers
  const handleDownloadDisclosureForm = (filename: string) => {
    const a = document.createElement('a');
    a.href = `/${filename}`;
    a.download = filename;
    a.click();
  };

  // Generic disclosure form upload handler
  const handleDisclosureFormUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<{ name: string; data: string } | null>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setter({ name: file.name, data: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // PayMongo payment handler - redirects to PayMongo checkout
  const handleInvest = async () => {
    console.log("🎯 handleInvest called with amount:", investmentAmount);
    
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    const amount = parseFloat(investmentAmount);
    
    // Minimum investment check (PayMongo minimum is 100 PHP)
    if (amount < 100) {
      toast.error("Minimum investment amount is ₱100");
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      console.log("💳 Creating PayMongo checkout for project:", projectId);
      
      const result = await createPaymentCheckout({
        amount: amount,
        projectId: projectId!,
        projectName: details.product || "Investment Project",
        description: `Investment in ${details.product || "project"}`,
        disclosureForms: {
          declarationForm: declarationForm || undefined,
          investmentLimitForm: investmentLimitForm || undefined,
          riskAcknowledgementForm: riskAcknowledgementForm || undefined,
        },
      });
      
      console.log("📥 PayMongo checkout result:", result);
      
      if (result.success && result.checkoutUrl) {
        toast.success("Redirecting to payment...");
        // Redirect to PayMongo checkout page
        window.location.href = result.checkoutUrl;
      } else {
        console.log("❌ Payment checkout failed:", result);
        toast.error(result.error || "Failed to create payment checkout");
      }
    } catch (error: any) {
      console.error('💥 Payment error:', error);
      toast.error(error?.message || "An error occurred while processing payment");
    } finally {
      setProcessingPayment(false);
    }
  };
  const handleReconfirmInvestment = async () => {
    setReconfirmLoading(true);
    try {
      await authFetch(`${API_BASE_URL}/investor/projects/${projectId}/reconfirm`, { method: 'POST' });
      toast.success('Investment reconfirmed! Your commitment is maintained.');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reconfirm investment');
    } finally {
      setReconfirmLoading(false);
    }
  };

  const handleCancelInvestment = async () => {
    if (!window.confirm('Are you sure you want to cancel your investment? This action cannot be undone.')) return;
    setCancelInvestmentLoading(true);
    try {
      await authFetch(`${API_BASE_URL}/investor/projects/${projectId}/cancel-investment`, { method: 'POST' });
      toast.success('Your investment has been cancelled and your funds will be returned.');
      setTimeout(() => navigate('/investor/projects'), 1200);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel investment');
    } finally {
      setCancelInvestmentLoading(false);
    }
  };
  // ── Data mapping for CampaignPage ──
  const issuer = projectData.issuerForm || {} as any;
  
  const campaignProps = {
    title: details.product || "Unnamed Project",
    status: projectData.escrowStatus
      ? projectData.escrowStatus.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      : projectData.approvalStatus === 'approved' ? 'Pending' : (projectData.status || 'Pending'),
    description: details.overview || "",
    riskLevel: details.riskLevel || "Medium",
    requiredFunding: `₱${parseFloat(details.projectRequirements || details.loanAmount || details.investmentAmount || "0").toLocaleString()}`,
    estReturn: `${details.investorPercentage || "N/A"}%`,
    duration: formatDuration(details.timeDuration),
    minInvestment: 100,
    retailLimit: eligibility ? `₱${(eligibility.maxInvestmentAmount || 0).toLocaleString()}` : "—",
    used: eligibility ? `₱${((eligibility.maxInvestmentAmount || 0) - Math.max(0, eligibility.remainingCapacity || 0)).toLocaleString()}` : "—",
    remainingCapacity: eligibility ? `₱${Math.max(0, eligibility.remainingCapacity || 0).toLocaleString()}` : "—",
  };

  const companyProps = {
    name: issuer.companyName || project.full_name || "Issuer",
    registeredName: issuer.companyName || "",
    industry: issuer.natureOfBusiness ? issuer.natureOfBusiness.substring(0, 80) : (projectData.type === "equity" ? "Equity Crowdfunding" : "Lending"),
    city: issuer.addressCity || details.location || "",
    yearFounded: issuer.signatureDate ? new Date(issuer.signatureDate).getFullYear() : null,
    secRegistration: issuer.secRegNo || "",
    description: issuer.natureOfBusiness || details.overview || "",
    teamSize: issuer.totalEmployees || "",
    website: issuer.website || "",
    logoUrl: null as string | null,
  };

  // Map gallery from project image
  const gallery = details.image
    ? [{ id: 1, url: details.image, caption: details.product || "Project Image" }]
    : [];

  // Map directors from issuerForm
  const directorsData = (issuer.directorsOfficers || []).map((d: any) => ({
    name: d.fullName || "Director",
    position: d.currentPosition || d.currentFunction || "Director/Officer",
    type: "Director" as const,
  }));

  // Key people (same source)
  const keyPeopleData = (issuer.directorsOfficers || []).slice(0, 5).map((d: any) => ({
    name: d.fullName || "Officer",
    role: d.currentPosition || d.currentFunction || "Officer",
  }));

  // Escrow steps from escrow status
  const escrowStatusValue = projectData.escrowStatus || "pending";
  const escrowMap: Record<string, number> = { pending: 0, funds_received: 1, escrow_secured: 2, released_to_issuer: 3 };
  const stepIdx = escrowMap[escrowStatusValue] ?? 0;
  const escrowStepsData = [
    { label: "Pending", done: stepIdx >= 0, active: stepIdx === 0 },
    { label: "Funds Received", done: stepIdx >= 1, active: stepIdx === 1 },
    { label: "Escrow Secured", done: stepIdx >= 2, active: stepIdx === 2 },
    { label: "Released to Issuer", done: stepIdx >= 3, active: stepIdx === 3 },
  ];

  // Can invest check
  const canInvest = !!investmentAmount && parseFloat(investmentAmount) >= 100 &&
    educationCompleted !== false &&
    allDisclosureFormsUploaded &&
    !(eligibility && eligibility.investorTier !== 'qualified' && parseFloat(investmentAmount) > Math.max(0, eligibility.remainingCapacity || 0));

  // ── Styles matching CampaignPage design language ──
  const sideCard: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #E8E4DD" };
  const greenBtn: React.CSSProperties = { width: "100%", padding: 14, border: "none", borderRadius: 12, background: "linear-gradient(135deg,#1B3A2D,#2D5A3F)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 2px 8px rgba(27,58,45,0.25)" };
  const outlineBtn: React.CSSProperties = { ...greenBtn, background: "transparent", color: "#1B3A2D", border: "1px solid #E8E4DD", boxShadow: "none" };

  // ── Build sidebar content ──
  const investmentSidebar = isOwnProject ? (
    <div style={sideCard}>
      <div style={{ background: "#EFF6FF", borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1D4ED8", margin: "0 0 8px" }}>This is your project</h3>
        <p style={{ fontSize: 13, color: "#60A5FA", margin: "0 0 16px", lineHeight: 1.5 }}>You cannot invest in your own project. Share it with potential investors to get funding.</p>
        <button onClick={() => navigate("/borwMyProj")} style={{ ...greenBtn, background: "#1D4ED8" }}>Go to My Projects</button>
      </div>
    </div>
  ) : hasExistingInvestment ? (
    <div style={sideCard}>
      <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 600, color: "#1B3A2D", margin: "0 0 16px" }}>Your Investment</h3>
      <div style={{ background: "#FFF7ED", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #FDBA74" }}>
        <p style={{ fontSize: 13, color: "#C2410C", fontWeight: 600, margin: "0 0 8px" }}>You have an existing investment</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#888" }}>Amount</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>₱{userInvestment?.amount?.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#888" }}>Status</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 100,
              background: userInvestment?.status === 'approved' ? '#F0FDF4' : userInvestment?.status === 'rejected' ? '#FEF2F2' : '#FEFCE8',
              color: userInvestment?.status === 'approved' ? '#15803D' : userInvestment?.status === 'rejected' ? '#DC2626' : '#CA8A04',
            }}>{userInvestment?.status}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#888" }}>Date</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{userInvestment?.date ? new Date(userInvestment.date).toLocaleDateString() : "—"}</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => navigate("/investor/investments")} style={greenBtn}>View My Investments</button>
        <button onClick={() => navigate("/investor/discover")} style={outlineBtn}>Browse Other Projects</button>
      </div>
    </div>
  ) : showConfirm ? (
    <div style={sideCard}>
      <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 600, color: "#1B3A2D", margin: "0 0 20px" }}>Confirm Investment</h3>
      <div style={{ background: "#FAFAF7", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #EDEAE4" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F1EC" }}>
          <span style={{ fontSize: 13, color: "#888" }}>Amount</span>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Fraunces',serif" }}>₱{parseFloat(investmentAmount).toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
          <span style={{ fontSize: 13, color: "#888" }}>Project</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{details.product || "Project"}</span>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "#888", margin: "0 0 16px", lineHeight: 1.5 }}>You will be redirected to PayMongo to complete your payment securely.</p>
      <button onClick={handleInvest} disabled={processingPayment} style={{ ...greenBtn, opacity: processingPayment ? 0.6 : 1 }}>
        {processingPayment ? "Processing..." : "Proceed to Payment"}
      </button>
      <button onClick={() => setShowConfirm(false)} disabled={processingPayment} style={{ ...outlineBtn, marginTop: 8 }}>Back</button>
    </div>
  ) : (
    <div style={sideCard}>
      <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 600, color: "#1B3A2D", margin: "0 0 20px" }}>Invest in this Campaign</h3>

      {/* Education gate */}
      {educationCompleted === false && (
        <div style={{ background: "#FEFCE8", borderRadius: 12, padding: 14, marginBottom: 16, border: "1px solid #FDE047", display: "flex", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🎓</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#CA8A04", margin: "0 0 6px" }}>Complete Education Module first</p>
            <button onClick={() => setShowEducationModal(true)} style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, border: "none", background: "#EAB308", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Start Module →</button>
          </div>
        </div>
      )}

      {/* Material change reconfirmation */}
      {project?.project_data?.pendingReconfirmation === true &&
        (project.project_data.investorRequests || []).some((r: any) => r.investorId === profile?.id) && (
        <div style={{ background: "#FFF7ED", borderRadius: 12, padding: 14, marginBottom: 16, border: "1px solid #FDBA74" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#C2410C", margin: "0 0 4px" }}>⚠️ Material Change — Action Required</p>
          <p style={{ fontSize: 11, color: "#EA580C", margin: "0 0 10px", lineHeight: 1.4 }}>
            Reconfirm or cancel by {project.project_data.reconfirmationDeadline ? new Date(project.project_data.reconfirmationDeadline).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'the deadline'}.
          </p>
          {project.project_data.materialChangeLog?.slice(-1)[0] && (
            <p style={{ fontSize: 11, color: "#EA580C", fontStyle: "italic", margin: "0 0 10px" }}>
              &ldquo;{project.project_data.materialChangeLog.slice(-1)[0].description}&rdquo;
            </p>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleReconfirmInvestment} disabled={reconfirmLoading} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "none", background: "#1B3A2D", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              {reconfirmLoading ? "Confirming…" : "✓ Reconfirm"}
            </button>
            <button onClick={handleCancelInvestment} disabled={cancelInvestmentLoading} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, border: "1px solid #FCA5A5", background: "transparent", color: "#DC2626", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              {cancelInvestmentLoading ? "Cancelling…" : "✕ Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* Investor classification */}
      {eligibility && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: eligibility.investorTier === "qualified" ? "#F5F3FF" : "#EFF6FF",
            color: eligibility.investorTier === "qualified" ? "#7C3AED" : "#1D4ED8",
            border: `1px solid ${eligibility.investorTier === "qualified" ? "#C4B5FD" : "#BFDBFE"}`
          }}>
            {eligibility.investorTier === "qualified" ? "★ Qualified Investor — No Cap" : `Retail Investor — ${eligibility.retailLimitPercentage || 5}% limit`}
          </span>
          {eligibility.investorTier !== "qualified" && (
            <p style={{ fontSize: 12, color: "#888", margin: "6px 0 0" }}>
              Remaining: <span style={{ fontWeight: 600, color: "#1B3A2D" }}>₱{Math.max(0, eligibility.remainingCapacity || 0).toLocaleString()}</span>
            </p>
          )}
        </div>
      )}

      {/* Investment meta */}
      <div style={{ display: "flex", flexDirection: "column", marginBottom: 20, borderRadius: 12, border: "1px solid #EDEAE4", overflow: "hidden" }}>
        {([["Min. Investment", "₱100"], ["Retail Limit", eligibility ? `₱${(eligibility.maxInvestmentAmount || 0).toLocaleString()}` : "—"], ["Used", eligibility ? `₱${((eligibility.maxInvestmentAmount || 0) - Math.max(0, eligibility.remainingCapacity || 0)).toLocaleString()}` : "—"]] as [string, string][]).map(([l, v], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #F3F1EC" }}>
            <span style={{ fontSize: 13, color: "#888" }}>{l}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Disclosure forms */}
      <div style={{ background: "#FAFAF7", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #EDEAE4" }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Required Disclosure Forms</p>
        <p style={{ fontSize: 11, color: "#888", margin: "0 0 14px" }}>Download, fill in, and upload each form before investing.</p>
        {([
          { label: "1. Declaration of External Investments", file: "Declaration_of_External_Crowdfunding_Investments.pdf", state: declarationForm, setter: setDeclarationForm, ref: declarationFormRef },
          { label: "2. Investment Limit Agreement", file: "Retail_Investor_Investment_Limit_Agreement.pdf", state: investmentLimitForm, setter: setInvestmentLimitForm, ref: investmentLimitFormRef },
          { label: "3. Risk Acknowledgement Statement", file: "Retail_Investors_Risk_Acknowledgement_Statement.pdf", state: riskAcknowledgementForm, setter: setRiskAcknowledgementForm, ref: riskAcknowledgementFormRef },
        ] as const).map(({ label, file, state, setter, ref }, i) => (
          <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, margin: "0 0 6px" }}>{label} <span style={{ color: "#DC2626" }}>*</span></p>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button type="button" onClick={() => handleDownloadDisclosureForm(file)} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, border: "1px solid #1B3A2D", background: "transparent", color: "#1B3A2D", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
                ⬇ Download
              </button>
              <div onClick={() => ref.current?.click()} style={{ flex: 1, padding: "6px 10px", borderRadius: 8, border: `1.5px dashed ${state ? "#86EFAC" : "#D1D5DB"}`, background: state ? "#F0FDF4" : "transparent", cursor: "pointer", textAlign: "center" as const, minWidth: 0 }}>
                {state ? (
                  <span style={{ fontSize: 11, color: "#15803D", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>✓ {state.name}</span>
                ) : (
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>Upload</span>
                )}
              </div>
              {state && (
                <button type="button" onClick={() => setter(null)} style={{ fontSize: 14, border: "none", background: "transparent", color: "#9CA3AF", cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}>✕</button>
              )}
            </div>
            <input ref={ref} type="file" accept=".pdf,.doc,.docx" onChange={(e) => handleDisclosureFormUpload(e, setter)} style={{ display: "none" }} />
          </div>
        ))}
        {!allDisclosureFormsUploaded && (
          <p style={{ fontSize: 11, color: "#CA8A04", fontWeight: 500, margin: "12px 0 0" }}>⚠ All 3 forms must be uploaded to proceed.</p>
        )}
      </div>

      {/* Amount input */}
      <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>How much would you like to invest?</label>
      <div style={{ display: "flex", alignItems: "center", border: "2px solid #E8E4DD", borderRadius: 12, padding: "0 16px", marginBottom: 6, background: "#FAFAF7" }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#888", marginRight: 8 }}>₱</span>
        <input type="number" placeholder="Enter amount" value={investmentAmount} onChange={e => setInvestmentAmount(e.target.value)} min="100" style={{ flex: 1, padding: "14px 0", border: "none", outline: "none", fontSize: 16, fontFamily: "'DM Sans',sans-serif", background: "transparent", width: "100%" }} />
      </div>
      <p style={{ fontSize: 11, color: "#888", margin: "0 0 14px" }}>Minimum: ₱100</p>

      {/* Capacity warning */}
      {eligibility && eligibility.investorTier !== "qualified" && investmentAmount &&
        parseFloat(investmentAmount) > Math.max(0, eligibility.remainingCapacity || 0) && (
        <p style={{ fontSize: 12, color: "#DC2626", fontWeight: 500, margin: "0 0 12px" }}>
          ⚠ Amount exceeds your remaining capacity of ₱{Math.max(0, eligibility.remainingCapacity || 0).toLocaleString()}.
        </p>
      )}

      <button onClick={() => setShowConfirm(true)} disabled={!canInvest} style={{ ...greenBtn, opacity: canInvest ? 1 : 0.5, cursor: canInvest ? "pointer" : "not-allowed" }}>
        Continue
      </button>
      <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: "14px 0 0", lineHeight: 1.5 }}>By continuing, you acknowledge that you have read the campaign details and associated documents.</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* Investor Education Modal Gate */}
      {showEducationModal && (
        <InvestorEducationModal onComplete={() => { setEducationCompleted(true); setShowEducationModal(false); }} />
      )}
      {/* Insufficient Funds Modal */}
      {insufficientFundsError.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setInsufficientFundsError(prev => ({ ...prev, show: false }))} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Insufficient iFunds Balance</h2>
            <p className="text-center text-gray-600 mb-6">You don't have enough funds in your iFunds wallet to make this investment.</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Balance:</span>
                <span className="font-bold text-gray-800">₱{insufficientFundsError.currentBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Investment Amount:</span>
                <span className="font-bold text-gray-800">₱{insufficientFundsError.requiredAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-red-600 font-medium">Amount Needed:</span>
                <span className="font-bold text-red-600">₱{insufficientFundsError.shortfall.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setInsufficientFundsError(prev => ({ ...prev, show: false }))} className="w-full bg-[#0C4B20] text-white hover:bg-[#8FB200] py-3">Add Funds to Wallet</Button>
              <Button variant="outline" onClick={() => setInsufficientFundsError(prev => ({ ...prev, show: false }))} className="w-full">Cancel</Button>
            </div>
            <p className="text-xs text-center text-gray-500 mt-4">Add funds to your iFunds wallet first, then come back to invest.</p>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-0 md:w-[280px] flex-shrink-0">
          <Sidebar activePage="Investment Opportunities" />
        </div>
        
        <main className="flex-1 overflow-y-auto">
          <CampaignPage
            embedded
            campaign={campaignProps}
            company={companyProps}
            escrowSteps={escrowStepsData}
            gallery={gallery}
            keyPeople={keyPeopleData}
            directors={directorsData}
            financials={[]}
            documents={[]}
            sidebarContent={investmentSidebar}
          />
        </main>
      </div>
    </div>
  );
};