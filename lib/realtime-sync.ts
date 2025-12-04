'use client';

/**
 * Real-time Synchronization Module
 * Handles real-time data updates across all dashboards using BroadcastChannel and localStorage
 */

export type DataChangeType = 'add' | 'update' | 'delete';
export type EntityType = 'attendance' | 'announcement' | 'timetable' | 'course-registration' | 'user' | 'subject' | 'department' | 'section' | 'masterSubject' | 'registeredCourse';

export interface DataChangeEvent {
  type: DataChangeType;
  entityType: EntityType;
  data: any;
  timestamp: number;
  userId?: string;
  source?: 'admin' | 'teacher' | 'student';
}

// Global broadcast channels for different data types
const channels: Record<EntityType, BroadcastChannel> = {} as any;

export function initializeBroadcastChannels() {
  if (typeof window === 'undefined') return;

  const entityTypes: EntityType[] = [
    'attendance',
    'announcement',
    'timetable',
    'course-registration',
    'user',
    'subject',
    'department',
    'section',
    'masterSubject',
    'registeredCourse',
  ];

  entityTypes.forEach(type => {
    channels[type] = new BroadcastChannel(`aams-${type}-updates`);
  });
}

export function broadcastChange(event: DataChangeEvent) {
  if (typeof window === 'undefined') return;

  initializeBroadcastChannels();
  const channel = channels[event.entityType];
  if (channel) {
    channel.postMessage({
      ...event,
      timestamp: Date.now(),
    });
  }
}

export function subscribeToChanges(
  entityType: EntityType,
  callback: (event: DataChangeEvent) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  initializeBroadcastChannels();
  const channel = channels[entityType];
  const handler = (e: MessageEvent) => callback(e.data);
  channel.addEventListener('message', handler);

  return () => {
    channel.removeEventListener('message', handler);
  };
}

// Auto-save to localStorage with debouncing
const saveQueues: Map<string, NodeJS.Timeout> = new Map();

export function autoSaveToLocalStorage(key: string, data: any, debounceMs: number = 500) {
  if (typeof window === 'undefined') return;

  // Clear existing timeout
  const existingTimeout = saveQueues.get(key);
  if (existingTimeout) clearTimeout(existingTimeout);

  // Set new timeout
  const timeout = setTimeout(() => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`✓ Auto-saved: ${key}`);
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
    saveQueues.delete(key);
  }, debounceMs);

  saveQueues.set(key, timeout);
}

// Sync across browser tabs
export function watchLocalStorageChanges(callback: (key: string, newValue: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: StorageEvent) => {
    if (e.newValue && e.key) {
      try {
        const data = JSON.parse(e.newValue);
        callback(e.key, data);
      } catch {
        callback(e.key, e.newValue);
      }
    }
  };

  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

// Batch operations for performance
export function batchSaveOperations(
  operations: Array<{ key: string; data: any }>
) {
  if (typeof window === 'undefined') return;

  operations.forEach(({ key, data }) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
    }
  });

  console.log(`✓ Batch saved ${operations.length} items`);
}
