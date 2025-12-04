"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCurrentUser,
  getStudents,
  getAllAttendance,
  addAttendance,
  updateAttendance,
  deleteAttendance,
  getSubjects,
  getTeacherSubjects,
  getDepartments,
  getSections,
  subscribeToAttendanceUpdates,
  setLiveAttendanceCode,
} from "@/lib/storage";
import { Attendance } from "@/lib/storage";
import { useRealtimeSyncRefresh } from "@/hooks/use-realtime-sync";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Calendar,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Save,
  Users2,
  ChevronLeft,
  ChevronRight,
  Building2
} from "lucide-react";


import { toast } from "sonner";

/**
 * Upgraded Teacher MarkAttendance component
 * Features:
 * - Mark all P/A/L/H
 * - Undo last change
 * - Save button center-bottom appearing only when unsaved changes exist
 * - Top-center success popup (3s)
 * - Roll-call mode (spacebar marks Present and moves next)
 * - Auto-save toggle
 * - AI Suggestion toggle (simulated)
 * - Bulk-select mode and apply
 * - Progress bar, mini realtime activity simulation
 *
 * Assumes your storage helpers are synchronous like in original file.
 */

// path to uploaded doc (workspace file supplied earlier)
const TEACHER_DOC_URL = "/mnt/data/PRE-REQUISITES for Frontend APP.pdf";

type Status = "present" | "absent" | "late" | "holiday";

