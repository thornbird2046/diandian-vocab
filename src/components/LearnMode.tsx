import React from 'react';
import { Volume2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Unit } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { ColoredPhonics, HighlightedText } from './Common';

interface LearnModeProps {
  currentUnit: Unit;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSpeak: (text: string) => void;
  onFinish: () => void;
}

export function LearnMode({ 
  currentUnit, 
  currentIndex, 
  onNext, 
  onPrev, 
  onSpeak, 
  onFinish 
}: LearnModeProps) {
  const [isFinished, setIsFinished] = React.useState(false);
  const word = currentUnit.words[currentIndex];
  const progress = ((currentIndex + 1) / currentUnit.words.length) * 100;

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface-container-lowest p-12 rounded-[3rem] border border-outline-variant/30 shadow-2xl text-center space-y-8"
      >
        <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-primary-container text-primary">
          <span className="material-symbols-outlined text-5xl">celebration</span>
        </div>
        <div>
          <h3 className="text-3xl font-lexend font-bold text-on-surface mb-2 tracking-tight">Stage Complete!</h3>
          <p className="text-on-surface-variant">You've reviewed all words in this unit. Ready for a challenge?</p>
        </div>
        <div className="flex flex-col gap-4">
          <button 
            onClick={onFinish}
            className="w-full bg-primary text-on-primary py-5 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">edit_square</span>
            <span>Start Challenge</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm border border-outline-variant/20 flex items-center gap-4">
        <div className="flex-1 h-3 bg-surface-container rounded-full overflow-hidden ml-2">
          <motion.div 
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
        </div>
        <span className="text-xs font-bold text-on-surface-variant mr-2">{currentIndex + 1} / {currentUnit.words.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={word.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-surface-container-lowest p-8 lg:p-12 rounded-[2.5rem] shadow-xl border border-outline-variant/10 relative overflow-hidden"
        >
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[4rem] -mr-8 -mt-8"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10">
            {/* Left Side: Word Info */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between lg:justify-start gap-4">
                  <h2 className="text-6xl lg:text-7xl font-black text-on-surface tracking-tighter font-mono">{word.word}</h2>
                  <div className="px-5 py-2 bg-secondary-container text-on-secondary-container rounded-2xl shadow-sm">
                    <span className="text-sm font-bold tracking-tight">
                      {word.pos.split(' ')[0].charAt(0).toUpperCase() + word.pos.split(' ')[0].slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-medium text-primary font-mono tracking-wide">/{word.phonetic}/</span>
                  <button 
                    onClick={() => onSpeak(word.word)}
                    className="w-14 h-14 bg-primary-container text-primary rounded-full hover:bg-primary-container/80 transition-all active:scale-90 flex items-center justify-center shadow-md shadow-primary/10"
                  >
                    <span className="material-symbols-outlined text-3xl">volume_up</span>
                  </button>
                </div>
              </div>

              {word.phonics && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-outline uppercase tracking-[0.2em] ml-2">Phonics Aid</h3>
                  <div className="inline-block px-8 py-4 bg-tertiary-container/20 rounded-3xl border border-tertiary-container/30">
                    <ColoredPhonics phonics={word.phonics} />
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Meaning & Examples */}
            <div className="space-y-8">
              <div className="p-8 bg-surface-container rounded-3xl border border-outline-variant/20">
                <h3 className="text-[10px] font-bold text-outline uppercase tracking-[0.2em] mb-4">Meaning</h3>
                <p className="text-2xl lg:text-3xl font-bold text-on-surface leading-tight">{word.meaning}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-outline uppercase tracking-[0.2em] ml-2">Example</h3>
                <div className="space-y-4">
                  {word.examples.slice(0, 1).map((ex, i) => (
                    <div key={i} className="text-left p-8 rounded-[2rem] border-2 border-primary/10 bg-primary/5">
                      <p className="text-xl lg:text-2xl font-medium text-on-surface leading-relaxed italic">
                        <HighlightedText text={ex.text} highlight={word.word} />
                      </p>
                      <p className="mt-4 text-on-surface-variant text-lg">"{ex.translation}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-4">
        <button 
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="flex-1 py-5 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl font-bold text-outline hover:text-on-surface disabled:opacity-30 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Prev</span>
        </button>
        {currentIndex === currentUnit.words.length - 1 ? (
          <button 
            onClick={() => setIsFinished(true)}
            className="flex-[2] py-5 bg-primary text-on-primary rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">check_circle</span>
            <span>Finish Learning</span>
          </button>
        ) : (
          <button 
            onClick={onNext}
            className="flex-[2] py-5 bg-primary text-on-primary rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span>Next Word</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  );
}
