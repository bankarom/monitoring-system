import React, { useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Clock, AppWindow, User } from 'lucide-react';

interface ScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  timestamp: string;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  timestamp,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext && hasNext) onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onPrev, onNext, hasPrev, hasNext, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `screenshot-${new Date(timestamp).getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
              <User className="w-4 h-4 text-sky-400" />
              <span>{title}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{new Date(timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center p-4 min-h-[400px] overflow-auto">
          {hasPrev && onPrev && (
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-white flex items-center justify-center backdrop-blur transition-transform hover:scale-110 z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <img
            src={imageUrl}
            alt={title}
            className="max-h-[75vh] w-auto object-contain rounded-lg border border-slate-800 shadow-2xl"
          />

          {hasNext && onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-white flex items-center justify-center backdrop-blur transition-transform hover:scale-110 z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};