export default function MarkAttendance() {
  const user = getCurrentUser();

  // data
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);

  // filters & controls
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedSubject, setSelectedSubject] = useState<string>("select");
  const [selectedDepartment, setSelectedDepartment] = useState<string>(user?.department || "all");
  const [selectedSection, setSelectedSection] = useState<string>("select");
  const [searchQuery, setSearchQuery] = useState("");

  const [departments, setDepartments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // UI states
  const [autoSave, setAutoSave] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, Status>>(
    {}
  );

  // extras
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkList, setBulkList] = useState<string[]>([]);
  const [aiSuggest, setAiSuggest] = useState(false);
  const [rollCallMode, setRollCallMode] = useState(false);
  const rollIndexRef = useRef(0);

  // undo stack
  const undoStack = useRef<
    { studentId: string; prev?: string; next: Status; timestamp: number }[]
  >([]);

  // save pill & success popup
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const successTimerRef = useRef<number | null>(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // simulated live activity for visual
  const [liveActivity, setLiveActivity] = useState(0);

  // live attendance state
  const [liveAttendanceMode, setLiveAttendanceMode] = useState(false);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [codeTimer, setCodeTimer] = useState<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  // initial load
  useEffect(() => {
    loadData();
  }, []);

  // Real-time sync: automatically refresh when user/subject changes to pick up newly assigned subjects
  useRealtimeSyncRefresh(['user', 'subject'], () => {
    loadData();
  });

  // Separate real-time subscription for attendance changes
  useRealtimeSyncRefresh(['attendance'], () => {
    setAttendance(getAllAttendance());
  });

  useEffect(() => {
    // if user has default subject, pick it after subjects load
    if (subjects.length > 0 && user?.subject) {
      const sub = subjects.find((s) => s.name === user.subject);
      if (sub) setSelectedSubject(sub.id);
    }
  }, [subjects, user?.subject]);

  function loadData() {
    const allStudents = getStudents();
    const allAttendance = getAllAttendance();
    const allSubjects = getSubjects();
    const deps = getDepartments();
    const secs = getSections();
    setDepartments(deps);
    setSections(secs);
    setStudents(allStudents);
    setAttendance(allAttendance);
    if (user?.role === 'teacher') {
      try {
        setSubjects(getTeacherSubjects(user.id));
      } catch (e) {
        setSubjects(allSubjects);
      }
    } else {
      setSubjects(allSubjects);
    }
  }

  // simulated heartbeat
  useEffect(() => {
    const id = window.setInterval(() => {
      setLiveActivity((p) => p + Math.floor(Math.random() * 2));
    }, 3000);
    return () => window.clearInterval(id);
  }, []);

  // live attendance code generation and timer
  const generateCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentCode(code);
    setTimeLeft(60);
    // Store in localStorage with subject and teacher info for students to access
    setLiveAttendanceCode(code, selectedSubject !== "select" ? selectedSubject : "", user?.id);
  };

  const startLiveAttendance = () => {
    if (selectedSubject === "select") {
      toast.error("Please select a subject first");
      return;
    }
    setLiveAttendanceMode(true);
    generateCode();
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          generateCode();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    setCodeTimer(timer);
  };

  const stopLiveAttendance = () => {
    setLiveAttendanceMode(false);
    setCurrentCode('');
    if (codeTimer) {
      clearInterval(codeTimer);
      setCodeTimer(null);
    }
    setTimeLeft(60);
  };

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (codeTimer) clearInterval(codeTimer);
    };
  }, [codeTimer]);

  // filtered students by search & department & section (for teacher's assigned section only)
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students
      .filter((st) => (selectedDepartment === "all" || st.department === selectedDepartment))
      .filter((st) => (selectedSection === "select" || st.section === selectedSection))
      .filter((st) => !q || st.name.toLowerCase().includes(q) || st.rollNo?.toLowerCase().includes(q));
  }, [students, selectedDepartment, selectedSection, searchQuery]);

  // attendance stats for the filtered list
  const attendanceStats = useMemo(() => {
    const stats = { total: filteredStudents.length, present: 0, absent: 0, late: 0, holiday: 0, notMarked: 0 };
    filteredStudents.forEach((student) => {
      const rec = attendance.find(
        (a) =>
          a.studentId === student.id &&
          a.date === selectedDate &&
          (selectedSubject === "select" ? true : a.subjectId === selectedSubject)
      );
      const pending = unsavedChanges[student.id];
      const status = pending ?? rec?.status;
      if (!status) stats.notMarked++;
      else if (status === "present") stats.present++;
      else if (status === "absent") stats.absent++;
      else if (status === "late") stats.late++;
      else if (status === "holiday") stats.holiday++;
    });
    return stats;
  }, [filteredStudents, attendance, selectedDate, selectedSubject, unsavedChanges]);

  // pagination slice
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));

  // helpers --------------------------------
  const getStudentAttendance = (studentId: string) =>
    attendance.find(
      (a) =>
        a.studentId === studentId &&
        a.date === selectedDate &&
        (selectedSubject === "select" ? true : a.subjectId === selectedSubject)
    );

  // register unsaved change (or persist if autoSave)
  function markAttendanceLocal(studentId: string, status: Status) {
    const rec = getStudentAttendance(studentId);
    const prev = unsavedChanges[studentId] ?? rec?.status;
    undoStack.current.push({ studentId, prev, next: status, timestamp: Date.now() });

    // set unsaved change
    setUnsavedChanges((p) => {
      const next = { ...p, [studentId]: status };
      setHasUnsavedChanges(true);
      setShowSaveButton(true);
      // if autoSave then persist immediately
      if (autoSave) {
        persistChanges({ [studentId]: status });
        // clear local unsaved for that id
        const cleared = { ...next };
        delete cleared[studentId];
        setHasUnsavedChanges(false);
        setShowSaveButton(false);
        return cleared;
      }
      return next;
    });
  }

  // persist function (applies changes to storage)
  function persistChanges(changes?: Record<string, Status>) {
    const toPersist = changes ?? unsavedChanges;
    const keys = Object.keys(toPersist);
    if (!keys.length) {
      toast("No changes to save");
      return;
    }

    keys.forEach((studentId) => {
      const status = toPersist[studentId];
      const existing = getStudentAttendance(studentId);
      if (existing) {
        updateAttendance(existing.id, status);
      } else {
        const newRec: Attendance = {
          id: "att_" + Date.now() + Math.random(),
          studentId,
          date: selectedDate,
          status,
          subjectId: selectedSubject === "select" ? "" : selectedSubject,
          departmentId: selectedDepartment !== "all" ? selectedDepartment : user?.department,
          sectionId: selectedSection !== "select" ? selectedSection : user?.section,
          markedBy: user?.id,
          markedAt: new Date().toISOString(),
        };
        addAttendance(newRec);
      }
    });

    // reload attendance and clear unsaved (only those persisted if explicit changes passed)
    setAttendance(getAllAttendance());
    if (!changes) setUnsavedChanges({});
    else {
      // remove persisted keys from unsavedChanges
      setUnsavedChanges((p) => {
        const next = { ...p };
        Object.keys(changes).forEach((k) => delete next[k]);
        return next;
      });
    }

    setHasUnsavedChanges(false);
    setShowSaveButton(false);

    // show success popup
    setShowSuccessPopup(true);
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    successTimerRef.current = window.setTimeout(() => {
      setShowSuccessPopup(false);
      successTimerRef.current = null;
    }, 3000);

    toast.success("Attendance saved successfully");
  }

  // delete a persisted record (or remove unsaved)
  function deleteAttendanceForStudent(studentId: string) {
    const rec = getStudentAttendance(studentId);
    if (!rec) {
      // remove unsaved only
      setUnsavedChanges((p) => {
        const next = { ...p };
        delete next[studentId];
        return next;
      });
      toast.success("Removed unsaved change");
      return;
    }
    deleteAttendance(rec.id);
    setAttendance(getAllAttendance());
    toast.success("Attendance deleted");
  }

  // mark-all helpers
  function markAllFiltered(status: Status) {
    const ids = filteredStudents.map((s) => s.id);
    const changes: Record<string, Status> = {};
    ids.forEach((id) => {
      changes[id] = status;
      undoStack.current.push({ studentId: id, prev: getStudentAttendance(id)?.status, next: status, timestamp: Date.now() });
    });

    // set unsaved changes or persist if autoSave
    setUnsavedChanges((p) => ({ ...p, ...changes }));
    setHasUnsavedChanges(true);
    setShowSaveButton(true);

    if (autoSave) {
      persistChanges(changes);
    } else {
      toast.success(`Applied "${status}" to ${ids.length} students (unsaved)`);
    }
  }

  // reset all: clears records for selected date+subject (NOTE: here we don't remove persisted data; this just resets view)
  function handleResetAll() {
    // if you want to delete persisted records you could call deleteAttendance for each record's id
    // Here we simply clear unsaved and reload
    setUnsavedChanges({});
    setHasUnsavedChanges(false);
    setShowSaveButton(false);
    // optionally inform
    toast.success("Reset unsaved changes (persisted records remain)");
  }

  // undo last
  function undoLast() {
    const last = undoStack.current.pop();
    if (!last) {
      toast("Nothing to undo");
      return;
    }
    if (last.prev) {
      // if prev existed, set it back as unsaved (so teacher can save)
      setUnsavedChanges((p) => ({ ...p, [last.studentId]: last.prev as Status }));
      setHasUnsavedChanges(true);
      setShowSaveButton(true);
    } else {
      // prev undefined -> remove unsaved change
      setUnsavedChanges((p) => {
        const next = { ...p };
        delete next[last.studentId];
        return next;
      });
      setHasUnsavedChanges(Object.keys(unsavedChanges).length > 0);
    }
    toast.success("Reverted last change");
  }

  // Roll-call: press space to mark next student present
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!rollCallMode) return;
      if (e.code === "Space") {
        e.preventDefault();
        const list = filteredStudents;
        if (!list.length) return;
        const idx = rollIndexRef.current % list.length;
        const student = list[idx];
        markAttendanceLocal(student.id, "present");
        rollIndexRef.current = (idx + 1) % list.length;
        // advance page if needed
        const pageOf = Math.floor(idx / itemsPerPage) + 1;
        setCurrentPage(pageOf);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rollCallMode, filteredStudents]);

  // AI Suggestion (simulated): returns a suggested status for a student
  function aiSuggestFor(studentId: string): Status | null {
    if (!aiSuggest) return null;
    // very simple heuristic: use last 3 attendance records (simulate)
    const hist = attendance.filter((a) => a.studentId === studentId).slice(-3);
    if (!hist.length) return "present";
    const counts = { present: 0, absent: 0, late: 0, holiday: 0 } as Record<string, number>;
    hist.forEach((h) => counts[h.status] = (counts[h.status] || 0) + 1);
    const max = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
    return (max && max[1] > 0) ? (max[0] as Status) : "present";
  }

  // save button handlers
  function onSaveClick() {
    persistChanges();
  }

  // UI helpers
  function statusBadge(status?: string) {
    const cfg: Record<string, string> = {
      present: "bg-green-100 text-green-800 border-green-200",
      absent: "bg-red-100 text-red-800 border-red-200",
      late: "bg-yellow-100 text-yellow-800 border-yellow-200",
      holiday: "bg-blue-100 text-blue-800 border-blue-200",
      "not-marked": "bg-gray-100 text-gray-700 border-gray-200",
    };
    const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Not Marked";
    return <Badge className={cfg[status ?? "not-marked"]}>{label}</Badge>;
  }

  

  // cleanup timers
  useEffect(() => {
    return () => {
      if (successTimerRef.current) window.clearTimeout(successTimerRef.current);
    };
  }, []);

  // ---------------- RENDER ----------------
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* header */}
      <div>
        <h1 className="text-3xl font-bold">Mark Attendance</h1>
        <p className="text-sm text-muted-foreground mt-1">Mark attendance for students in your assigned department, subject, and section.</p>
      </div>

      {/* controls */}
      <Card className="glass glass-border">
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" /> Attendance Controls</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Department</label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
                {user?.department && !departments.find((d) => d.name === user.department) && (
                  <SelectItem value={user.department}>{user.department}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* controls continued */}
      <Card className="glass glass-border">
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* date */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>

            {/* subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><BookOpen className="w-4 h-4" /> Subject</label>
              <Select
                value={selectedSubject}
                onValueChange={(v) => {
                  if (!user?.subject) {
                    setSelectedSubject(v);
                    setCurrentPage(1);
                  }
                }}
                disabled={!!user?.subject}
              >
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select subject</SelectItem>
                  {subjects.map((sub) => <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* section */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><Building2 className="w-4 h-4" /> Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">All Sections</SelectItem>
                  {sections.map((sec) => (
                    <SelectItem key={sec.id} value={sec.name}>{sec.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* autosave */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Auto Save</label>
              <div className="flex items-center gap-2">
                <Switch checked={autoSave} onCheckedChange={(v) => setAutoSave(v)} />
                <span className="text-sm text-muted-foreground">{autoSave ? "On" : "Off"}</span>
              </div>
            </div>
          </div>

          {/* quick actions */}
          <div className="flex gap-2 items-center">
            <Button size="sm" onClick={() => markAllFiltered("present")} className="flex items-center gap-2"><Users2 className="w-4 h-4" /> Mark All Present</Button>
            <Button size="sm" variant="destructive" onClick={() => markAllFiltered("absent")}>Mark All Absent</Button>
            <Button size="sm" variant="outline" onClick={() => markAllFiltered("late")}>Mark All Late</Button>
            <Button size="sm" variant="outline" onClick={() => markAllFiltered("holiday")}>Mark All Holiday</Button>

            <div className="ml-auto flex items-center gap-4">
              <div className="text-sm text-muted-foreground">Completion</div>
              <div className="w-48 bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${( (attendanceStats.present + attendanceStats.absent + attendanceStats.late + attendanceStats.holiday) / Math.max(1, attendanceStats.total) ) * 100}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass glass-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{attendanceStats.total}</p>
              </div>
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass glass-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass glass-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
              </div>
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass glass-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Attendance Card - Modern Design */}
      <Card className={`glass glass-border relative overflow-hidden transition-all duration-500 ${
        liveAttendanceMode
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800'
          : 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20'
      }`}>
        {/* Animated background effect when active */}
        {liveAttendanceMode && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 via-emerald-400/10 to-green-400/10 animate-pulse" />
        )}

        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full transition-all duration-300 ${
                liveAttendanceMode
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Live Attendance</h3>
                <p className="text-sm text-muted-foreground">
                  {liveAttendanceMode ? 'Session Active' : 'Ready to Start'}
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                liveAttendanceMode ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-gray-400'
              }`} />
              <span className={`text-sm font-medium transition-colors ${
                liveAttendanceMode ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {liveAttendanceMode ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          {/* Main Code Display */}
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Current Attendance Code</p>
              <div className={`inline-flex items-center justify-center w-32 h-16 rounded-xl font-mono text-2xl font-bold transition-all duration-300 ${
                liveAttendanceMode
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {liveAttendanceMode ? currentCode : '------'}
              </div>
            </div>

            {/* Timer Progress Bar */}
            {liveAttendanceMode && (
              <div className="space-y-2 max-w-xs mx-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Code expires in</span>
                  <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                    {timeLeft}s
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!liveAttendanceMode ? (
              <Button
                onClick={startLiveAttendance}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Start Live Attendance
                </div>
              </Button>
            ) : (
              <Button
                onClick={stopLiveAttendance}
                variant="destructive"
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  Stop Live Attendance
                </div>
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className={`text-center p-4 rounded-lg transition-all duration-300 ${
            liveAttendanceMode
              ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
              : 'bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                liveAttendanceMode ? 'bg-green-500' : 'bg-slate-400'
              }`} />
              <span className="text-sm font-medium">
                {liveAttendanceMode ? 'Students can now mark attendance' : 'Instructions'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {liveAttendanceMode
                ? 'Students must enter the 6-digit code shown above to mark their attendance. Code refreshes every 60 seconds.'
                : 'Click "Start Live Attendance" to generate a code that students can use to mark their attendance in real-time.'
              }
            </p>
          </div>

          {/* Live Activity Indicator */}
          {liveAttendanceMode && (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-medium">Live session active</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* table */}
      <Card className="glass glass-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {bulkMode && <TableHead className="w-12"></TableHead>}
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.map((student: any, idx: number) => {
                  const persisted = getStudentAttendance(student.id);
                  const suggested = aiSuggest ? aiSuggestFor(student.id) : null;
                  const unsaved = unsavedChanges[student.id];
                  const effective = unsaved ?? persisted?.status ?? undefined;
                  const inBulk = bulkList.includes(student.id);

                  return (
                    <TableRow key={student.id} className={`hover:bg-muted/30 transition ${idx % 2 === 0 ? "" : "bg-muted/10"} ${inBulk ? "bg-blue-50" : ""}`}>
                      {bulkMode && (
                        <TableCell>
                          <input type="checkbox" checked={inBulk} onChange={(e) => {
                            if (e.target.checked) setBulkList((p) => [...p, student.id]);
                            else setBulkList((p) => p.filter(x => x !== student.id));
                          }} />
                        </TableCell>
                      )}

                      <TableCell className="font-medium">
                        <div>{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.email ?? ""}</div>
                      </TableCell>

                      <TableCell>{student.rollNo}</TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusBadge(effective)}
                          {unsaved && <div className="text-xs text-orange-500">Unsaved</div>}
                          {aiSuggest && suggested && <div className="text-xs text-muted-foreground">Suggest: <span className="font-medium">{suggested}</span></div>}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant={effective === "present" ? "default" : "outline"} onClick={() => markAttendanceLocal(student.id, "present")}>P</Button>
                          <Button size="sm" variant={effective === "absent" ? "destructive" : "outline"} onClick={() => markAttendanceLocal(student.id, "absent")}>A</Button>
                          <Button size="sm" variant={effective === "late" ? "secondary" : "outline"} onClick={() => markAttendanceLocal(student.id, "late")}>L</Button>
                          <Button size="sm" variant={effective === "holiday" ? "default" : "outline"} onClick={() => markAttendanceLocal(student.id, "holiday")}>H</Button>

                          {(persisted || unsaved) && (
                            <Button size="sm" variant="ghost" onClick={() => deleteAttendanceForStudent(student.id)} className="text-destructive">
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* pagination & footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStudents.length)} – {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /> Prev</Button>
              <div>Page {currentPage} / {totalPages}</div>
              <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* bulk drawer */}
      {bulkMode && (
        <div className="fixed bottom-6 left-6 bg-white rounded-xl shadow-lg p-4 border">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">{bulkList.length} selected</div>
            <Select value={""} onValueChange={(v) => {
              // apply quick bulk from dropdown
              if (!v) return;
              markAllFiltered(v as Status);
            }}>
              <SelectTrigger><SelectValue placeholder="Apply status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => { setBulkList([]); toast.success("Cleared selection"); }}>Clear</Button>
          </div>
        </div>
      )}

      {/* Save button (center-bottom) */}
      {Object.keys(unsavedChanges).length > 0 && showSaveButton && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <Button size="lg" className="px-8 py-3 text-base shadow-xl bg-blue-600 hover:bg-blue-700 text-white rounded-full" onClick={onSaveClick}>
            SAVE ATTENDANCE
          </Button>
        </div>
      )}

      {/* success popup (top-center) */}
      {showSuccessPopup && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg">
            <span className="font-medium">Attendance saved successfully!</span>
            <button onClick={() => setShowSuccessPopup(false)} className="text-white hover:text-gray-200">
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
