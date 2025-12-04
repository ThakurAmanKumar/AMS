'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCurrentUser, getMasterSubjects, getCourseRegistrations, getRegisteredCoursesForStudent, registerCoursesForStudent, subscribeToCourseRegistrationUpdates } from '@/lib/storage';

export default function CourseRegistration() {
  const [user, setUser] = useState<any>(null);
  const [openRegistrations, setOpenRegistrations] = useState<any[]>([]);
  const [masterSubjects, setMasterSubjects] = useState<any[]>([]);
  const [registeredCourses, setRegisteredCourses] = useState<any>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'student') {
      setUser(currentUser);
      loadData();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToCourseRegistrationUpdates((message) => {
      if (message.type === 'course_registration_updated' ||
          message.type === 'course_registration_added' ||
          message.type === 'course_registration_deleted') {
        loadData();
      }
    });
    return unsubscribe;
  }, []);

  const loadData = () => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    const registrations = getCourseRegistrations().filter(reg => reg.isOpen);
    setOpenRegistrations(registrations);

    const subjects = getMasterSubjects();
    setMasterSubjects(subjects);

    const registered = getRegisteredCoursesForStudent(currentUser.id);
    setRegisteredCourses(registered);
  };

  const handleCourseSelection = (courseId: string, checked: boolean) => {
    if (checked) {
      setSelectedCourses(prev => [...prev, courseId]);
    } else {
      setSelectedCourses(prev => prev.filter(id => id !== courseId));
    }
  };

  const handleSubmit = async () => {
    if (!user || selectedCourses.length === 0) return;

    setIsSubmitting(true);
    try {
      registerCoursesForStudent(user.id, selectedCourses);
      setMessage('Courses registered successfully!');
      setSelectedCourses([]);
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to register courses. Please try again.');
    }
    setIsSubmitting(false);
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>Please log in as a student to access course registration.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get departments that have open registrations
  const openRegistrationDepartmentIds = openRegistrations.map(reg => reg.departmentId);

  // Filter subjects to only show those from departments with open registrations
  // Also consider student's department if they have one
  const availableSubjects = masterSubjects.filter(subject => {
    const isFromOpenDepartment = openRegistrationDepartmentIds.includes(subject.departmentId);
    const isFromStudentDepartment = user?.department && subject.departmentId === user.department;
    return isFromOpenDepartment || isFromStudentDepartment;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Course Registration</h1>
        <p className="text-muted-foreground">Register for available courses</p>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {openRegistrations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No registration periods are currently open.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {openRegistrations.map(registration => (
            <Card key={registration.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{registration.semester} {registration.year} Registration</span>
                  <Badge variant="default">Open</Badge>
                </CardTitle>
                <CardDescription>
                  Register for available courses. Deadline: {registration.deadline ? new Date(registration.deadline).toLocaleDateString() : 'No deadline'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {availableSubjects.map(subject => {
                    const isRegistered = registeredCourses?.courseIds?.includes(subject.id) || false;
                    const isSelected = selectedCourses.includes(subject.id);

                    return (
                      <div key={subject.id} className="flex items-center space-x-3 p-3 border rounded">
                        <Checkbox
                          id={subject.id}
                          checked={isSelected}
                          disabled={isRegistered}
                          onCheckedChange={(checked) => handleCourseSelection(subject.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <label htmlFor={subject.id} className="font-medium cursor-pointer">
                            {subject.name} ({subject.code})
                          </label>
                          <p className="text-sm text-muted-foreground">{subject.description}</p>
                        </div>
                        {isRegistered && (
                          <Badge variant="secondary">Already Registered</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedCourses.length > 0 && (
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-sm text-muted-foreground">
                      {selectedCourses.length} course{selectedCourses.length > 1 ? 's' : ''} selected
                    </span>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Registering...' : 'Register Selected Courses'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
