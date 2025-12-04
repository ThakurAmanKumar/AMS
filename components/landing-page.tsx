'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Users, BarChart3, Shield } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-primary">AAMS</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/login/admin')}
              className="px-4 py-2 text-primary font-semibold hover:bg-primary/10 rounded-lg transition"
            >
              Admin
            </button>
            <button
              onClick={() => router.push('/login/teacher')}
              className="px-4 py-2 text-primary font-semibold hover:bg-primary/10 rounded-lg transition"
            >
              Teacher
            </button>
            <button
              onClick={() => router.push('/login/student')}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
            >
              Student
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Advanced Attendance Management System
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Smart, Fast & Automated Attendance Monitoring for Universities
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => router.push('/login/admin')}
              className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
            >
              Admin Login
            </button>
            <button
              onClick={() => router.push('/login/teacher')}
              className="px-8 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition"
            >
              Teacher Login
            </button>
            <button
              onClick={() => router.push('/login/student')}
              className="px-8 py-3 border-2 border-accent text-accent font-semibold rounded-lg hover:bg-accent/5 transition"
            >
              Student Login
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Student Portal */}
          <div className="glass glass-border p-8 rounded-2xl hover:shadow-lg transition">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Student Portal</h3>
            <p className="text-muted-foreground mb-6">
              View your attendance, analytics, timetable, and subject-wise performance reports.
            </p>
            <button
              onClick={() => router.push('/login/student')}
              className="text-primary font-semibold hover:gap-2 flex items-center gap-1 transition"
            >
              Login →
            </button>
          </div>

          {/* Teacher Portal */}
          <div className="glass glass-border p-8 rounded-2xl hover:shadow-lg transition">
            <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-2">Teacher Portal</h3>
            <p className="text-muted-foreground mb-6">
              Mark attendance, manage classes, track student performance, and post announcements.
            </p>
            <button
              onClick={() => router.push('/login/teacher')}
              className="text-accent font-semibold hover:gap-2 flex items-center gap-1 transition"
            >
              Login →
            </button>
          </div>

          {/* Admin Portal */}
          <div className="glass glass-border p-8 rounded-2xl hover:shadow-lg transition">
            <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Admin Portal</h3>
            <p className="text-muted-foreground mb-6">
              Full control over students, teachers, attendance management, and system settings.
            </p>
            <button
              onClick={() => router.push('/login/admin')}
              className="text-secondary font-semibold hover:gap-2 flex items-center gap-1 transition"
            >
              Login →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 Advanced Attendance Management System. All rights reserved.</p>
          <p className="text-sm mt-2">University-Grade Attendance Tracking & Analytics</p>
        </div>
      </footer>
    </div>
  );
}
