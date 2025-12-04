'use client';

import { useState, useEffect } from 'react';
import { getAllUsers, addUser, updateUser, deleteUser, getDepartments, getMasterSubjects, Department, MasterSubject, User } from '@/lib/storage';
import { useRealtimeSyncRefresh } from '@/hooks/use-realtime-sync';
import { Edit2, Trash2, Plus, X, Upload, Download, Search, Filter, BarChart3, Users, BookOpen, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [masterSubjects, setMasterSubjects] = useState<MasterSubject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    empId: '',
    name: '',
    subject: '',
    assignedClass: '',
    email: '',
    phone: '',
    password: '',
    department: '',
    experience: '',
  });

  // Advanced features
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'subject' | 'experience'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadTeachers();
    loadDepartments();
    loadMasterSubjects();
  }, []);

  // Real-time sync: reload teachers when user changes occur (e.g., subject assignment)
  useRealtimeSyncRefresh(['user'], () => {
    loadTeachers();
  });

  const loadTeachers = () => {
    const data = getAllUsers().filter(user => user.role === 'teacher');
    setTeachers(data);
  };

  const loadDepartments = () => {
    const data = getDepartments();
    setDepartments(data);
  };

  const loadMasterSubjects = () => {
    const data = getMasterSubjects();
    setMasterSubjects(data);
  };
  const handleAddTeacher = () => {
    if (!formData.empId || !formData.name || !formData.email || !formData.subject || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateUser(editingId, {
        empId: formData.empId,
        name: formData.name,
        subject: formData.subject,
        assignedClass: formData.assignedClass,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        department: formData.department,
      });
    } else {
      const newTeacher: User = {
        id: 'teacher_' + Date.now(),
        empId: formData.empId,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'teacher',
        subject: formData.subject,
        assignedClass: formData.assignedClass,
        phone: formData.phone,
        department: formData.department,
      };
      addUser(newTeacher);
    }

    loadTeachers();
    setFormData({ empId: '', name: '', subject: '', assignedClass: '', email: '', phone: '', password: '', department: '', experience: '' });
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (teacher: User) => {
    setFormData({
      empId: teacher.empId || '',
      name: teacher.name,
      subject: teacher.subject || '',
      assignedClass: teacher.assignedClass || '',
      email: teacher.email,
      phone: teacher.phone || '',
      password: teacher.password || '',
      department: teacher.department || '',
      experience: '',
    });
    setEditingId(teacher.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this teacher?')) {
      deleteUser(id);
      loadTeachers();
      toast.success('Teacher deleted successfully!');
    }
  };

  const filteredTeachers = teachers.filter(
    t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Teacher Management</h1>
        <button
          onClick={() => {
            setFormData({ empId: '', name: '', subject: '', assignedClass: '', email: '', phone: '', password: '', department: '', experience: '' });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition"
        >
          <Plus className="w-5 h-5" />
          Add Teacher
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent/50 transition"
        />
      </div>

      <div className="glass glass-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold">Emp. ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Subject</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Assigned Class</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-6 py-4">{teacher.empId}</td>
                  <td className="px-6 py-4">{teacher.name}</td>
                  <td className="px-6 py-4">{teacher.subject}</td>
                  <td className="px-6 py-4">{teacher.assignedClass}</td>
                  <td className="px-6 py-4">{teacher.department}</td>
                  <td className="px-6 py-4 text-sm">{teacher.email}</td>
                  <td className="px-6 py-4">{teacher.phone}</td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(teacher)}
                      className="p-2 text-accent hover:bg-accent/10 rounded-lg transition"
                      title="Edit teacher"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(teacher.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                      title="Delete teacher"
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass glass-border rounded-2xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {editingId ? 'Edit Teacher' : 'Add New Teacher'}
              </h2>
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
                placeholder="Employee ID"
                value={formData.empId}
                onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="">Select Subject</option>
                {masterSubjects.map((subject) => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Assigned Class"
                value={formData.assignedClass}
                onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent/50"
                title="Select Department"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.code}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddTeacher}
                className="flex-1 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition"
              >
                {editingId ? 'Update' : 'Add'} Teacher
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
