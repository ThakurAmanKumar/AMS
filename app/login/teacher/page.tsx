'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, initializeStorage } from '@/lib/storage';

export default function TeacherLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('john@aams.com');
  const [password, setPassword] = useState('teacher123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ensure storage is initialized
    initializeStorage();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const user = loginUser(email, password);
    if (user && user.role === 'teacher') {
      router.push('/teacher/dashboard');
    } else {
      setError('Invalid teacher credentials. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">📚</span>
            <span className="text-3xl font-bold text-accent">AAMS</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Teacher Login</h1>
          <p className="text-muted-foreground mt-2">Access your teaching dashboard</p>
        </div>

        <div className="glass glass-border rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-lg">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-lg">🔒</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg text-sm text-foreground">
              <p className="font-semibold mb-1">Demo Credentials:</p>
              <p>Email: john@aams.com or sarah@aams.com</p>
              <p>Password: teacher123</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-accent/90 disabled:opacity-50 transition"
            >
              {loading ? 'Logging in...' : 'Login as Teacher'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-accent hover:underline text-sm font-semibold"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
