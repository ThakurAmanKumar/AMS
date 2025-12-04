'use client';

import { useState, useEffect } from 'react';
import { getTimetable, addTimetableSlot, updateTimetableSlot, deleteTimetableSlot, getSubjects, getTeachers } from '@/lib/storage';
import { TimetableSlot, Subject, User } from '@/lib/storage';
import { useRealtimeSyncRefresh } from '@/hooks/use-realtime-sync';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

export default function TimetableManagement() {
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    time: '',
    subjectId: '',
    teacherId: '',
    className: '',
    day: '',
    room: '',
    section: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  // Real-time sync: refresh when timetable changes
  useRealtimeSyncRefresh('timetable', () => {
    loadData();
  });

  const loadData = () => {
    setTimetable(getTimetable());
    setSubjects(getSubjects());
    setTeachers(getTeachers());
  };

  const handleAddSlot = () => {
    if (!formData.time || !formData.subjectId || !formData.teacherId || !formData.className || !formData.day) {
      toast.error('Please fill in all fields');
      return;
    }

    const newSlot: TimetableSlot = {
      id: 'timetable_' + Date.now(),
      time: formData.time,
      subjectId: formData.subjectId,
      teacherId: formData.teacherId,
      className: formData.className,
      day: formData.day,
      room: formData.room,
      section: formData.section,
    };

    if (editingId) {
      updateTimetableSlot(editingId, newSlot);
      toast.success('Timetable slot updated successfully!');
    } else {
      addTimetableSlot(newSlot);
      toast.success('Timetable slot added successfully!');
    }

    loadData();
    setFormData({ time: '', subjectId: '', teacherId: '', className: '', day: '', room: '', section: '' });
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (slot: TimetableSlot) => {
    setFormData({
      time: slot.time,
      subjectId: slot.subjectId,
      teacherId: slot.teacherId,
      className: slot.className,
      day: slot.day,
      room: slot.room || '',
      section: slot.section || '',
    });
    setEditingId(slot.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this timetable slot?')) {
      deleteTimetableSlot(id);
      loadData();
      toast.success('Timetable slot deleted successfully!');
    }
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Unknown Subject';
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : 'Unknown Teacher';
  };

  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-8 max-w-7xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Timetable Management</h1>
        <button
          onClick={() => {
            setFormData({ time: '', subjectId: '', teacherId: '', className: '', day: '', room: '', section: '' });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-5 h-5" />
          Add Timetable Slot
        </button>
      </div>

      {/* Timetable Table */}
      <div className="glass glass-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold">Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Subject</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Teacher</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Room</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Section</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Day</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timetable.map((slot) => (
                <tr key={slot.id} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-6 py-4 font-medium">{slot.time}</td>
                  <td className="px-6 py-4">{getSubjectName(slot.subjectId)}</td>
                  <td className="px-6 py-4">{getTeacherName(slot.teacherId)}</td>
                  <td className="px-6 py-4">{slot.room || 'N/A'}</td>
                  <td className="px-6 py-4">{slot.section || 'N/A'}</td>
                  <td className="px-6 py-4">{slot.day}</td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(slot)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                      title="Edit Slot"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                      title="Delete Slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass glass-border rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {editingId ? 'Edit Timetable Slot' : 'Add New Timetable Slot'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-muted rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <select
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select Time Slot</option>
                {timeSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select Teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Class Name (e.g., B.Tech CSE - A)"
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="Room (e.g., Room 101)"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="Section (e.g., A, B, C)"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select Day</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddSlot}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                {editingId ? 'Update' : 'Add'} Slot
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 border border-border rounded-lg hover:bg-muted transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}