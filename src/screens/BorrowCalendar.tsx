import React, { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { getWalletBalance } from "../lib/wallet";

// UI and Icons
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
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

// Sample events data
const events = [
  {
    id: 1,
    title: "Passa Sustainable Agriculture",
    date: "2025-07-10T10:00:00",
    image: "/rectangle-8.png",
  },
  {
    id: 2,
    title: "Securing Farming Funding for Growth and Sustainability",
    date: "2025-07-15T14:00:00",
    image: "/rectangle-13.png",
  },
];

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
  const { profile, token } = useContext(AuthContext)!;
  const [balance, setBalance] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  if (!token) return <Navigate to="/login" />;

  useEffect(() => {
    getWalletBalance(token).then(setBalance).catch(console.error);
  }, [token]);

  const weeks = generateCalendar(currentMonth);

  // Filter events in current month and sort
  const monthEvents = events
    .map((e) => ({ ...e, dateObj: parseISO(e.date) }))
    .filter((e) => isSameMonth(e.dateObj, currentMonth))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f0]">
      <Navbar activePage="login" showAuthButtons={true} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex w-[325px]"><Sidebar /></aside>
        {/* Mobile toggle */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <Button variant="outline" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </Button>
        </div>
        <div className={`md:hidden fixed inset-0 bg-white z-40 transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform`}>
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Card className="shadow-none border-none rounded-none bg-white">
            <CardContent className="p-0">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold">Calendar</h2>
                  <div className="flex items-center gap-4">
                    <BellIcon />
                    <Avatar><AvatarImage src="/ellipse-1.png" alt="User"/><AvatarFallback>U</AvatarFallback></Avatar>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Events List */}
                  <div className="flex-1">
                    <h3 className="text-xl font-medium mb-4">Upcoming Event</h3>
                    <div className="space-y-8">
                      {monthEvents.map((ev, idx) => (
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
                          <div className="flex gap-4 flex-wrap">
                            <Button className="bg-[#ffc628] text-black hover:bg-[#e6b324] px-[70px] py-[18px] rounded-[10px] font-medium">
                              Interested
                            </Button>
                            <Button variant="outline" className="bg-[#d9d9d9] hover:bg-[#c5c5c5] border-none text-black px-[30px] py-[18px] rounded-[10px] font-medium">
                              View Details
                            </Button>
                          </div>
                          {idx !== monthEvents.length - 1 && <Separator className="my-4 max-w-[426px]" />}
                        </div>
                      ))}
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
                            const hasEvent = events.some(e =>
                              isSameDay(parseISO(e.date), day)
                            );
                            const isCurrent = isSameMonth(day, currentMonth);
                            return (
                              <div
                                key={di}
                                className={`h-[42px] flex items-center justify-center rounded-full transition-colors
                                  ${!isCurrent ? 'text-[#00000066]' : 'text-black'}
                                  ${hasEvent ? 'bg-[#ffc628]' : ''}`}
                              >
                                {format(day, 'd')}
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
        </main>
      </div>
    </div>
  );
};

export default BorrowerCalender;
