'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, getStudents, getAllAttendance } from '@/lib/storage';
import { useRealtimeSyncRefresh } from '@/hooks/use-realtime-sync';
import { Users, BookOpen, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TeacherDashboardHome() {
  const [user, setUser] = useState(getCurrentUser());
  const [stats, setStats] = useState({
    todaysClasses: 0,
    totalStudents: 0,
    attendanceStatus: 0,
    upcomingEvents: 0,
  });

  useEffect(() => {
    const students = getStudents();
    const attendance = getAllAttendance();
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);

    setStats({
      todaysClasses: 4,
      totalStudents: students.length,
      attendanceStatus: todayAttendance.length,
      upcomingEvents: 2,
    });
  }, []);

  // Real-time sync: refresh user info when profile/subject is updated by admin
  useRealtimeSyncRefresh(['user'], () => {
    setUser(getCurrentUser());
  });

  const attendanceData = [
    { day: 'Mon', rate: 92 },
    { day: 'Tue', rate: 88 },
    { day: 'Wed', rate: 95 },
    { day: 'Thu', rate: 87 },
    { day: 'Fri', rate: 91 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground mt-2">Teaching {user?.subject} to {user?.assignedClass}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="glass glass-border p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-semibold">Today's Classes</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.todaysClasses}</p>
            </div>
            <BookOpen className="w-12 h-12 text-accent/30" />
          </div>
        </div>

        <div className="glass glass-border p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-semibold">Total Students</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.totalStudents}</p>
            </div>
            <Users className="w-12 h-12 text-primary/30" />
          </div>
        </div>

        <div className="glass glass-border p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-semibold">Attendance Today</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.attendanceStatus}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-secondary/30" />
          </div>
        </div>

        <div className="glass glass-border p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-semibold">Upcoming Events</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.upcomingEvents}</p>
            </div>
            <Calendar className="w-12 h-12 text-primary/30" />
          </div>
        </div>
      </div>

      {/* Attendance Trend Chart */}
      <div className="glass glass-border p-6 rounded-xl">
        <h3 className="text-lg font-bold text-foreground mb-4">Class Attendance Rate (This Week)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={2} name="Attendance %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
