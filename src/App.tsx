import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Trash2, 
  Brain, 
  PenTool,
  Volume2,
  X,
  Loader2,
  Star,
  ArrowRight,
  Sparkles,
  Mic,
  Square,
  Play,
  Pause,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateWordDetails, Word, Unit, recognizeHandwriting } from './services/geminiService';
import { cn } from './lib/utils';
import { useUnits } from './hooks/useUnits';
import { useRecorder } from './hooks/useRecorder';

import { Header } from './components/Header';
import { UnitList } from './components/UnitList';
import { AddUnit } from './components/AddUnit';
import { LearnMode } from './components/LearnMode';
import { QuizMode } from './components/QuizMode';
import { VocabularyBook } from './components/VocabularyBook';
import { ReviewHistory } from './components/ReviewHistory';

type Mode = 'list' | 'add' | 'learn' | 'quiz-cn-en' | 'exercise-fill' | 'exercise-translate' | 'review-wrong' | 'vocabulary-book' | 'record' | 'dictation-self' | 'review-history';

const PHASE_SEQUENCE: Mode[] = ['learn', 'record', 'quiz-cn-en', 'exercise-fill', 'exercise-translate'];

export default function App() {
  const { 
    units, 
    setUnits,
    wrongWordHistory, 
    setWrongWordHistory,
    activeWrongWordIds,
    setActiveWrongWordIds,
    addUnit, 
    deleteUnit, 
    updateUnit,
    markWrong,
    learningGoal,
    setLearningGoal
  } = useUnits();

  const { isRecording, isPlayingAudio, startRecording, stopRecording, playAudio } = useRecorder();

  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [mode, setMode] = useState<Mode>('list');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('正在生成...');
  const [inputText, setInputText] = useState('');
  const [unitTitle, setUnitTitle] = useState('');
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [recordingWordId, setRecordingWordId] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const setSubmitting = (val: boolean) => {
    setIsSubmitting(val);
    isSubmittingRef.current = val;
  };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizInput, setQuizInput] = useState('');
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [modal, setModal] = useState<{
    type: 'alert' | 'confirm';
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);
  
  // Exercise states
  const [wrongWordsInSession, setWrongWordsInSession] = useState<Set<string>>(new Set());

  const allWords = useMemo(() => units.flatMap(u => u.words), [units]);
  
  const sortedHistory = useMemo(() => {
    return Object.entries(wrongWordHistory)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, wordIds]) => {
        const ids = wordIds as string[];
        const words = allWords.filter(w => ids.includes(w.id));
        return { date, words };
      })
      .filter(item => item.words.length > 0);
  }, [wrongWordHistory, allWords]);

  // Handle Enter key for record mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'record' && e.key === 'Enter' && !isRecording) {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isRecording, currentIndex, currentUnit]);

  // Cleanup old recordings (> 2 hours) - Run once on mount
  useEffect(() => {
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const now = Date.now();
    
    let changed = false;
    const updatedUnits = units.map(unit => {
      let unitChanged = false;
      const updatedWords = unit.words.map(word => {
        if (word.recordedAt && now - word.recordedAt > TWO_HOURS) {
          changed = true;
          unitChanged = true;
          const { recordingUrl, recordedAt, ...rest } = word;
          return rest;
        }
        return word;
      });
      return unitChanged ? { ...unit, words: updatedWords } : unit;
    });

    if (changed) {
      setUnits(updatedUnits);
    }
  }, []); // Run once on mount

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleRecording = async (wordId?: string, unitId?: string) => {
    if (wordId) setRecordingWordId(wordId);
    const blobUrl = await startRecording();
    if (!blobUrl) return;

    if (wordId && unitId) {
      // Recording from vocabulary book
      setUnits(prev => prev.map(u => {
        if (u.id === unitId) {
          const updatedWords = u.words.map(w => 
            w.id === wordId ? { ...w, recordingUrl: blobUrl, recordedAt: Date.now() } : w
          );
          return { ...u, words: updatedWords };
        }
        return u;
      }));
      setRecordingWordId(null);
    } else if (currentUnit) {
      // Recording from quiz/learn mode
      const updatedWords = currentUnit.words.map((w, i) => 
        i === currentIndex ? { ...w, recordingUrl: blobUrl, recordedAt: Date.now() } : w
      );
      const updatedUnit = { ...currentUnit, words: updatedWords };
      setCurrentUnit(updatedUnit);
      updateUnit(updatedUnit);
    }
  };

  const handleAddUnit = async (title: string, words: string[]) => {
    if (isSubmittingRef.current) return;
    setSubmitting(true);
    
    const messages = [
      '正在连接 AI 导师...',
      '正在查询词典和音标...',
      '正在生成自然拼读拆解...',
      '正在编写生动的例句...',
      '正在最后校对内容...',
      '即将完成，请稍候...'
    ];
    let msgIndex = 0;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMessage(messages[msgIndex]);
    }, 2500);

    try {
      const wordDetails = await generateWordDetails(words);
      const newUnit: Unit = {
        id: Math.random().toString(36).substr(2, 9),
        name: title,
        words: wordDetails,
        wrongWordIds: [],
        createdAt: Date.now()
      };
      addUnit(newUnit);
      setMode('list');
    } catch (e) {
      console.error("Failed to generate unit details", e);
    } finally {
      clearInterval(interval);
      setSubmitting(false);
      setLoadingMessage('正在生成...');
    }
  };

  const startLearn = (unit: Unit) => {
    setCurrentUnit(unit);
    setCurrentIndex(0);
    setQuizFinished(false);
    setMode('learn');
  };

  const toggleWordSelection = (wordId: string) => {
    setSelectedWordIds(prev => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  const startDictationFromBook = () => {
    if (selectedWordIds.size === 0) {
      setModal({ type: 'alert', message: "请先选择要听写的单词！" });
      return;
    }

    const selectedWords = allWords.filter(w => selectedWordIds.has(w.id));
    
    const wordsWithoutRecording = selectedWords.filter(w => !w.recordingUrl);
    if (wordsWithoutRecording.length > 0) {
      setModal({ 
        type: 'alert', 
        message: `有 ${wordsWithoutRecording.length} 个单词还没有录音，请先录音后再开始听写。` 
      });
      return;
    }

    const tempUnit: Unit = {
      id: 'temp-dictation',
      name: '单词本听写挑战',
      words: selectedWords,
      wrongWordIds: [],
      createdAt: Date.now()
    };

    setCurrentUnit(tempUnit);
    setCurrentIndex(0);
    setQuizFinished(false);
    setQuizScore(0);
    setMode('dictation-self');
  };

  const startLearnFromBook = () => {
    if (selectedWordIds.size === 0) {
      setModal({ type: 'alert', message: "请先选择要学习的单词！" });
      return;
    }

    const selectedWords = allWords.filter(w => selectedWordIds.has(w.id));
    const tempUnit: Unit = {
      id: 'temp-learn',
      name: '单词本学习',
      words: selectedWords,
      wrongWordIds: [],
      createdAt: Date.now()
    };

    startLearn(tempUnit);
  };

  const startQuiz = (unit: Unit, type: Mode) => {
    // Filter words based on mode
    let filteredWords = unit.words;
    if (type === 'exercise-fill') {
      filteredWords = unit.words.filter(w => w.type !== 'sentence');
    } else if (type === 'quiz-cn-en') {
      // Include phrases and sentences in dictation/translation quiz
      filteredWords = unit.words;
    } else if (type === 'exercise-translate') {
      // If there are sentences, prioritize them? Or show everything?
      // User said: "put the sentences I fed you into the translation function"
      // Let's show everything in translate mode, but sentences are special.
      filteredWords = unit.words;
    }

    if (filteredWords.length === 0) {
      // Skip this phase if no words match
      const currentPhaseIndex = PHASE_SEQUENCE.indexOf(type);
      if (currentPhaseIndex !== -1 && currentPhaseIndex < PHASE_SEQUENCE.length - 1) {
        startQuiz(unit, PHASE_SEQUENCE[currentPhaseIndex + 1]);
        return;
      } else {
        if (unit.id.startsWith('review-')) {
          setMode('review-history');
        } else if (unit.id === 'temp-dictation') {
          setMode('vocabulary-book');
        } else {
          setMode('list');
        }
        return;
      }
    }

    setCurrentUnit({ ...unit, words: filteredWords });
    setCurrentIndex(0);
    setQuizScore(0);
    setQuizInput('');
    setQuizFeedback(null);
    setQuizFinished(false);
    setWrongWordsInSession(new Set());
    setMode(type);
  };

  const startReviewWrong = (unit: Unit) => {
    if (unit.wrongWordIds.length === 0) {
      setModal({ type: 'alert', message: "没有错题需要复习！" });
      return;
    }
    const wrongWords = unit.words.filter(w => unit.wrongWordIds.includes(w.id));
    setCurrentUnit({ ...unit, words: wrongWords });
    setCurrentIndex(0);
    setQuizScore(0);
    setQuizInput('');
    setQuizFeedback(null);
    setQuizFinished(false);
    setWrongWordsInSession(new Set());
    setMode('review-wrong');
  };

  const handleSkip = () => {
    if (!currentUnit) return;
    setQuizInput('');
    setQuizFeedback(null);
    if (mode === 'record' && isRecording) stopRecording();
    
    if (currentIndex < currentUnit.words.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handlePrevious = () => {
    if (!currentUnit || currentIndex === 0) return;
    setQuizInput('');
    setQuizFeedback(null);
    if (mode === 'record' && isRecording) stopRecording();
    setCurrentIndex(i => i - 1);
  };

  const handleDeleteWords = (wordIds: string[]) => {
    if (wordIds.length === 0) return;
    
    setModal({
      type: 'confirm',
      message: `确定要删除选中的 ${wordIds.length} 个单词吗？`,
      onConfirm: () => {
        setUnits(prev => {
          return prev.map(unit => ({
            ...unit,
            words: unit.words.filter(w => !wordIds.includes(w.id))
          })).filter(unit => unit.words.length > 0);
        });
        setSelectedWordIds(new Set());
        setModal(null);
      },
      onCancel: () => setModal(null)
    });
  };

  const handleHandwritingRecognize = async (base64Image: string) => {
    if (isSubmittingRef.current || !currentUnit) return;
    setSubmitting(true);
    setLoadingMessage('正在识别手写文字...');
    try {
      const recognizedText = await recognizeHandwriting(base64Image);
      setQuizInput(recognizedText);
      // Process the answer using the shared logic
      processQuizAnswer(recognizedText);
    } catch (e) {
      console.error("Handwriting recognition failed", e);
    } finally {
      setSubmitting(false);
      setLoadingMessage('正在生成...');
    }
  };

  const processQuizAnswer = (inputToTest: string) => {
    if (!currentUnit) return;
    const currentWord = currentUnit.words[currentIndex];

    let isCorrect = inputToTest.trim().toLowerCase() === currentWord.word.toLowerCase();

    if (mode === 'exercise-translate' || (mode === 'quiz-cn-en' && (currentWord.type === 'phrase' || currentWord.type === 'sentence'))) {
      const normalize = (str: string) => str.trim().toLowerCase().replace(/[.?!,;:]+$/, '').replace(/\s+/g, ' ');
      const target = currentWord.type === 'sentence' 
        ? currentWord.word 
        : (currentWord.examples && currentWord.examples.length > 0 ? currentWord.examples[0].text : currentWord.word);
      
      // For quiz-cn-en, the target is always the word itself if it's a phrase/sentence
      const finalTarget = mode === 'quiz-cn-en' ? currentWord.word : target;
      isCorrect = normalize(inputToTest) === normalize(finalTarget);
    }
    
    setQuizFeedback(isCorrect ? 'correct' : 'wrong');
    
    // Auto-advance after 1.5s regardless of correct/wrong to avoid "freeze"
    setTimeout(() => {
      handleSkip();
    }, 1500);

    if (isCorrect) {
      setQuizScore(s => s + 1);
      
      if (mode === 'review-wrong') {
        // Remove from active review list
        setActiveWrongWordIds(prev => prev.filter(id => id !== currentWord.id));

        const updatedUnits = units.map(u => {
          if (u.words.some(w => w.id === currentWord.id)) {
            return { ...u, wrongWordIds: u.wrongWordIds.filter(id => id !== currentWord.id) };
          }
          return u;
        });
        setUnits(updatedUnits);
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      
      // Permanent History
      setWrongWordHistory(prev => ({
        ...prev,
        [today]: [...new Set([...(prev[today] || []), currentWord.id])]
      }));

      // Active Review List
      setActiveWrongWordIds(prev => [...new Set([...prev, currentWord.id])]);

      setWrongWordsInSession(prev => new Set(prev).add(currentWord.id));
      const updatedUnits = units.map(u => {
        if (u.words.some(w => w.id === currentWord.id)) {
          if (!u.wrongWordIds.includes(currentWord.id)) {
            return { ...u, wrongWordIds: [...u.wrongWordIds, currentWord.id] };
          }
        }
        return u;
      });
      setUnits(updatedUnits);
    }
  };

  const handleQuizSubmit = (override?: string) => {
    if (isSubmittingRef.current || !currentUnit) return;
    const inputToTest = override !== undefined ? override : quizInput;
    processQuizAnswer(inputToTest);
  };

  const handleStartReview = (date: string, words: Word[]) => {
    setCurrentUnit({ id: `review-${date}`, name: `${date} 错题复习`, words, wrongWordIds: [] } as any);
    setCurrentIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizInput('');
    setQuizFeedback(null);
    setWrongWordsInSession(new Set());
    setMode('review-wrong');
  };

  const goToNextPhase = () => {
    if (!currentUnit) return;
    const currentPhaseIndex = PHASE_SEQUENCE.indexOf(mode);
    if (currentPhaseIndex !== -1 && currentPhaseIndex < PHASE_SEQUENCE.length - 1) {
      const nextMode = PHASE_SEQUENCE[currentPhaseIndex + 1];
      startQuiz(currentUnit, nextMode);
    } else {
      if (currentUnit.id.startsWith('review-')) {
        setMode('review-history');
      } else if (currentUnit.id === 'temp-dictation') {
        setMode('vocabulary-book');
      } else {
        setMode('list');
      }
    }
  };

  const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span className="font-mono">
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="text-teal-600 font-bold underline decoration-2 underline-offset-4">{part}</span>
          ) : part
        )}
      </span>
    );
  };

  const ColoredPhonics = ({ phonics }: { phonics: string }) => {
    const colors = [
      'text-teal-400', 
      'text-orange-500', 
      'text-blue-500', 
      'text-purple-500', 
      'text-pink-500',
      'text-cyan-500'
    ];
    const parts = phonics.split('-');
    return (
      <div className="flex items-center gap-1 font-mono text-xl tracking-widest font-bold">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <span className={colors[i % colors.length]}>{part}</span>
            {i < parts.length - 1 && <span className="text-gray-300">-</span>}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const startGlobalReview = () => {
    if (activeWrongWordIds.length === 0) return;
    
    const words = allWords.filter(w => activeWrongWordIds.includes(w.id));
    if (words.length === 0) return;
    
    const reviewUnit: Unit = {
      id: 'global-review',
      name: '错题重练',
      words: words,
      createdAt: Date.now(),
      wrongWordIds: []
    };
    
    setCurrentUnit(reviewUnit);
    setCurrentIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizFeedback(null);
    setQuizInput('');
    setWrongWordsInSession(new Set());
    setMode('review-wrong');
  };

  const handleSetLearningGoal = (wordIds: string[]) => {
    const goalWords = allWords.filter(w => wordIds.includes(w.id));
    if (goalWords.length === 0) return;
    
    const newGoal: Unit = {
      id: 'learning-goal-' + Date.now(),
      name: `学习目标 (${new Date().toLocaleDateString()})`,
      words: goalWords,
      createdAt: Date.now(),
      wrongWordIds: []
    };
    
    setLearningGoal(newGoal);
    setMode('list');
    setSelectedWordIds(new Set());
  };

  return (
    <div className="min-h-screen text-on-surface font-sans selection:bg-primary-container selection:text-on-primary-container">
      <Header mode={mode} onModeChange={setMode} />

      <main className="px-6 py-4 pb-32 max-w-5xl mx-auto space-y-8">
        <AnimatePresence mode="wait">
          {mode === 'list' && (
            <motion.div 
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Hero Progress Section - Compact & Minimal */}
              <section className="py-2 flex flex-col items-center justify-center text-center">
                <div className="flex items-center gap-3">
                  <span className="text-primary font-bold text-2xl tracking-tight">
                    {selectedWordIds.size > 0 
                      ? selectedWordIds.size 
                      : (learningGoal ? learningGoal.words.length : 0)} words
                  </span>
                  <span className="text-on-surface-variant text-sm font-medium">
                    {learningGoal ? "Ready for July's garden today" : "No learning goal set"}
                  </span>
                </div>
                <div className="mt-3 w-full max-w-xs bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-1/3 rounded-full opacity-30"></div>
                </div>
              </section>

              {/* Learning Grid (Bento Style) */}
              <div className="grid grid-cols-2 gap-4">
                {/* Study Card - Large (Full Width span) */}
                <div 
                  onClick={() => learningGoal ? startLearn(learningGoal) : setMode('vocabulary-book')}
                  className="col-span-2 bg-primary-container rounded-2xl p-6 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="space-y-1">
                    <h2 className="text-on-primary-container font-bold text-2xl">Study</h2>
                    <p className="text-on-primary-container/70 text-sm">Grow your vocabulary</p>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-2xl">
                    <span className="material-symbols-outlined text-primary text-4xl">menu_book</span>
                  </div>
                </div>

                {/* Fill-in-the-blanks */}
                <div 
                  onClick={() => learningGoal && startQuiz(learningGoal, 'exercise-fill')}
                  className={cn(
                    "bg-surface-container-lowest rounded-2xl p-5 flex flex-col items-start justify-between min-h-[140px] active:scale-[0.98] transition-all cursor-pointer border border-transparent hover:border-outline-variant/20",
                    !learningGoal && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="bg-tertiary-container/30 p-3 rounded-xl mb-4">
                    <span className="material-symbols-outlined text-tertiary text-2xl">edit_square</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">Blanks</h3>
                    <p className="text-on-surface-variant text-xs">Context practice</p>
                  </div>
                </div>

                {/* Translate */}
                <div 
                  onClick={() => learningGoal && startQuiz(learningGoal, 'exercise-translate')}
                  className={cn(
                    "bg-surface-container-lowest rounded-2xl p-5 flex flex-col items-start justify-between min-h-[140px] active:scale-[0.98] transition-all cursor-pointer border border-transparent hover:border-outline-variant/20",
                    !learningGoal && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="bg-primary-container/40 p-3 rounded-xl mb-4">
                    <span className="material-symbols-outlined text-primary text-2xl">translate</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">Translate</h3>
                    <p className="text-on-surface-variant text-xs">Across languages</p>
                  </div>
                </div>

                {/* Read Aloud */}
                <div 
                  onClick={() => learningGoal && startQuiz(learningGoal, 'record')}
                  className={cn(
                    "bg-surface-container-lowest rounded-2xl p-5 flex flex-col items-start justify-between min-h-[140px] active:scale-[0.98] transition-all cursor-pointer border border-transparent hover:border-outline-variant/20",
                    !learningGoal && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="bg-secondary-container p-3 rounded-xl mb-4">
                    <span className="material-symbols-outlined text-on-secondary-container text-2xl">record_voice_over</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">Read Aloud</h3>
                    <p className="text-on-surface-variant text-xs">Pronunciation</p>
                  </div>
                </div>

                {/* Dictation */}
                <div 
                  onClick={() => learningGoal && startQuiz(learningGoal, 'quiz-cn-en')}
                  className={cn(
                    "bg-surface-container-lowest rounded-2xl p-5 flex flex-col items-start justify-between min-h-[140px] active:scale-[0.98] transition-all cursor-pointer border border-transparent hover:border-outline-variant/20",
                    !learningGoal && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="bg-primary-container/30 p-3 rounded-xl mb-4">
                    <span className="material-symbols-outlined text-primary text-2xl">keyboard</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">Dictation</h3>
                    <p className="text-on-surface-variant text-xs">Listen and type</p>
                  </div>
                </div>

                {/* Review Mistakes - Moved to Bottom */}
                <div 
                  className="col-span-2 bg-error-container/5 rounded-2xl p-6 flex items-center justify-between border border-outline-variant/10 hover:border-error-container/30 transition-all"
                >
                  <div 
                    onClick={startGlobalReview}
                    className={cn(
                      "flex items-center gap-4 flex-1 cursor-pointer active:scale-[0.98] transition-all",
                      activeWrongWordIds.length === 0 && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="bg-error-container/20 p-4 rounded-2xl">
                      <span className="material-symbols-outlined text-error text-3xl">history_edu</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-on-error-container">Review Mistakes</h3>
                      <p className="text-on-error-container/70 text-sm">
                        {activeWrongWordIds.length} items to review
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMode('review-history')}
                    className="ml-4 p-4 bg-surface-container-highest rounded-2xl text-on-surface-variant hover:text-primary transition-all active:scale-90 flex flex-col items-center gap-1"
                  >
                    <span className="material-symbols-outlined">history</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
                  </button>
                </div>
              </div>

              {/* Weekly Summary Card */}
              <section className="bg-surface-container-low rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-on-surface">Weekly Goal</h3>
                  <span className="text-primary font-bold text-sm">75% Done</span>
                </div>
                <div className="flex justify-between gap-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-8 h-20 bg-surface-container rounded-full relative">
                        {i < 5 && (
                          <div 
                            className="absolute bottom-0 w-full bg-primary rounded-full" 
                            style={{ height: `${[80, 60, 90, 40, 20][i]}%` }}
                          ></div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-on-surface-variant">{day}</span>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {mode === 'add' && (
            <AddUnit 
              unitTitle={unitTitle}
              setUnitTitle={setUnitTitle}
              inputText={inputText}
              setInputText={setInputText}
              isSubmitting={isSubmitting}
              loadingMessage={loadingMessage}
              onSubmit={() => {
                const words = inputText.split(/[,\n]/).map(w => w.trim()).filter(w => w.length > 0);
                handleAddUnit(unitTitle || '新单元', words);
              }}
            />
          )}

          {mode === 'learn' && currentUnit && (
            <LearnMode 
              currentUnit={currentUnit}
              currentIndex={currentIndex}
              onNext={() => setCurrentIndex(i => Math.min(currentUnit.words.length - 1, i + 1))}
              onPrev={() => setCurrentIndex(i => Math.max(0, i - 1))}
              onSpeak={speak}
              onFinish={goToNextPhase}
            />
          )}

          {/* Quiz Modes */}
          {(mode.startsWith('quiz') || mode.startsWith('exercise') || mode === 'review-wrong' || mode === 'record' || mode === 'dictation-self') && currentUnit && (
            <QuizMode 
              currentUnit={currentUnit}
              currentIndex={currentIndex}
              quizMode={mode}
              userInput={quizInput}
              setUserInput={setQuizInput}
              isRecording={isRecording}
              isSubmitting={isSubmitting}
              isFinished={quizFinished}
              feedback={quizFeedback}
              onSpeak={speak}
              onPlayAudio={playAudio}
              onStartRecording={handleRecording}
              onStopRecording={stopRecording}
              onHandwritingRecognize={handleHandwritingRecognize}
              onSubmit={handleQuizSubmit}
              onSkip={handleSkip}
              onPrevious={handlePrevious}
              onFinish={goToNextPhase}
              onBack={() => {
                if (mode === 'dictation-self') setMode('vocabulary-book');
                else if (mode === 'review-wrong') setMode('review-history');
                else if (mode === 'record') setMode('list');
                else setMode('list');
              }}
            />
          )}

          {mode === 'vocabulary-book' && (
            <motion.div 
              key="vocabulary-book"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <VocabularyBook 
                units={units}
                selectedWordIds={selectedWordIds}
                onToggleWordSelection={toggleWordSelection}
                onSelectAll={() => {
                  const allIds = units.flatMap(u => u.words.map(w => w.id));
                  setSelectedWordIds(new Set(allIds));
                }}
                onClearSelection={() => setSelectedWordIds(new Set())}
                onStartDictation={startDictationFromBook}
                onStartLearn={startLearnFromBook}
                onSetLearningGoal={handleSetLearningGoal}
                onDeleteWords={handleDeleteWords}
                onAddUnit={() => setMode('add')}
                onSpeak={speak}
                onPlayAudio={playAudio}
                onRecording={handleRecording}
                onStopRecording={stopRecording}
                recordingWordId={recordingWordId}
                onBack={() => setMode('list')}
              />
            </motion.div>
          )}

          {mode === 'review-history' && (
            <motion.div 
              key="review-history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <ReviewHistory 
                sortedHistory={sortedHistory}
                onStartReview={(date, words) => {
                  setCurrentUnit({ id: `review-${date}`, name: `${date} 错题复习`, words, wrongWordIds: [] } as any);
                  setCurrentIndex(0);
                  setQuizScore(0);
                  setQuizInput('');
                  setQuizFeedback(null);
                  setQuizFinished(false);
                  setWrongWordsInSession(new Set());
                  setMode('review-wrong');
                }}
                onSpeak={speak}
                onPlayAudio={playAudio}
                onBack={() => setMode('list')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Custom Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => modal.type === 'alert' && setModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-2xl border border-outline-variant/30 max-w-sm w-full space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  modal.type === 'alert' ? "bg-primary-container text-primary" : "bg-error-container text-error"
                )}>
                  <span className="material-symbols-outlined text-3xl">
                    {modal.type === 'alert' ? 'info' : 'warning'}
                  </span>
                </div>
                <p className="text-lg font-bold text-on-surface leading-tight">
                  {modal.message}
                </p>
              </div>

              <div className="flex gap-3">
                {modal.type === 'confirm' && (
                  <button 
                    onClick={modal.onCancel}
                    className="flex-1 py-3.5 rounded-2xl font-bold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95"
                  >
                    取消
                  </button>
                )}
                <button 
                  onClick={modal.onConfirm || (() => setModal(null))}
                  className={cn(
                    "flex-1 py-3.5 rounded-2xl font-bold transition-all active:scale-95 shadow-lg",
                    modal.type === 'alert' ? "bg-primary text-on-primary shadow-primary/20" : "bg-error text-on-error shadow-error/20"
                  )}
                >
                  {modal.type === 'alert' ? '知道了' : '确定删除'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-50 rounded-t-[1.5rem] bg-background dark:bg-[#1a1c18] shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
        <div className="bg-surface-container dark:bg-[#2d2f2a] h-[2px] w-full"></div>
        <div className="flex justify-around items-center px-4 pb-6 pt-2">
          {/* Active Tab: Learn */}
          <button 
            onClick={() => setMode('list')}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl px-5 py-2 active:scale-90 duration-150 transition-all",
              mode === 'list' ? "bg-surface-container text-primary" : "text-outline"
            )}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: mode === 'list' ? "'FILL' 1" : "'FILL' 0" }}>menu_book</span>
            <span className="font-lexend font-medium text-xs">Learn</span>
          </button>
          <button 
            onClick={() => setMode('vocabulary-book')}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl px-5 py-2 active:scale-90 duration-150 transition-all",
              mode === 'vocabulary-book' ? "bg-surface-container text-primary" : "text-outline"
            )}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: mode === 'vocabulary-book' ? "'FILL' 1" : "'FILL' 0" }}>edit_note</span>
            <span className="font-lexend font-medium text-xs">Review</span>
          </button>
          <button 
            className="flex flex-col items-center justify-center text-outline px-5 py-2 hover:text-primary transition-all active:scale-90 duration-150"
          >
            <span className="material-symbols-outlined">auto_graph</span>
            <span className="font-lexend font-medium text-xs">Progress</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
