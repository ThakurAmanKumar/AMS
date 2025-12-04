'use client';

import { useState, useEffect } from 'react';
import DashboardHome from './sections/dashboard-home';
import StudentManagement from './sections/student-management';
import TeacherManagement from './sections/teacher-management';
import AttendanceManagement from './sections/attendance-management';
import Reports from './sections/reports';
import Settings from './sections/settings';
import Profile from './sections/profile';
import MasterData from './sections/master-data';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'dashboard';
      setActiveSection(hash);
    };

    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardHome />;
      case 'students':
        return <StudentManagement />;
      case 'teachers':
        return <TeacherManagement />;
      case 'attendance':
        return <AttendanceManagement />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile />;
      case 'master-data':
        return <MasterData />;
      default:
        return <DashboardHome />;
    }
  };

  return renderSection();
}
