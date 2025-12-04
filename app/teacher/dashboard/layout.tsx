'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import SessionProvider from '@/components/session-provider';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  TrendingUp,
  Megaphone,
  User,
} from 'lucide-react';

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Mark Attendance', href: '/teacher/dashboard/attendance', icon: <ClipboardList size={20} /> },
    { label: 'Assigned Timetable', href: '/teacher/dashboard/timetable', icon: <Calendar size={20} /> },
    { label: 'Analytics', href: '/teacher/dashboard/analytics', icon: <TrendingUp size={20} /> },
    { label: 'Announcements', href: '/teacher/dashboard/announcements', icon: <Megaphone size={20} /> },
    { label: 'Profile', href: '/teacher/dashboard/profile', icon: <User size={20} /> },
  ];

  return (
    <SessionProvider requiredRole="teacher">
      <div className="flex h-screen bg-slate-100">
        <Sidebar items={navItems} activePath={pathname} />
        <main className="flex-1 overflow-auto md:ml-0 ml-0 pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
