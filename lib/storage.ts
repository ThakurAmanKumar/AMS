'use client';

import { broadcastChange, autoSaveToLocalStorage, EntityType, DataChangeType } from './realtime-sync';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  phone?: string;
  subject?: string;
  assignedClass?: string;
  rollNo?: string;
  course?: string;
  department?: string;
  section?: string;
  empId?: string;
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  phone: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'holiday';
  subjectId: string;
  departmentId?: string;
  sectionId?: string;
  markedBy?: string; // teacherId or adminId
  markedAt?: string; // timestamp
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  className: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  teacherId: string;
  date: string;
}

export interface TimetableSlot {
  id: string;
  time: string; // e.g., "09:00-10:00"
  subjectId: string;
  teacherId: string;
  className: string;
  day: string; // e.g., "Monday"
  room?: string;
  section?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Section {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  description?: string;
}

export interface MasterSubject {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  description?: string;
}

export interface CourseRegistration {
  id: string;
  semester: string; // e.g., "Fall", "Spring"
  year: string; // e.g., "2023"
  departmentId: string;
  isOpen: boolean;
  deadline?: string; // ISO date string
}

export interface RegisteredCourses {
  studentId: string;
  courseIds: string[]; // IDs of registered MasterSubjects
}

const STORAGE_KEYS = {
  USERS: 'aams_users',
  CURRENT_USER: 'aams_current_user',
  ATTENDANCE: 'aams_attendance',
  SUBJECTS: 'aams_subjects',
  ANNOUNCEMENTS: 'aams_announcements',
  TIMETABLE: 'aams_timetable',
  LIVE_ATTENDANCE_CODE: 'aams_live_attendance_code',
  DEPARTMENTS: 'aams_departments',
  SECTIONS: 'aams_sections',
  MASTER_SUBJECTS: 'aams_master_subjects',
  COURSE_REGISTRATIONS: 'aams_course_registrations',
  REGISTERED_COURSES: 'aams_registered_courses',
};

// BroadcastChannel for real-time updates
let attendanceChannel: BroadcastChannel | null = null;
let courseRegistrationChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined') {
  attendanceChannel = new BroadcastChannel('aams-attendance-updates');
  courseRegistrationChannel = new BroadcastChannel('aams-course-registration-updates');
}

