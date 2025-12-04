"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAllAttendance,
  getStudents,
  getSubjects,
  updateAttendance,
  addAttendance,
  deleteAttendance,
  subscribeToAttendanceUpdates,
  getDepartments,
  getSections,
  getStudentsByDepartment,
  getAttendanceByDepartment,
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

import {
  MdSearch as Search,
  MdDownload as Download,
  MdFilterList as Filter,
  MdCalendarToday as Calendar,
  MdPeople as Users,
  MdMenuBook as BookOpen,
  MdEdit as Edit,
  MdDelete as Trash2,
  MdChevronLeft as ChevronLeft,
  MdChevronRight as ChevronRight,
  MdOutlineBarChart as Chart,
  MdBolt as Zap,
  MdCheckCircle as CheckCircle,
  MdWarningAmber as Warning,
  MdClose as Close,
  MdUndo as Undo,
  MdSelectAll as SelectAllIcon,
  MdBlock as BlockIcon,
} from "react-icons/md";

import { toast } from "sonner";

/**
 * Admin Attendance Management — Advanced Replacement
 *
 * - Mark all present/absent/late/holiday (applies to filtered students)
 * - Live realtime filters
 * - Save Attendance floating pill appears when changes exist (auto-hide after 3s)
 * - Undo last change
 * - Bulk select + bulk apply
 * - Export CSV/PDF
 * - Status analytics + distribution bar
 *
 * NOTE: If your storage APIs are async, convert calls to async/await.
 */

// small helper: path to uploaded doc in your workspace (provided earlier)
const ADMIN_DOC_URL = "/mnt/data/PRE-REQUISITES for Frontend APP.pdf";

type Status = "present" | "absent" | "late" | "holiday";

