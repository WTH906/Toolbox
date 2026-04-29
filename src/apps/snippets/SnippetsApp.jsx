import React, { useState, useCallback, useEffect, useRef } from 'react';
import SnippetManager from './SnippetManager.jsx';
import useCloudSync from '../../shared/useCloudSync.js';

export default function SnippetsApp({ sessionName: parentSession, onSyncStatusChange }) {
  const cloud = useCloudSync('snippets');
  const [initialData, setInitialData] = useState(null);
  const bootRan = useRef(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (parentSession && parentSession !== cloud.sessionName) cloud.setSessionName(parentSession);
  }, [parentSession]);

  useEffect(() => {
    onSyncStatusChange?.({ status: cloud.syncStatus, lastSavedAt: cloud.lastSavedAt });
  }, [cloud.syncStatus, cloud.lastSavedAt, onSyncStatusChange]);

  useEffect(() => {
    if (bootRan.current) return;
    bootRan.current = true;
    (async () => {
      if (cloud.hasSession) {
        const data = await cloud.loadFromCloud();
        if (data?.tags || data?.snippets) setInitialData(data);
      }
      loaded.current = true;
    })();
  }, []);

  const handleDataChange = useCallback((data) => {
    if (!loaded.current || !cloud.hasSession) return;
    cloud.saveToCloud(data);
  }, [cloud.hasSession, cloud.saveToCloud]);

  return <SnippetManager initialData={initialData} onDataChange={handleDataChange} />;
}
