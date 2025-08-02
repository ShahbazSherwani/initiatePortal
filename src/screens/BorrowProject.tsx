import React, { useContext, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import {
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  LogOutIcon,
  SettingsIcon,
  WalletIcon,
  HelpCircleIcon,
  ChevronDownIcon,
} from "lucide-react";
import { Navbar } from "../components/Navigation/navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useNavigate } from "react-router-dom";

export const BorrowerProject: React.FC = () => {
  const { token } = useContext(AuthContext)!;
  const navigate = useNavigate();

  // Redirect if not authenticated
  if (!token) return <Navigate to="/login" replace />;

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helpers to build month grid
  const buildCalendar = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const days: { day: number; current?: boolean }[] = [];

    // fill previous
    const offset = start.getDay();
    for (let i = offset - 1; i >= 0; i--) {
      const d = new Date(start);
      d.setDate(start.getDate() - (i + 1));
      days.push({ day: d.getDate(), current: false });
    }

    // current month
    for (let d = 1; d <= end.getDate(); d++) {
      days.push({ day: d, current: true });
    }

    // fill next
    while (days.length % 7 !== 0) {
      days.push({ day: days.length - (offset + end.getDate()) + 1, current: false });
    }
    return days;
  };

  const calendarDays = buildCalendar(currentDate);
  const weekDays = ["SUN", "MON", "TUES", "WED", "THURS", "FRI", "SAT"];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* <Navbar activePage="home" showAuthButtons={false} /> */}
      <div className="flex flex-1">
        <Sidebar activePage="Calendar" />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Card className="rounded-none md:rounded-l-3xl border-none shadow-none">
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Project/Payout */}
                <section className="flex-1 space-y-6">
                  <div className="flex items-center gap-3">
                    <HomeIcon className="w-6 h-6 text-gray-700" />
                    <h2 className="text-2xl font-semibold">Payout Schedule</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="block text-gray-500">Generate Total Payout Required:</span>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium">50,000 PHP</span>
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <span className="block text-gray-500">% of Total Payout (Capital + Interest):</span>
                      <span className="text-lg font-medium">10,000 PHP</span>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-500">Payout Date:</span>
                        <div className="font-medium">15 Oct, 2023</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <div className="font-medium">10,000 PHP</div>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-gray-500">Generate Net Income Calculation:</span>
                      <div className="text-xl font-medium">3,000 PHP</div>
                    </div>
                    <h3 className="text-xl font-semibold">View Project</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <img
                        src="/rectangle-8.png"
                        alt="Project"
                        className="w-full sm:w-40 h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-lg font-medium">Passa Sustainable Agriculture</h4>
                          <div className="text-gray-500">Project ID: PFLA345N</div>
                        </div>
                        <Button variant="outline">View Details</Button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Right: Calendar */}
                <section className="w-full md:w-80">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setCurrentDate(
                        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
                      );
                    }}>
                      <ChevronLeftIcon />
                    </Button>
                    <h3 className="text-xl font-semibold">
                      {currentDate.toLocaleString("default", { month: "long" })} {currentDate.getFullYear()}
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setCurrentDate(
                        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
                      );
                    }}>
                      <ChevronRightIcon />
                    </Button>
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-7 text-center text-xs text-gray-500">
                    {weekDays.map((wd) => (<div key={wd}>{wd}</div>))}
                  </div>
                  <div className="grid grid-cols-7 text-center gap-1 mt-2">
                    {calendarDays.map((cell, idx) => (
                      <div
                        key={idx}
className={`p-1 flex justify-center items-center rounded-full ${
cell.current
  ? "text-black"
  : "text-gray-400"
                        }`}
                      >
                        {cell.day}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};
