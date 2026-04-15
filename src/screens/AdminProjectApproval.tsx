import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectsContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { toast } from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import { Dialog, Transition } from '@headlessui/react';
import { IssuerFormDigital, defaultIssuerFormData } from '../components/IssuerFormDigital';
import { CreditRiskReviewTab } from '../components/CreditRiskReviewTab';
import { AdminProjectUpdatesTab } from '../components/AdminProjectUpdatesTab';
// @ts-ignore - JSX component without type declarations
import CampaignPage from './Updated Campaign Page/CampaignPage';

export const AdminProjectApproval: React.FC<{ action?: 'approve' | 'reject' }> = ({ action }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, loadProjects } = useProjects();
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [remoteProject, setRemoteProject] = useState<any>(null);
  const [escrowStatus, setEscrowStatus] = useState('pending');
  const [escrowNotes, setEscrowNotes] = useState('');
  const [escrowSaving, setEscrowSaving] = useState(false);
  const [showCampaignPreview, setShowCampaignPreview] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // IMPORTANT: Define handleApproveReject with useCallback BEFORE using it in any other hooks
  const handleApproveReject = useCallback(async (actionType: 'approve' | 'reject') => {
    // Approval guard: warn if credit risk review is not finalized before approving
    if (actionType === 'approve') {
      try {
        const crStatus = await authFetch(`${API_BASE_URL}/admin/projects/${projectId}/credit-review/status`);
        if (crStatus?.success && !crStatus.isFinalized) {
          const proceed = window.confirm(
            'Credit Risk Review has not been finalized for this project.\n\nYou can still approve, but it is recommended to complete the Credit Risk Review first.\n\nProceed with approval anyway?'
          );
          if (!proceed) return;
        }
      } catch {
        // If check fails (e.g. table doesn't exist yet), allow approval to proceed
        console.warn('Credit review status check failed — proceeding with approval');
      }
    }

    setLoading(true);
    try {
      const result = await authFetch(`${API_BASE_URL}/admin/projects/${projectId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: actionType,
          feedback
        })
      });
      
      if (result.success) {
        // Update local state with the result
        if (result.updatedProject) {
          // Update local cache with the updated project
          const cachedProjects = JSON.parse(localStorage.getItem("cachedAdminProjects") || "[]");
          const updatedProjects = cachedProjects.map(p => 
            p.id === projectId ? result.updatedProject : p
          );
          localStorage.setItem("cachedAdminProjects", JSON.stringify(updatedProjects));
        }
        
        toast.success(actionType === 'approve' ? 'Project approved!' : 'Project rejected');
        
        // Refresh projects data
        try {
          await loadProjects();
        } catch (err) {
          console.error("Failed to refresh projects list:", err);
        }
        
        // Redirect to admin projects list with the correct filter
        if (actionType === 'approve') {
          navigate('/admin/projects?filter=approved');
        } else {
          navigate('/admin/projects?filter=rejected');
        }
      } else {
        toast.error('Failed to process project');
      }
    } catch (error) {
      console.error('Error processing project:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  }, [projectId, feedback, navigate, loadProjects]);
  
  // Redirect if not admin
  useEffect(() => {
    if (profile && !profile.isAdmin) {
      navigate('/borrow');
      toast.error('You do not have permission to access this page');
    }
  }, [profile, navigate]);
  
  // Find project in local projects list first
  const project = projects.find(p => p.id.toString() === projectId);
  
  // If not found in local list, try to use AdminProjectView's approach
  useEffect(() => {
    if (!project) {
      async function fetchProject() {
        try {
          const data = await authFetch(`${API_BASE_URL}/admin/projects/${projectId}`);
          setRemoteProject(data);
        } catch (error) {
          console.error("Failed to fetch project:", error);
          // Try to load from cache if network error
          if (error.code === "auth/network-request-failed") {
            const cachedProject = localStorage.getItem(`project_${projectId}`);
            if (cachedProject) {
              setRemoteProject(JSON.parse(cachedProject));
            }
          }
        }
      }
      fetchProject();
    }
  }, [project, projectId]);

  useEffect(() => {
    const source = project || remoteProject;
    if (source?.project_data) {
      setEscrowStatus(source.project_data.escrowStatus || 'pending');
      setEscrowNotes(source.project_data.escrowNotes || '');
    }
  }, [project, remoteProject]);

  const handleEscrowStatusUpdate = async () => {
    setEscrowSaving(true);
    try {
      const result = await authFetch(`${API_BASE_URL}/admin/projects/${projectId}/escrow-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          escrowStatus,
          notes: escrowNotes
        })
      });

      if (result?.success) {
        toast.success('Escrow status updated');
      } else {
        toast.error('Failed to update escrow status');
      }
    } catch (error: any) {
      console.error('Escrow update failed:', error);
      toast.error(error?.message || 'Failed to update escrow status');
    } finally {
      setEscrowSaving(false);
    }
  };
  
  const handleDeleteProject = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setDeleting(true);
    try {
      const result = await authFetch(`${API_BASE_URL}/admin/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin deleted project' })
      });
      if (result?.success) {
        toast.success(`Project deleted successfully. Removed ${result.cascade?.updates || 0} updates, ${result.cascade?.creditReviews || 0} credit reviews, ${result.cascade?.refundRequests || 0} refund requests.`);
        try { await loadProjects(); } catch {}
        navigate('/admin/projects');
      } else {
        toast.error('Failed to delete project');
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error(error?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmText('');
    }
  };

  // Auto-trigger approval/rejection if action is provided - ALWAYS include this hook
  useEffect(() => {
    if (action && !loading) {
      handleApproveReject(action);
    }
  }, [action, loading, handleApproveReject]);
  
  // Use either the local project or the remote one
  const displayProject = project || remoteProject;
  
  if (!displayProject && loading) {
    return <div className="p-8">Loading project details...</div>;
  }
  
  if (!displayProject && !loading) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold mb-4">Project Not Found</h2>
        <p>This project could not be loaded. It may have been deleted or you may not have permission to view it.</p>
        <Button 
          onClick={() => navigate('/admin/projects')}
          className="mt-4"
        >
          Back to Projects List
        </Button>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6">Review Project</h1>

            <Tabs defaultValue="review" className="w-full">
              <TabsList className="mb-6 bg-gray-100 rounded-lg p-1">
                <TabsTrigger value="review" className="px-4 py-2 text-sm font-medium">Project Review</TabsTrigger>
                <TabsTrigger value="credit-risk" className="px-4 py-2 text-sm font-medium">Credit Risk Review</TabsTrigger>
                <TabsTrigger value="updates" className="px-4 py-2 text-sm font-medium">Project Updates</TabsTrigger>
              </TabsList>

              {/* ── Tab 1: Project Review (existing content, unchanged) ── */}
              <TabsContent value="review">
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Project Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Project Name:</p>
                  <p className="font-medium">
                    {displayProject?.project_data?.details?.product || 'Unnamed Project'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Created By:</p>
                  <p className="font-medium">{displayProject?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Type:</p>
                  <p className="font-medium">{displayProject?.project_data?.type || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status:</p>
                  <p className="font-medium">{displayProject?.project_data?.status || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Amount:</p>
                  <p className="font-medium">
                    {displayProject?.project_data?.details?.loanAmount || 
                     displayProject?.project_data?.details?.investmentAmount || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Add your code here - replacing the existing similar code */}
            {displayProject?.project_data?.details?.image && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Project Image</h2>
                <img 
                  src={displayProject.project_data.details.image} 
                  alt="Project" 
                  className="max-h-[300px] object-contain rounded-lg"
                />
              </div>
            )}

            {/* Campaign Preview (as investors will see it) */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowCampaignPreview(prev => !prev)}
                className="flex items-center gap-2 text-lg font-semibold text-[#1B3A2D] hover:underline mb-3"
              >
                <span>{showCampaignPreview ? '▼' : '▶'}</span>
                Campaign Preview (Investor View)
              </button>
              {showCampaignPreview && (() => {
                const d = displayProject?.project_data?.details || {};
                const iss = displayProject?.project_data?.issuerForm || {};
                const esVal = displayProject?.project_data?.escrowStatus || 'pending';
                const esMap: Record<string, number> = { pending: 0, funds_received: 1, escrow_secured: 2, released_to_issuer: 3 };
                const sIdx = esMap[esVal] ?? 0;
                const formatDur = (dateStr?: string) => {
                  if (!dateStr) return "N/A";
                  const end = new Date(dateStr);
                  const now = new Date();
                  const diffMs = end.getTime() - now.getTime();
                  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                  if (diffDays <= 0) return "Ended";
                  if (diffDays > 365) return `${Math.round(diffDays / 365)} years`;
                  if (diffDays > 30) return `${Math.round(diffDays / 30)} months`;
                  return `${diffDays} days`;
                };
                return (
                  <div className="border rounded-xl overflow-hidden">
                    <CampaignPage
                      embedded
                      sidebarContent={false}
                      approvalStatus={displayProject?.project_data?.approvalStatus || 'pending'}
                      campaign={{
                        title: d.product || "Unnamed Project",
                        status: displayProject?.project_data?.status || "Pending",
                        description: d.overview || "",
                        riskLevel: d.riskLevel || "Medium",
                        requiredFunding: `₱${parseFloat(d.projectRequirements || d.loanAmount || d.investmentAmount || "0").toLocaleString()}`,
                        estReturn: `${d.investorPercentage || "N/A"}%`,
                        duration: formatDur(d.timeDuration),
                        minInvestment: 100,
                      }}
                      company={{
                        name: iss.companyName || displayProject?.full_name || "Issuer",
                        registeredName: iss.companyName || "",
                        industry: iss.natureOfBusiness ? iss.natureOfBusiness.substring(0, 80) : "",
                        city: iss.addressCity || d.location || "",
                        secRegistration: iss.secRegNo || "",
                        description: iss.natureOfBusiness || d.overview || "",
                        teamSize: iss.totalEmployees || "",
                        website: iss.website || "",
                      }}
                      escrowSteps={[
                        { label: "Pending", done: sIdx >= 0, active: sIdx === 0 },
                        { label: "Funds Received", done: sIdx >= 1, active: sIdx === 1 },
                        { label: "Escrow Secured", done: sIdx >= 2, active: sIdx === 2 },
                        { label: "Released to Issuer", done: sIdx >= 3, active: sIdx === 3 },
                      ]}
                      gallery={d.image ? [{ id: 1, url: d.image, caption: d.product || "Project Image" }] : []}
                      keyPeople={(iss.directorsOfficers || []).slice(0, 5).map((p: any) => ({ name: p.fullName || "Officer", role: p.currentPosition || p.currentFunction || "Officer" }))}
                      directors={(iss.directorsOfficers || []).map((p: any) => ({ name: p.fullName || "Director", position: p.currentPosition || p.currentFunction || "Director/Officer", type: (p.type === 'Management' ? 'Management' : 'Director') as 'Director' | 'Management' }))}
                      financials={(iss.financialStatements || []).map((f: any) => ({ year: f.year || "", grossRevenue: parseFloat(f.grossRevenue) || 0, netIncome: parseFloat(f.netIncome) || 0, totalAssets: parseFloat(f.totalAssets) || 0, totalLiabilities: parseFloat(f.totalLiabilities) || 0 }))}
                      documents={(iss.campaignDocuments || []).map((dc: any) => ({ name: dc.name || "Document", type: dc.fileType || "PDF", size: dc.fileSize || "—", category: dc.category || "General", url: dc.fileData || "#" }))}
                    />
                  </div>
                );
              })()}
            </div>

            {/* Issuer Form 3 — Digital Form (new) */}
            {displayProject?.project_data?.issuerForm && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Issuer Form 3 (Digital)</h2>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <IssuerFormDigital
                    data={{ ...defaultIssuerFormData, ...displayProject.project_data.issuerForm }}
                    onChange={() => {}}
                    readOnly={true}
                  />
                </div>
              </div>
            )}

            {/* Legacy: Project Details Form PDF (uploaded by borrower) */}
            {!displayProject?.project_data?.issuerForm && displayProject?.project_data?.details?.projectDetailsForm && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Issuer Form 3 (Legacy PDF Upload)</h2>
                <div className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1B5E20" strokeWidth="2" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <span className="text-sm font-medium text-gray-700 flex-1 truncate">
                    {displayProject.project_data.details.projectDetailsForm.name || 'Project_Details_Form'}
                  </span>
                  <a
                    href={displayProject.project_data.details.projectDetailsForm.data}
                    download={displayProject.project_data.details.projectDetailsForm.name || 'Project_Details_Form'}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-[#1B5E20] rounded-lg hover:bg-[#2E7D32] transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Project Overview</h2>
              <p>{displayProject?.project_data?.details?.overview || 'No overview provided'}</p>
            </div>

            <div className="mb-8 border rounded-lg p-4 bg-gray-50">
              <h2 className="text-xl font-semibold mb-3">Escrow Status Tracker (Manual)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Escrow Status</label>
                  <select
                    value={escrowStatus}
                    onChange={(e) => setEscrowStatus(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="funds_received">Funds Received</option>
                    <option value="escrow_secured">Escrow Secured</option>
                    <option value="released_to_issuer">Released to Issuer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={escrowNotes}
                    onChange={(e) => setEscrowNotes(e.target.value)}
                    placeholder="Escrow remarks"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <Button
                className="mt-4 bg-[#0C4B20] hover:bg-[#0A3D1A] text-white"
                onClick={handleEscrowStatusUpdate}
                disabled={escrowSaving}
              >
                {escrowSaving ? 'Saving...' : 'Update Escrow Status'}
              </Button>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Admin Feedback</h2>
              <Textarea
                placeholder="Enter your feedback for the project owner..."
                className="h-32"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                onClick={() => handleApproveReject('approve')}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Approve Project'}
              </Button>
              
              <Button
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-2"
                onClick={() => handleApproveReject('reject')}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Reject Project'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/admin/projects')}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button
                className="bg-red-800 hover:bg-red-900 text-white px-8 py-2 ml-auto"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading || deleting}
              >
                Delete Project
              </Button>
            </div>

            {/* Delete Project Confirmation Dialog */}
            <Transition appear show={showDeleteDialog} as={Fragment}>
              <Dialog as="div" className="relative z-50" onClose={() => setShowDeleteDialog(false)}>
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
                  leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                  <div className="fixed inset-0 bg-black/30" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                  <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child
                      as={Fragment}
                      enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                      leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                    >
                      <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                          Delete Project
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            This action is <strong>irreversible</strong>. The project and all associated data will be permanently removed.
                          </p>
                        </div>

                        <div className="mt-4 space-y-4">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                              </svg>
                              <div>
                                <h4 className="text-sm font-medium text-red-800">Warning</h4>
                                <p className="text-sm text-red-700 mt-1">
                                  Deleting <strong>"{displayProject?.project_data?.details?.product || 'this project'}"</strong> will permanently remove:
                                </p>
                                <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                                  <li>All project data and settings</li>
                                  <li>All investment/interest requests</li>
                                  <li>All project updates</li>
                                  <li>Credit risk reviews</li>
                                  <li>Refund requests</li>
                                  <li>Related notifications</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          <Input
                            placeholder="Type DELETE to confirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                          />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                          <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleDeleteProject}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={deleteConfirmText !== 'DELETE' || deleting}
                          >
                            {deleting ? 'Deleting...' : 'Delete Project'}
                          </Button>
                        </div>
                      </Dialog.Panel>
                    </Transition.Child>
                  </div>
                </div>
              </Dialog>
            </Transition>
              </TabsContent>

              {/* ── Tab 2: Credit Risk Review (new) ── */}
              <TabsContent value="credit-risk">
                {projectId && <CreditRiskReviewTab projectId={projectId} />}
              </TabsContent>

              {/* ── Tab 3: Project Updates ── */}
              <TabsContent value="updates">
                {projectId && <AdminProjectUpdatesTab projectId={projectId} />}
              </TabsContent>
            </Tabs>
      </div>
    </div>
  );
};

export default AdminProjectApproval;