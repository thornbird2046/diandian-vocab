import React from 'react';

export const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span className="font-mono">
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="text-primary font-bold underline decoration-2 underline-offset-4 decoration-primary/30">{part}</span>
        ) : part
      )}
    </span>
  );
};

export const ColoredPhonics = ({ phonics }: { phonics: string }) => {
  const colors = [
    'text-primary', 
    'text-secondary', 
    'text-tertiary', 
    'text-error', 
    'text-primary-fixed',
    'text-secondary-fixed'
  ];
  const parts = phonics.split('-');
  return (
    <div className="flex items-center gap-1 font-mono text-2xl tracking-widest font-bold">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span className={colors[i % colors.length]}>{part}</span>
          {i < parts.length - 1 && <span className="text-outline-variant opacity-50">•</span>}
        </React.Fragment>
      ))}
    </div>
  );
};
