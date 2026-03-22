import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface HandwritingCanvasProps {
  onRecognize: (base64Image: string) => void;
  isProcessing: boolean;
  currentIndex: number;
  disabled?: boolean;
}

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({ onRecognize, isProcessing, currentIndex, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear canvas when currentIndex changes
  useEffect(() => {
    clearCanvas();
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [currentIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1d1b20'; // on-surface color
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 350;
        // Re-set styles after resize
        ctx.strokeStyle = '#1d1b20';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isProcessing || disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isProcessing || disabled) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Auto-recognize after 1.5s of inactivity
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleRecognize();
    }, 1500);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleRecognize = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Scale down image even more for maximum speed
      const maxDim = 600;
      let width = canvas.width;
      let height = canvas.height;
      
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = width * ratio;
        height = height * ratio;
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0, width, height);
        // Use even lower quality jpeg for even smaller payload
        const base64Image = tempCanvas.toDataURL('image/jpeg', 0.3);
        onRecognize(base64Image);
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="relative bg-surface-container-lowest border-2 border-dashed border-outline-variant/50 rounded-3xl overflow-hidden h-[350px] cursor-crosshair shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full touch-none"
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-surface-container-lowest/80 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Recognizing...</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <button
          onClick={clearCanvas}
          disabled={isProcessing || disabled}
          className="px-8 py-3 bg-surface-container text-on-surface-variant rounded-full font-bold hover:bg-surface-container-high transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          <span>Clear Canvas</span>
        </button>
      </div>
    </div>
  );
};
