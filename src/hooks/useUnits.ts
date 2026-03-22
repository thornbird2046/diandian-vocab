import { useState, useEffect } from 'react';
import { Unit } from '../services/geminiService';

export function useUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [wrongWordHistory, setWrongWordHistory] = useState<Record<string, string[]>>({});
  const [activeWrongWordIds, setActiveWrongWordIds] = useState<string[]>([]);
  const [learningGoal, setLearningGoal] = useState<Unit | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vocab_units');
    const savedHistory = localStorage.getItem('vocab_wrong_history');
    const savedActive = localStorage.getItem('vocab_active_wrong');
    const savedGoal = localStorage.getItem('vocab_learning_goal');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
        const migrated = parsed.map((u: any) => ({
          ...u,
          wrongWordIds: u.wrongWordIds || [],
          words: u.words.map((w: any) => {
            const word = {
              ...w,
              examples: w.examples || [{ text: w.example, translation: w.exampleTranslation }]
            };
            // Cleanup recordings older than 2 hours
            if (word.recordedAt && word.recordedAt < twoHoursAgo) {
              delete word.recordingUrl;
              delete word.recordedAt;
            }
            return word;
          })
        }));
        setUnits(migrated);
      } catch (e) {
        console.error("Failed to load units", e);
      }
    }
    
    if (savedHistory) {
      try {
        setWrongWordHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    if (savedActive) {
      try {
        setActiveWrongWordIds(JSON.parse(savedActive));
      } catch (e) {
        console.error("Failed to load active wrong words", e);
      }
    }

    if (savedGoal) {
      try {
        setLearningGoal(JSON.parse(savedGoal));
      } catch (e) {
        console.error("Failed to load learning goal", e);
      }
    }
  }, []);

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('vocab_units', JSON.stringify(units));
        localStorage.setItem('vocab_wrong_history', JSON.stringify(wrongWordHistory));
        localStorage.setItem('vocab_active_wrong', JSON.stringify(activeWrongWordIds));
        if (learningGoal) {
          localStorage.setItem('vocab_learning_goal', JSON.stringify(learningGoal));
        } else {
          localStorage.removeItem('vocab_learning_goal');
        }
      } catch (e) {
        console.error("Failed to save to localStorage (likely quota exceeded). Clearing recordings...");
        const clearedUnits = units.map(u => ({
          ...u,
          words: u.words.map(w => {
            const { recordingUrl, recordedAt, ...rest } = w;
            return rest;
          })
        }));
        setUnits(clearedUnits);
        try {
          localStorage.setItem('vocab_units', JSON.stringify(clearedUnits));
        } catch (e2) {
          console.error("Still failing to save even after clearing recordings.", e2);
        }
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [units, wrongWordHistory, activeWrongWordIds, learningGoal]);

  const addUnit = (unit: Unit) => setUnits(prev => [...prev, unit]);
  
  const deleteUnit = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    if (learningGoal?.id === id) setLearningGoal(null);
  };

  const updateUnit = (updated: Unit) => {
    setUnits(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const markWrong = (wordId: string, date: string) => {
    setWrongWordHistory(prev => {
      const current = prev[date] || [];
      if (!current.includes(wordId)) {
        return { ...prev, [date]: [...current, wordId] };
      }
      return prev;
    });
  };

  return { 
    units, 
    setUnits,
    wrongWordHistory, 
    setWrongWordHistory,
    activeWrongWordIds,
    setActiveWrongWordIds,
    learningGoal,
    setLearningGoal,
    addUnit, 
    deleteUnit, 
    updateUnit,
    markWrong
  };
}