// Initialize default data
export function initializeStorage() {
  if (typeof window === 'undefined') return;

  const defaultAdmin: User = {
    id: 'admin1',
    name: 'Admin User',
    email: 'aman@aams.com',
    password: 'aman@aams',
    role: 'admin',
    phone: '9876543210',
  };

  const defaultUsers: User[] = [
    defaultAdmin,
    {
      id: 'teacher1',
      name: 'Dr. John Smith',
      email: 'john@aams.com',
      password: 'teacher123',
      role: 'teacher',
      phone: '9876543211',
      subject: 'Mathematics',
      assignedClass: 'B.Tech CSE - A',
    },
    {
      id: 'teacher2',
      name: 'Prof. Sarah Johnson',
      email: 'sarah@aams.com',
      password: 'teacher123',
      role: 'teacher',
      phone: '9876543212',
      subject: 'Physics',
      assignedClass: 'B.Tech CSE - B',
    },
    {
      id: 'student1',
      name: 'Rajesh Kumar',
      email: 'rajesh@aams.com',
      password: 'student123',
      role: 'student',
      phone: '9876543213',
      rollNo: 'CSE001',
      course: 'B.Tech CSE - A',
      department: 'Computer Science & Engineering',
      section: 'A',
    },
    {
      id: 'student2',
      name: 'Priya Sharma',
      email: 'priya@aams.com',
      password: 'student123',
      role: 'student',
      phone: '9876543214',
      rollNo: 'CSE002',
      course: 'B.Tech CSE - B',
      department: 'Computer Science & Engineering',
      section: 'B',
    },
    {
      id: 'student3',
      name: 'Amit Patel',
      email: 'amit@aams.com',
      password: 'student123',
      role: 'student',
      phone: '9876543215',
      rollNo: 'CSE003',
      course: 'B.Tech CSE - A',
      department: 'Computer Science & Engineering',
      section: 'A',
    },
  ];

  const defaultSubjects: Subject[] = [
    {
      id: 'sub1',
      name: 'Mathematics',
      code: 'CS101',
      teacherId: 'teacher1',
      className: 'B.Tech CSE - A',
    },
    {
      id: 'sub2',
      name: 'Physics',
      code: 'CS102',
      teacherId: 'teacher2',
      className: 'B.Tech CSE - B',
    },
  ];

  const defaultDepartments: Department[] = [
    {
      id: 'dept1',
      name: 'Computer Science & Engineering',
      code: 'CSE',
      description: 'Department of Computer Science and Engineering',
    },
    {
      id: 'dept2',
      name: 'Electrical & Electronics Engineering',
      code: 'EEE',
      description: 'Department of Electrical and Electronics Engineering',
    },
    {
      id: 'dept3',
      name: 'Mechanical Engineering',
      code: 'ME',
      description: 'Department of Mechanical Engineering',
    },
    {
      id: 'dept4',
      name: 'Civil Engineering',
      code: 'CE',
      description: 'Department of Civil Engineering',
    },
    {
      id: 'dept5',
      name: 'Information Technology',
      code: 'IT',
      description: 'Department of Information Technology',
    },
  ];

  const defaultSections: Section[] = [
    {
      id: 'sec1',
      name: 'Section A',
      code: 'A',
      departmentId: 'dept1',
      description: 'First section of CSE department',
    },
    {
      id: 'sec2',
      name: 'Section B',
      code: 'B',
      departmentId: 'dept1',
      description: 'Second section of CSE department',
    },
  ];

  const defaultMasterSubjects: MasterSubject[] = [
    {
      id: 'msub1',
      name: 'Mathematics',
      code: 'CS101',
      departmentId: 'dept1',
      description: 'Basic Mathematics for Engineering',
    },
    {
      id: 'msub2',
      name: 'Physics',
      code: 'CS102',
      departmentId: 'dept1',
      description: 'Engineering Physics',
    },
    {
      id: 'msub3',
      name: 'Chemistry',
      code: 'CS103',
      departmentId: 'dept1',
      description: 'Engineering Chemistry',
    },
  ];

  // Initialize if not already done
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(defaultSubjects));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(defaultDepartments));
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(defaultSections));
    localStorage.setItem(STORAGE_KEYS.MASTER_SUBJECTS, JSON.stringify(defaultMasterSubjects));
  }
}

// Auth Functions
export function loginUser(email: string, password: string): User | null {
  if (typeof window === 'undefined') return null;
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]') as User[];
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.id);
    localStorage.setItem('aams_session_timestamp', Date.now().toString());
    localStorage.setItem('aams_session_active', 'true');
    // Do NOT broadcast login event - this prevents cross-tab interference
    return user;
  }
  return null;
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const userId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!userId) return null;
    
    // Ensure storage is initialized before retrieving user
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      initializeStorage();
    }
    
    const users = getAllUsers();
    const user = users.find(u => u.id === userId) || null;
    
    return user;
  } catch {
    return null;
  }
}

export function logoutUser() {
  if (typeof window === 'undefined') return;
  // Do NOT broadcast logout event - this prevents cross-tab interference
  // Logout only affects current tab
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem('aams_session_timestamp');
  localStorage.removeItem('aams_session_active');
}

// User Management
export function getAllUsers(): User[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
}

export function getStudents(): User[] {
  const users = getAllUsers();
  return users.filter(u => u.role === 'student');
}

export function getStudentsByDepartment(departmentId: string): User[] {
  const students = getStudents();
  return students.filter(s => s.department === getDepartmentById(departmentId)?.name);
}

