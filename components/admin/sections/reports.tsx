  'use client';

import { getAllAttendance, getStudents } from '@/lib/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter, AreaChart, Area } from 'recharts';
import { Download, FileText, FileSpreadsheet, Presentation, TrendingUp, Calendar, Filter, Settings, Brain, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ReportsSection() {
  const [studentAttendanceData, setStudentAttendanceData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [teacherPerformanceData, setTeacherPerformanceData] = useState<any[]>([]);
  const [predictiveData, setPredictiveData] = useState<any[]>([]);
  const [heatMapData, setHeatMapData] = useState<any[]>([]);
  const [selectedReportType, setSelectedReportType] = useState<'overview' | 'predictive' | 'comparative' | 'custom'>('overview');
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-12-31' });
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  useEffect(() => {
    const students = getStudents();
    const attendance = getAllAttendance();

    // Student attendance data
    const data = students.map(student => {
      const records = attendance.filter(a => a.studentId === student.id);
      const presentCount = records.filter(a => a.status === 'present').length;
      const lateCount = records.filter(a => a.status === 'late').length;
      const absentCount = records.filter(a => a.status === 'absent').length;
      const totalCount = records.length || 1;
      const percentage = ((presentCount + lateCount) / totalCount * 100).toFixed(1);
      return {
        name: student.name,
        attendance: parseFloat(percentage),
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        total: totalCount,
        trend: Math.random() > 0.5 ? 'up' : 'down', // Mock trend
      };
    });

    setStudentAttendanceData(data);

    // Monthly trend data with predictive elements
    const monthly = [
      { month: 'Jan', attendance: 88, predicted: 89 },
      { month: 'Feb', attendance: 85, predicted: 87 },
      { month: 'Mar', attendance: 92, predicted: 91 },
      { month: 'Apr', attendance: 78, predicted: 82 },
      { month: 'May', attendance: 95, predicted: 93 },
      { month: 'Jun', attendance: null, predicted: 88 }, // Future prediction
    ];
    setMonthlyData(monthly);

    // Teacher performance data
    const teachers = [
      { name: 'Dr. Smith', subject: 'Math', avgAttendance: 92, studentSatisfaction: 4.5 },
      { name: 'Prof. Johnson', subject: 'Physics', avgAttendance: 88, studentSatisfaction: 4.2 },
      { name: 'Ms. Davis', subject: 'Chemistry', avgAttendance: 95, studentSatisfaction: 4.7 },
      { name: 'Mr. Wilson', subject: 'Biology', avgAttendance: 87, studentSatisfaction: 4.1 },
    ];
    setTeacherPerformanceData(teachers);

    // Predictive analytics data
    const predictive = students.slice(0, 10).map((student, index) => ({
      name: student.name,
      currentAttendance: parseFloat(data[index]?.attendance.toString() || '0'),
      predictedAttendance: Math.min(100, parseFloat(data[index]?.attendance.toString() || '0') + Math.random() * 10 - 5),
      riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
    }));
    setPredictiveData(predictive);

    // Heat map data for attendance patterns
    const heatMap = [];
    for (let week = 1; week <= 12; week++) {
      for (let day = 1; day <= 7; day++) {
        heatMap.push({
          week: week.toString(),
          day: day.toString(),
          attendance: Math.floor(Math.random() * 100),
        });
      }
    }
    setHeatMapData(heatMap);
  }, []);

  const handleDownloadReport = (format: 'pdf' | 'excel' | 'ppt') => {
    const reportData = {
      type: selectedReportType,
      dateRange,
      data: selectedReportType === 'overview' ? studentAttendanceData :
            selectedReportType === 'predictive' ? predictiveData : teacherPerformanceData,
      generatedAt: new Date().toISOString(),
    };

    // Mock download functionality
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${selectedReportType}-${format}-${Date.now()}.${format === 'pdf' ? 'json' : format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateCustomReport = () => {
    // Custom report generation logic would go here
    alert('Custom report generation feature would be implemented with advanced filtering and data processing');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-8 max-w-7xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Advanced Reports & Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleDownloadReport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            title="Download PDF report"
          >
            <FileText className="w-5 h-5" />
            PDF
          </button>
          <button
            onClick={() => handleDownloadReport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            title="Download Excel report"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Excel
          </button>
          <button
            onClick={() => handleDownloadReport('ppt')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            title="Download PowerPoint report"
          >
            <Presentation className="w-5 h-5" />
            PPT
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="glass glass-border p-6 rounded-xl">
          <h3 className="text-lg font-bold text-foreground mb-4">Student-wise Attendance %</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studentAttendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="attendance" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass glass-border p-6 rounded-xl">
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
      </div>

      <div className="mt-8 glass glass-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold">Student Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Total Classes</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Present</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Late</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {studentAttendanceData.map((student, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-6 py-4 font-semibold">{student.name}</td>
                  <td className="px-6 py-4">{student.total}</td>
                  <td className="px-6 py-4">{student.present}</td>
                  <td className="px-6 py-4">{student.late}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      student.attendance >= 85 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {student.attendance}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
