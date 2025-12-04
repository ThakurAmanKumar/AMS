'use client';

import { useState, useEffect } from 'react';
import { getAnnouncements } from '@/lib/storage';

export default function StudentNotifications() {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const allAnnouncements = getAnnouncements() || [];

    // Sort newest first
    const sorted = [...allAnnouncements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setAnnouncements(sorted);
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        Notifications & Announcements
      </h1>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="glass glass-border p-8 rounded-xl text-center text-muted-foreground">
            No announcements yet
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="glass glass-border p-6 rounded-xl"
            >
              {/* Title */}
              <h3 className="text-lg font-bold text-foreground mb-2">
                {announcement.title}
              </h3>

              {/* Content */}
              <p className="text-muted-foreground mb-4">
                {announcement.content}
              </p>

              {/* FULL TEACHER DETAILS */}
              <div className="bg-muted/30 p-3 rounded-lg text-xs leading-relaxed space-y-1 text-muted-foreground">
                <p>
                  <strong>Teacher:</strong>{' '}
                  {announcement.teacherName || "Unknown Teacher"}
                </p>

                <p>
                  <strong>Subject:</strong>{' '}
                  {announcement.teacherSubject || "Unknown Subject"}
                </p>

                <p>
                  <strong>Department/Class:</strong>{' '}
                  {announcement.teacherDepartment || "Unknown Department"}
                </p>

                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(announcement.date).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