export function getStudentsBySection(sectionId: string): User[] {
  const students = getStudents();
  return students.filter(s => s.section === getSectionById(sectionId)?.code);
}

export function getTeachers(): User[] {
  const users = getAllUsers();
  return users.filter(u => u.role === 'teacher');
}

export function addUser(user: User) {
  if (typeof window === 'undefined') return;
  const users = getAllUsers();
  users.push(user);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  autoSaveToLocalStorage(STORAGE_KEYS.USERS, users);
  
  const currentUser = getCurrentUser();
  broadcastChange({
    type: 'add',
    entityType: 'user',
    data: user,
    timestamp: Date.now(),
    userId: currentUser?.id,
  });
}

export function updateUser(id: string, updates: Partial<User>) {
  if (typeof window === 'undefined') return;
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    const oldUser = users[index];
    users[index] = { ...users[index], ...updates };
    
    // Save with real-time sync
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    autoSaveToLocalStorage(STORAGE_KEYS.USERS, users);

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, id);
    }
    
    broadcastChange({
      type: 'update',
      entityType: 'user',
      data: { id, oldUser, newUser: users[index] },
      timestamp: Date.now(),
      userId: currentUser?.id,
    });
  }
}

export function deleteUser(id: string) {
  if (typeof window === 'undefined') return;
  const users = getAllUsers();
  const deleted = users.find(u => u.id === id);
  const filtered = users.filter(u => u.id !== id);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
  autoSaveToLocalStorage(STORAGE_KEYS.USERS, filtered);
  
  const currentUser = getCurrentUser();
  if (deleted) {
    broadcastChange({
      type: 'delete',
      entityType: 'user',
      data: deleted,
      timestamp: Date.now(),
      userId: currentUser?.id,
    });
  }
}

export function getUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find(u => u.id === id) || null;
}

// Attendance Management
export function getAllAttendance(): Attendance[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTENDANCE) || '[]');
}

export function addAttendance(attendance: Attendance) {
  if (typeof window === 'undefined') return;
  const records = getAllAttendance();
  // Enrich with timestamp and user info
  const user = getCurrentUser();
  const enriched = {
    ...attendance,
    markedBy: attendance.markedBy || user?.id,
    markedAt: attendance.markedAt || new Date().toISOString(),
  };
  records.push(enriched);
  
  // Save with real-time sync
  const data = JSON.stringify(records);
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, data);
  autoSaveToLocalStorage(STORAGE_KEYS.ATTENDANCE, records);
  
  // Broadcast addition
  broadcastChange({
    type: 'add',
    entityType: 'attendance',
    data: enriched,
    timestamp: Date.now(),
    userId: user?.id,
  });
}

