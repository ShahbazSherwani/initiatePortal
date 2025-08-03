import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectsContext';
// Remove this line - import { getWalletBalance } from "../services/api";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { Navbar } from '../components/Navigation/navbar';
import { Sidebar } from '../components/Sidebar/Sidebar';

// You can reuse this function from BorrowCalendar
function generateCalendar(date: Date) {
  const firstDayOfMonth = startOfMonth(date);
  const lastDayOfMonth = endOfMonth(date);
  const days = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export const InvestorCalendar: React.FC = () => {
  const { profile, token } = useContext(AuthContext)!;
  const { projects } = useProjects();
  const [balance, setBalance] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  if (!token) return <Navigate to="/login" />;

  // Replace this useEffect since getWalletBalance doesn't exist
  useEffect(() => {
    // Just set a default balance for now
    setBalance(10000); // You can replace this with actual API call later
  }, [token]);

  // Generate events from projects - focus on investor-specific events
  const events = React.useMemo(() => {
    const allEvents = [];
    
    // Add investor-specific events
    projects.forEach(project => {
      // Projects the investor has invested in
      if (project.project_data?.investorRequests && project.project_data.investorRequests.length > 0) {
        project.project_data.investorRequests.forEach(request => {
          // Only show this investor's own investments
          if (request.investorId === profile?.id) {
            allEvents.push({
              id: `investment-${project.id}-${request.investorId}`,
              title: `Your Investment in ${project.project_data.details?.product || 'Project'}`,
              date: request.date,
              image: project.project_data.details?.image || "/investment.png",
              type: 'investment',
              projectId: project.id,
              amount: request.amount,
              status: request.status
            });
            
            // Add payout events for accepted investments
            if (request.status === "accepted" && project.project_data.payoutSchedule?.scheduleDate) {
              allEvents.push({
                id: `payout-${project.id}-${request.investorId}`,
                title: `Expected Payout from ${project.project_data.details?.product || 'Project'}`,
                date: new Date(project.project_data.payoutSchedule.scheduleDate).toISOString(),
                image: project.project_data.details?.image || "/payout.png",
                type: 'expected-payout',
                projectId: project.id,
                amount: (request.amount * (1 + (project.project_data.details?.estimatedReturn || 0) / 100)).toFixed(2)
              });
            }
          }
        });
      }
    });
    
    // Add published projects that investor hasn't invested in yet
    projects.forEach(project => {
      // Update this condition to check for both published AND approved status
      if (project.project_data?.status === "published" && 
          project.project_data?.approvalStatus === "approved") {
        // Check if investor hasn't already invested
        const alreadyInvested = project.project_data?.investorRequests?.some(
          req => req.investorId === profile?.id
        );
        
        if (!alreadyInvested) {
          allEvents.push({
            id: `opportunity-${project.id}`,
            title: `Investment Opportunity: ${project.project_data?.details?.product || 'New Project'}`,
            date: project.created_at || new Date().toISOString(),
            image: project.project_data?.details?.image || "/opportunity.png",
            type: 'opportunity',
            projectId: project.id
          });
        }
      }
    });
    
    return allEvents;
  }, [projects, profile]);

  // Rest of your calendar component implementation
  // ...
  
  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* <Navbar activePage="calendar" showAuthButtons={false} /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop */}
        <div className="hidden md:block w-[325px]">
          <Sidebar activePage="Calendar" />
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Investor Calendar</h1>
            
            {/* Calendar UI */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                    className="p-2 rounded hover:bg-gray-100"
                  >
                    &lt;
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(new Date())}
                    className="p-2 rounded hover:bg-gray-100"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                    className="p-2 rounded hover:bg-gray-100"
                  >
                    &gt;
                  </button>
                </div>
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-medium p-2">
                    {day}
                  </div>
                ))}
                {/* Calendar days would go here */}
              </div>
            </div>
            
            {/* Events listing */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
              <div className="space-y-4">
                {events.length > 0 ? events.map(event => (
                  <div 
                    key={event.id}
                    className="bg-white rounded-lg shadow p-4 flex items-center cursor-pointer"
                    onClick={() => navigate(`/investor/project/${event.projectId}`)}
                  >
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-12 h-12 rounded-md object-cover mr-4"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                      {event.amount && (
                        <p className="text-sm font-medium">
                          Amount: {parseFloat(String(event.amount)).toLocaleString()} PHP
                        </p>
                      )}
                    </div>
                    {event.type === 'investment' && event.status && (
                      <div className={`rounded-full px-3 py-1 text-xs ${
                        event.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        event.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </div>
                    )}
                    {event.type === 'opportunity' && (
                      <div className="rounded-full px-3 py-1 text-xs bg-blue-100 text-blue-800">
                        New
                      </div>
                    )}
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-8">
                    No upcoming events or investment opportunities.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InvestorCalendar;