import React from 'react';
import { RotateCcw, History, Play, Volume2, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Word } from '../services/geminiService';

interface ReviewHistoryProps {
  sortedHistory: { date: string, words: Word[] }[];
  onStartReview: (date: string, words: Word[]) => void;
  onSpeak: (text: string) => void;
  onPlayAudio: (url: string) => void;
  onBack?: () => void;
}

export function ReviewHistory({ sortedHistory, onStartReview, onSpeak, onPlayAudio, onBack }: ReviewHistoryProps) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-2">
        {onBack && (
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-on-surface tracking-tight">Review Mistakes</h2>
          <p className="text-xs text-on-surface-variant">Spelling mistakes recorded by date. Click a date to start reviewing.</p>
        </div>
      </div>

      {sortedHistory.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-[2.5rem] border-2 border-dashed border-outline-variant/50">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-5xl text-primary/30">history</span>
          </div>
          <p className="text-on-surface-variant font-medium">Great job! No mistakes recorded yet.</p>
        </div>
      ) : (
        sortedHistory.map(({ date, words }) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-outline text-sm flex items-center gap-2 uppercase tracking-widest">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                {date === new Date().toISOString().split('T')[0] ? 'Today' : date}
              </h3>
              <button 
                onClick={() => onStartReview(date, words)}
                className="text-xs font-bold px-4 py-1.5 rounded-full transition-all bg-primary-container text-primary hover:bg-primary-container/80 shadow-sm flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                Review ({words.length})
              </button>
            </div>
            <div className="grid gap-3">
              {words.map(word => (
                <div key={word.id} className="bg-surface-container-lowest p-5 rounded-3xl border border-outline-variant/10 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm bg-error-container text-error shadow-sm">
                      !
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface font-mono text-lg tracking-tight">{word.word}</h4>
                      <p className="text-xs text-on-surface-variant font-medium">{word.meaning}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {word.recordingUrl ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onPlayAudio(word.recordingUrl!); }} 
                        className="p-2 bg-secondary-container text-on-secondary-container rounded-xl hover:bg-secondary-container/80 transition-all flex items-center gap-2 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">mic</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">My Rec</span>
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onSpeak(word.word); }} 
                        className="w-10 h-10 bg-surface-container text-on-surface-variant hover:text-primary hover:bg-primary-container transition-all rounded-full flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-xl">volume_up</span>
                      </button>
                    )}
                    {word.recordingUrl && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onSpeak(word.word); }} 
                        className="w-8 h-8 text-outline hover:text-on-surface transition-all flex items-center justify-center"
                        title="Play AI voice"
                      >
                        <span className="material-symbols-outlined text-lg">volume_up</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
