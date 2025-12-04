'use client';

import { useState, useEffect } from 'react';
import { getStudents, addUser, updateUser, deleteUser, getDepartments, getSections } from '@/lib/storage';
import { Edit2, Trash2, Plus, X, Upload, Download, Search, Filter, Eye, EyeOff } from 'lucide-react';
import { User, Department, Section } from '@/lib/storage';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

export default function StudentManagement() {
  const [students, setStudents] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    department: '',
    section: '',
    email: '',
    phone: '',
    password: '',
  });

  // Advanced features
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [filterCourse, setFilterCourse] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'rollNo' | 'course'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadStudents();
    loadDepartments();
    loadSections();
  }, []);

  const loadStudents = () => {
    const data = getStudents();
    setStudents(data);
  };

  const loadDepartments = () => {
    const data = getDepartments();
    setDepartments(data);
  };

  const loadSections = () => {
    const data = getSections();
    setSections(data);
  };

  const handleAddStudent = () => {
    if (!formData.name || !formData.email || !formData.rollNo || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateUser(editingId, {
        name: formData.name,
        rollNo: formData.rollNo,
        department: formData.department,
        section: formData.section,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      toast.success('Student updated successfully!');
    } else {
      const newStudent: User = {
        id: 'student_' + Date.now(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'student',
        rollNo: formData.rollNo,
        department: formData.department,
        section: formData.section,
        phone: formData.phone,
      };
      addUser(newStudent);
      toast.success('Student added successfully!');
    }

    loadStudents();
      setFormData({ name: '', rollNo: '', course: '', department: '', section: '', email: '', phone: '', password: '' });
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (student: User) => {
    setFormData({
      name: student.name,
      rollNo: student.rollNo || '',
      department: student.department || '',
      section: student.section || '',
      email: student.email,
      phone: student.phone || '',
      password: student.password || '',
    });
    setEditingId(student.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      deleteUser(id);
      loadStudents();
      toast.success('Student deleted successfully!');
    }
  };

  const filteredStudents = students
    .filter(
      s => (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';
      if (sortOrder === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-8 max-w-7xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Advanced Student Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              bulkMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            title={bulkMode ? 'Exit bulk selection mode' : 'Enable bulk selection mode'}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Mode'}
          </button>
          <button
            onClick={() => {
              setFormData({ name: '', rollNo: '', course: '', department: '', section: '', email: '', phone: '', password: '' });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            <Plus className="w-5 h-5" />
            Add Student
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {bulkMode && selectedStudents.length > 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium">{selectedStudents.length} students selected</span>
            <button
              onClick={() => setShowBulkDialog(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              title="Open bulk actions dialog"
            >
              Bulk Actions
            </button>
            <button
              onClick={() => setSelectedStudents([])}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Clear Selection
            </button>
          </div>
        </motion.div>
      )}

      {/* Advanced Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-4 py-2.5 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
            title="Filter students by course"
          >
            <option value="all">All Courses</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'rollNo')}
            className="px-4 py-2.5 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
            title="Sort students by field"
          >
            <option value="name">Sort by Name</option>
            <option value="rollNo">Sort by Roll No</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2.5 border border-border rounded-lg bg-input hover:bg-muted transition"
            title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass glass-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {bulkMode && <th className="px-6 py-3 text-center text-sm font-semibold">Select</th>}
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Roll No</th>

                <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Section</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-border hover:bg-muted/30 transition">
                  {bulkMode && (
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student.id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                          }
                        }}
                        className="rounded border-border"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4">{student.name}</td>
                  <td className="px-6 py-4">{student.rollNo}</td>
                  <td className="px-6 py-4">{student.department}</td>
                  <td className="px-6 py-4">{student.section}</td>
                  <td className="px-6 py-4 text-sm">{student.email}</td>
                  <td className="px-6 py-4">{student.phone}</td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(student)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                      title="Edit Student"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                      title="Delete Student"
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
                {editingId ? 'Edit Student' : 'Add New Student'}
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
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="Roll Number"
                value={formData.rollNo}
                onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <select
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
                title="Select Course"
              >
                <option value="">Select Course</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={`B.Tech ${dept.code}`}>
                    B.Tech {dept.name}
                  </option>
                ))}
              </select>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value, section: '', course: '' })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.code}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select Section</option>
                {sections.filter(section => section.departmentId === departments.find(dept => dept.code === formData.department)?.id).map((section) => (
                  <option key={section.id} value={section.name}>
                    {section.name}
                  </option>
                ))}
              </select>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                onClick={handleAddStudent}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                {editingId ? 'Update' : 'Add'} Student
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

      {/* Bulk Actions Dialog */}
      {showBulkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass glass-border rounded-2xl p-8 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Bulk Actions</h2>
              <button
                onClick={() => setShowBulkDialog(false)}
                className="p-2 hover:bg-muted rounded-lg transition"
                title="Close bulk actions dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  selectedStudents.forEach((id: string) => handleDelete(id));
                  setSelectedStudents([]);
                  setShowBulkDialog(false);
                }}
                className="w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                title="Delete selected students"
              >
                Delete Selected Students
              </button>
              <button
                onClick={() => {
                  // Export selected students
                  const selectedData = students.filter(s => selectedStudents.includes(s.id));
                  const csv = selectedData.map(s => `${s.name},${s.rollNo},${s.course},${s.email}`).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'selected_students.csv';
                  a.click();
                  setShowBulkDialog(false);
                }}
                className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                title="Export selected students to CSV"
              >
                Export Selected Students
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
