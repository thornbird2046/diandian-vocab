import React from 'react';
import { BookOpen, PenTool, RotateCcw, Mic, History, Trash2 } from 'lucide-react';
import { Unit } from '../services/geminiService';
import { cn } from '../lib/utils';

interface UnitListProps {
  units: Unit[];
  onUnitClick: (unit: Unit) => void;
  onDeleteUnit: (id: string) => void;
  onStartLearn: (unit: Unit) => void;
  onStartQuiz: (unit: Unit, mode: any) => void;
  onStartReviewWrong: (unit: Unit) => void;
}

export function UnitList({ 
  units, 
  onUnitClick, 
  onDeleteUnit, 
  onStartLearn, 
  onStartQuiz, 
  onStartReviewWrong 
}: UnitListProps) {
  return (
    <div className="space-y-6">
      {units.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-[2.5rem] border-2 border-dashed border-outline-variant/50">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-5xl text-primary/30">library_books</span>
          </div>
          <p className="text-on-surface-variant font-medium">No units yet. Add some to start learning!</p>
        </div>
      ) : (
        [...units]
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .map((unit) => (
          <div key={unit.id} className="bg-surface-container-lowest p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h3 className="font-bold text-xl text-on-surface tracking-tight group-hover:text-primary transition-colors">{unit.name}</h3>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm">list_alt</span>
                  <span className="text-xs font-bold uppercase tracking-widest">{unit.words.length} Words</span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteUnit(unit.id); }}
                className="w-10 h-10 flex items-center justify-center text-outline hover:text-error hover:bg-error-container rounded-full transition-all"
                title="Delete Unit"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              <button 
                onClick={() => onStartLearn(unit)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-primary-container text-primary hover:bg-primary-container/80 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined">auto_stories</span>
                <span className="text-xs font-bold uppercase tracking-widest">Learn</span>
              </button>
              <button 
                onClick={() => onStartQuiz(unit, 'quiz-cn-en')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined">edit_square</span>
                <span className="text-xs font-bold uppercase tracking-widest">Spell</span>
              </button>
              <button 
                onClick={() => onStartQuiz(unit, 'exercise-fill')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-tertiary-container text-on-tertiary-container hover:bg-tertiary-container/80 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined">format_list_bulleted</span>
                <span className="text-xs font-bold uppercase tracking-widest">Fill</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onStartQuiz(unit, 'exercise-translate')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined">translate</span>
                <span className="text-xs font-bold uppercase tracking-widest">Translate</span>
              </button>
              <button 
                onClick={() => onStartReviewWrong(unit)}
                disabled={unit.wrongWordIds.length === 0}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-error-container text-error hover:bg-error-container/80 transition-all shadow-sm active:scale-95 disabled:opacity-30"
              >
                <span className="material-symbols-outlined">history</span>
                <span className="text-xs font-bold uppercase tracking-widest">Review</span>
              </button>
            </div>
            
            <div className="mt-3">
              <button 
                onClick={() => onStartQuiz(unit, 'record')}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-95"
              >
                <span className="material-symbols-outlined">mic</span>
                <span className="text-xs font-bold uppercase tracking-widest">Read Aloud & Record</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
