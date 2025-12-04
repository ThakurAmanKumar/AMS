'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getCurrentUser, getStudentAttendance, getSubjects, getAllAttendance, subscribeToAttendanceUpdates, addAttendance, Attendance, getLiveAttendanceCode, getRegisteredCoursesForStudent, getMasterSubjects, getDepartments, getSections, subscribeToCourseRegistrationUpdates } from '@/lib/storage';
import { useRealtimeSyncRefresh } from '@/hooks/use-realtime-sync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

import {
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';

import { CheckCircle, Clock, UserCheck, UserX, Activity } from 'lucide-react';
import { Subject as BaseSubject, Attendance as BaseAttendance } from '@/lib/storage';
import StudentAttendanceTable from './StudentAttendanceTable';

/* ------------------ Types ------------------ */
interface SubjectUI extends BaseSubject {
  attendancePercentage: number;
  presentPercentage: number;
  odMlPercentApproved?: number;
  classesConducted?: number;
  present?: number;
  absent?: number;
  odMlTaken?: number;
  description?: string;
}

interface AttendanceUI extends BaseAttendance {
  type?: 'marked' | 'corrected' | 'leaveRequest';
  subjectName?: string;
  timestamp?: number;
}

interface ActivityLog {
  id: string;
  type: 'marked' | 'corrected' | 'leaveRequest';
  message: string;
  timestamp: number;
}

interface TimetableEntry {
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface LeaveRequest {
  status: 'pending' | 'approved' | 'rejected';
}

/* ------------------ Utils ------------------ */
function calcPercent(attended: number, total: number) {
  if (total === 0) return 0;
  return Math.round((attended / total) * 1000) / 10;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-300 rounded w-1/3"></div>
      <div className="h-48 bg-gray-300 rounded"></div>
      <div className="h-24 bg-gray-300 rounded"></div>
    </div>
  );
}

/* ------------------ Daily Attendance ------------------ */
function DailyAttendanceStatus({ attendance }: { attendance: AttendanceUI[] }) {
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = attendance.filter(a => a.date === today);

  const present = todayRecords.filter(a => a.status === 'present').length;
  const absent = todayRecords.filter(a => a.status === 'absent').length;
  const late = todayRecords.filter(a => a.status === 'late').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border border-green-500 bg-green-50">
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-green-800 font-medium">Present Today</p>
            <p className="text-4xl font-bold text-green-900">{present}</p>
          </div>
          <UserCheck className="w-10 h-10 text-green-600" />
        </CardContent>
      </Card>

      <Card className="border border-red-500 bg-red-50">
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-800 font-medium">Absent Today</p>
            <p className="text-4xl font-bold text-red-900">{absent}</p>
          </div>
          <UserX className="w-10 h-10 text-red-600" />
        </CardContent>
      </Card>

      <Card className="border border-yellow-500 bg-yellow-50">
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-800 font-medium">Late Today</p>
            <p className="text-4xl font-bold text-yellow-900">{late}</p>
          </div>
          <Clock className="w-10 h-10 text-yellow-600" />
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------ Attendance Predictor Table ------------------ */
function AttendancePredictorTable({ subjects }: { subjects: SubjectUI[] }) {
  const calculatePresentPercentage = (subject: SubjectUI): number => {
    const d = (subject.present || 0) + (subject.absent || 0) + (subject.odMlTaken || 0);
    return d === 0 ? 0 : ((subject.present || 0) / d) * 100;
  };

  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle>Attendance Predictor</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>OD/ML</TableHead>
              <TableHead>Present %</TableHead>
              <TableHead>OD/ML %</TableHead>
              <TableHead>Attendance %</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {subjects.map(s => {
              const presentPercentage = calculatePresentPercentage(s);

              return (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell>{s.code}</TableCell>
                  <TableCell>{s.description}</TableCell>
                  <TableCell>{s.classesConducted}</TableCell>
                  <TableCell>{s.present}</TableCell>
                  <TableCell>{s.absent}</TableCell>
                  <TableCell>{s.odMlTaken}</TableCell>
                  <TableCell>{presentPercentage.toFixed(1)}%</TableCell>
                  <TableCell>{(s.odMlPercentApproved || 0).toFixed(1)}%</TableCell>
                  <TableCell>{s.attendancePercentage.toFixed(1)}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/* ------------------ Recent Activity Feed ------------------ */
function RecentActivityFeed({ activities }: { activities: ActivityLog[] }) {
  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle>Recent Attendance Activities</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 max-h-80 overflow-y-auto">
        {activities.length === 0 && (
          <p className="text-center text-muted-foreground">No recent activities</p>
        )}

        <ul className="divide-y divide-muted">
          {activities.map(a => (
            <li key={a.id} className="py-2 flex gap-3 items-center">
              {a.type === 'marked' && <CheckCircle className="text-green-600 w-6 h-6" />}
              {a.type === 'corrected' && <Clock className="text-yellow-500 w-6 h-6" />}
              {a.type === 'leaveRequest' && <UserCheck className="text-blue-600 w-6 h-6" />}

              <div>
                <p className="font-semibold text-sm">{a.message}</p>
                <p className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/* ------------------ Subject Trend Chart ------------------ */
const SubjectTrendChart = React.memo(function SubjectTrendChart({
  subjectTrends
}: {
  subjectTrends: Array<Record<string, any>>;
}) {
  if (!subjectTrends || subjectTrends.length === 0) return null;

  const lineKeys = useMemo(() => {
    if (!subjectTrends.length) return [];
    return Object.keys(subjectTrends[0]).filter(k => k !== 'month');
  }, [subjectTrends]);

  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle>Subject Trend (Monthly)</CardTitle>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={subjectTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[0, 100]} />
            <RechartsTooltip />
            <Legend />
            {lineKeys.map((key, i) => (
              <Line key={key} dataKey={key} type="monotone"
                stroke={['#4f46e5', '#22c55e', '#facc15', '#ef4444'][i % 4]}
                strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

/* ------------------ Class Schedule ------------------ */
function LiveClassSchedule({ timetable }: { timetable: TimetableEntry[] }) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const todayClasses = timetable.filter(t => t.date === today);

  const ongoing = todayClasses.find(t => {
    const s = new Date(t.startTime);
    const e = new Date(t.endTime);
    return s <= now && e >= now;
  });

  const upcoming = todayClasses.find(t => new Date(t.startTime) > now);

  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle>Today's Class Schedule</CardTitle>
      </CardHeader>

      <CardContent>
        {ongoing ? (
          <div className="bg-green-100 p-4 border border-green-300 rounded flex justify-between">
            <div>
              <p className="font-semibold text-green-800">LIVE NOW</p>
              <p className="text-lg">{ongoing.subject}</p>
            </div>
            <Activity className="w-10 h-10 text-green-700 animate-pulse" />
          </div>
        ) : upcoming ? (
          <div className="bg-blue-100 p-4 border border-blue-300 rounded flex justify-between">
            <div>
              <p className="font-semibold text-blue-800">Upcoming</p>
              <p className="text-lg">{upcoming.subject}</p>
            </div>
            <Clock className="w-10 h-10 text-blue-700" />
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No classes today</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------ Leave Request ------------------ */
function LeaveRequestSection({
  absentToday,
  leaveRequest,
  onSubmitRequest
}: {
  absentToday: boolean;
  leaveRequest: LeaveRequest | null;
  onSubmitRequest: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  if (!absentToday) return null;

  const submit = async () => {
    setLoading(true);
    try {
      await onSubmitRequest();
      toast({ title: 'Leave Requested', description: 'Pending approval.' });
    } catch {
      toast({ title: 'Error submitting', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle>Leave Request</CardTitle>
      </CardHeader>

      <CardContent>
        {leaveRequest ? (
          <Badge>{leaveRequest.status}</Badge>
        ) : (
          <Button disabled={loading} onClick={submit} variant="outline">
            {loading ? 'Submitting...' : 'Submit Leave Request'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------ Strength Indicator ------------------ */
function SubjectStrengthIndicator({ subjects }: { subjects: SubjectUI[] }) {
  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle>Subject Strength Indicator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {subjects.map(sub => {
          const perc = sub.attendancePercentage;
          let color = 'bg-red-500';
          if (perc >= 85) color = 'bg-green-500';
          else if (perc >= 75) color = 'bg-yellow-500';

          return (
            <div key={sub.id}>
              <div className="flex justify-between">
                <span className="font-semibold">{sub.code}</span>
                <span>{perc.toFixed(1)}%</span>
              </div>

              <div className="w-full bg-gray-200 h-3 rounded">
                <div className={`${color} h-3 rounded`} style={{ width: `${perc}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ------------------ Heatmap Calendar ------------------ */
function HeatmapCalendar({ attendance }: { attendance: AttendanceUI[] }) {
  const [month, setMonth] = useState(new Date());
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const statusMap = useMemo(() => {
    const map: Record<string, string> = {};
    attendance.forEach(a => {
      const d = new Date(a.date);
      if (d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth()) {
        map[a.date] = a.status;
      }
    });
    return map;
  }, [attendance, month]);

  const colors = {
    present: 'bg-green-500',
    absent: 'bg-red-500',
    late: 'bg-yellow-500',
    holiday: 'bg-blue-500',
    none: 'bg-gray-300'
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle>
          Attendance Heatmap - {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {days.map(d => {
            const dateStr = new Date(month.getFullYear(), month.getMonth(), d)
              .toISOString()
              .split('T')[0];

            const status = statusMap[dateStr] || 'none';

            return (
              <div
                key={d}
                className={cn(
                  'p-3 text-center font-medium text-white rounded',
                  colors[status as keyof typeof colors] || 'bg-gray-300'
                )}
              >
                {d}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------ AI Suggestion ------------------ */
function AISuggestionCard({ lowSubject }: { lowSubject: string | null }) {
  if (!lowSubject) return null;

  return (
    <Card className="glass glass-border border-indigo-400 bg-indigo-50">
      <CardContent>
        <p className="font-semibold text-indigo-700">AI Suggestion</p>
        <p>Your attendance in <b>{lowSubject}</b> is low. Attend next 2 classes to reach 75%.</p>
      </CardContent>
    </Card>
  );
}

/* ------------------ Attendance Calendar Card ------------------ */
function AttendanceCalendarCard({ attendance }: { attendance: AttendanceUI[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const attendanceMap = useMemo(() => {
    const map: Record<string, string> = {};
    attendance.forEach(record => {
      const date = new Date(record.date);
      if (date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear()) {
        map[record.date] = record.status;
      }
    });
    return map;
  }, [attendance, currentMonth]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500 text-white';
      case 'absent': return 'bg-red-500 text-white';
      case 'late': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle>Attendance Calendar</CardTitle>
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          >
            Previous
          </Button>
          <span className="font-semibold">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          >
            Next
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-semibold text-sm">
              {day}
            </div>
          ))}
          {emptyCells.map(i => (
            <div key={`empty-${i}`} className="p-2"></div>
          ))}
          {days.map(day => {
            const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
            const status = attendanceMap[dateStr];
            return (
              <div
                key={day}
                className={cn(
                  'p-2 text-center text-sm rounded cursor-pointer hover:opacity-80',
                  getStatusColor(status || '')
                )}
              >
                {day}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------ Live Attendance Code Input Card ------------------ */
function LiveAttendanceCodeCard({ onCodeSubmit }: { onCodeSubmit: (code: string) => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({ title: 'Invalid Code', description: 'Please enter a 6-digit code.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await onCodeSubmit(code);
      setCode('');
      toast({ title: 'Attendance Marked', description: 'Your attendance has been recorded successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to mark attendance. Please try again.', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle>Live Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="attendance-code" className="block text-sm font-medium mb-2">
              Enter 6-digit Code
            </label>
            <Input
              id="attendance-code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
            />
          </div>
          <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
            {loading ? 'Marking...' : 'Mark Attendance'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ------------------ Attendance History Card ------------------ */
function AttendanceHistoryCard({ attendance }: { attendance: AttendanceUI[] }) {
  const sortedAttendance = useMemo(() => {
    return [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance]);

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
              {sortedAttendance.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 px-2 text-center text-muted-foreground">
                    No attendance records found
                  </td>
                </tr>
              ) : (
                sortedAttendance.slice(0, 20).map(record => (
                  <tr key={record.id} className="border-b border-border/50 hover:bg-accent/20 transition">
                    <td className="py-2 px-2">
                      {new Date(record.date).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="py-2 px-2 font-medium">{record.subjectName || 'Unknown Subject'}</td>
                    <td className="py-2 px-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------ Attendance Progress Card ------------------ */
function AttendanceProgressCard({ subjects }: { subjects: SubjectUI[] }) {
  // Replace card UI with a full table component showing registered-course attendance
  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle>Attendance Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <StudentAttendanceTable />
      </CardContent>
    </Card>
  );
}

/* ------------------ Registered Subjects Card ------------------ */
function RegisteredSubjectsCard({ subjects, registeredCourses, masterSubjects }: { subjects: SubjectUI[], registeredCourses: any, masterSubjects: any }) {
  // Filter to show only registered courses
  const registeredSubjects = useMemo(() => {
    if (!registeredCourses || !Array.isArray(registeredCourses.courseIds) || masterSubjects.length === 0) {
      return [];
    }
    return masterSubjects
      .filter((ms: any) => registeredCourses.courseIds.includes(ms.id))
      .map((ms: any) => {
        const enriched = subjects.find(s => s.id === ms.id);
        return {
          id: ms.id,
          name: ms.name,
          code: ms.code,
          attendancePercentage: enriched?.attendancePercentage || 0,
        };
      });
  }, [registeredCourses, masterSubjects, subjects]);

  return (
    <Card className="glass glass-border">
      <CardHeader>
        <CardTitle>Registered Subjects ({registeredSubjects.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {registeredSubjects.length === 0 ? (
            <p className="text-center text-muted-foreground">No subjects registered</p>
          ) : (
            registeredSubjects.map((subject: any) => (
              <div key={subject.id} className="flex justify-between items-center p-3 border rounded hover:bg-accent/20 transition">
                <div>
                  <p className="font-medium">{subject.name}</p>
                  <p className="text-sm text-muted-foreground">{subject.code}</p>
                </div>
                <Badge variant="outline" className={subject.attendancePercentage >= 75 ? 'bg-green-50 text-green-700' : subject.attendancePercentage >= 60 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}>
                  {subject.attendancePercentage.toFixed(1)}%
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------ Main Component ------------------ */
export default function SubjectWiseAttendance() {
  const [mounted, setMounted] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const user = useMemo(() => getCurrentUser(), []);
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [departments, setDepartments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  const subjects = useMemo(() => mounted ? getSubjects() : [], [mounted, refreshTrigger]);
  const masterSubjects = useMemo(() => mounted ? getMasterSubjects() : [], [mounted, refreshTrigger]);
  const registeredCourses = useMemo(() => mounted && user ? getRegisteredCoursesForStudent(user.id) : null, [mounted, user, refreshTrigger]);
  const studentAttendance = useMemo(() => mounted && user ? getStudentAttendance(user.id) : [], [mounted, user, refreshTrigger]);
  const allAttendance = useMemo(() => mounted ? getAllAttendance() : [], [mounted, refreshTrigger]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCourseRegistrationUpdates(() => {
      setRefreshTrigger(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  // Real-time sync: automatically refresh when attendance changes
  useRealtimeSyncRefresh(['attendance', 'subject', 'department', 'section'], () => {
    setRefreshTrigger(prev => prev + 1);
  });

  /* -------- Derived Data -------- */
  const activity = useMemo(() => {
    return allAttendance
      .filter(x => x.studentId === user?.id)
      .map(x => ({
        id: x.id,
        type: (x as any).type || 'marked',
        message: `${(x as any).type || 'Marked'} for ${(x as any).subjectName}`,
        timestamp: new Date((x as any).timestamp || x.date).getTime()
      }))
      .sort((x, y) => y.timestamp - x.timestamp)
      .slice(0, 10);
  }, [allAttendance, user]);

  const timetable = useMemo(() => {
    const baseDate = new Date('2023-01-01');
    return subjects.map((sub, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + (i % 2)); // alternate days demo

      const dateStr = d.toISOString().split('T')[0];

      const startHour = 8 + i;
      const endHour = startHour + 1;

      return {
        subject: sub.name,
        date: dateStr,
        startTime: new Date(
          `${dateStr}T${String(startHour).padStart(2, '0')}:00:00`
        ).toISOString(),
        endTime: new Date(
          `${dateStr}T${String(endHour).padStart(2, '0')}:00:00`
        ).toISOString(),
      };
    });
  }, [subjects]);

  /* -------- Enriched Subject Stats -------- */
  const enriched = useMemo(() => {
    return subjects.map(sub => {
      const rec = studentAttendance.filter(r => r.subjectId === sub.id);

      const p = rec.filter(r => r.status === 'present').length;
      const a = rec.filter(r => r.status === 'absent').length;
      const od = rec.filter(r => (r.status as any) === 'od' || (r.status as any) === 'ml').length;

      const total = rec.length;
      const attended = p + od;

      return {
        id: sub.id,
        code: sub.code || sub.name,
        description: sub.name,
        classesConducted: total,
        present: p,
        absent: a,
        odMlTaken: od,
        attendancePercentage: calcPercent(attended, total),
        presentPercentage: calcPercent(p, p + a + od),
        odMlPercentApproved: od ? 100 : 0,
        name: sub.name,
        teacherId: sub.teacherId,
        className: sub.className,
      };
    });
  }, [subjects, studentAttendance]);

  const absentToday = useMemo(() => {
    const t = new Date().toISOString().split('T')[0];
    return studentAttendance.some(a => a.date === t && a.status === 'absent');
  }, [studentAttendance]);

  const lowSub = enriched.find(s => s.attendancePercentage < 75)?.code || null;

  const subjectTrends = useMemo(() => [], []);

  const submitLeave = useCallback(() =>
    new Promise<void>(res => {
      setTimeout(() => {
        res();
      }, 1200);
    }), []);

  const handleCodeSubmit = async (code: string) => {
    if (!user) throw new Error('User not found');

    // For now, we'll assume the code is valid and mark as present for today's date
    // In a real implementation, you'd validate the code against the teacher's current code
    const today = new Date().toISOString().split('T')[0];
    const subjectId = enriched.length > 0 ? enriched[0].id : 'default'; // Use first subject or default

    const newAttendance: Attendance = {
      id: "att_" + Date.now() + Math.random(),
      studentId: user.id,
      date: today,
      status: 'present',
      subjectId,
    };

    addAttendance(newAttendance);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-4">My Attendance</h1>
          {user && (
            <div className="flex gap-4 text-sm">
              <p className="text-muted-foreground">
                <span className="font-semibold">Department:</span> {user.department || 'N/A'}
              </p>
              <p className="text-muted-foreground">
                <span className="font-semibold">Section:</span> {user.section || 'N/A'}
              </p>
            </div>
          )}
        </div>
        <div className="text-right text-sm text-muted-foreground">
          Last sync: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <LiveAttendanceCodeCard onCodeSubmit={handleCodeSubmit} />
      <AttendanceCalendarCard attendance={studentAttendance} />
      <AttendanceHistoryCard attendance={studentAttendance} />
      <AttendanceProgressCard subjects={enriched} />
      <RegisteredSubjectsCard subjects={enriched} registeredCourses={registeredCourses} masterSubjects={masterSubjects} />
    </div>
  );
}
