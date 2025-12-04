'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, getLiveAttendanceCode, markLiveAttendance, getSubjects } from '@/lib/storage';
import { useRealtimeSyncRefresh } from '@/hooks/use-realtime-sync';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function LiveAttendance() {
  const user = getCurrentUser();
  const [attendanceCode, setAttendanceCode] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [liveSubject, setLiveSubject] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    const allSubjects = getSubjects();
    setSubjects(allSubjects);
    checkSession();
  }, []);

  // Real-time sync: check for new live attendance sessions
  useRealtimeSyncRefresh(['attendance'], () => {
    checkSession();
  });

  const checkSession = () => {
    const session = getLiveAttendanceCode();
    if (session) {
      setSessionActive(true);
      const subject = subjects.find(s => s.id === session.subjectId);
      setLiveSubject(subject?.name || session.subjectId);
      // Auto-open dialog if session is active
      setTimeout(() => {
        setIsDialogOpen(true);
      }, 500);
    } else {
      setSessionActive(false);
      setLiveSubject(null);
    }
  };

  const handleSubmitCode = async () => {
    if (!attendanceCode.trim()) {
      setErrorMessage('Please enter the attendance code');
      toast.error('Please enter the attendance code');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = markLiveAttendance(user?.id || '', attendanceCode.trim());

      if (result.success) {
        setSuccessMessage(result.message);
        toast.success(result.message);
        setAttendanceCode('');
        
        // Show success for 3 seconds then close
        setTimeout(() => {
          setIsDialogOpen(false);
          setSuccessMessage(null);
        }, 3000);
      } else {
        setErrorMessage(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setErrorMessage('Failed to mark attendance');
      toast.error('Failed to mark attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmitCode();
    }
  };

  return (
    <>
      {/* Floating button to open live attendance dialog */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="rounded-full h-14 w-14 p-0 shadow-lg hover:shadow-xl transition-shadow"
          title="Enter live attendance code"
        >
          <Clock className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Session Active Indicator */}
      {sessionActive && (
        <motion.div
          className="fixed bottom-24 right-6 z-40"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <Card className="bg-green-50 border-green-200 dark:bg-green-950/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="text-sm">
                  <p className="font-semibold text-green-700">Live Attendance Active</p>
                  <p className="text-green-600 text-xs">{liveSubject}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Live Attendance Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Mark Attendance
            </DialogTitle>
          </DialogHeader>

          {successMessage ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 gap-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6 }}
              >
                <CheckCircle className="w-16 h-16 text-green-500" />
              </motion.div>
              <p className="text-center text-lg font-semibold text-green-600">
                {successMessage}
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Your attendance has been recorded for {liveSubject}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {liveSubject && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-700">
                    Current Class: <span className="font-bold">{liveSubject}</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Attendance Code</label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={attendanceCode}
                  onChange={(e) => {
                    setAttendanceCode(e.target.value.toUpperCase().replace(/[^0-9]/g, ''));
                    setErrorMessage(null);
                  }}
                  onKeyPress={handleKeyPress}
                  maxLength={6}
                  disabled={isLoading}
                  className="text-center text-2xl font-bold tracking-widest"
                  autoFocus
                />
              </div>

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </motion.div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setAttendanceCode('');
                    setErrorMessage(null);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitCode}
                  disabled={isLoading || attendanceCode.length !== 6}
                  className="flex-1"
                >
                  {isLoading ? 'Verifying...' : 'Submit Code'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
