'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Building, Users, Plus, Edit2, Trash2, X, Search, Filter } from 'lucide-react';
import { Department, Section, MasterSubject } from '@/lib/storage';
import {
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  getSections,
  addSection,
  updateSection,
  deleteSection,
  getMasterSubjects,
  addMasterSubject,
  updateMasterSubject,
  deleteMasterSubject,
  getSectionsByDepartment,
  getMasterSubjectsByDepartment,
} from '@/lib/storage';
import { toast } from 'react-toastify';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState<'departments' | 'sections' | 'subjects'>('departments');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-8 max-w-7xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Master Data Management</h1>
        <p className="text-muted-foreground">Manage departments, sections, and subjects</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
            activeTab === 'departments'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building className="w-4 h-4" />
          Departments
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
            activeTab === 'sections'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Sections
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
            activeTab === 'subjects'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Subjects
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'departments' && <DepartmentsTab />}
      {activeTab === 'sections' && <SectionsTab />}
      {activeTab === 'subjects' && <SubjectsTab />}
    </motion.div>
  );
}

// Departments Tab Component
function DepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = () => {
    const data = getDepartments();
    setDepartments(data);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateDepartment(editingId, formData);
      toast.success('Department updated successfully!');
    } else {
      const newDepartment: Department = {
        id: 'dept_' + Date.now(),
        ...formData,
      };
      addDepartment(newDepartment);
      toast.success('Department added successfully!');
    }

    loadDepartments();
    setFormData({ name: '', code: '', description: '' });
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (dept: Department) => {
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
    });
    setEditingId(dept.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this department? This will also delete associated sections and subjects.')) {
      deleteDepartment(id);
      loadDepartments();
      toast.success('Department deleted successfully!');
    }
  };

  const filteredDepartments = departments.filter(
    dept => dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Departments</h2>
            <p className="text-sm text-muted-foreground">Manage academic departments</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={() => {
              setFormData({ name: '', code: '', description: '' });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass glass-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map((dept) => (
                <tr key={dept.id} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-6 py-4 font-medium">{dept.name}</td>
                  <td className="px-6 py-4">{dept.code}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{dept.description || '-'}</td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(dept)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                      title="Edit Department"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                      title="Delete Department"
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
                {editingId ? 'Edit Department' : 'Add New Department'}
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
                placeholder="Department Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="Department Code (e.g., CSE)"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                {editingId ? 'Update' : 'Add'} Department
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

// Sections Tab Component
function SectionsTab() {
  const [sections, setSections] = useState<Section[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    departmentId: '',
    description: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSections();
    loadDepartments();
  }, []);

  const loadSections = () => {
    const data = getSections();
    setSections(data);
  };

  const loadDepartments = () => {
    const data = getDepartments();
    setDepartments(data);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code || !formData.departmentId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateSection(editingId, formData);
      toast.success('Section updated successfully!');
    } else {
      const newSection: Section = {
        id: 'sec_' + Date.now(),
        ...formData,
      };
      addSection(newSection);
      toast.success('Section added successfully!');
    }

    loadSections();
    setFormData({ name: '', code: '', departmentId: '', description: '' });
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (sec: Section) => {
    setFormData({
      name: sec.name,
      code: sec.code,
      departmentId: sec.departmentId,
      description: sec.description || '',
    });
    setEditingId(sec.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      deleteSection(id);
      loadSections();
      toast.success('Section deleted successfully!');
    }
  };

  const filteredSections = sections.filter(
    sec => sec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sec.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentName = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Sections</h2>
            <p className="text-sm text-muted-foreground">Manage department sections</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search sections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={() => {
              setFormData({ name: '', code: '', departmentId: '', description: '' });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" />
            Add Section
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass glass-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSections.map((sec) => (
                <tr key={sec.id} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-6 py-4 font-medium">{sec.name}</td>
                  <td className="px-6 py-4">{sec.code}</td>
                  <td className="px-6 py-4">{getDepartmentName(sec.departmentId)}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{sec.description || '-'}</td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(sec)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                      title="Edit Section"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sec.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                      title="Delete Section"
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
                {editingId ? 'Edit Section' : 'Add New Section'}
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
                placeholder="Section Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="Section Code (e.g., A)"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                {editingId ? 'Update' : 'Add'} Section
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

// Subjects Tab Component
function SubjectsTab() {
  const [subjects, setSubjects] = useState<MasterSubject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    departmentId: '',
    description: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSubjects();
    loadDepartments();
  }, []);

  const loadSubjects = () => {
    const data = getMasterSubjects();
    setSubjects(data);
  };

  const loadDepartments = () => {
    const data = getDepartments();
    setDepartments(data);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code || !formData.departmentId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingId) {
      updateMasterSubject(editingId, formData);
      toast.success('Subject updated successfully!');
    } else {
      const newSubject: MasterSubject = {
        id: 'msub_' + Date.now(),
        ...formData,
      };
      addMasterSubject(newSubject);
      toast.success('Subject added successfully!');
    }

    loadSubjects();
    setFormData({ name: '', code: '', departmentId: '', description: '' });
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (sub: MasterSubject) => {
    setFormData({
      name: sub.name,
      code: sub.code,
      departmentId: sub.departmentId,
      description: sub.description || '',
    });
    setEditingId(sub.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      deleteMasterSubject(id);
      loadSubjects();
      toast.success('Subject deleted successfully!');
    }
  };

  const filteredSubjects = subjects.filter(
    sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           sub.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentName = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Subjects</h2>
            <p className="text-sm text-muted-foreground">Manage master subjects</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={() => {
              setFormData({ name: '', code: '', departmentId: '', description: '' });
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass glass-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Description</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubjects.map((sub) => (
                <tr key={sub.id} className="border-b border-border hover:bg-muted/30 transition">
                  <td className="px-6 py-4 font-medium">{sub.name}</td>
                  <td className="px-6 py-4">{sub.code}</td>
                  <td className="px-6 py-4">{getDepartmentName(sub.departmentId)}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{sub.description || '-'}</td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(sub)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                      title="Edit Subject"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                      title="Delete Subject"
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
                {editingId ? 'Edit Subject' : 'Add New Subject'}
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
                placeholder="Subject Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="Subject Code (e.g., CS101)"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                {editingId ? 'Update' : 'Add'} Subject
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