import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReadingList from './ReadingList.jsx';
import useCloudSync from '../../shared/useCloudSync.js';

let _c = 0;
const genId = () => `rl_${Date.now().toString(36)}_${++_c}`;

export default function ReadingListApp({ sessionName: parentSession, onSyncStatusChange, onSaveToBookmarks, externalAdd, onLinksChange }) {
  const cloud = useCloudSync('reading');
  const [items, setItems] = useState([]);
  const bootRan = useRef(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (parentSession && parentSession !== cloud.sessionName) cloud.setSessionName(parentSession);
  }, [parentSession]);

  useEffect(() => {
    onSyncStatusChange?.({ status: cloud.syncStatus, lastSavedAt: cloud.lastSavedAt });
  }, [cloud.syncStatus, cloud.lastSavedAt, onSyncStatusChange]);

  // Boot
  useEffect(() => {
    if (bootRan.current) return;
    bootRan.current = true;
    (async () => {
      if (cloud.hasSession) {
        const data = await cloud.loadFromCloud();
        if (data?.items?.length) setItems(data.items);
      }
      loaded.current = true;
    })();
  }, []);

  // Auto-save
  useEffect(() => {
    if (!loaded.current || !cloud.hasSession) return;
    cloud.saveToCloud({ items });
  }, [items, cloud.hasSession]);

  // Report links to parent (for feed "already saved" check)
  useEffect(() => {
    onLinksChange?.(items.map(i => i.link));
  }, [items, onLinksChange]);

  // External add (from Feed tab)
  useEffect(() => {
    if (!externalAdd) return;
    setItems(prev => {
      if (prev.some(i => i.link === externalAdd.link)) return prev;
      return [{ id: genId(), title: externalAdd.title, link: externalAdd.link, source: externalAdd.source || '', dateAdded: new Date().toISOString(), read: false }, ...prev];
    });
  }, [externalAdd]);

  const toggleRead = useCallback((id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: !i.read } : i));
  }, []);

  const remove = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // Get all links for the feed "already saved" check
  const allLinks = items.map(i => i.link);

  return (
    <ReadingList
      items={items}
      onToggleRead={toggleRead}
      onRemove={remove}
      onSaveToBookmarks={onSaveToBookmarks}
    />
  );
}

// Export a hook to get reading list links for the feed
export function useReadingListLinks(items) {
  return items.map(i => i.link);
}
