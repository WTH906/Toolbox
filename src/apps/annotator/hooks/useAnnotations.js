import { useState, useCallback } from 'react';

let _idCounter = 0;
const genId = () => `ann_${Date.now()}_${++_idCounter}`;

export default function useAnnotations() {
  const [annotations, setAnnotations] = useState([]);

  const addAnnotation = useCallback((annotation) => {
    const newAnnotation = {
      id: genId(),
      color: 'yellow',
      comment: '',
      createdAt: new Date().toISOString(),
      ...annotation,
    };
    setAnnotations((prev) => [...prev, newAnnotation]);
    return newAnnotation;
  }, []);

  const updateAnnotation = useCallback((id, updates) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  }, []);

  const removeAnnotation = useCallback((id) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
  }, []);

  const importAnnotations = useCallback((imported) => {
    setAnnotations(imported);
  }, []);

  return {
    annotations,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    clearAnnotations,
    importAnnotations,
  };
}
