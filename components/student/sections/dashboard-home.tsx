'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, getStudentAttendance, getAnnouncements, getAllAttendance, getSubjects } from '@/lib/storage';
import { useRealtimeSyncRefresh } from '@/hooks/use-realtime-sync';
import { TrendingUp, BookOpen, AlertCircle, Bell } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function StudentDashboardHome() {
  const [user, setUser] = useState<any>(null);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [stats, setStats] = useState({
    totalClasses: 0,
    attended: 0,
    absent: 0,
    late: 0,
  });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    const allSubjects = getSubjects();
    setSubjects(allSubjects);
  }, []);

  // Real-time sync: refresh attendance when new marks are added
  useRealtimeSyncRefresh(['attendance'], () => {
    if (user?.id) {
      loadAttendanceData();
    }
  });

  const loadAttendanceData = () => {
    if (!user?.id) return;
    
    const attendance = getStudentAttendance(user.id);
    const totalClasses = attendance.length || 1;
    const attendedClasses = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const percentage = ((attendedClasses / totalClasses) * 100).toFixed(1);

    setAttendancePercentage(parseFloat(percentage));
    setStats({
      totalClasses,
      attended: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
    });

    // Sort by date, newest first
    const sorted = [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAttendance(sorted);

    const allAnnouncements = getAnnouncements();
    setAnnouncements(allAnnouncements.slice(-3));
  };

  useEffect(() => {
    if (user?.id) {
      loadAttendanceData();
    }
  }, [user?.id]);

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'holiday':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const monthlyData = [
    { month: 'Week 1', attendance: 85 },
    { month: 'Week 2', attendance: 90 },
    { month: 'Week 3', attendance: 88 },
    { month: 'Week 4', attendance: 92 },
  ];

  const pieData = [
    { name: 'Present', value: stats.attended },
    { name: 'Absent', value: stats.absent },
    { name: 'Late', value: stats.late },
  ];

  const COLORS = ['#22c55e', '#ef4444', '#eab308'];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground mt-2">Roll No: {user?.rollNo} | Course: {user?.course}</p>
      </div>

      {/* Today's Classes Card */}
      <div className="glass glass-border p-6 rounded-xl mb-8">
        <h3 className="text-lg font-bold text-foreground mb-4">Today's Classes</h3>
        <div className="space-y-2">
          <p className="text-muted-foreground">No classes scheduled for today</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="glass glass-border p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-semibold">Attendance %</p>
              <p className="text-3xl font-bold text-foreground mt-2">{attendancePercentage}%</p>
            </div>
            <TrendingUp className={`w-12 h-12 ${attendancePercentage >= 75 ? 'text-green-500/30' : 'text-red-500/30'}`} />
          </div>
        </div>

        <div className="glass glass-border p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-semibold">Total Classes</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.totalClasses}</p>
            </div>
            <BookOpen className="w-12 h-12 text-primary/30" />
          </div>
        </div>

        <div className="glass glass-border p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-semibold">Classes Attended</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.attended}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500/30" />
          </div>
        </div>

        <div className="glass glass-border p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-semibold">Today's Status</p>
              <p className="text-lg font-bold text-foreground mt-2">Present</p>
            </div>
            <AlertCircle className="w-12 h-12 text-green-500/30" />
          </div>
        </div>
      </div>

      {/* Recent Attendance History Card */}
      <div className="glass glass-border p-6 rounded-xl mb-8">
        <h3 className="text-lg font-bold text-foreground mb-4">Recent Attendance History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-semibold">Date</th>
                <th className="text-left py-2 px-2 font-semibold">Subject</th>
                <th className="text-left py-2 px-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.slice(-10).map((record, index) => (
                <tr key={index} className="border-b border-border/50 hover:bg-accent/20 transition">
                  <td className="py-2 px-2">
                    {new Date(record.date).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="py-2 px-2 font-medium">{getSubjectName(record.subjectId)}</td>
                  <td className="py-2 px-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 px-2 text-center text-muted-foreground">
                    No attendance records yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Attendance Trend Card */}
      <div className="glass glass-border p-6 rounded-xl mb-8">
        <h3 className="text-lg font-bold text-foreground mb-4">Monthly Attendance Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="attendance" stroke="#4f46e5" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance Distribution Card */}
      <div className="glass glass-border p-6 rounded-xl mb-8">
        <h3 className="text-lg font-bold text-foreground mb-4">Attendance Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
