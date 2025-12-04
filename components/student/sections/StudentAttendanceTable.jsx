'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { getCurrentUser, getRegisteredCoursesForStudent, getMasterSubjects, getAllAttendance } from '@/lib/storage';
import { useRealtimeSyncRefresh } from '@/hooks/use-realtime-sync';

// Example data shape expected in storage
// RegisteredCourse: { studentId, courseIds: [] }
// MasterSubject: { id, name, code, departmentId, description }
// Attendance: { id, studentId, subjectId, date, status }

export default function StudentAttendanceTable() {
  const user = getCurrentUser();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // registeredCourses for this student is a single object { studentId, courseIds: [] }
  const registered = useMemo(() => (user ? getRegisteredCoursesForStudent(user.id) : null), [user, refreshKey]);
  const masterSubjects = useMemo(() => getMasterSubjects(), [refreshKey]);
  const allAttendance = useMemo(() => getAllAttendance(), [refreshKey]);

  // Real-time sync: refresh attendance when new marks are added
  useRealtimeSyncRefresh(['attendance'], () => {
    setRefreshKey(prev => prev + 1);
  });

  // Build attendance data only for registered courses
  const attendanceData = useMemo(() => {
    // Map subjectId -> { conducted, present, absent }
    const map = {};

    // initialize map for each registered course id
    if (registered && Array.isArray(registered.courseIds)) {
      registered.courseIds.forEach((subjectId) => {
        if (!subjectId) return;
        map[subjectId] = { conducted: 0, present: 0, absent: 0 };
      });
    }

    allAttendance.forEach((a) => {
      // Only count attendance for this student and subjects they are registered in
      if (!user) return;
      if (a.studentId !== user.id) return;
      if (!map[a.subjectId]) return; // not registered

      map[a.subjectId].conducted += 1;
      if (a.status === 'present') map[a.subjectId].present += 1;
      else map[a.subjectId].absent += 1;
    });

    // Convert to array with subject info
    return Object.keys(map).map((subjectId) => {
      const subj = masterSubjects.find(s => s.id === subjectId) || { id: subjectId, code: subjectId, name: 'Unknown Subject', description: '' };
      const { conducted, present, absent } = map[subjectId];
      const percentage = conducted > 0 ? (present / conducted) * 100 : 0;
      return {
        code: subj.code || subj.id || subjectId,
        name: subj.name || 'Unknown Subject',
        conducted,
        present,
        absent,
        percentage: percentage.toFixed(2),
      };
    });
  }, [registered, masterSubjects, allAttendance, user, refreshKey]);

  const getStatusColor = (percentage) => {
    const perc = parseFloat(percentage);
    if (perc >= 75) return 'text-green-600 font-semibold';
    if (perc >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold">Subject Code</th>
            <th className="text-left py-3 px-4 font-semibold">Subject Name</th>
            <th className="text-center py-3 px-4 font-semibold">Classes Conducted</th>
            <th className="text-center py-3 px-4 font-semibold">Present</th>
            <th className="text-center py-3 px-4 font-semibold">Absent</th>
            <th className="text-center py-3 px-4 font-semibold">Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {attendanceData.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-6 px-4 text-center text-muted-foreground">
                No registered courses or attendance records found.
              </td>
            </tr>
          ) : (
            attendanceData.map((row, idx) => (
              <tr key={row.code} className="border-b border-border/50 hover:bg-accent/20 transition">
                <td className="py-3 px-4 font-medium">{row.code}</td>
                <td className="py-3 px-4">{row.name}</td>
                <td className="py-3 px-4 text-center">{row.conducted}</td>
                <td className="py-3 px-4 text-center text-green-600 font-semibold">{row.present}</td>
                <td className="py-3 px-4 text-center text-red-600 font-semibold">{row.absent}</td>
                <td className={`py-3 px-4 text-center ${getStatusColor(row.percentage)}`}>
                  {row.percentage}%
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
