import { useState, useCallback, useRef, useEffect } from 'react';

const SESSION_NAME_KEY = 'toolbox-session-name';
const LOCAL_DATA_KEY = 'toolbox-local-data';
const DEBOUNCE_MS = 2000;

// ── localStorage fallback ──

function saveLocal(app, id, data) {
  try {
    const payload = { ...data, id, savedAt: new Date().toISOString() };
    localStorage.setItem(`${LOCAL_DATA_KEY}:${app}:${id}`, JSON.stringify(payload));
    return payload;
  } catch { return null; }
}

function loadLocal(app, id) {
  try {
    const raw = localStorage.getItem(`${LOCAL_DATA_KEY}:${app}:${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── API helpers ──

async function fetchSession(app, id) {
  const res = await fetch(`/api/session?id=${encodeURIComponent(id)}&app=${encodeURIComponent(app)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Load failed: ${res.status}`);
  return res.json();
}

async function putSession(app, data) {
  const res = await fetch(`/api/session?app=${encodeURIComponent(app)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return res.json();
}

// ── Shared session name (all apps use the same name) ──

export function getSessionName() {
  try { return localStorage.getItem(SESSION_NAME_KEY) || ''; }
  catch { return ''; }
}

export function setStoredSessionName(name) {
  try { localStorage.setItem(SESSION_NAME_KEY, name.trim().toLowerCase()); }
  catch { /* ignore */ }
}

// ── Hook ──

export default function useCloudSync(appName = 'annotator') {
  const [sessionName, setSessionNameState] = useState(() => getSessionName());
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const timerRef = useRef(null);
  const latestDataRef = useRef(null);
  const useLocalFallback = useRef(false);

  const setSessionName = useCallback((name) => {
    const clean = name.trim().toLowerCase();
    setSessionNameState(clean);
    setStoredSessionName(clean);
  }, []);

  const loadFromCloud = useCallback(async (name) => {
    const id = (name || sessionName).trim().toLowerCase();
    if (!id) return null;

    setSyncStatus('loading');
    try {
      const data = await fetchSession(appName, id);
      useLocalFallback.current = false;
      setSyncStatus(data ? 'saved' : 'idle');
      if (data?.savedAt) setLastSavedAt(data.savedAt);
      return data;
    } catch (err) {
      console.info(`[${appName}] Cloud sync unavailable, using local storage.`, err.message);
      useLocalFallback.current = true;
      const local = loadLocal(appName, id);
      setSyncStatus(local ? 'local' : 'idle');
      if (local?.savedAt) setLastSavedAt(local.savedAt);
      return local;
    }
  }, [sessionName, appName]);

  const saveToCloud = useCallback((data) => {
    if (!sessionName) return;

    latestDataRef.current = { ...data, id: sessionName };

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const payload = latestDataRef.current;
      if (!payload) return;

      if (useLocalFallback.current) {
        const result = saveLocal(appName, sessionName, payload);
        if (result) { setSyncStatus('local'); setLastSavedAt(result.savedAt); }
        return;
      }

      setSyncStatus('saving');
      try {
        const result = await putSession(appName, payload);
        setSyncStatus('saved');
        setLastSavedAt(result.savedAt);
      } catch (err) {
        console.info(`[${appName}] Cloud save failed, falling back to local.`, err.message);
        useLocalFallback.current = true;
        const result = saveLocal(appName, sessionName, payload);
        if (result) { setSyncStatus('local'); setLastSavedAt(result.savedAt); }
        else setSyncStatus('error');
      }
    }, DEBOUNCE_MS);
  }, [sessionName, appName]);

  useEffect(() => { return () => clearTimeout(timerRef.current); }, []);

  const clearCloudSession = useCallback(async () => {
    if (!sessionName) return;
    try {
      await fetch(`/api/session?id=${encodeURIComponent(sessionName)}&app=${encodeURIComponent(appName)}`, { method: 'DELETE' });
    } catch { /* ignore */ }
    try { localStorage.removeItem(`${LOCAL_DATA_KEY}:${appName}:${sessionName}`); }
    catch { /* ignore */ }
    setLastSavedAt(null);
    setSyncStatus('idle');
  }, [sessionName, appName]);

  return {
    sessionName, setSessionName,
    syncStatus, lastSavedAt,
    loadFromCloud, saveToCloud, clearCloudSession,
    hasSession: !!sessionName,
  };
}
