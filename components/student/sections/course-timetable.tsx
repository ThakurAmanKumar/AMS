'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCurrentUser, getStudentTimetable, getSubjects, getTimetable, getUserById, getTeachers } from '@/lib/storage';
import { useRealtimeSyncRefresh } from '@/hooks/use-realtime-sync';
import { TimetableSlot, Subject, User } from '@/lib/storage';
import { Calendar, Clock, User as UserIcon, MapPin } from 'lucide-react';

export default function CourseTimetable() {
  const user = getCurrentUser();
  const memoizedUser = useMemo(() => user, [user?.id]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [filterBySubject, setFilterBySubject] = useState<string>('all');
  const [uniqueSubjects, setUniqueSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (memoizedUser) {
      loadData();
    }
  }, [memoizedUser]);

  // Real-time sync: refresh when timetable changes
  useRealtimeSyncRefresh('timetable', () => {
    if (memoizedUser) {
      loadData();
    }
  });

  const loadData = () => {
    if (!memoizedUser) return;
    
    // Get all timetable entries
    const allTimetable = getTimetable();
    setTimetable(allTimetable);
    setSubjects(getSubjects());
    setTeachers(getTeachers());
    
    // Extract unique subjects for filtering
    const subjectsSet = Array.from(new Set(allTimetable.map(slot => slot.subjectId)));
    setUniqueSubjects(subjectsSet as string[]);
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : teacherId;
  };

  const getSlotsForDay = (day: string) => {
    let slots = timetable.filter(slot => slot.day === day).sort((a, b) => a.time.localeCompare(b.time));
    
    // Apply subject filter
    if (filterBySubject !== 'all') {
      slots = slots.filter(slot => slot.subjectId === filterBySubject);
    }
    
    return slots;
  };

  const timeSlots = [
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00',
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Calendar className="w-8 h-8" />
          Timetable
        </h1>
        <p className="text-muted-foreground">View and manage your class schedule</p>
      </div>

      {/* Today's Classes Card */}
      <div className="glass glass-border p-6 rounded-xl mb-8">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Today's Classes ({todayName})
        </h3>
        <div className="space-y-3">
          {getSlotsForDay(todayName).length > 0 ? (
            getSlotsForDay(todayName).map((slot, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 hover:border-primary/40 transition">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{getSubjectName(slot.subjectId)}</p>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {slot.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {slot.className}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground flex items-center gap-1 justify-end">
                    <UserIcon className="w-4 h-4" />
                    {getTeacherName(slot.teacherId)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground py-4">No classes scheduled for today</p>
          )}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="glass glass-border p-6 rounded-xl">
        <h3 className="text-lg font-bold text-foreground mb-6">Weekly Schedule</h3>

        {/* Subject Filter */}
        <div className="mb-6 flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Filter by Subject:</label>
          <select
            value={filterBySubject}
            onChange={(e) => setFilterBySubject(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
          >
            <option value="all">All Subjects</option>
            {uniqueSubjects.map(subjectId => {
              const s = subjects.find(x => x.id === subjectId);
              return (
                <option key={subjectId} value={subjectId}>{s ? s.name : subjectId}</option>
              );
            })}
          </select>
        </div>

        {/* Day Selection */}
        <div className="flex flex-wrap gap-2 mb-6">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                selectedDay === day
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Timetable Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b-2 border-border">
                <th className="p-4 text-left font-semibold text-foreground">Time</th>
                <th className="p-4 text-left font-semibold text-foreground">Subject</th>
                <th className="p-4 text-left font-semibold text-foreground">Teacher</th>
                <th className="p-4 text-left font-semibold text-foreground">Room</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(timeSlot => {
                const slot = getSlotsForDay(selectedDay).find(s => s.time === timeSlot);
                const [startTime, endTime] = timeSlot.split('-');
                return (
                  <tr key={timeSlot} className={`border-b border-border hover:bg-muted/50 transition ${
                    slot ? 'bg-primary/5' : ''
                  }`}>
                    <td className="p-4 font-medium text-foreground">{startTime} - {endTime}</td>
                    <td className="p-4">
                      {slot ? (
                        <span className="font-semibold text-foreground">{getSubjectName(slot.subjectId)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 text-foreground">
                      {slot ? getTeacherName(slot.teacherId) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="p-4 text-foreground">
                      {slot ? (slot.room || 'Room ' + Math.floor(Math.random() * 100 + 1)) : <span className="text-muted-foreground">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* No classes message */}
        {getSlotsForDay(selectedDay).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No classes scheduled for {selectedDay}
          </div>
        )}
      </div>
    </div>
  );
}
