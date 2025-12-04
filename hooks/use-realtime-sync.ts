'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { subscribeToChanges, DataChangeEvent, EntityType } from '@/lib/realtime-sync';

/**
 * Hook for subscribing to real-time data changes
 * @param entityType - The type of entity to listen for changes
 * @param onchange - Callback function when data changes
 * @param enabled - Whether to enable the subscription (default: true)
 */
export function useRealtimeSync(
  entityType: EntityType | EntityType[],
  onChange: (event: DataChangeEvent) => void,
  enabled: boolean = true
) {
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const entities = Array.isArray(entityType) ? entityType : [entityType];
    const unsubscribers: (() => void)[] = [];

    entities.forEach((entity) => {
      const unsub = subscribeToChanges(entity, (event) => {
        onChange(event);
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((unsub) => {
        if (unsub) unsub();
      });
    };
  }, [entityType, onChange, enabled]);
}

/**
 * Hook for tracking real-time updates with automatic refresh
 */
export function useRealtimeSyncRefresh(
  entityType: EntityType | EntityType[],
  onRefresh: () => void,
  enabled: boolean = true
) {
  useRealtimeSync(
    entityType,
    (event) => {
      // Debounce rapid updates
      onRefresh();
    },
    enabled
  );
}

/**
 * Hook for displaying notifications when data changes
 */
export function useRealtimeSyncNotification(
  entityType: EntityType | EntityType[],
  enabled: boolean = true
) {
  const [notification, setNotification] = useState<DataChangeEvent | null>(null);

  useRealtimeSync(
    entityType,
    (event) => {
      setNotification(event);
      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    },
    enabled
  );

  return notification;
}

/**
 * Hook for syncing component state with real-time data
 */
export function useRealtimeSyncState<T>(
  initialData: T,
  entityType: EntityType | EntityType[],
  mergeFunction?: (current: T, event: DataChangeEvent) => T
) {
  const [data, setData] = useState<T>(initialData);

  useRealtimeSync(
    entityType,
    (event) => {
      if (mergeFunction) {
        setData((current) => mergeFunction(current, event));
      } else {
        // Default: refresh by re-fetching
        setData(initialData);
      }
    },
    true
  );

  return data;
}
