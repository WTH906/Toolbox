import React, { useState, useCallback, useEffect, useRef } from 'react';
import SubscriptionManager from './SubscriptionManager.jsx';
import useCloudSync from '../../shared/useCloudSync.js';

export default function SubscriptionsApp({ sessionName: parentSession, onSyncStatusChange }) {
  const cloud = useCloudSync('subscriptions');
  const [initialData, setInitialData] = useState(null);
  const bootRan = useRef(false);
  const loaded = useRef(false);

  // Sync session name from parent (the toolbox shell or our standalone shell)
  useEffect(() => {
    if (parentSession && parentSession !== cloud.sessionName) {
      cloud.setSessionName(parentSession);
    }
  }, [parentSession]);

  // Bubble sync status up so the shell's status bar can render it
  useEffect(() => {
    onSyncStatusChange?.({ status: cloud.syncStatus, lastSavedAt: cloud.lastSavedAt });
  }, [cloud.syncStatus, cloud.lastSavedAt, onSyncStatusChange]);

  // Boot: load from Redis (with localStorage fallback handled by the hook)
  useEffect(() => {
    if (bootRan.current) return;
    bootRan.current = true;
    (async () => {
      if (cloud.hasSession) {
        const data = await cloud.loadFromCloud();
        if (data?.tags || data?.subscriptions) setInitialData(data);
      }
      loaded.current = true;
    })();
  }, []);

  // Save on every data change (the hook debounces internally)
  const handleDataChange = useCallback((data) => {
    if (!loaded.current || !cloud.hasSession) return;
    cloud.saveToCloud(data);
  }, [cloud.hasSession, cloud.saveToCloud]);

  return <SubscriptionManager initialData={initialData} onDataChange={handleDataChange} />;
}