export function deleteAttendance(id: string) {
  if (typeof window === 'undefined') return;
  const records = getAllAttendance();
  const deletedRecord = records.find(a => a.id === id);
  const filtered = records.filter(a => a.id !== id);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(filtered));
  autoSaveToLocalStorage(STORAGE_KEYS.ATTENDANCE, filtered);
  
  // Broadcast deletion
  const user = getCurrentUser();
  if (deletedRecord) {
    broadcastChange({
      type: 'delete',
      entityType: 'attendance',
      data: deletedRecord,
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

export function getStudentAttendance(studentId: string): Attendance[] {
  if (typeof window === 'undefined') return [];
  const records = getAllAttendance();
  return records.filter(a => a.studentId === studentId);
}

export function getAttendanceByDepartment(departmentId: string): Attendance[] {
  if (typeof window === 'undefined') return [];
  const records = getAllAttendance();
  return records.filter(a => a.departmentId === departmentId);
}

export function getAttendanceBySection(sectionId: string): Attendance[] {
  if (typeof window === 'undefined') return [];
  const records = getAllAttendance();
  return records.filter(a => a.sectionId === sectionId);
}

export function getAttendanceByDepartmentAndDate(departmentId: string, date: string): Attendance[] {
  if (typeof window === 'undefined') return [];
  const records = getAllAttendance();
  return records.filter(a => a.departmentId === departmentId && a.date === date);
}

export function updateAttendance(id: string, status: 'present' | 'absent' | 'late' | 'holiday') {
  const records = getAllAttendance();
  const index = records.findIndex(a => a.id === id);
  if (index !== -1) {
    const oldStatus = records[index].status;
    records[index].status = status;
    records[index].markedAt = new Date().toISOString();
    
    // Save with real-time sync
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
    autoSaveToLocalStorage(STORAGE_KEYS.ATTENDANCE, records);
    
    const user = getCurrentUser();
    // Broadcast update
    broadcastChange({
      type: 'update',
      entityType: 'attendance',
      data: { id, oldStatus, newStatus: status, record: records[index] },
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

export function getTeacherStudents(teacherId: string): User[] {
  const students = getStudents();
  return students;
}

// Subject Management
export function getSubjects(): Subject[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
}

export function addSubject(subject: Subject) {
  if (typeof window === 'undefined') return;
  const subjects = getSubjects();
  subjects.push(subject);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  autoSaveToLocalStorage(STORAGE_KEYS.SUBJECTS, subjects);
  
  const user = getCurrentUser();
  broadcastChange({
    type: 'add',
    entityType: 'subject',
    data: subject,
    timestamp: Date.now(),
    userId: user?.id,
  });
}

export function getTeacherSubjects(teacherId: string): Subject[] {
  const subjects = getSubjects();
  return subjects.filter(s => s.teacherId === teacherId);
}

// ANNOUNCEMENT MANAGEMENT
export function getAnnouncements(): Announcement[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS) || "[]");
  } catch (e) {
    return [];
  }
}

export function addAnnouncement(announcement: Announcement) {
  if (typeof window === 'undefined') return;
  const announcements = getAnnouncements();
  announcements.push(announcement);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  autoSaveToLocalStorage(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
  
  const user = getCurrentUser();
  broadcastChange({
    type: 'add',
    entityType: 'announcement',
    data: announcement,
    timestamp: Date.now(),
    userId: user?.id,
  });
}

export function deleteAnnouncement(id: string) {
  if (typeof window === 'undefined') return;
  const announcements = getAnnouncements();
  const filtered = announcements.filter(a => a.id !== id);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(filtered));
  autoSaveToLocalStorage(STORAGE_KEYS.ANNOUNCEMENTS, filtered);
  
  const user = getCurrentUser();
  broadcastChange({
    type: 'delete',
    entityType: 'announcement',
    data: { id },
    timestamp: Date.now(),
    userId: user?.id,
  });
}

export function getTeacherAnnouncements(teacherId: string): Announcement[] {
  return getAnnouncements().filter(a => a.teacherId === teacherId);
}

// 🔥 NEW FUNCTION: Get Announcements for Students
export function getStudentAnnouncements(): Announcement[] {
  return getAnnouncements(); // return all announcements
}


// Timetable Management
export function getTimetable(): TimetableSlot[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.TIMETABLE) || '[]');
}

export function addTimetableSlot(slot: TimetableSlot) {
  if (typeof window === 'undefined') return;
  const slots = getTimetable();
  slots.push(slot);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(slots));
  autoSaveToLocalStorage(STORAGE_KEYS.TIMETABLE, slots);
  
  const user = getCurrentUser();
  broadcastChange({
    type: 'add',
    entityType: 'timetable',
    data: slot,
    timestamp: Date.now(),
    userId: user?.id,
  });
}

export function updateTimetableSlot(id: string, updates: Partial<TimetableSlot>) {
  if (typeof window === 'undefined') return;
  const slots = getTimetable();
  const index = slots.findIndex(s => s.id === id);
  if (index !== -1) {
    const oldSlot = slots[index];
    slots[index] = { ...slots[index], ...updates };
    
    // Save with real-time sync
    localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(slots));
    autoSaveToLocalStorage(STORAGE_KEYS.TIMETABLE, slots);
    
    const user = getCurrentUser();
    broadcastChange({
      type: 'update',
      entityType: 'timetable',
      data: { id, oldSlot, newSlot: slots[index] },
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

export function deleteTimetableSlot(id: string) {
  if (typeof window === 'undefined') return;
  const slots = getTimetable();
  const deleted = slots.find(s => s.id === id);
  const filtered = slots.filter(s => s.id !== id);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.TIMETABLE, JSON.stringify(filtered));
  autoSaveToLocalStorage(STORAGE_KEYS.TIMETABLE, filtered);
  
  const user = getCurrentUser();
  if (deleted) {
    broadcastChange({
      type: 'delete',
      entityType: 'timetable',
      data: deleted,
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

export function getStudentTimetable(student: User): TimetableSlot[] {
  const slots = getTimetable();
  return slots.filter(s => s.className === student.course);
}

export function getTeacherTimetable(teacherId: string): TimetableSlot[] {
  const slots = getTimetable();
  return slots.filter(s => s.teacherId === teacherId);
}

// Live Attendance Code Management
export function setLiveAttendanceCode(code: string, subjectId?: string, teacherId?: string) {
  if (typeof window === 'undefined') return;
  const liveSession = {
    code,
    subjectId: subjectId || '',
    teacherId: teacherId || '',
    timestamp: Date.now(),
    expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour expiry
  };
  localStorage.setItem(STORAGE_KEYS.LIVE_ATTENDANCE_CODE, JSON.stringify(liveSession));
  // Broadcast live attendance session creation
  broadcastChange({
    type: 'add',
    entityType: 'attendance',
    data: { type: 'live_session', session: liveSession },
    timestamp: Date.now(),
    userId: teacherId,
  });
}

export function getLiveAttendanceCode(): { code: string; subjectId: string; teacherId: string; timestamp: number; expiresAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LIVE_ATTENDANCE_CODE);
    if (!data) return null;
    const session = JSON.parse(data);
    // Check if session has expired
    if (session.expiresAt && session.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEYS.LIVE_ATTENDANCE_CODE);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function markLiveAttendance(studentId: string, code: string): { success: boolean; message: string; attendance?: Attendance } {
  if (typeof window === 'undefined') return { success: false, message: 'Client-side only' };
  
  try {
    const session = getLiveAttendanceCode();
    if (!session) {
      return { success: false, message: 'No active attendance session' };
    }
    
    if (session.code !== code) {
      return { success: false, message: 'Invalid attendance code' };
    }
    
    // Check if student is already marked for this session
    const attendance = getAllAttendance();
    const today = new Date().toISOString().split('T')[0];
    const existingRecord = attendance.find(
      a => a.studentId === studentId && a.date === today && a.subjectId === session.subjectId && a.status !== 'holiday'
    );
    
    if (existingRecord) {
      return { success: false, message: 'Already marked for this subject today' };
    }
    
    // Create attendance record
    const student = getStudents().find(s => s.id === studentId);
    const subject = getSubjects().find(s => s.id === session.subjectId);
    
    if (!student || !subject) {
      return { success: false, message: 'Invalid student or subject' };
    }
    
    const newRec: Attendance = {
      id: 'att_' + Date.now() + Math.random(),
      studentId,
      date: today,
      status: 'present',
      subjectId: session.subjectId,
      departmentId: student.department,
      sectionId: student.section,
      markedBy: session.teacherId,
      markedAt: new Date().toISOString(),
    };
    
    addAttendance(newRec);
    
    return { 
      success: true, 
      message: 'Your Attendance is Captured Successfully',
      attendance: newRec 
    };
  } catch (error) {
    console.error('Error marking live attendance:', error);
    return { success: false, message: 'Error marking attendance' };
  }
}

// Department Management
export function getDepartments(): Department[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.DEPARTMENTS) || '[]');
}

export function getDepartmentById(id: string): Department | null {
  const departments = getDepartments();
  return departments.find(d => d.id === id) || null;
}

export function addDepartment(department: Department) {
  if (typeof window === 'undefined') return;
  const departments = getDepartments();
  departments.push(department);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
  autoSaveToLocalStorage(STORAGE_KEYS.DEPARTMENTS, departments);
  
  const user = getCurrentUser();
  broadcastChange({
    type: 'add',
    entityType: 'department',
    data: department,
    timestamp: Date.now(),
    userId: user?.id,
  });
}

export function updateDepartment(id: string, updates: Partial<Department>) {
  if (typeof window === 'undefined') return;
  const departments = getDepartments();
  const index = departments.findIndex(d => d.id === id);
  if (index !== -1) {
    const oldDept = departments[index];
    departments[index] = { ...departments[index], ...updates };
    
    // Save with real-time sync
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
    autoSaveToLocalStorage(STORAGE_KEYS.DEPARTMENTS, departments);
    
    const user = getCurrentUser();
    broadcastChange({
      type: 'update',
      entityType: 'department',
      data: { id, oldDept, newDept: departments[index] },
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

export function deleteDepartment(id: string) {
  if (typeof window === 'undefined') return;
  const departments = getDepartments();
  const deleted = departments.find(d => d.id === id);
  const filtered = departments.filter(d => d.id !== id);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(filtered));
  autoSaveToLocalStorage(STORAGE_KEYS.DEPARTMENTS, filtered);
  
  const user = getCurrentUser();
  if (deleted) {
    broadcastChange({
      type: 'delete',
      entityType: 'department',
      data: deleted,
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

// Section Management
export function getSections(): Section[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SECTIONS) || '[]');
}

export function getSectionById(id: string): Section | null {
  const sections = getSections();
  return sections.find(s => s.id === id) || null;
}

export function addSection(section: Section) {
  if (typeof window === 'undefined') return;
  const sections = getSections();
  sections.push(section);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
  autoSaveToLocalStorage(STORAGE_KEYS.SECTIONS, sections);
  
  const user = getCurrentUser();
  broadcastChange({
    type: 'add',
    entityType: 'section',
    data: section,
    timestamp: Date.now(),
    userId: user?.id,
  });
}

export function updateSection(id: string, updates: Partial<Section>) {
  if (typeof window === 'undefined') return;
  const sections = getSections();
  const index = sections.findIndex(s => s.id === id);
  if (index !== -1) {
    const oldSection = sections[index];
    sections[index] = { ...sections[index], ...updates };
    
    // Save with real-time sync
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
    autoSaveToLocalStorage(STORAGE_KEYS.SECTIONS, sections);
    
    const user = getCurrentUser();
    broadcastChange({
      type: 'update',
      entityType: 'section',
      data: { id, oldSection, newSection: sections[index] },
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

export function deleteSection(id: string) {
  if (typeof window === 'undefined') return;
  const sections = getSections();
  const deleted = sections.find(s => s.id === id);
  const filtered = sections.filter(s => s.id !== id);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(filtered));
  autoSaveToLocalStorage(STORAGE_KEYS.SECTIONS, filtered);
  
  const user = getCurrentUser();
  if (deleted) {
    broadcastChange({
      type: 'delete',
      entityType: 'section',
      data: deleted,
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

// Master Subject Management
export function getMasterSubjects(): MasterSubject[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.MASTER_SUBJECTS) || '[]');
}

export function addMasterSubject(subject: MasterSubject) {
  if (typeof window === 'undefined') return;
  const subjects = getMasterSubjects();
  subjects.push(subject);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.MASTER_SUBJECTS, JSON.stringify(subjects));
  autoSaveToLocalStorage(STORAGE_KEYS.MASTER_SUBJECTS, subjects);
  
  const user = getCurrentUser();
  broadcastChange({
    type: 'add',
    entityType: 'masterSubject',
    data: subject,
    timestamp: Date.now(),
    userId: user?.id,
  });
}

export function updateMasterSubject(id: string, updates: Partial<MasterSubject>) {
  if (typeof window === 'undefined') return;
  const subjects = getMasterSubjects();
  const index = subjects.findIndex(s => s.id === id);
  if (index !== -1) {
    const oldSubject = subjects[index];
    subjects[index] = { ...subjects[index], ...updates };
    
    // Save with real-time sync
    localStorage.setItem(STORAGE_KEYS.MASTER_SUBJECTS, JSON.stringify(subjects));
    autoSaveToLocalStorage(STORAGE_KEYS.MASTER_SUBJECTS, subjects);
    
    const user = getCurrentUser();
    broadcastChange({
      type: 'update',
      entityType: 'masterSubject',
      data: { id, oldSubject, newSubject: subjects[index] },
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

export function deleteMasterSubject(id: string) {
  if (typeof window === 'undefined') return;
  const subjects = getMasterSubjects();
  const deleted = subjects.find(s => s.id === id);
  const filtered = subjects.filter(s => s.id !== id);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.MASTER_SUBJECTS, JSON.stringify(filtered));
  autoSaveToLocalStorage(STORAGE_KEYS.MASTER_SUBJECTS, filtered);
  
  const user = getCurrentUser();
  if (deleted) {
    broadcastChange({
      type: 'delete',
      entityType: 'masterSubject',
      data: deleted,
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

// Utility functions
export function getSectionsByDepartment(departmentId: string): Section[] {
  const sections = getSections();
  return sections.filter(s => s.departmentId === departmentId);
}

export function getMasterSubjectsByDepartment(departmentId: string): MasterSubject[] {
  const subjects = getMasterSubjects();
  return subjects.filter(s => s.departmentId === departmentId);
}

// Course Registration Management
export function getCourseRegistrations(): CourseRegistration[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSE_REGISTRATIONS) || '[]');
}

export function addCourseRegistration(registration: CourseRegistration) {
  if (typeof window === 'undefined') return;
  const registrations = getCourseRegistrations();
  registrations.push(registration);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.COURSE_REGISTRATIONS, JSON.stringify(registrations));
  autoSaveToLocalStorage(STORAGE_KEYS.COURSE_REGISTRATIONS, registrations);
  
  const user = getCurrentUser();
  // Broadcast update
  broadcastChange({
    type: 'add',
    entityType: 'course-registration',
    data: registration,
    timestamp: Date.now(),
    userId: user?.id,
  });
}

export function updateCourseRegistration(id: string, updates: Partial<CourseRegistration>) {
  if (typeof window === 'undefined') return;
  const registrations = getCourseRegistrations();
  const index = registrations.findIndex(r => r.id === id);
  if (index !== -1) {
    const oldRegistration = registrations[index];
    registrations[index] = { ...registrations[index], ...updates };
    
    // Save with real-time sync
    localStorage.setItem(STORAGE_KEYS.COURSE_REGISTRATIONS, JSON.stringify(registrations));
    autoSaveToLocalStorage(STORAGE_KEYS.COURSE_REGISTRATIONS, registrations);
    
    const user = getCurrentUser();
    // Broadcast update
    broadcastChange({
      type: 'update',
      entityType: 'course-registration',
      data: { old: oldRegistration, new: registrations[index] },
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

export function deleteCourseRegistration(id: string) {
  if (typeof window === 'undefined') return;
  const registrations = getCourseRegistrations();
  const deletedRegistration = registrations.find(r => r.id === id);
  const filtered = registrations.filter(r => r.id !== id);
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.COURSE_REGISTRATIONS, JSON.stringify(filtered));
  autoSaveToLocalStorage(STORAGE_KEYS.COURSE_REGISTRATIONS, filtered);
  
  const user = getCurrentUser();
  // Broadcast deletion
  if (deletedRegistration) {
    broadcastChange({
      type: 'delete',
      entityType: 'course-registration',
      data: deletedRegistration,
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

export function getOpenCourseRegistrations(): CourseRegistration[] {
  const registrations = getCourseRegistrations();
  return registrations.filter(r => r.isOpen);
}

export function getCourseRegistrationsByDepartment(departmentId: string): CourseRegistration[] {
  const registrations = getCourseRegistrations();
  return registrations.filter(r => r.departmentId === departmentId);
}

// Registered Courses Management
export function getRegisteredCourses(): RegisteredCourses[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTERED_COURSES) || '[]');
}

export function getRegisteredCoursesForStudent(studentId: string): RegisteredCourses | null {
  const registeredCourses = getRegisteredCourses();
  return registeredCourses.find(rc => rc.studentId === studentId) || null;
}

export function registerCoursesForStudent(studentId: string, courseIds: string[]) {
  if (typeof window === 'undefined') return;
  const registeredCourses = getRegisteredCourses();
  const existingIndex = registeredCourses.findIndex(rc => rc.studentId === studentId);
  if (existingIndex !== -1) {
    const oldCourses = registeredCourses[existingIndex].courseIds;
    registeredCourses[existingIndex].courseIds = courseIds;
  } else {
    registeredCourses.push({ studentId, courseIds });
  }
  
  // Save with real-time sync
  localStorage.setItem(STORAGE_KEYS.REGISTERED_COURSES, JSON.stringify(registeredCourses));
  autoSaveToLocalStorage(STORAGE_KEYS.REGISTERED_COURSES, registeredCourses);
  
  const user = getCurrentUser();
  broadcastChange({
    type: 'add',
    entityType: 'registeredCourse',
    data: { studentId, courseIds },
    timestamp: Date.now(),
    userId: user?.id,
  });
}

export function unregisterCoursesForStudent(studentId: string, courseIds: string[]) {
  if (typeof window === 'undefined') return;
  const registeredCourses = getRegisteredCourses();
  const existingIndex = registeredCourses.findIndex(rc => rc.studentId === studentId);
  if (existingIndex !== -1) {
    const oldCourses = registeredCourses[existingIndex].courseIds;
    registeredCourses[existingIndex].courseIds = registeredCourses[existingIndex].courseIds.filter(id => !courseIds.includes(id));
    
    // Save with real-time sync
    localStorage.setItem(STORAGE_KEYS.REGISTERED_COURSES, JSON.stringify(registeredCourses));
    autoSaveToLocalStorage(STORAGE_KEYS.REGISTERED_COURSES, registeredCourses);
    
    const user = getCurrentUser();
    broadcastChange({
      type: 'delete',
      entityType: 'registeredCourse',
      data: { studentId, courseIds, oldCourses, newCourses: registeredCourses[existingIndex].courseIds },
      timestamp: Date.now(),
      userId: user?.id,
    });
  }
}

// Real-time course registration updates
export function subscribeToCourseRegistrationUpdates(callback: (message: any) => void) {
  if (!courseRegistrationChannel) return () => {};
  const handler = (event: MessageEvent) => callback(event.data);
  courseRegistrationChannel.addEventListener('message', handler);
  return () => courseRegistrationChannel?.removeEventListener('message', handler);
}

// Real-time attendance updates
export function subscribeToAttendanceUpdates(callback: (message: any) => void) {
  if (!attendanceChannel) return () => {};
  const handler = (event: MessageEvent) => callback(event.data);
  attendanceChannel.addEventListener('message', handler);
  return () => attendanceChannel?.removeEventListener('message', handler);
}
