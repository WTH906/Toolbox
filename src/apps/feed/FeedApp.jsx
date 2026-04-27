import React, { useState, useCallback, useEffect, useRef } from 'react';
import MyFeed from './MyFeed.jsx';
import useCloudSync from '../../shared/useCloudSync.js';

export default function FeedApp({ sessionName: parentSession, onSyncStatusChange }) {
  const cloud = useCloudSync('feed');
  const [initialTopics, setInitialTopics] = useState(null);
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

  // Boot: load saved topics from cloud
  useEffect(() => {
    if (bootRan.current) return;
    bootRan.current = true;
    (async () => {
      if (cloud.hasSession) {
        const data = await cloud.loadFromCloud();
        if (data?.topicsFr || data?.topicsEn) {
          setInitialTopics({ topicsFr: data.topicsFr, topicsEn: data.topicsEn });
        }
      }
      loaded.current = true;
    })();
  }, []);

  // Save topics when they change
  const handleTopicsChange = useCallback((topicsFr, topicsEn) => {
    if (!loaded.current || !cloud.hasSession) return;
    cloud.saveToCloud({ topicsFr, topicsEn });
  }, [cloud.hasSession, cloud.saveToCloud]);

  return <MyFeed initialTopics={initialTopics} onTopicsChange={handleTopicsChange} />;
}
