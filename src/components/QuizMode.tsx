import React from 'react';
import { Volume2, Mic, Square, PenTool, RotateCcw, Check, X, ArrowRight, History, CheckCircle2, Play, ChevronLeft } from 'lucide-react';
import { Unit, Word } from '../services/geminiService';
import { HandwritingCanvas } from './HandwritingCanvas';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface QuizModeProps {
  currentUnit: Unit;
  currentIndex: number;
  quizMode: string;
  userInput: string;
  setUserInput: (val: string) => void;
  isRecording: boolean;
  isSubmitting: boolean;
  isFinished: boolean;
  feedback: 'correct' | 'wrong' | null;
  onSpeak: (text: string) => void;
  onPlayAudio: (url: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onHandwritingRecognize: (base64: string) => void;
  onSubmit: (override?: string) => void;
  onSkip: () => void;
  onPrevious: () => void;
  onFinish: () => void;
  onBack?: () => void;
}

export function QuizMode({
  currentUnit,
  currentIndex,
  quizMode,
  userInput,
  setUserInput,
  isRecording,
  isSubmitting,
  isFinished,
  feedback,
  onSpeak,
  onPlayAudio,
  onStartRecording,
  onStopRecording,
  onHandwritingRecognize,
  onSubmit,
  onSkip,
  onPrevious,
  onFinish,
  onBack
}: QuizModeProps) {
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
          <span className="material-symbols-outlined text-5xl">task_alt</span>
        </div>
        <div>
          <h3 className="text-3xl font-lexend font-bold text-on-surface mb-2 tracking-tight">Practice Complete!</h3>
          <p className="text-on-surface-variant">Fantastic! You've completed all exercises for this stage.</p>
        </div>
        <div className="flex flex-col gap-4">
          <button 
            onClick={onFinish}
            className="w-full bg-primary text-on-primary py-5 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined">arrow_forward</span>
            <span>Next Stage</span>
          </button>
        </div>
      </motion.div>
    );
  }

  const getModeTitle = () => {
    switch (quizMode) {
      case 'quiz-cn-en': return 'CN → EN';
      case 'quiz-en-cn': return 'EN → CN';
      case 'exercise-fill': return 'Fill Blanks';
      case 'exercise-translate': return 'Translate';
      case 'review-wrong': return 'Review Mistakes';
      case 'record': return 'Read Aloud';
      case 'dictation-self': return 'Dictation';
      default: return 'Practice';
    }
  };

  return (
    <div className="space-y-8 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-full transition-all pointer-events-auto"
              title="Back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <div className={cn(
            "px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 pointer-events-none",
            quizMode.startsWith('quiz') ? "text-primary bg-primary-container" : 
            quizMode === 'review-wrong' ? "text-error bg-error-container" : "text-secondary bg-secondary-container"
          )}>
            <span className="material-symbols-outlined text-sm">
              {quizMode.startsWith('quiz') ? 'translate' : 
               quizMode === 'review-wrong' ? 'history' : 'edit_note'}
            </span>
            {getModeTitle()} • {currentIndex + 1} of {currentUnit.words.length} items
          </div>
        </div>
        <button 
          onClick={onFinish}
          className="text-xs font-bold text-outline hover:text-on-surface transition-colors flex items-center gap-1 pointer-events-auto"
        >
          <span>Skip stage</span>
          <span className="material-symbols-outlined text-sm">skip_next</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest p-8 lg:p-12 rounded-[2.5rem] shadow-xl border border-outline-variant/10 relative overflow-hidden">
        {/* Progress indicator */}
        <div className="absolute top-0 left-0 h-1.5 bg-primary/10 w-full">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "absolute inset-0 flex items-center justify-center z-20 rounded-[2.5rem] backdrop-blur-md",
                feedback === 'correct' ? "bg-primary/10" : "bg-error/10"
              )}
            >
              {feedback === 'correct' ? (
                <div className="bg-surface-container-lowest p-8 rounded-full shadow-2xl border-4 border-primary/20">
                  <span className="material-symbols-outlined text-7xl text-primary font-bold">check</span>
                </div>
              ) : (
                <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-2xl border-4 border-error/20 flex flex-col items-center gap-4 max-w-[90%]">
                  <span className="material-symbols-outlined text-7xl text-error font-bold">close</span>
                  <div className="text-center space-y-2">
                    <p className="text-error font-bold text-sm uppercase tracking-widest">Correct Answer</p>
                    <p className="text-2xl font-mono font-bold text-on-surface">
                      {quizMode === 'exercise-translate' 
                        ? (word.type === 'sentence' 
                            ? word.word 
                            : (word.examples && word.examples.length > 0 
                                ? word.examples[0].text 
                                : word.word)) 
                        : word.word}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Question Side */}
          <div className="text-center lg:text-left space-y-8 pointer-events-none">
            <p className="text-[10px] text-outline font-bold uppercase tracking-[0.2em]">
              {quizMode === 'quiz-cn-en' && 'Write the English word'}
              {quizMode === 'quiz-en-cn' && 'Write the Chinese meaning'}
              {quizMode === 'exercise-fill' && 'Fill in the blank'}
              {quizMode === 'exercise-translate' && 'Translate the sentence'}
              {quizMode === 'review-wrong' && 'Re-spell the word'}
              {quizMode === 'record' && 'Read aloud'}
              {quizMode === 'dictation-self' && 'Listen and write'}
            </p>

            <div className="min-h-[120px] flex flex-col justify-center">
              {quizMode === 'quiz-cn-en' && (
                <h2 className="text-5xl lg:text-6xl font-bold text-on-surface tracking-tight">{word.meaning}</h2>
              )}
              {quizMode === 'quiz-en-cn' && (
                <h2 className="text-5xl lg:text-6xl font-bold text-on-surface font-mono tracking-tighter">{word.word}</h2>
              )}
              {quizMode === 'exercise-fill' && (
                <div className="space-y-6">
                  <h2 className="text-2xl lg:text-3xl font-bold text-on-surface leading-relaxed font-mono">
                    {word.examples[0].text.replace(new RegExp(word.word, 'gi'), '_____')}
                  </h2>
                  <p className="text-on-surface-variant text-lg lg:text-xl italic">"{word.examples[0].translation}"</p>
                </div>
              )}
              {quizMode === 'exercise-translate' && (
                <div className="space-y-6">
                  <h2 className="text-3xl lg:text-4xl font-bold text-on-surface leading-tight">
                    {word.type === 'sentence' 
                      ? word.meaning 
                      : (word.examples && word.examples.length > 0 
                          ? word.examples[0].translation 
                          : word.meaning)}
                  </h2>
                  <p className="text-outline text-xs uppercase tracking-widest">Tip: Enter the full English sentence</p>
                </div>
              )}
              {quizMode === 'review-wrong' && (
                <div className="space-y-3">
                  <h2 className="text-5xl lg:text-6xl font-bold text-on-surface tracking-tight">{word.meaning}</h2>
                  <p className="text-primary font-mono text-xl lg:text-2xl">[{word.phonetic}]</p>
                </div>
              )}
              {quizMode === 'record' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center lg:justify-start gap-4">
                    <h2 className="text-5xl lg:text-6xl font-bold text-on-surface font-mono tracking-tighter">{word.word}</h2>
                  </div>
                  <p className="text-xl lg:text-2xl text-on-surface-variant italic">"{word.examples[0].text}"</p>
                  {word.recordingUrl && (
                    <button 
                      onClick={() => onPlayAudio(word.recordingUrl!)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-secondary-container text-on-secondary-container rounded-full font-bold hover:bg-secondary-container/80 transition-all shadow-sm pointer-events-auto"
                    >
                      <span className="material-symbols-outlined text-sm">history</span>
                      <span>Play Recording</span>
                    </button>
                  )}
                </div>
              )}
              {quizMode === 'dictation-self' && (
                <div className="space-y-6">
                  <button 
                    onClick={() => word.recordingUrl ? onPlayAudio(word.recordingUrl) : onSpeak(word.word)}
                    className="w-28 h-28 bg-primary-container text-primary rounded-full flex items-center justify-center mx-auto lg:mx-0 hover:bg-primary-container/70 transition-all active:scale-90 shadow-xl shadow-primary/10 select-none outline-none active:outline-none pointer-events-auto"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <span className="material-symbols-outlined text-5xl select-none pointer-events-none">
                      {word.recordingUrl ? 'play_arrow' : 'volume_up'}
                    </span>
                  </button>
                  <p className="text-xs font-bold text-outline uppercase tracking-widest">
                    {word.recordingUrl ? 'Play your recording' : 'Play pronunciation'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Input/Canvas Side */}
          <div className="space-y-8">
            {quizMode === 'record' ? (
              <div className="flex flex-col items-center gap-6 py-12">
                <button
                  onMouseDown={onStartRecording}
                  onMouseUp={onStopRecording}
                  onTouchStart={onStartRecording}
                  onTouchEnd={onStopRecording}
                  className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl select-none outline-none active:outline-none",
                    isRecording ? "bg-error scale-110 shadow-error/30" : "bg-primary hover:bg-primary/90 shadow-primary/30"
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <span className="material-symbols-outlined text-5xl text-white select-none pointer-events-none">
                    {isRecording ? 'stop' : 'mic'}
                  </span>
                </button>
                <div className="space-y-1 text-center">
                  <p className="text-lg font-bold text-on-surface">
                    {isRecording ? "Recording... Release to stop" : "Hold to record"}
                  </p>
                  <p className="text-[10px] text-outline uppercase tracking-widest">Speak clearly into the mic</p>
                </div>
              </div>
            ) : (
              <div className="relative w-full">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Your Answer</p>
                </div>

                <input 
                  autoFocus
                  disabled={isSubmitting || !!feedback}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                  placeholder={isSubmitting ? "Submitting..." : (quizMode === 'exercise-translate' ? "Type full sentence..." : "Type here...")}
                  className={cn(
                    "w-full text-center lg:text-left text-3xl font-bold py-6 border-b-4 transition-all bg-transparent outline-none font-mono tracking-tight",
                    isSubmitting ? "border-primary text-primary" : "border-surface-container focus:border-primary text-on-surface"
                  )}
                />

                <div className="mt-10 p-6 lg:p-8 bg-surface-container rounded-[2rem] border border-outline-variant/20 shadow-inner select-none">
                  <h3 className="text-[10px] font-bold text-outline uppercase tracking-[0.2em] mb-6 flex items-center justify-center lg:justify-start gap-2 pointer-events-none">
                    <span className="material-symbols-outlined text-sm">draw</span>
                    Handwriting Recognition (Optional)
                  </h3>
                <HandwritingCanvas 
                  onRecognize={onHandwritingRecognize}
                  isProcessing={isSubmitting}
                  currentIndex={currentIndex}
                  disabled={isSubmitting || !!feedback}
                />
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button 
                onClick={onPrevious}
                disabled={currentIndex === 0 || isSubmitting}
                className="flex-1 bg-surface-container text-on-surface-variant py-5 rounded-2xl font-bold hover:bg-surface-container-high transition-all disabled:opacity-30 active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                <span>Previous</span>
              </button>
              <button 
                onClick={onSkip}
                disabled={isSubmitting}
                className="flex-1 bg-surface-container text-on-surface-variant py-5 rounded-2xl font-bold hover:bg-surface-container-high transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Next</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              {quizMode !== 'record' && (
                <button 
                  onClick={() => onSubmit()}
                  disabled={!userInput.trim() || isSubmitting || !!feedback}
                  className={cn(
                    "flex-[2] py-5 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center gap-3",
                    isSubmitting 
                      ? "bg-primary text-on-primary scale-[0.98]" 
                      : "bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 active:scale-95 shadow-primary/20"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      <span>Submit Answer</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
