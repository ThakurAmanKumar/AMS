'use client';

import { useState, useEffect } from 'react';
import StudentDashboardHome from './sections/dashboard-home';
import CourseTimetable from './sections/course-timetable';
import SubjectWiseAttendance from './sections/subject-attendance';
import StudentNotifications from './sections/notifications';
import StudentProfile from './sections/profile';
import PerformanceSection from './sections/performance';

export default function StudentDashboard() {
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
        return <StudentDashboardHome />;
      case 'calendar':
        return <CourseTimetable />;
      case 'subjects':
        return <SubjectWiseAttendance />;
      case 'notifications':
        return <StudentNotifications />;
      case 'profile':
        return <StudentProfile />;
      case 'performance':
        return <PerformanceSection />;
      default:
        return <StudentDashboardHome />;
    }
  };

  return renderSection();
}
