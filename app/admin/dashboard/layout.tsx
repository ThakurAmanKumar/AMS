'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import SessionProvider from '@/components/session-provider';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Database,
  BookMarked,
  ClipboardList,
  Calendar,
  BarChart3,
  User,
  Settings,
} from 'lucide-react';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Students', href: '/admin/dashboard/students', icon: <Users size={20} /> },
    { label: 'Teachers', href: '/admin/dashboard/teachers', icon: <BookOpen size={20} /> },
    { label: 'Master Data', href: '/admin/dashboard/master-data', icon: <Database size={20} /> },
    { label: 'Course Registration', href: '/admin/dashboard/course-registration', icon: <BookMarked size={20} /> },
    { label: 'Attendance', href: '/admin/dashboard/attendance', icon: <ClipboardList size={20} /> },
    { label: 'Timetable', href: '/admin/dashboard/timetable', icon: <Calendar size={20} /> },
    { label: 'Reports', href: '/admin/dashboard/reports', icon: <BarChart3 size={20} /> },
    { label: 'Profile', href: '/admin/dashboard/profile', icon: <User size={20} /> },
    { label: 'Settings', href: '/admin/dashboard/settings', icon: <Settings size={20} /> },
  ];

  return (
    <SessionProvider requiredRole="admin">
      <div className="flex h-screen bg-slate-100">
        <Sidebar items={navItems} activePath={pathname} showLogout={false} />
        <main className="flex-1 overflow-auto md:ml-0 ml-0 pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
