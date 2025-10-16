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
      // Investor view - navigate to project details first
      navigate(`/investor/project/${projectId}/details`);
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
      <div className="fc-event-content-wrapper">
        <div className="fc-event-title-container">
          <span className="fc-event-title">{eventInfo.event.title}</span>
        </div>
        {profile?.role === 'investor' && !isOwner && (
          <div className="fc-event-buttons">
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
              className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 text-xs px-2 py-1"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                navigate(`/investor/project/${projectId}/details`);
              }}
            >
              View Details
            </Button>
          </div>
        )}
        {isOwner && (
          <div className="fc-event-buttons">
            <Button 
              size="sm" 
              variant="outline"
              className="text-xs px-2 py-1" 
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                navigate(`/borrower/project/${eventInfo.event.extendedProps.projectId}/details`);
              }}
            >
              Edit
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="bg-white shadow-sm border-0">
      <div className="p-4 md:p-6">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={calendarEvents}
          height="auto"
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay'
          }}
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day'
          }}
          dayMaxEvents={false}
          moreLinkText="more"
          eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
          contentHeight="auto"
          aspectRatio={1.8}
          displayEventTime={false}
          eventMaxStack={10}
        />
      </div>
      
      {/* Custom CSS for FullCalendar to match owner portal theme */}
      <style>{`
        .fc {
          font-family: inherit;
        }
        
        /* Button Styling */
        .fc .fc-button {
          background-color: #0C4B20 !important;
          border-color: #0C4B20 !important;
          color: white !important;
          text-transform: capitalize;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }
        
        .fc .fc-button:hover {
          background-color: #0A3D1A !important;
          border-color: #0A3D1A !important;
        }
        
        .fc .fc-button:disabled {
          background-color: #6B7280 !important;
          border-color: #6B7280 !important;
          opacity: 0.5;
        }
        
        .fc .fc-button-active {
          background-color: #0A3D1A !important;
          border-color: #0A3D1A !important;
        }
        
        /* Grid Styling */
        .fc-theme-standard .fc-scrollgrid {
          border-color: #E5E7EB;
        }
        
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #E5E7EB;
        }
        
        /* Header Styling */
        .fc-col-header-cell {
          background-color: #F9FAFB;
          font-weight: 600;
          color: #374151;
          padding: 0.75rem 0.5rem;
        }
        
        /* Day Cell Styling */
        .fc-daygrid-day {
          background-color: white;
          min-height: 120px;
        }
        
        .fc-daygrid-day:hover {
          background-color: #F9FAFB;
        }
        
        .fc-daygrid-day-frame {
          padding: 4px;
        }
        
        .fc-daygrid-day-number {
          color: #374151;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
        }
        
        .fc-day-today {
          background-color: #E6F4EA !important;
        }
        
        .fc-day-today .fc-daygrid-day-number {
          color: #0C4B20;
          font-weight: 700;
        }
        
        /* Event Container Styling */
        .fc-daygrid-event-harness {
          margin: 2px 4px;
        }
        
        .fc-event {
          border: none !important;
          border-radius: 0.375rem;
          padding: 4px 6px !important;
          margin: 2px 0 !important;
          font-size: 0.75rem;
          overflow: visible !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .fc-h-event {
          background-color: #0C4B20 !important;
          border-color: #0C4B20 !important;
        }
        
        .fc-h-event:hover {
          opacity: 0.95;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
        
        /* Custom Event Content Wrapper */
        .fc-event-content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
          padding: 2px;
        }
        
        .fc-event-title-container {
          font-weight: 500;
          font-size: 0.75rem;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .fc-event-title {
          color: white;
        }
        
        .fc-event-buttons {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        
        .fc-event-buttons button {
          font-size: 0.65rem !important;
          padding: 2px 6px !important;
          height: auto !important;
          min-height: 22px;
          white-space: nowrap;
        }
        
        /* More Link Styling */
        .fc-daygrid-event-dot {
          border-color: #0C4B20 !important;
        }
        
        .fc-toolbar-title {
          color: #111827;
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        .fc-more-link {
          color: #0C4B20 !important;
          font-weight: 500;
          font-size: 0.75rem;
          padding: 2px 4px;
        }
        
        .fc-more-link:hover {
          color: #0A3D1A !important;
          background-color: #E6F4EA;
        }
        
        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .fc .fc-button {
            padding: 0.375rem 0.75rem;
            font-size: 0.75rem;
          }
          
          .fc-toolbar-title {
            font-size: 1rem;
          }
          
          /* Rearrange toolbar: arrows + today on left, views on right */
          .fc-toolbar {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 0.5rem;
          }
          
          .fc-toolbar-chunk:first-child {
            order: 1;
            flex: 0 0 auto;
          }
          
          .fc-toolbar-chunk:nth-child(2) {
            order: 3;
            flex: 1 1 100%;
            justify-content: center;
          }
          
          .fc-toolbar-chunk:last-child {
            order: 2;
            flex: 0 0 auto;
          }
          
          .fc-header-toolbar {
            margin-bottom: 1rem !important;
          }
          
          .fc-daygrid-day {
            min-height: 140px;
          }
          
          .fc-daygrid-day-number {
            padding: 0.25rem;
            font-size: 0.875rem;
          }
          
          .fc-event {
            font-size: 0.7rem;
            padding: 4px 6px !important;
            margin: 3px 2px !important;
          }
          
          .fc-event-title-container {
            font-size: 0.7rem;
            margin-bottom: 2px;
          }
          
          .fc-event-buttons {
            display: flex;
            flex-direction: column;
            gap: 3px;
            width: 100%;
          }
          
          .fc-event-buttons button {
            font-size: 0.65rem !important;
            padding: 3px 6px !important;
            min-height: 24px;
            width: 100%;
            text-align: center;
          }
          
          .fc-col-header-cell {
            padding: 0.5rem 0.25rem;
            font-size: 0.75rem;
          }
          
          /* Ensure events stay within day cells */
          .fc-daygrid-event-harness {
            margin: 2px 3px;
          }
          
          .fc-event-content-wrapper {
            padding: 3px;
          }
        }
        
        @media (max-width: 640px) {
          .fc-daygrid-day {
            min-height: 160px;
          }
          
          .fc-event {
            padding: 5px 6px !important;
          }
          
          .fc-event-buttons button {
            font-size: 0.7rem !important;
            padding: 4px 8px !important;
            min-height: 26px;
          }
        }
        
        @media (max-width: 480px) {
          .fc .fc-button {
            padding: 0.25rem 0.5rem;
            font-size: 0.7rem;
          }
          
          .fc-daygrid-day {
            min-height: 180px;
          }
          
          .fc-event {
            font-size: 0.75rem;
            padding: 6px 8px !important;
            margin: 4px 3px !important;
          }
          
          .fc-event-title-container {
            font-size: 0.75rem;
            margin-bottom: 4px;
          }
          
          .fc-event-buttons {
            gap: 4px;
          }
          
          .fc-event-buttons button {
            font-size: 0.75rem !important;
            padding: 5px 10px !important;
            min-height: 28px;
            font-weight: 500;
          }
        }
      `}</style>
    </Card>
  );
};

export default UnifiedCalendar;