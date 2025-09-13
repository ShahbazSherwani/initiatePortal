import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAccount } from '../contexts/AccountContext';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

// TypeScript interfaces
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
      overview?: string;
      location?: string;
      timeDuration?: string;
    }
  };
  created_at: string;
  full_name?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  image: string;
  project: Project;
  type: 'project';
}

// Generate calendar grid
function generateCalendar(date: Date) {
  const startMonth = startOfMonth(date);
  const endMonth = endOfMonth(date);
  const startDate = startOfWeek(startMonth, { weekStartsOn: 0 }); // Start week on Sunday
  const endDate = endOfWeek(endMonth, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export const EnhancedCalendar: React.FC = () => {
  const { profile } = useAuth();
  const { currentAccountType } = useAccount();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const navigate = useNavigate();

  // Get the current user type from account context, not profile role
  const currentUserType = currentAccountType || profile?.role;

  // Debug current user role
  console.log('EnhancedCalendar - Current user profile:', profile);
  console.log('EnhancedCalendar - Profile role:', profile?.role);
  console.log('EnhancedCalendar - Current account type:', currentAccountType);
  console.log('EnhancedCalendar - Effective user type:', currentUserType);

  // Fetch approved projects
  useEffect(() => {
    async function fetchApprovedProjects() {
      try {
        console.log("Fetching approved projects for calendar...");
        const data = await authFetch(`${API_BASE_URL}/calendar/projects`);
        console.log("Calendar projects data:", data);
        
        // Filter only approved projects
        const projectsArray = Array.isArray(data) ? data : [];
        const approvedProjects = projectsArray.filter((project: Project) => 
          project.project_data?.approvalStatus === 'approved'
        );
        
        console.log("Approved projects for calendar:", approvedProjects);
        setAllProjects(approvedProjects);
      } catch (error) {
        console.error("Failed to load approved projects:", error);
      }
    }
    
    fetchApprovedProjects();
  }, []);

  // Generate calendar events from approved projects
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];
    
    allProjects.forEach(project => {
      // Safety check for project_data and details
      if (!project.project_data?.details) {
        console.warn(`Project ${project.id} missing project_data.details`);
        return;
      }

      // Add project as an event on its creation date
      calendarEvents.push({
        id: `project-${project.id}`,
        title: project.project_data.details.product || 'Project Event',
        date: new Date(project.created_at),
        image: project.project_data.details.image || '/group-13-1.png',
        project: project,
        type: 'project'
      });
    });
    
    console.log("Generated calendar events:", calendarEvents);
    return calendarEvents;
  }, [allProjects]);

  const weeks = generateCalendar(currentMonth);

  // Get events for current month
  const monthEvents = events
    .filter(event => isSameMonth(event.date, currentMonth))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
  };

  const handleViewDetails = (projectId: number) => {
    console.log(`🔍 Viewing details for project ${projectId} as ${currentUserType}`);
    
    if (currentUserType === 'borrower') {
      // Borrowers can edit their projects using the existing edit route
      console.log(`🔍 Navigating borrower to: /borwEditProject/${projectId}`);
      navigate(`/borwEditProject/${projectId}`);
    } else {
      // Investors get read-only details view
      console.log(`🔍 Navigating investor to: /investor/project/${projectId}/details`);
      navigate(`/investor/project/${projectId}/details`);
    }
  };

  const handleInvest = (projectId: number) => {
    console.log(`💰 Investing in project ${projectId} as ${currentUserType}`);
    console.log(`💰 Navigating to: /investor/project/${projectId}`);
    // Navigate to investor project view (investment page)
    navigate(`/investor/project/${projectId}`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6">
      {/* Calendar Grid - Shows first on mobile, second on desktop */}
      <div className="order-1 lg:order-2 w-full lg:w-[400px]">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar */}
        <Card className="p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
              <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => {
                  const dayEvents = getEventsForDay(day);
                  const hasEvents = dayEvents.length > 0;
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={dayIndex}
                      className={`
                        h-10 flex items-center justify-center text-sm cursor-pointer rounded-lg
                        ${isCurrentMonth ? 'text-black' : 'text-gray-400'}
                        ${hasEvents ? 'bg-[#0C4B20] text-white font-medium' : 'hover:bg-gray-100'}
                        ${isToday && !hasEvents ? 'bg-blue-100 text-blue-600' : ''}
                        ${hasEvents ? 'relative' : ''}
                      `}
                      onClick={() => {
                        if (hasEvents) {
                          const firstEvent = dayEvents[0];
                          handleViewDetails(firstEvent.project.id);
                        }
                      }}
                      title={hasEvents ? `${dayEvents.length} event(s) - ${dayEvents[0].title}` : ''}
                    >
                      {format(day, 'd')}
                      {hasEvents && dayEvents.length > 1 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Events List - Shows second on mobile, first on desktop */}
      <div className="order-2 lg:order-1 flex-1">
        <h2 className="text-2xl font-semibold mb-6">Upcoming Event</h2>
        
        {monthEvents.length > 0 ? (
          <div className="space-y-8">
            {monthEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-6">
                  {/* Event Date */}
                  <p className="text-lg font-medium mb-4">
                    {format(event.date, 'dd MMMM, h:mm a')}
                  </p>
                  
                  {/* Event Image */}
                  <div className="mb-4">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full max-w-[400px] h-[250px] object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/group-13-1.png';
                      }}
                    />
                  </div>
                  
                  {/* Event Title */}
                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                  
                  {/* Event Description */}
                  <p className="text-gray-600 mb-4">
                    {event.project.project_data?.details?.overview || 'Project overview'}
                  </p>
                  
                  {/* Project Details - Fixed spacing */}
                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex justify-between items-center max-w-xs">
                      <span className="font-medium">Location:</span>
                      <span className="text-right">{event.project.project_data?.details?.location || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between items-center max-w-xs">
                      <span className="font-medium">Type:</span>
                      <span className="text-right">{event.project.project_data?.type || 'Project'}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {(() => {
                      // Debug info
                      console.log(`Button rendering for project ${event.project.id}:`, {
                        profileRole: profile?.role,
                        currentAccountType: currentAccountType,
                        effectiveUserType: currentUserType,
                        projectOwner: event.project.firebase_uid,
                        currentUserId: profile?.id,
                        isProjectOwner: event.project.firebase_uid === profile?.id
                      });
                      
                      if (currentUserType === 'borrower') {
                        // ALL BORROWERS (regardless of project ownership) only see View Details
                        console.log(`🔵 Rendering BORROWER buttons for project ${event.project.id}`);
                        return (
                          <Button 
                            className="bg-[#d9d9d9] hover:bg-[#c5c5c5] border-none text-black px-8 py-2 w-full sm:w-auto"
                            onClick={() => handleViewDetails(event.project.id)}
                          >
                            View Details
                          </Button>
                        );
                      } else if (currentUserType === 'investor') {
                        // ALL INVESTORS (regardless of project ownership) see both buttons
                        console.log(`🟡 Rendering INVESTOR buttons for project ${event.project.id}`);
                        return (
                          <>
                            <Button 
                              className="bg-[#0C4B20] hover:bg-[#8FB200] text-white px-8 py-2 w-full sm:w-auto"
                              onClick={() => handleInvest(event.project.id)}
                            >
                              Invest
                            </Button>
                            <Button 
                              variant="outline"
                              className="bg-[#d9d9d9] hover:bg-[#c5c5c5] border-none text-black px-8 py-2 w-full sm:w-auto"
                              onClick={() => handleViewDetails(event.project.id)}
                            >
                              View Details
                            </Button>
                          </>
                        );
                      } else {
                        // Default fallback for unknown roles
                        console.log(`⚠️ Rendering FALLBACK buttons for project ${event.project.id} (unknown type: ${currentUserType})`);
                        return (
                          <Button 
                            className="bg-[#d9d9d9] hover:bg-[#c5c5c5] border-none text-black px-8 py-2 w-full sm:w-auto"
                            onClick={() => handleViewDetails(event.project.id)}
                          >
                            View Details
                          </Button>
                        );
                      }
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">No events in this month.</p>
              <Button 
                className="bg-[#0C4B20] hover:bg-[#8FB200] text-white"
                onClick={() => navigate(currentUserType === 'investor' ? '/projects' : '/borwMyProj')}
              >
                {currentUserType === 'investor' ? 'Browse Projects' : 'My Projects'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnhancedCalendar;