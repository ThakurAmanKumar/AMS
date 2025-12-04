'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import SessionProvider from '@/components/session-provider';
import LiveAttendance from '@/components/student/sections/live-attendance';
import {
  LayoutDashboard,
  TrendingUp,
  BookMarked,
  Calendar,
  BarChart2,
  Bell,
  User,
} from 'lucide-react';

export default function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'My Attendance', href: '/student/dashboard/subjects', icon: <TrendingUp size={20} /> },
    { label: 'Course Registration', href: '/student/dashboard/course-registration', icon: <BookMarked size={20} /> },
    { label: 'Timetable', href: '/student/dashboard/calendar', icon: <Calendar size={20} /> },
    { label: 'Performance', href: '/student/dashboard/performance', icon: <BarChart2 size={20} /> },
    { label: 'Notifications', href: '/student/dashboard/notifications', icon: <Bell size={20} /> },
    { label: 'Profile', href: '/student/dashboard/profile', icon: <User size={20} /> },
  ];

  return (
    <SessionProvider requiredRole="student">
      <div className="flex h-screen bg-slate-100">
        <Sidebar items={navItems} activePath={pathname} showLogout={true} />
        <main className="flex-1 overflow-auto md:ml-0 ml-0 pt-16 md:pt-0">
          {children}
        </main>
        <LiveAttendance />
      </div>
    </SessionProvider>
  );
}
