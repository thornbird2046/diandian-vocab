import React from 'react';
import { Plus, BookOpen, Star, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface HeaderProps {
  mode: string;
  onModeChange: (mode: any) => void;
}

export function Header({ mode, onModeChange }: HeaderProps) {
  return (
    <header className="max-w-2xl mx-auto px-6 py-10 flex items-center justify-between">
      <div className="flex items-center gap-4 cursor-pointer group" onClick={() => onModeChange('list')}>
        <div className="w-12 h-12 bg-primary text-on-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
          <span className="material-symbols-outlined text-3xl">park</span>
        </div>
        <div>
          <h1 className="text-2xl font-lexend font-bold tracking-tight text-on-surface">July's Word Garden</h1>
          <p className="text-[10px] text-outline font-bold uppercase tracking-[0.2em]">Cultivate your vocab</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {mode === 'list' ? (
          <>
            <button 
              onClick={() => onModeChange('vocabulary-book')}
              className="w-12 h-12 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm hover:shadow-md hover:bg-surface-container transition-all active:scale-95 text-on-surface-variant"
              title="Vocabulary Book"
            >
              <span className="material-symbols-outlined">menu_book</span>
            </button>
            <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined">account_circle</span>
            </div>
          </>
        ) : (
          <button 
            onClick={() => onModeChange('list')}
            className="w-12 h-12 flex items-center justify-center bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm hover:shadow-md hover:bg-surface-container transition-all active:scale-95 text-on-surface-variant"
            title="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>
    </header>
  );
}
