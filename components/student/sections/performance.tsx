'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCurrentUser, getStudentAttendance, getSubjects } from '@/lib/storage';
import { useRealtimeSyncRefresh } from '@/hooks/use-realtime-sync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Printer, TrendingUp, BookOpen, Award } from 'lucide-react';

export default function PerformanceSection() {
  const user = getCurrentUser();
  const memoizedUser = useMemo(() => user, [user?.id]);

  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  useEffect(() => {
    if (memoizedUser?.id) {
      loadPerformanceData();
    }
  }, [memoizedUser?.id]);

  // Real-time sync: refresh attendance when new marks are added
  useRealtimeSyncRefresh(['attendance'], () => {
    if (memoizedUser?.id) {
      loadPerformanceData();
    }
  });

  const loadPerformanceData = () => {
    if (!memoizedUser?.id) return;

    const attendance = getStudentAttendance(memoizedUser.id);
    const subjectList = getSubjects();

    // Calculate subject-wise attendance
    const subjectAttendance = subjectList.map(subject => {
      const subjectRecords = attendance.filter(a => a.subjectId === subject.id);
      const total = subjectRecords.length;
      const present = subjectRecords.filter(a => a.status === 'present').length;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

      return {
        subject: subject.name,
        attendance: parseFloat(percentage as string),
        totalClasses: total,
        presentClasses: present,
      };
    });

    setAttendanceData(subjectAttendance);
    setSubjects(subjectList);

    // Sort by date, newest first for recent history
    const sorted = [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecentAttendance(sorted);
  };

  // Radar chart data for performance
  const radarData = attendanceData.map(item => ({
    subject: item.subject,
    attendance: item.attendance,
    performance: Math.min(100, item.attendance + Math.random() * 20), // Mock performance data
  }));

  // Monthly trend data
  const monthlyTrend = [
    { month: 'Jan', attendance: 85 },
    { month: 'Feb', attendance: 88 },
    { month: 'Mar', attendance: 92 },
    { month: 'Apr', attendance: 90 },
    { month: 'May', attendance: 95 },
    { month: 'Jun', attendance: 93 },
  ];

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">Performance Dashboard</h1>
        <Button onClick={handlePrintReport} className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Print Report
        </Button>
      </div>

      {/* Subject-wise Attendance Card */}
      <Card className="glass glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Subject-wise Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attendanceData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{item.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.presentClasses}/{item.totalClasses} classes attended
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Progress value={item.attendance} className="w-24" />
                  <span className="font-bold text-lg">{item.attendance}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Radar Card */}
      <Card className="glass glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Performance Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar name="Attendance" dataKey="attendance" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Radar name="Performance" dataKey="performance" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Attendance Trend Card */}
      <Card className="glass glass-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Monthly Attendance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="attendance" stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Attendance History Card */}
      <Card className="glass glass-border">
        <CardHeader>
          <CardTitle>Recent Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
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
                {recentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 px-2 text-center text-muted-foreground">
                      No attendance records yet
                    </td>
                  </tr>
                ) : (
                  recentAttendance.slice(0, 10).map((record) => {
                    const subject = subjects.find(s => s.id === record.subjectId);
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

                    return (
                      <tr key={record.id} className="border-b border-border/50 hover:bg-accent/20 transition">
                        <td className="py-2 px-2">
                          {new Date(record.date).toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="py-2 px-2 font-medium">{subject?.name || 'Unknown Subject'}</td>
                        <td className="py-2 px-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
