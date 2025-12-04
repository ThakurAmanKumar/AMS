'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, initializeStorage } from '@/lib/storage';

export default function StudentLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('rajesh@aams.com');
  const [password, setPassword] = useState('student123');
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
    if (user && user.role === 'student') {
      router.push('/student/dashboard');
    } else {
      setError('Invalid student credentials. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">📚</span>
            <span className="text-3xl font-bold text-secondary">AAMS</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Student Login</h1>
          <p className="text-muted-foreground mt-2">View your attendance and analytics</p>
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
                  className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50 transition"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/50 transition"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-lg text-sm text-foreground">
              <p className="font-semibold mb-1">Demo Credentials:</p>
              <p>Email: rajesh@aams.com, priya@aams.com, or amit@aams.com</p>
              <p>Password: student123</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/90 disabled:opacity-50 transition"
            >
              {loading ? 'Logging in...' : 'Login as Student'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-secondary hover:underline text-sm font-semibold"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
