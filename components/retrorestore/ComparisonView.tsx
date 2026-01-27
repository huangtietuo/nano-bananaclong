'use client'

import React, { useState } from 'react';

interface ComparisonViewProps {
  originalUrl: string;
  restoredUrl: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ originalUrl, restoredUrl }) => {
  const [activeTab, setActiveTab] = useState<'original' | 'restored' | 'split'>('split');
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex justify-center space-x-1 mb-4 bg-slate-800 p-1 rounded-lg self-center">
        <button
          onClick={() => setActiveTab('original')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'original' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Original
        </button>
        <button
          onClick={() => setActiveTab('split')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'split' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Split View
        </button>
        <button
          onClick={() => setActiveTab('restored')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'restored' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          Restored
        </button>
      </div>

      {/* Viewer */}
      <div className="relative flex-grow min-h-[400px] w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
        {activeTab === 'original' && (
           <img src={originalUrl} alt="Original" className="w-full h-full object-contain" />
        )}
        
        {activeTab === 'restored' && (
           <img src={restoredUrl} alt="Restored" className="w-full h-full object-contain" />
        )}

        {activeTab === 'split' && (
          <div className="relative w-full h-full group select-none">
            {/* Background Image (Restored - Right side logically) */}
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${restoredUrl})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
            />

            {/* Foreground Image (Original - Clipped) */}
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat border-r-2 border-white shadow-[2px_0_10px_rgba(0,0,0,0.5)]"
              style={{ 
                backgroundImage: `url(${originalUrl})`, 
                width: `${sliderPosition}%`,
                backgroundSize: 'contain', 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'center' 
              }}
            />

            {/* Slider Handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-transparent cursor-ew-resize flex items-center justify-center hover:bg-primary/20 transition-colors"
              style={{ left: `calc(${sliderPosition}% - 2px)` }}
            >
              <div className="w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center transform -translate-x-[1px]">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
                </svg>
              </div>
            </div>

            {/* Hidden Range Input for Accessibility & Touch */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
              aria-label="Comparison slider"
            />
            
            <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">Original</div>
            <div className="absolute top-4 right-4 bg-primary/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">Restored</div>
          </div>
        )}
      </div>
      
      {/* Download Action */}
      <div className="mt-4 flex justify-end">
        <a 
          href={restoredUrl} 
          download="restored-photo.png"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Result
        </a>
      </div>
    </div>
  );
};