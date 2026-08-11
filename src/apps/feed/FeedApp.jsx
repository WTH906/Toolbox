import React, { useState, useCallback, useEffect, useRef } from 'react';
import MyFeed from './MyFeed.jsx';
import useCloudSync from '../../shared/useCloudSync.js';

export default function FeedApp({ sessionName: parentSession, onSyncStatusChange, onReadLater, readingListLinks }) {
  const cloud = useCloudSync('feed');
  const [initialTopics, setInitialTopics] = useState(null);
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
        if (data) setInitialTopics(data);
      }
      loaded.current = true;
    })();
  }, []);

  const handleTopicsChange = useCallback((topicsFr, topicsEn, presets) => {
    if (!loaded.current || !cloud.hasSession) return;
    cloud.saveToCloud({ topicsFr, topicsEn, presets });
  }, [cloud.hasSession, cloud.saveToCloud]);

  return <MyFeed initialTopics={initialTopics} onTopicsChange={handleTopicsChange} onReadLater={onReadLater} readingListLinks={readingListLinks} />;
}
