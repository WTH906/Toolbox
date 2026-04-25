import React, { useState, useCallback, useEffect, useRef } from 'react';
import BookmarkManager from './BookmarkManager.jsx';
import useCloudSync from '../../shared/useCloudSync.js';

export default function BookmarkApp({ sessionName: parentSession, onSyncStatusChange }) {
  const cloud = useCloudSync('bookmarks');
  const [initialData, setInitialData] = useState(null);
  const bootRan = useRef(false);
  const loaded = useRef(false);

  // Sync session name from parent
  useEffect(() => {
    if (parentSession && parentSession !== cloud.sessionName) {
      cloud.setSessionName(parentSession);
    }
  }, [parentSession]);

  // Report sync status up
  useEffect(() => {
    onSyncStatusChange?.({ status: cloud.syncStatus, lastSavedAt: cloud.lastSavedAt });
  }, [cloud.syncStatus, cloud.lastSavedAt, onSyncStatusChange]);

  // Boot: load from cloud
  useEffect(() => {
    if (bootRan.current) return;
    bootRan.current = true;
    (async () => {
      if (cloud.hasSession) {
        const data = await cloud.loadFromCloud();
        if (data?.tags || data?.bookmarks) setInitialData(data);
      }
      loaded.current = true;
    })();
  }, []);

  // Save on data change
  const handleDataChange = useCallback((data) => {
    if (!loaded.current || !cloud.hasSession) return;
    cloud.saveToCloud(data);
  }, [cloud.hasSession, cloud.saveToCloud]);

  return <BookmarkManager initialData={initialData} onDataChange={handleDataChange} />;
}
