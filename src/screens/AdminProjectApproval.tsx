import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectsContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'react-hot-toast';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

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
  
  // IMPORTANT: Define handleApproveReject with useCallback BEFORE using it in any other hooks
  const handleApproveReject = useCallback(async (actionType: 'approve' | 'reject') => {
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

            {/* Project Details Form (uploaded by borrower) */}
            {displayProject?.project_data?.details?.projectDetailsForm && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Project Details Form</h2>
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
            </div>
      </div>
    </div>
  );
};

export default AdminProjectApproval;