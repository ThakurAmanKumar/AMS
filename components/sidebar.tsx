'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, logoutUser } from '@/lib/storage';
import { useState, useEffect } from 'react';
import { Menu, X, LogOut } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: NavItem[];
  activePath: string;
  showLogout?: boolean;
}

export default function Sidebar({ items, activePath, showLogout = true }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load user on mount
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  };

  const isActive = (item: NavItem) => activePath === item.href;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative top-0 left-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 transition-transform duration-300 z-30 shadow-lg ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col p-6">
          {/* Logo */}
          <div className="mb-8 pt-8 md:pt-0">
            <h1 className="text-2xl font-bold text-white">AAMS</h1>
            <p className="text-sm text-slate-400 mt-1">University Portal</p>
          </div>

          {/* User Info */}
          <div className="mb-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-sm">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Logged in as</p>
            <p className="font-bold text-white truncate mt-1">{user?.name || 'Guest'}</p>
            <p className="text-xs text-slate-400 capitalize mt-1">{user?.role || ''}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
                  isActive(item)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          {showLogout && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 font-semibold rounded-lg hover:bg-slate-700/50 hover:text-white transition-all duration-200 cursor-pointer"
              >
                <span className="flex-shrink-0 w-5 h-5"><LogOut size={20} /></span>
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
