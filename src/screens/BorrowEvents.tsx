import React, { useContext, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { getWalletBalance } from "../lib/wallet";

// UI & Icons
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Switch } from "../components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  BellIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  HelpCircleIcon,
  HomeIcon,
  LogOutIcon,
  SettingsIcon,
  WalletIcon,
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";

// Sample event
const event = {
  date: "10 July, 10:00 AM",
  image: "/rectangle-8.png",
  title: "Passa Sustainable Agriculture",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
  details: { date: "31 July, 2:00 PM", type: "Online" },
};

interface ReminderOption { label: string; defaultChecked: boolean; }
const reminderOptions: ReminderOption[] = [
  { label: "Before 30 minutes", defaultChecked: true },
  { label: "Before 1 hour", defaultChecked: false },
  { label: "Before 1 day", defaultChecked: false },
];

// Generate calendar weeks for any month
function generateCalendar(date: Date) {
  const startMonth = startOfMonth(date);
  const endMonth = endOfMonth(date);
  const startDate = startOfWeek(startMonth, { weekStartsOn: 0 });
  const endDate = endOfWeek(endMonth, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weeks = [] as Date[][];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export const BorrowerEvent: React.FC = (): JSX.Element => {
  const { token } = useContext(AuthContext)!;
  const [balance, setBalance] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const navigate = useNavigate();

  if (!token) return <Navigate to="/login" replace />;

  useEffect(() => {
    getWalletBalance(token).then(setBalance).catch(console.error);
  }, [token]);

  const weeks = generateCalendar(currentMonth);
  const hasEventOn = (day: Date) => isSameDay(parseISO(event.date), day);

  return (
    <div className=" flex flex-col min-h-screen bg-[#f0f0f0]">
      {/* Navbar */}
      {/* <Navbar activePage="borrow" showAuthButtons={false} /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* Unified Sidebar handles desktop & mobile internally */}
        <Sidebar activePage="Calendar" />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Card className="bg-white rounded-lg shadow pt-20 pb-20">
            <CardContent>
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Upcoming Event</h2>

              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Event Details */}
                <div className="flex-1 space-y-4">
                  <p className="text-lg">{event.date}</p>
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full md:w-[70%] h-60 object-cover rounded-lg"
                  />
                  <h3 className="text-xl font-medium">{event.title}</h3>
                  <p className="text-gray-600">{event.description}</p>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Date:</span>
                      <span>{event.details.date}</span>
                    </div>

                  </div>
                <div className="grid grid-cols-2 gap-4 mb-4">

                    <div className="flex justify-between">
                      <span className="font-medium">Type:</span>
                      <span>{event.details.type}</span>
                    </div>
                  </div>
                  <Button className="bg-[#ffc628] hover:bg-[#e6b324] text-black px-8 py-3 rounded-lg">
                    Interested
                  </Button>
                </div>

                {/* Calendar Grid */}
                {/* <div className="w-full lg:w-1/3 space-y-4">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                      <ChevronLeftIcon />
                    </Button>
                    <span className="font-semibold">{format(currentMonth, 'LLLL yyyy')}</span>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                      <ChevronRightIcon />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 text-center font-medium">
                    {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (<div key={d}>{d}</div>))}
                  </div>
                  <div className="space-y-1">
                    {weeks.map((week, idx) => (
                      <div key={idx} className="grid grid-cols-7 gap-1">
                        {week.map((day,i) => (
                          <div
                            key={i}
                            className={`h-10 flex items-center justify-center rounded-full
                              ${!isSameMonth(day,currentMonth)?'text-gray-400':''}
                              ${hasEventOn(day)?'bg-[#ffc628]':''}`}
                          >{format(day,'d')}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div> */}

                {/* Reminder Section */}
                <div className="w-full lg:w-1/4">
                  <h2 className="text-2xl font-semibold mb-4">Set Reminder</h2>
                  <div className="space-y-4">
                    {reminderOptions.map((opt,i)=>(
                      <div key={i} className="flex justify-between items-center">
                        <span>{opt.label}</span>
                        <Switch defaultChecked={opt.defaultChecked} />
                      </div>
                    ))}
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

export default BorrowerEvent;
