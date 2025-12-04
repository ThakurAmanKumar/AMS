'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCurrentUser, getTeacherTimetable, getSubjects } from '@/lib/storage';
import { TimetableSlot, Subject } from '@/lib/storage';
import { motion } from 'framer-motion';

export default function AssignedTimetable() {
  const user = getCurrentUser();
  const memoizedUser = useMemo(() => user, [user?.id]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));

  useEffect(() => {
    if (memoizedUser) {
      const teacherTimetable = getTeacherTimetable(memoizedUser.id);
      setTimetable(teacherTimetable);
      setSubjects(getSubjects());
    }
  }, [memoizedUser]);

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  const formatTimeToAMPM = (timeRange: string) => {
    const [startTime, endTime] = timeRange.split('-');
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const getSlotsForDay = (day: string) => {
    return timetable.filter(slot => slot.day === day).sort((a, b) => a.time.localeCompare(b.time));
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-8 max-w-6xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-foreground mb-8">Assigned Timetable</h1>

      <div className="glass glass-border rounded-xl p-8">
        {/* Day Selection */}
        <div className="flex flex-wrap gap-2 mb-8">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedDay === day
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Timetable Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border rounded-lg">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-4 text-left font-semibold">Time</th>
                <th className="border border-border p-4 text-left font-semibold">Subject</th>
                <th className="border border-border p-4 text-left font-semibold">Room</th>
                <th className="border border-border p-4 text-left font-semibold">Section</th>
              </tr>
            </thead>
            <tbody>
              {getSlotsForDay(selectedDay).map(slot => (
                <tr key={slot.id} className="hover:bg-muted/50">
                  <td className="border border-border p-4 font-medium">{formatTimeToAMPM(slot.time)}</td>
                  <td className="border border-border p-4">
                    {getSubjectName(slot.subjectId)}
                  </td>
                  <td className="border border-border p-4">
                    {slot.room || 'N/A'}
                  </td>
                  <td className="border border-border p-4">
                    {slot.section || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* No classes message */}
        {getSlotsForDay(selectedDay).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No classes assigned for {selectedDay}
          </div>
        )}

        {/* Real-time indicator */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Real-time timetable updates
        </div>
      </div>
    </motion.div>
  );
}