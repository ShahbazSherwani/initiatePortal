import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectsContext';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
// Import Button properly
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "../components/ui/popover";
import { InterestButton } from "../components/ui/InterestButton";

// Add TypeScript interfaces
interface Project {
  id: number;
  firebase_uid: string;
  project_data: {
    status?: string;
    type?: string;
    approvalStatus?: string;
    details?: {
      product?: string;
      image?: string;
    }
  };
  created_at: string;
  full_name?: string;
}

export const UnifiedCalendar = () => {
  const { profile } = useAuth();
  const { projects } = useProjects();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const navigate = useNavigate();
  
  // Fetch ALL approved projects regardless of user role
  useEffect(() => {
    async function fetchApprovedProjects() {
      try {
        console.log("Fetching approved projects...");
        const data = await authFetch(`${API_BASE_URL}/calendar/projects`);
        console.log("Approved projects data:", data);
        
        // Check if data is an array or if it has a nested data property
        const projectsArray = Array.isArray(data) ? data : data.projects || [];
        console.log("Projects array length:", projectsArray.length);
        setAllProjects(projectsArray);
        
        // Cache the approved projects
        sessionStorage.setItem("approvedProjects", JSON.stringify(projectsArray));
      } catch (error) {
        console.error("Failed to load approved projects:", error);
        
        // Try to load from cache
        try {
          const cached = sessionStorage.getItem("approvedProjects");
          if (cached) {
            setAllProjects(JSON.parse(cached));
          }
        } catch (e) {
          console.error("Failed to load from cache:", e);
        }
      }
    }
    
    fetchApprovedProjects();
  }, []);
  
  // Combine projects based on role
  const calendarEvents = useMemo(() => {
    const events: any[] = [];
    
    console.log("AllProjects for calendar:", allProjects);
    
    // For all users: Include approved projects
    allProjects.forEach(project => {
      events.push({
        id: `project-${project.id}`,
        title: project.project_data?.details?.product || 'Unnamed Project',
        date: project.created_at,
        color: '#4CAF50',
        extendedProps: {
          projectId: project.id,
          isApproved: true,
          projectType: project.project_data?.type,
          ownerId: project.firebase_uid,
          isOwner: project.firebase_uid === profile?.id,
          projectData: project.project_data
        }
      });
    });
    
    // Debug logging:
    console.log("Projects to display:", allProjects);
    console.log("Filtered events for calendar:", events);
    console.log("User role:", profile?.role);
    
    return events;
  }, [profile, allProjects]);
  
  const handleEventClick = (info: any) => {
    const { projectId } = info.event.extendedProps;
    
    if (profile?.isAdmin) {
      // Admin view
      navigate(`/admin/project/${projectId}`);
    } else if (profile?.role === 'investor') {
      // Investor view - navigate to investment page
      navigate(`/investor/project/${projectId}`);
    } else {
      // Borrower view - navigate to project details/edit
      navigate(`/borrower/project/${projectId}/details`);
    }
  };
  
  const renderEventContent = (eventInfo: any) => {
    const { isOwner, projectId } = eventInfo.event.extendedProps;
    
    // Check if investor has already shown interest
    const hasShownInterest = eventInfo.event.extendedProps.projectData?.interestRequests?.some(
      (req: any) => req.investorId === profile?.id
    );
    
    return (
      <div className="flex items-center p-1">
        <div className="flex-1">
          {eventInfo.event.title}
        </div>
        {profile?.role === 'investor' && !isOwner && (
          <div className="flex gap-1 ml-2">
            <InterestButton
              projectId={projectId}
              hasShownInterest={hasShownInterest}
              size="sm"
              onInterestShown={() => {
                // Refresh the calendar or show success message
                window.location.reload();
              }}
            />
            <Button 
              size="sm" 
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                navigate(`/investor/project/${projectId}`);
              }}
            >
              View
            </Button>
          </div>
        )}
        {isOwner && (
          <Button 
            size="sm" 
            variant="outline"
            className="ml-2" 
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              navigate(`/borrower/project/${eventInfo.event.extendedProps.projectId}/details`);
            }}
          >
            Edit
          </Button>
        )}
      </div>
    );
  };
  
  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={calendarEvents}
      height="auto"
      eventClick={handleEventClick}
      eventContent={renderEventContent}
    />
  );
};

export default UnifiedCalendar;