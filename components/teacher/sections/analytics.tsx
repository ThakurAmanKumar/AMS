'use client';

import { useState, useEffect } from 'react';
import { getStudents, getAllAttendance } from '@/lib/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ClassAnalytics() {
  const [studentAnalytics, setStudentAnalytics] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    const students = getStudents();
    const attendance = getAllAttendance();

    const analytics = students.map(student => {
      const records = attendance.filter(a => a.studentId === student.id);
      const presentCount = records.filter(a => a.status === 'present').length;
      const totalCount = records.length || 1;
      const percentage = ((presentCount / totalCount) * 100).toFixed(1);
      return {
        name: student.name,
        attendance: parseFloat(percentage),
        present: presentCount,
        total: totalCount,
      };
    });

    setStudentAnalytics(analytics);

    const monthly = [
      { month: 'Jan', attendance: 88, passed: 45, failed: 5 },
      { month: 'Feb', attendance: 85, passed: 44, failed: 6 },
      { month: 'Mar', attendance: 92, passed: 48, failed: 2 },
      { month: 'Apr', attendance: 78, passed: 40, failed: 10 },
      { month: 'May', attendance: 95, passed: 50, failed: 0 },
    ];
    setMonthlyData(monthly);
  }, []);

  const lowestAttendance = studentAnalytics.sort((a, b) => a.attendance - b.attendance).slice(0, 5);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Class Analytics</h1>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Class Performance */}
        <div className="glass glass-border p-6 rounded-xl">
          <h3 className="text-lg font-bold text-foreground mb-4">Student-wise Attendance %</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studentAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="attendance" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="glass glass-border p-6 rounded-xl">
          <h3 className="text-lg font-bold text-foreground mb-4">Monthly Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="attendance" stroke="#4f46e5" strokeWidth={2} />
              <Line type="monotone" dataKey="passed" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lowest Attendance Alert */}
      <div className="glass glass-border p-6 rounded-xl mb-8">
        <h3 className="text-lg font-bold text-foreground mb-4">Students with Lowest Attendance</h3>
        <div className="space-y-3">
          {lowestAttendance.map((student, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-semibold text-foreground">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.present} out of {student.total} classes</p>
              </div>
              <span className={`px-4 py-2 rounded-lg font-semibold ${
                student.attendance >= 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {student.attendance}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="glass glass-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold">Student Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Total Classes</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Present</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {studentAnalytics.map((student, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-6 py-4 font-semibold">{student.name}</td>
                  <td className="px-6 py-4">{student.total}</td>
                  <td className="px-6 py-4">{student.present}</td>
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
    </div>
  );
}
