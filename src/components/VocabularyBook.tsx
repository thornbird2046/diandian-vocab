import React from 'react';
import { BookOpen, History, RotateCcw, Volume2, Play, Mic, ChevronLeft, Star, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { Unit, Word } from '../services/geminiService';
import { cn } from '../lib/utils';

interface VocabularyBookProps {
  units: Unit[];
  selectedWordIds: Set<string>;
  onToggleWordSelection: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onStartDictation: () => void;
  onStartLearn: (wordIds: string[]) => void;
  onSetLearningGoal: (wordIds: string[]) => void;
  onDeleteWords: (wordIds: string[]) => void;
  onAddUnit: () => void;
  onSpeak: (text: string) => void;
  onPlayAudio: (url: string) => void;
  onRecording: (wordId: string, unitId: string) => void;
  onStopRecording: () => void;
  recordingWordId: string | null;
  onBack?: () => void;
}

export function VocabularyBook({
  units,
  selectedWordIds,
  onToggleWordSelection,
  onSelectAll,
  onClearSelection,
  onStartDictation,
  onStartLearn,
  onSetLearningGoal,
  onDeleteWords,
  onAddUnit,
  onSpeak,
  onPlayAudio,
  onRecording,
  onStopRecording,
  recordingWordId,
  onBack
}: VocabularyBookProps) {
  const allWordsWithUnit = [...units]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .flatMap(u => u.words.map(w => ({ ...w, unitId: u.id, unitName: u.name, unitCreatedAt: u.createdAt })));

  // Group words by date
  const groupedWords: { date: string; words: any[] }[] = [];
  allWordsWithUnit.forEach(word => {
    const date = new Date(word.unitCreatedAt || Date.now()).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const group = groupedWords.find(g => g.date === date);
    if (group) {
      group.words.push(word);
    } else {
      groupedWords.push({ date, words: [word] });
    }
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 hover:bg-surface-container rounded-full transition-colors active:scale-90"
              >
                <span className="material-symbols-outlined text-on-surface">arrow_back</span>
              </button>
            )}
            <div className="flex flex-col">
              <h2 className="text-3xl font-lexend font-bold text-on-surface tracking-tight">Vocabulary</h2>
              <p className="text-on-surface-variant text-sm">Manage July's word garden</p>
            </div>
          </div>
          <button 
            onClick={onAddUnit}
            className="bg-primary text-on-primary px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Add Words</span>
          </button>
        </div>

        {/* Selection Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-surface-container-low p-3 rounded-2xl">
          <div className="flex bg-surface-container rounded-xl p-1">
            <button 
              onClick={onSelectAll}
              className="px-4 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              Select All
            </button>
            <button 
              onClick={onClearSelection}
              className="px-4 py-1.5 text-xs font-bold text-outline hover:bg-surface-variant rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="h-6 w-[1px] bg-outline-variant/30 mx-2 hidden sm:block"></div>

          <button 
            onClick={() => onStartLearn(Array.from(selectedWordIds))}
            disabled={selectedWordIds.size === 0}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none",
              selectedWordIds.size > 0 ? "bg-primary text-on-primary shadow-primary/20" : "bg-surface-container-highest text-outline"
            )}
          >
            <span className="material-symbols-outlined text-lg">menu_book</span>
            <span>Study Now ({selectedWordIds.size})</span>
          </button>

          <button 
            onClick={() => onSetLearningGoal(Array.from(selectedWordIds))}
            disabled={selectedWordIds.size === 0}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none",
              selectedWordIds.size > 0 ? "bg-secondary text-on-secondary shadow-secondary/20" : "bg-surface-container-highest text-outline"
            )}
          >
            <span className="material-symbols-outlined text-lg">target</span>
            <span>Set Goal ({selectedWordIds.size})</span>
          </button>

          <button 
            onClick={onStartDictation}
            disabled={selectedWordIds.size === 0}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none",
              selectedWordIds.size > 0 ? "bg-tertiary text-on-tertiary shadow-tertiary/20" : "bg-surface-container-highest text-outline"
            )}
          >
            <span className="material-symbols-outlined text-lg">keyboard</span>
            <span>Dictation ({selectedWordIds.size})</span>
          </button>

          <button 
            onClick={() => onDeleteWords(Array.from(selectedWordIds))}
            disabled={selectedWordIds.size === 0}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none",
              selectedWordIds.size > 0 ? "bg-error text-on-error shadow-error/20" : "bg-surface-container-highest text-outline"
            )}
          >
            <span className="material-symbols-outlined text-lg">delete</span>
            <span>Delete ({selectedWordIds.size})</span>
          </button>

          <div className="ml-auto px-4 py-2 bg-primary-container/30 rounded-xl">
            <span className="text-primary font-bold text-xs">Total: {allWordsWithUnit.length}</span>
          </div>
        </div>
      </div>

      {/* Word List */}
      <div className="space-y-10">
        {units.length === 0 ? (
          <div className="text-center py-24 bg-surface-container-lowest rounded-[2rem] border-2 border-dashed border-outline-variant/30">
            <div className="bg-surface-container w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-outline text-4xl">eco</span>
            </div>
            <h3 className="text-on-surface font-bold text-xl mb-2">July's garden is empty</h3>
            <p className="text-on-surface-variant text-sm mb-8">Start by adding some new words to grow!</p>
            <button 
              onClick={onAddUnit}
              className="bg-primary-container text-on-primary-container px-8 py-3 rounded-2xl font-bold hover:bg-primary-container/80 transition-colors"
            >
              Plant First Word
            </button>
          </div>
        ) : (
          groupedWords.map((group, groupIdx) => (
            <div key={group.date} className="space-y-4">
              <div className="flex items-center gap-4 px-2">
                <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
                <span className="text-xs font-bold text-outline uppercase tracking-[0.2em] bg-surface-container-low px-4 py-1 rounded-full">
                  {group.date}
                </span>
                <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
              </div>
              
              <div className="grid gap-4">
                {group.words.map((word, idx) => (
                  <div 
                    key={word.id + idx} 
                    onClick={() => onToggleWordSelection(word.id)}
                    className={cn(
                      "bg-surface-container-lowest p-5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99]",
                      selectedWordIds.has(word.id) 
                        ? "border-primary shadow-lg shadow-primary/5 bg-primary-container/10" 
                        : "border-outline-variant/30 shadow-sm hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div 
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all",
                          selectedWordIds.has(word.id) ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
                        )}
                      >
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-xl text-on-surface font-mono tracking-tight">{word.word}</h4>
                          <div className="flex items-center gap-1">
                            {word.recordingUrl && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); onPlayAudio(word.recordingUrl!); }} 
                                className="p-1.5 bg-secondary-container text-on-secondary-container rounded-lg hover:bg-secondary-container/80 transition-colors flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">play_arrow</span>
                                <span className="text-[10px] font-bold">Mine</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant tracking-tight">
                            {word.pos.split(' ')[0].charAt(0).toUpperCase() + word.pos.split(' ')[0].slice(1).toLowerCase()}
                          </span>
                          <p className="text-sm text-on-surface-variant font-medium">{word.meaning}</p>
                        </div>
                        <p className="text-[10px] font-bold text-primary/60 uppercase tracking-tighter">Unit: {word.unitName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button 
                        onMouseDown={(e) => { e.stopPropagation(); onRecording(word.id, word.unitId); }}
                        onMouseUp={(e) => { e.stopPropagation(); onStopRecording(); }}
                        onTouchStart={(e) => { e.stopPropagation(); onRecording(word.id, word.unitId); }}
                        onTouchEnd={(e) => { e.stopPropagation(); onStopRecording(); }}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-90",
                          recordingWordId === word.id 
                            ? "bg-error text-on-error animate-pulse" 
                            : (word.recordingUrl ? "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-highest")
                        )}
                      >
                        <span className="material-symbols-outlined text-lg">{recordingWordId === word.id ? "mic" : "record_voice_over"}</span>
                        <span>{recordingWordId === word.id ? "Recording..." : (word.recordingUrl ? "Redo" : "Record")}</span>
                      </button>
                      
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedWordIds.has(word.id) ? "bg-primary border-primary" : "border-outline-variant"
                      )}>
                        {selectedWordIds.has(word.id) && (
                          <span className="material-symbols-outlined text-on-primary text-sm font-bold">check</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
