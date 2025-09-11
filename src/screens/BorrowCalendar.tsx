import React, { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { useAuth } from "../contexts/AuthContext";
import { getWalletBalance } from "../lib/wallet";
import { useProjects } from "../contexts/ProjectsContext";
import { DashboardLayout } from "../layouts/DashboardLayout";

// UI and Icons
import { Navbar } from "../components/Navigation/navbar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";

// Generates weeks array for calendar grid
function generateCalendar(date: Date) {
  const startMonth = startOfMonth(date);
  const endMonth = endOfMonth(date);
  const startDate = startOfWeek(startMonth, { weekStartsOn: 0 });
  const endDate = endOfWeek(endMonth, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export const BorrowerCalender: React.FC = () => {
  const { profile, token, profilePicture } = useAuth();
  const { projects } = useProjects();
  const [balance, setBalance] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const navigate = useNavigate();

  if (!token) return <Navigate to="/login" />;

  useEffect(() => {
    getWalletBalance(token).then(setBalance).catch(console.error);
  }, [token]);

  // Generate events from projects
  const events = React.useMemo(() => {
    const allEvents = [];
    
    // Add milestone events
    projects.forEach(project => {
      // Always add the project creation date as an event
      const creationDate = project.createdAt 
        ? new Date(project.createdAt) 
        : new Date();
      
      allEvents.push({
        id: `project-${project.id}`,
        title: `${project.details.product || 'Project'} Created`,
        date: creationDate.toISOString(),
        image: project.details.image || "/rectangle-8.png",
        type: 'project',
        projectId: project.id
      });
      
      // If there's a time duration, add project end date
      if (project.timeDuration || project.details?.timeDuration) {
        const endDate = new Date(project.timeDuration || project.details?.timeDuration || creationDate);
        
        allEvents.push({
          id: `project-end-${project.id}`,
          title: `${project.details.product || 'Project'} End Date`,
          date: endDate.toISOString(),
          image: project.details.image || "/rectangle-13.png",
          type: 'deadline',
          projectId: project.id
        });
      }
      
      // Add payout schedule as events
      if (project.payoutSchedule && project.payoutSchedule.scheduleDate) {
        allEvents.push({
          id: `payout-${project.id}`,
          title: `${project.details.product || 'Project'} - Payout`,
          date: new Date(project.payoutSchedule.scheduleDate).toISOString(),
          image: project.details.image || "/rectangle-13.png",
          type: 'payout',
          projectId: project.id,
          amount: project.payoutSchedule.scheduleAmount
        });
      }
    });
    
    // Investment requests are now handled by admin only
    // Remove investment request events from borrower calendar
    projects.forEach(project => {
      if (project.investorRequests && project.investorRequests.length > 0) {
        project.investorRequests.forEach((request, index) => {
          // For investors - show their own investment requests only
          if (profile.role === 'investor' && request.investorId === profile.id) {
            allEvents.push({
              id: `investment-${project.id}-${request.investorId}-${index}-${request.date}`,
              title: `Your Investment in ${project.details.product}`,
              date: request.date,
              image: project.details.image || "/investment.png",
              type: 'investment',
              projectId: project.id,
              amount: request.amount,
              status: request.status
            });
          }
        });
      }
    });
    
    return allEvents;
  }, [projects, profile]);

  const weeks = generateCalendar(currentMonth);

  // Filter events in current month and sort
  const monthEvents = events
    .map((e) => ({ ...e, dateObj: parseISO(e.date) }))
    .filter((e) => isSameMonth(e.dateObj, currentMonth))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  return (
    <DashboardLayout activePage="calendar">
      <div className="p-4 md:p-8">
        <Card className="shadow-none border-none rounded-none bg-white">
          <CardContent className="p-0">
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">Calendar</h2>
                  <div className="flex items-center gap-4">
                    <BellIcon />
                    <Avatar><AvatarImage src={profilePicture || "/ellipse-1.png"} alt="User"/><AvatarFallback>U</AvatarFallback></Avatar>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Events List */}
                  <div className="flex-1">
                    <h3 className="text-xl font-medium mb-4">Upcoming Event</h3>
                    <div className="space-y-8">
                      {monthEvents.length > 0 ? (
                        monthEvents.map((ev, idx) => (
                          <div key={ev.id} className="space-y-4">
                            <p className="font-medium text-lg">
                              {format(ev.dateObj, 'd MMM, h:mm a')}
                            </p>
                            <img
                              src={ev.image}
                              alt={ev.title}
                              className="w-full max-w-[426px] h-[216px] object-cover rounded-md"
                            />
                            <h4 className="text-[22px] font-medium">
                              {ev.title}
                            </h4>
                            
                            {/* Add event type specific details */}
                            {ev.type === 'milestone' && (
                              <p className="text-gray-600">Project milestone due date</p>
                            )}
                            
                            {ev.type === 'payout' && (
                              <p className="text-gray-600">
                                Scheduled payout: {ev.amount || "Amount not specified"}
                              </p>
                            )}
                            
                            <div className="flex gap-4 flex-wrap">
                              <Button 
                                className="bg-[#ffc628] text-black hover:bg-[#e6b324] px-[70px] py-[18px] rounded-[10px] font-medium"
                                onClick={() => navigate(`/borrower/project/${ev.projectId}/details`)}
                              >
                                View Project
                              </Button>
                              <Button 
                                variant="outline" 
                                className="bg-[#d9d9d9] hover:bg-[#c5c5c5] border-none text-black px-[30px] py-[18px] rounded-[10px] font-medium"
                                onClick={() => navigate(`/borwMyProj`)}
                              >
                                My Projects
                              </Button>
                            </div>
                            {idx !== monthEvents.length - 1 && <Separator className="my-4 max-w-[426px]" />}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-gray-500 mb-4">No events in this month.</p>
                          <Button 
                            className="bg-[#ffc628] text-black hover:bg-[#e6b324]"
                            onClick={() => navigate('/borwMyProj')}
                          >
                            Manage Projects
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="w-full lg:w-1/3">
                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-4">
                      <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeftIcon />
                      </Button>
                      <span className="font-semibold">
                        {format(currentMonth, 'LLLL yyyy')}
                      </span>
                      <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRightIcon />
                      </Button>
                    </div>
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 text-center mb-2">
                      {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
                        <div key={d} className="font-medium">{d}</div>
                      ))}
                    </div>
                    {/* Days grid */}
                    <div className="space-y-1">
                      {weeks.map((week, wi) => (
                        <div key={wi} className="grid grid-cols-7 gap-1">
                          {week.map((day, di) => {
                            const dayEvents = events.filter(e => 
                              isSameDay(parseISO(e.date), day)
                            );
                            const hasEvent = dayEvents.length > 0;
                            const isCurrent = isSameMonth(day, currentMonth);
                            return (
                              <div
                                key={di}
                                className={`h-[42px] flex items-center justify-center rounded-full cursor-pointer
                                  ${!isCurrent ? 'text-[#00000066]' : 'text-black'}
                                  ${hasEvent ? 'bg-[#ffc628] hover:bg-[#e6b324]' : 'hover:bg-gray-100'}`}
                                onClick={() => {
                                  if (hasEvent && dayEvents[0].projectId) {
                                    navigate(`/borrower/project/${dayEvents[0].projectId}/details`);
                                  }
                                }}
                                title={hasEvent ? `${dayEvents.length} event(s)` : ''}
                              >
                                {format(day, 'd')}
                                {hasEvent && dayEvents.length > 1 && (
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </DashboardLayout>
  );
};

export default BorrowerCalender;
