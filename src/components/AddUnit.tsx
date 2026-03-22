import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface AddUnitProps {
  unitTitle: string;
  setUnitTitle: (val: string) => void;
  inputText: string;
  setInputText: (val: string) => void;
  isSubmitting: boolean;
  loadingMessage: string;
  onSubmit: () => void;
}

export function AddUnit({ 
  unitTitle, 
  setUnitTitle, 
  inputText, 
  setInputText, 
  isSubmitting, 
  loadingMessage, 
  onSubmit 
}: AddUnitProps) {
  return (
    <motion.div 
      key="add"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/30 shadow-2xl shadow-primary/5"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-primary-container p-3 rounded-2xl">
          <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
        </div>
        <div>
          <h2 className="text-2xl font-lexend font-bold text-on-surface tracking-tight">Plant New Words</h2>
          <p className="text-on-surface-variant text-sm">Grow July's garden with AI</p>
        </div>
      </div>
      
      <div className="space-y-6 mb-8">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Unit Name (Optional)</label>
          <input 
            type="text"
            value={unitTitle}
            onChange={(e) => setUnitTitle(e.target.value)}
            placeholder="e.g. Lesson 1, Final Review..."
            className="w-full p-5 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 transition-all outline-none text-on-surface placeholder:text-outline/50"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-bold text-outline uppercase tracking-widest ml-1">Word List</label>
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. apple, banana, cat, dog... (Separate by comma or newline)"
            className="w-full h-48 p-5 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 transition-all resize-none outline-none text-on-surface placeholder:text-outline/50"
          />
          <p className="text-[10px] text-outline/70 ml-1">Tip: Add 5-10 words at a time for best results.</p>
        </div>
      </div>

      <button 
        onClick={onSubmit}
        disabled={isSubmitting || !inputText.trim()}
        className="w-full bg-primary text-on-primary py-5 rounded-2xl font-bold shadow-xl shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-3 group active:scale-95"
      >
        {isSubmitting ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-3 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              <span className="text-lg">{loadingMessage}</span>
            </div>
            <span className="text-[10px] opacity-70 font-normal">AI is working hard, please wait...</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">sparkles</span>
            <span className="text-lg">Generate Unit</span>
          </div>
        )}
      </button>
    </motion.div>
  );
}
