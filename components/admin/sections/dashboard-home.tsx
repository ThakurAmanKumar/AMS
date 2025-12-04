'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, BookOpen, TrendingUp, TrendingDown, AlertTriangle, Brain, Zap, Activity } from 'lucide-react';
import { getAllUsers, getAllAttendance } from '@/lib/storage';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter } from 'recharts';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClassesToday: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    attendanceRate: 0,
    predictedAttendance: 0,
  });

  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 0,
    liveAttendanceUpdates: 0,
  });

  useEffect(() => {
    const users = getAllUsers();
    const attendance = getAllAttendance();
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(a => a.date === today);

    const totalToday = todayAttendance.length;
    const presentCount = todayAttendance.filter(a => a.status === 'present').length;
    const absentCount = todayAttendance.filter(a => a.status === 'absent').length;
    const lateCount = todayAttendance.filter(a => a.status === 'late').length;
    const attendanceRate = totalToday > 0 ? ((presentCount + lateCount) / totalToday * 100) : 0;

    setStats({
      totalStudents: users.filter(u => u.role === 'student').length,
      totalTeachers: users.filter(u => u.role === 'teacher').length,
      totalClassesToday: 6,
      presentToday: presentCount,
      absentToday: absentCount,
      lateToday: lateCount,
      attendanceRate: Math.round(attendanceRate),
      predictedAttendance: Math.round(attendanceRate + (Math.random() * 10 - 5)), // Mock prediction
    });

    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        activeUsers: Math.floor(Math.random() * 50) + 10,
        liveAttendanceUpdates: prev.liveAttendanceUpdates + Math.floor(Math.random() * 3),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const attendanceData = [
    { name: 'Mon', present: 45, absent: 8, late: 2, predicted: 47 },
    { name: 'Tue', present: 48, absent: 5, late: 2, predicted: 49 },
    { name: 'Wed', present: 50, absent: 3, late: 2, predicted: 51 },
    { name: 'Thu', present: 46, absent: 7, late: 2, predicted: 48 },
    { name: 'Fri', present: 42, absent: 10, late: 3, predicted: 45 },
  ];

  const pieData = [
    { name: 'Present', value: stats.presentToday, color: '#4f46e5' },
    { name: 'Absent', value: stats.absentToday, color: '#ef4444' },
    { name: 'Late', value: stats.lateToday, color: '#eab308' },
  ];

  const predictionData = [
    { day: 'Today', actual: stats.attendanceRate, predicted: stats.predictedAttendance },
    { day: 'Tomorrow', actual: null, predicted: stats.predictedAttendance + 2 },
    { day: 'Day 3', actual: null, predicted: stats.predictedAttendance - 1 },
    { day: 'Day 4', actual: null, predicted: stats.predictedAttendance + 3 },
    { day: 'Day 5', actual: null, predicted: stats.predictedAttendance - 2 },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }: any) => (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="glass glass-border p-6 rounded-xl hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-semibold">{title}</p>
          <motion.p
            className="text-3xl font-bold text-foreground mt-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {value}
          </motion.p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(trend)}% from last week
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">Advanced Admin Dashboard</h1>
        <p className="text-muted-foreground">Real-time insights with AI-powered predictions</p>
      </motion.div>

      {/* Real-time Status */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex gap-4"
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <Activity className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium">{realTimeData.activeUsers} Active Users</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">{realTimeData.liveAttendanceUpdates} Live Updates Today</span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="bg-blue-100 dark:bg-blue-900/20 text-blue-600"
          trend={5.2}
        />
        <StatCard
          title="Total Teachers"
          value={stats.totalTeachers}
          icon={UserCheck}
          color="bg-green-100 dark:bg-green-900/20 text-green-600"
          trend={2.1}
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          icon={TrendingUp}
          color="bg-purple-100 dark:bg-purple-900/20 text-purple-600"
          trend={-1.3}
          subtitle="Today's attendance"
        />
        <StatCard
          title="AI Prediction"
          value={`${stats.predictedAttendance}%`}
          icon={Brain}
          color="bg-orange-100 dark:bg-orange-900/20 text-orange-600"
          subtitle="Tomorrow's forecast"
        />
      </div>

      {/* Alert Section */}
      {stats.absentToday > 5 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">High Absence Alert</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {stats.absentToday} students absent today. Consider reviewing attendance policies.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* AI-Powered Attendance Prediction */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass glass-border p-6 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-foreground">AI Attendance Prediction</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={predictionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="actual"
                stackId="1"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.6}
                name="Actual"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stackId="2"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.4}
                name="Predicted"
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Real-time Attendance Distribution */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass glass-border p-6 rounded-xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold text-foreground">Live Attendance Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Weekly Trend with Prediction */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass glass-border p-6 rounded-xl lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-foreground">Weekly Attendance Trend & Forecast</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="present"
                stroke="#4f46e5"
                strokeWidth={3}
                name="Present"
                dot={{ fill: '#4f46e5', strokeWidth: 2, r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="AI Prediction"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
