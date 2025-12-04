'use client';

import { useState, useEffect } from 'react';
import {
  getCurrentUser,
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement
} from '@/lib/storage';

import { Announcement } from '@/lib/storage';
import { Plus, Trash2, X } from 'lucide-react';

export default function Announcements() {
  const user = getCurrentUser();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = () => {
    // Load announcements posted by this teacher
    const data = getAnnouncements().filter(a => a.teacherId === user?.id);
    setAnnouncements(data);
  };

  const handlePostAnnouncement = () => {
    if (!formData.title || !formData.content) {
      alert('Please fill all fields');
      return;
    }

    const newAnnouncement: Announcement = {
      id: 'ann_' + Date.now(),
      title: formData.title,
      content: formData.content,

      // 🔥 NEW TEACHER DETAILS ADDED
      teacherId: user?.id || '',
      teacherName: user?.name || 'Unknown Teacher',
      teacherSubject: user?.subject || 'Unknown Subject',
      teacherDepartment: user?.department || user?.class || 'Unknown Department',

      date: new Date().toISOString(),
    };

    addAnnouncement(newAnnouncement);
    loadAnnouncements();

    setFormData({ title: '', content: '' });
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this announcement?')) {
      deleteAnnouncement(id);
      loadAnnouncements();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Announcements</h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition"
        >
          <Plus className="w-5 h-5" />
          Post Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="glass glass-border p-8 rounded-xl text-center text-muted-foreground">
            No announcements yet. Post one to get started!
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="glass glass-border p-6 rounded-xl">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-foreground">
                  {announcement.title}
                </h3>

                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-muted-foreground mb-3">{announcement.content}</p>

              {/* 🔥 NEW TEACHER DETAIL SECTION */}
              <div className="text-xs space-y-1 text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <p><b>Teacher:</b> {announcement.teacherName}</p>
                <p><b>Subject:</b> {announcement.teacherSubject}</p>
                <p><b>Department/Class:</b> {announcement.teacherDepartment}</p>
                <p><b>Date:</b> {new Date(announcement.date).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass glass-border rounded-2xl p-8 max-w-md w-full">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Post Announcement</h2>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-muted rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Announcement Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-2 focus:ring-accent/50"
              />

              <textarea
                placeholder="Announcement Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:ring-2 focus:ring-accent/50"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePostAnnouncement}
                className="flex-1 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition"
              >
                Post Announcement
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
    </div>
  );
}