export default function AttendanceManagement() {
  // --- data states
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // --- filters & controls
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status | "not-marked">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // --- sorting & pagination
  const [sortBy, setSortBy] = useState<"name" | "roll" | "status">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- advanced features
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkList, setBulkList] = useState<string[]>([]);
  const [showBulkApply, setShowBulkApply] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<Status>("present");

  // unsaved changes map: studentId -> new status
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, Status>>(
    {}
  );

  // stack to enable undo
  const undoStack = useRef<
    { studentId: string; prev?: string; next: Status; timestamp: number }[]
  >([]);

  // save-pill visibility & timer
  const [showSavePill, setShowSavePill] = useState(false);
  const savePillTimerRef = useRef<number | null>(null);

  // auto-save toggle
  const [autoSave, setAutoSave] = useState(false);

  // live activity counter (simulated)
  const [liveActivity, setLiveActivity] = useState(0);

  // analytics
  const [analytics, setAnalytics] = useState({
    present: 0,
    absent: 0,
    late: 0,
    holiday: 0,
    notMarked: 0,
  });

  // initial load
  useEffect(() => {
    load();
  }, []);

  // Real-time sync: automatically refresh when attendance changes
  useRealtimeSyncRefresh(['attendance', 'user', 'department', 'section'], () => {
    load();
  });

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);


  useEffect(() => {
    // simulate realtime activity heartbeat
    const id = window.setInterval(() => {
      setLiveActivity((p) => p + Math.floor(Math.random() * 2));
    }, 3500);
    return () => window.clearInterval(id);
  }, []);

  function load() {
    // synchronous storage as in your original code
    const allA = getAllAttendance();
    const allS = getStudents();
    const allSub = getSubjects();
    const allDepts = getDepartments();
    const allSecs = getSections();
    setAttendance(allA);
    setStudents(allS);
    setSubjects(allSub);
    setDepartments(allDepts);
    setSections(allSecs);
  }

  // compute filtered students
  const filtered = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    let list = students.filter((s) => {
      const matchClass = selectedClass === "all" || s.course === selectedClass;
      const matchDept = selectedDepartment === "all" || s.department === selectedDepartment;
      const matchSection = selectedSection === "all" || s.section === selectedSection;
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search) ||
        s.rollNo.toLowerCase().includes(search);
      return matchClass && matchDept && matchSection && matchSearch;
    });

    // build today's attendance records for selected subject
    const todayRecs = attendance.filter(
      (a) =>
        a.date === selectedDate &&
        (selectedSubject === "all" ? true : a.subjectId === selectedSubject) &&
        (selectedDepartment === "all" ? true : a.departmentId === selectedDepartment)
    );

    // apply status filter
    if (statusFilter !== "all") {
      list = list.filter((s) => {
        const rec = todayRecs.find((r) => r.studentId === s.id);
        if (statusFilter === "not-marked") return !rec;
        return rec?.status === statusFilter;
      });
    }

    // map unsaved changes into effective status for sorting/filters
    list = list.map((s) => {
      const change = unsavedChanges[s.id];
      return { ...s, _effectiveStatus: change ?? todayRecs.find((r) => r.studentId === s.id)?.status ?? "not-marked" };
    });

    // sort
    list.sort((a: any, b: any) => {
      let aV: any = "";
      let bV: any = "";

      if (sortBy === "name") {
        aV = a.name.toLowerCase();
        bV = b.name.toLowerCase();
      } else if (sortBy === "roll") {
        aV = a.rollNo.toLowerCase();
        bV = b.rollNo.toLowerCase();
      } else {
        aV = a._effectiveStatus || "zzz";
        bV = b._effectiveStatus || "zzz";
      }

      if (sortOrder === "asc") return aV < bV ? -1 : aV > bV ? 1 : 0;
      return aV > bV ? -1 : aV < bV ? 1 : 0;
    });

    return list;
  }, [
    students,
    attendance,
    selectedClass,
    selectedDepartment,
    selectedSection,
    selectedSubject,
    statusFilter,
    searchQuery,
    sortBy,
    sortOrder,
    unsavedChanges,
  ]);

  // analytics for header cards
  useEffect(() => {
    const recs = attendance.filter(
      (a) =>
        a.date === selectedDate &&
        (selectedSubject === "all" ? true : a.subjectId === selectedSubject)
    );

    const present = recs.filter((r) => r.status === "present").length;
    const absent = recs.filter((r) => r.status === "absent").length;
    const late = recs.filter((r) => r.status === "late").length;
    const holiday = recs.filter((r) => r.status === "holiday").length;
    const notMarked = students.length - recs.length;
    setAnalytics({ present, absent, late, holiday, notMarked });
  }, [attendance, students, selectedDate, selectedSubject]);

  // pagination slice
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  // utils
  const getTodayRecord = (studentId: string) =>
    attendance.find(
      (a) =>
        a.studentId === studentId &&
        a.date === selectedDate &&
        (selectedSubject === "all" ? true : a.subjectId === selectedSubject)
    );

  // mark logic: registers unsaved change (doesn't persist until Save)
  function markStudent(studentId: string, status: Status) {
    const currentRec = getTodayRecord(studentId);
    const prevStatus = unsavedChanges[studentId] ?? currentRec?.status;
    // push to undo stack
    undoStack.current.push({
      studentId,
      prev: prevStatus,
      next: status,
      timestamp: Date.now(),
    });

    setUnsavedChanges((p) => {
      const next = { ...p, [studentId]: status };
      showSavePillWithTimeout();
      // if autoSave is ON, save immediately
      if (autoSave) {
        persistChanges({ [studentId]: status });
        return {};
      }
      return next;
    });
  }

  function markAllFiltered(status: Status) {
    const ids = filtered.map((s: any) => s.id);
    // register all in unsavedChanges
    const nextChanges: Record<string, Status> = {};
    ids.forEach((id) => (nextChanges[id] = status));
    // push each to undo stack
    ids.forEach((id) =>
      undoStack.current.push({
        studentId: id,
        prev: getTodayRecord(id)?.status,
        next: status,
        timestamp: Date.now(),
      })
    );
    setUnsavedChanges((p) => ({ ...p, ...nextChanges }));
    setBulkList(ids);
    showSavePillWithTimeout();
    if (autoSave) {
      persistChanges(nextChanges);
      setUnsavedChanges({});
    }
  }

  function clearUnsavedForIds(ids: string[]) {
    setUnsavedChanges((p) => {
      const next = { ...p };
      ids.forEach((id) => delete next[id]);
      return next;
    });
  }

  // Save button behaviour — persist unsavedChanges
  function persistChanges(changes?: Record<string, Status>) {
    const toPersist = changes ?? unsavedChanges;
    const keys = Object.keys(toPersist);
    if (!keys.length) {
      toast("No changes to save");
      return;
    }

    keys.forEach((studentId) => {
      const status = toPersist[studentId];
      const existing = getTodayRecord(studentId);

      if (existing) {
        updateAttendance(existing.id, status);
      } else {
        const newRec: Attendance = {
          id: "att_" + Date.now() + Math.random(),
          studentId,
          date: selectedDate,
          status,
          subjectId:
            selectedSubject === "all" ? subjects[0]?.id || "sub1" : selectedSubject,
        };
        addAttendance(newRec);
      }
    });

    // refresh local attendance state
    setAttendance(getAllAttendance());

    // clear unsaved for persisted keys
    if (!changes) setUnsavedChanges({});
    else clearUnsavedForIds(Object.keys(changes));

    // show success toast & hide save pill
    toast.success("Attendance saved successfully");
    hideSavePill();
  }

  // Save pill helpers: show for 3s, reset timer on subsequent changes
  function showSavePillWithTimeout() {
    setShowSavePill(true);
    if (savePillTimerRef.current) {
      window.clearTimeout(savePillTimerRef.current);
    }
    // auto-hide after 3 seconds
    savePillTimerRef.current = window.setTimeout(() => {
      setShowSavePill(false);
      savePillTimerRef.current = null;
    }, 3000);
  }

  function hideSavePill() {
    setShowSavePill(false);
    if (savePillTimerRef.current) {
      window.clearTimeout(savePillTimerRef.current);
      savePillTimerRef.current = null;
    }
  }

  function undoLast() {
    const last = undoStack.current.pop();
    if (!last) {
      toast("Nothing to undo");
      return;
    }
    // revert in unsavedChanges (set prev)
    if (last.prev) {
      setUnsavedChanges((p) => ({ ...p, [last.studentId]: last.prev as Status }));
    } else {
      // prev undefined -> means record didn't exist, remove unsaved change and if record existed remove too
      setUnsavedChanges((p) => {
        const next = { ...p };
        delete next[last.studentId];
        return next;
      });
      // also delete persisted record if already existed but prev undefined rarely happens
    }
    toast.success("Last change undone");
    showSavePillWithTimeout();
  }

  // bulk apply: persist or add to unsaved
  function handleBulkApply() {
    const ids = bulkList.slice();
    if (!ids.length) {
      toast("No students selected for bulk apply");
      return;
    }
    const changes: Record<string, Status> = {};
    ids.forEach((id) => (changes[id] = bulkStatus));
    setUnsavedChanges((p) => ({ ...p, ...changes }));
    setShowBulkApply(false);
    showSavePillWithTimeout();
    toast.success(`Applied ${bulkStatus} to ${ids.length} students`);
    if (autoSave) {
      persistChanges(changes);
      setUnsavedChanges({});
    }
  }

  // delete single persisted record
  function deleteRecordByStudent(studentId: string) {
    const rec = getTodayRecord(studentId);
    if (!rec) {
      // if it's only in unsaved, remove it from unsaved
      setUnsavedChanges((p) => {
        const next = { ...p };
        delete next[studentId];
        return next;
      });
      toast.success("Unsaved change removed");
      return;
    }
    deleteAttendance(rec.id);
    setAttendance(getAllAttendance());
    toast.success("Record deleted");
  }

  // CSV / PDF export
  function exportCSV() {
    const headers = ["Name", "Roll", "Class", "Status"];
    const rows = filtered.map((s: any) => {
      const effective = unsavedChanges[s.id] ?? getTodayRecord(s.id)?.status ?? "Not Marked";
      return [s.name, s.rollNo, s.course, effective];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = `attendance-${selectedDate}.csv`;
    a.click();
    toast.success("CSV exported");
  }

  function exportPDF() {
    window.print();
    toast.success("PDF exported (browser print)");
  }

  // small helper: status badge with unsaved indicator
  function renderStatusBadge(studentId: string) {
    const unsaved = unsavedChanges[studentId];
    const persisted = getTodayRecord(studentId)?.status;
    const status = unsaved ?? persisted;
    const showUnsavedDot = unsaved !== undefined;

    const cfg: Record<string, string> = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      late: "bg-yellow-100 text-yellow-800",
      holiday: "bg-blue-100 text-blue-800",
      "not-marked": "bg-gray-100 text-gray-700",
    };

    return (
      <div className="flex items-center gap-2">
        <Badge className={cfg[status ?? "not-marked"]}>
          {status ? (status as string).charAt(0).toUpperCase() + (status as string).slice(1) : "Not Marked"}
        </Badge>
        {showUnsavedDot && <div className="w-2 h-2 rounded-full bg-orange-400" title="Unsaved change" />}
      </div>
    );
  }

  const uniqueClasses = Array.from(new Set(students.map((s) => s.course))).filter(Boolean);

  // header sort icon helper
  const sortIcon = (field: "name" | "roll" | "status") =>
    sortBy === field ? (sortOrder === "asc" ? "↑" : "↓") : "";

  // mark-all helpers bound for UI buttons
  const markAllPresent = () => markAllFiltered("present");
  const markAllAbsent = () => markAllFiltered("absent");
  const markAllLate = () => markAllFiltered("late");
  const markAllHoliday = () => markAllFiltered("holiday");

  // cleanup on unmount timers
  useEffect(() => {
    return () => {
      if (savePillTimerRef.current) window.clearTimeout(savePillTimerRef.current);
    };
  }, []);

  // ---------------- UI ----------------
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Attendance Management</h1>
          <p className="text-muted-foreground mt-1">
            Realtime attendance management & export tools.
          </p>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>

            <Button variant="outline" onClick={exportPDF}>
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
          </div>

          <div className="flex gap-2 mt-1">
            <Button variant="ghost" size="sm" onClick={undoLast}>
              <Undo className="w-4 h-4 mr-1" /> Undo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setUnsavedChanges({}); toast.success("Cleared unsaved changes"); }}>
              Clear Unsaved
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-2 md:col-span-1 border-l-4 border-green-500">
          <CardHeader><CardTitle className="text-green-700 flex items-center gap-2"><CheckCircle className="w-4 h-4" />Present</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.present}</CardContent>
        </Card>

        <Card className="border-l-4 border-red-500">
          <CardHeader><CardTitle className="text-red-700 flex items-center gap-2"><Close className="w-4 h-4" />Absent</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.absent}</CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500">
          <CardHeader><CardTitle className="text-yellow-700 flex items-center gap-2"><Warning className="w-4 h-4" />Late</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.late}</CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <CardHeader><CardTitle className="text-blue-700 flex items-center gap-2"><Calendar className="w-4 h-4" />Not Marked</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{analytics.notMarked}</CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" /> Filters & Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Date</label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>

            {/* Class */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Class</label>
              <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {uniqueClasses.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Department</label>
              <Select value={selectedDepartment} onValueChange={(v) => { setSelectedDepartment(v); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {/* Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Section</label>
              <Select value={selectedSection} onValueChange={(v) => { setSelectedSection(v); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><BookOpen className="w-4 h-4" /> Subject</label>
              <Select value={selectedSubject} onValueChange={(v) => { setSelectedSubject(v); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((sub) => (<SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue placeholder="Filter status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="not-marked">Not Marked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input className="pl-10" placeholder="Search by name or roll..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="secondary" onClick={markAllPresent}><SelectAllIcon className="w-4 h-4 mr-2" />Mark All Present</Button>
            <Button size="sm" variant="destructive" onClick={markAllAbsent}><BlockIcon className="w-4 h-4 mr-2" />Mark All Absent</Button>
            <Button size="sm" variant="outline" onClick={markAllLate}>Mark All Late</Button>
            <Button size="sm" variant="outline" onClick={markAllHoliday}>Mark All Holiday</Button>

            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm text-muted-foreground">Live Activity</div>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-400" style={{ width: `${Math.min(100, (liveActivity % 50) * 2)}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <TableRow>
                  {bulkMode && <TableHead className="w-12"></TableHead>}
                  <TableHead className="cursor-pointer" onClick={() => { setSortBy("name"); setSortOrder(sortBy === "name" ? (sortOrder === "asc" ? "desc" : "asc") : "asc"); }}>
                    Name {sortIcon("name")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => { setSortBy("roll"); setSortOrder(sortBy === "roll" ? (sortOrder === "asc" ? "desc" : "asc") : "asc"); }}>
                    Roll No {sortIcon("roll")}
                  </TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => { setSortBy("status"); setSortOrder(sortBy === "status" ? (sortOrder === "asc" ? "desc" : "asc") : "asc"); }}>
                    Status {sortIcon("status")}
                  </TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.map((s: any, idx: number) => {
                  const rec = getTodayRecord(s.id);
                  const unsaved = unsavedChanges[s.id];
                  const effective = unsaved ?? rec?.status ?? undefined;
                  const inBulk = bulkList.includes(s.id);
                  return (
                    <TableRow key={s.id} className={`hover:bg-muted/30 transition ${idx % 2 === 0 ? "" : "bg-muted/10"} ${inBulk ? "bg-blue-50" : ""}`}>
                      {bulkMode && (
                        <TableCell>
                          <input type="checkbox" checked={inBulk} onChange={(e) => {
                            if (e.target.checked) setBulkList((p) => [...p, s.id]);
                            else setBulkList((p) => p.filter(x => x !== s.id));
                          }} />
                        </TableCell>
                      )}

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src="/placeholder-user.jpg" alt={s.name} />
                            <AvatarFallback>{s.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-muted-foreground">{s.email ?? ""}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{s.rollNo}</TableCell>
                      <TableCell>{s.course}</TableCell>

                      <TableCell>{renderStatusBadge(s.id)}</TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button size="sm" variant={effective === "present" ? "default" : "outline"} onClick={() => markStudent(s.id, "present")}>P</Button>
                          <Button size="sm" variant={effective === "absent" ? "destructive" : "outline"} onClick={() => markStudent(s.id, "absent")}>A</Button>
                          <Button size="sm" variant={effective === "late" ? "secondary" : "outline"} onClick={() => markStudent(s.id, "late")}>L</Button>
                          <Button size="sm" variant={effective === "holiday" ? "default" : "outline"} onClick={() => markStudent(s.id, "holiday")}>H</Button>

                          {(rec || unsaved) && (
                            <Button size="sm" variant="ghost" onClick={() => deleteRecordByStudent(s.id)} className="text-destructive">
                              <Trash2 className="w-4 h-4" />
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

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)} – {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /> Prev</Button>
              <div>Page {currentPage} / {totalPages}</div>
              <Button size="sm" variant="outline" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next <ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk drawer */}
      {bulkMode && (
        <div className="fixed bottom-6 left-6 bg-white rounded-xl shadow-lg p-4 border">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">{bulkList.length} selected</div>
            <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as Status)}>
              <SelectTrigger><SelectValue placeholder="Apply status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleBulkApply}>Apply</Button>
            <Button size="sm" variant="outline" onClick={() => setBulkList([])}>Clear</Button>
          </div>
        </div>
      )}

      {/* Floating SAVE button (center-bottom) */}
      {Object.keys(unsavedChanges).length > 0 && showSavePill && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <Button
            size="lg"
            className="px-8 py-3 text-base shadow-xl bg-blue-600 hover:bg-blue-700 text-white rounded-full animate-in fade-in slide-in-from-bottom-4"
            onClick={() => {
              persistChanges();
              setShowSuccessPopup(true);
              // hide success popup after 3 seconds
              setTimeout(() => setShowSuccessPopup(false), 3000);
            }}
          >
            SAVE ATTENDANCE
          </Button>
        </div>
      )}

    </div>
  );
}
