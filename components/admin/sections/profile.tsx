'use client';

import { getCurrentUser, updateUser } from '@/lib/storage';
import { useState } from 'react';
import { Save } from 'lucide-react';

export default function AdminProfile() {
  const user = getCurrentUser();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (user) {
      updateUser(user.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Admin Profile</h1>

      <div className="glass glass-border rounded-xl p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {saved && (
            <div className="p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
              Profile saved successfully!
            </div>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
