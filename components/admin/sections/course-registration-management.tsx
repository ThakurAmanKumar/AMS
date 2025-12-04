'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Filter } from 'lucide-react';
import {
  getCourseRegistrations,
  addCourseRegistration,
  updateCourseRegistration,
  deleteCourseRegistration,
  getDepartments,
  subscribeToCourseRegistrationUpdates,
  getRegisteredCourses,
  getUserById,
  getSections,
  CourseRegistration,
  Department,
  RegisteredCourses,
  User
} from '@/lib/storage';

export default function CourseRegistrationManagement() {
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<CourseRegistration | null>(null);
  const [formData, setFormData] = useState({
    semester: '',
    year: '',
    departmentId: '',
    isOpen: true,
    deadline: ''
  });
  const [message, setMessage] = useState('');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    section: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCourseRegistrationUpdates((message) => {
      if (message.type === 'course_registration_updated' ||
          message.type === 'course_registration_added' ||
          message.type === 'course_registration_deleted' ||
          message.type === 'course_registered' ||
          message.type === 'student_courses_registered' ||
          message.type === 'student_courses_unregistered') {
        loadData();
      }
    });
    return unsubscribe;
  }, []);

  const loadData = () => {
    setRegistrations(getCourseRegistrations());
    setDepartments(getDepartments());

    // Load registered students data
    const registeredCourses = getRegisteredCourses();
    const studentsData = registeredCourses.map(rc => {
      const user = getUserById(rc.studentId);
      if (user && user.role === 'student') {
        return {
          id: user.id,
          name: user.name,
          rollNo: user.rollNo || 'N/A',
          department: user.department || 'N/A',
          section: user.course || 'N/A',
          status: 'Done',
          registeredCourses: rc.courseIds.length
        };
      }
      return null;
    }).filter(Boolean);

    setRegisteredStudents(studentsData);
  };

  const resetForm = () => {
    setFormData({
      semester: '',
      year: '',
      departmentId: '',
      isOpen: true,
      deadline: ''
    });
    setEditingRegistration(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const registrationData: CourseRegistration = {
      id: editingRegistration?.id || `reg_${Date.now()}`,
      semester: formData.semester,
      year: formData.year,
      departmentId: formData.departmentId,
      isOpen: formData.isOpen,
      deadline: formData.deadline || undefined
    };

    try {
      if (editingRegistration) {
        updateCourseRegistration(editingRegistration.id, registrationData);
        setMessage('Registration updated successfully!');
      } else {
        addCourseRegistration(registrationData);
        setMessage('Registration created successfully!');
      }
      setIsDialogOpen(false);
      resetForm();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save registration. Please try again.');
    }
  };

  const handleEdit = (registration: CourseRegistration) => {
    setEditingRegistration(registration);
    setFormData({
      semester: registration.semester,
      year: registration.year,
      departmentId: registration.departmentId,
      isOpen: registration.isOpen,
      deadline: registration.deadline || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this registration period?')) {
      deleteCourseRegistration(id);
      setMessage('Registration deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const toggleRegistration = (registration: CourseRegistration) => {
    updateCourseRegistration(registration.id, { isOpen: !registration.isOpen });
    setMessage(`Registration ${!registration.isOpen ? 'opened' : 'closed'} successfully!`);
    setTimeout(() => setMessage(''), 3000);
  };

  const filteredStudents = registeredStudents.filter(student => {
    const matchesDepartment = !filters.department || student.department === filters.department;
    const matchesSection = !filters.section || student.section === filters.section;
    return matchesDepartment && matchesSection;
  });

  const getFilteredSections = () => {
    if (!filters.department) return [];
    return getSections().filter(section => section.departmentId === departments.find(dept => dept.name === filters.department)?.id);
  };

  const resetFilters = () => {
    setFilters({
      department: '',
      section: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Course Registration Management</h2>
          <p className="text-muted-foreground">Manage course registration periods for different semesters and departments.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>Add Registration Period</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRegistration ? 'Edit' : 'Add'} Registration Period</DialogTitle>
              <DialogDescription>
                Configure course registration settings for a specific semester and department.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="semester">Semester</Label>
                  <Select value={formData.semester} onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fall">Fall</SelectItem>
                      <SelectItem value="Spring">Spring</SelectItem>
                      <SelectItem value="Summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="e.g., 2024"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={formData.departmentId} onValueChange={(value) => setFormData(prev => ({ ...prev, departmentId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isOpen"
                  checked={formData.isOpen}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOpen: checked }))}
                />
                <Label htmlFor="isOpen">Registration Open</Label>
              </div>
              <div>
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
              <DialogFooter>
                <Button type="submit">{editingRegistration ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {registrations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No registration periods configured yet.</p>
            </CardContent>
          </Card>
        ) : (
          registrations.map(registration => (
            <Card key={registration.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {registration.semester} {registration.year}
                      <Badge variant={registration.isOpen ? "default" : "secondary"}>
                        {registration.isOpen ? "Open" : "Closed"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Department: {departments.find(d => d.id === registration.departmentId)?.name || registration.departmentId}
                      {registration.deadline && (
                        <span className="ml-4">
                          Deadline: {new Date(registration.deadline).toLocaleString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRegistration(registration)}
                    >
                      {registration.isOpen ? 'Close' : 'Open'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(registration)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(registration.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Registered Students Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Registered Students</CardTitle>
              <CardDescription>
                Real-time data of students who have registered for courses
              </CardDescription>
            </div>
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter Students</DialogTitle>
                  <DialogDescription>
                    Filter registered students by department and section.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="filter-department">Department</Label>
                    <Select value={filters.department} onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All departments" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filter-section">Section</Label>
                    <Select value={filters.section} onValueChange={(value) => setFilters(prev => ({ ...prev, section: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All sections" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredSections().map(section => (
                          <SelectItem key={section.id} value={section.name}>{section.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetFilters}>
                    Reset
                  </Button>
                  <Button onClick={() => setIsFilterDialogOpen(false)}>
                    Apply Filters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <p className="text-center text-muted-foreground">
              {registeredStudents.length === 0
                ? "No students have registered for courses yet."
                : "No students match the current filters."}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map(student => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-muted-foreground">{student.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Roll No</Label>
                      <p className="text-sm text-muted-foreground">{student.rollNo}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Department</Label>
                      <p className="text-sm text-muted-foreground">{student.department}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Section</Label>
                      <p className="text-sm text-muted-foreground">{student.section}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge variant="default">{student.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
