import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const KEY = 'shformacions_saved_courses';

export function useSavedCourses() {
  const { session } = useAuth();
  const storageKey = session ? `${KEY}_${session.userId}` : KEY;

  const [savedIds, setSavedIds] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setSavedIds(stored);
    } catch { setSavedIds([]); }
  }, [storageKey]);

  const save = useCallback((ids: number[]) => {
    setSavedIds(ids);
    localStorage.setItem(storageKey, JSON.stringify(ids));
  }, [storageKey]);

  const toggleSave = useCallback((courseId: number) => {
    setSavedIds((prev) => {
      const next = prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const remove = useCallback((courseId: number) => {
    setSavedIds((prev) => {
      const next = prev.filter((id) => id !== courseId);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const clearAll = useCallback(() => { save([]); }, [save]);

  return { savedIds, toggleSave, remove, clearAll };
}
