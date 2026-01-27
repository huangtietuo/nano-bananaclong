'use client'

import React, { useState } from 'react';
import { ImageUploader } from "@/components/retrorestore/ImageUploader";
import { ComparisonView } from "@/components/retrorestore/ComparisonView";
import { Toggle } from "@/components/retrorestore/Toggle";
import { Button } from "@/components/retrorestore/Button";
import { restoreImage } from "@/lib/retrorestore/geminiService";
import { AppState, ImageFile, RestorationConfig } from "@/components/retrorestore/types";

export function RetroRestoreClient() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [restoredImageUrl, setRestoredImageUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [config, setConfig] = useState<RestorationConfig>({
    colorize: true,
    sharpen: true,
    denoise: true,
    promptEnhancement: ""
  });

  const handleImageSelected = (image: ImageFile) => {
    setOriginalImage(image);
    setAppState(AppState.UPLOADING);
  };

  const handleRestore = async () => {
    if (!originalImage) return;

    setAppState(AppState.PROCESSING);
    setErrorMsg(null);

    try {
      const resultUrl = await restoreImage(
        originalImage.base64,
        originalImage.mimeType,
        config
      );
      setRestoredImageUrl(resultUrl);
      setAppState(AppState.COMPLETE);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong during restoration.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setRestoredImageUrl(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
  };

  return (
    <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
      
      {/* State: IDLE - Upload Area */}
      {appState === AppState.IDLE && (
        <div className="max-w-2xl mx-auto mt-12 animate-fade-in">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4">Restore your memories</h2>
            <p className="text-lg text-muted-foreground">
              Bring old, blurry, or black & white photos back to life with advanced AI.
            </p>
          </div>
          <ImageUploader onImageSelected={handleImageSelected} />
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {
              [
                { title: 'De-noise', desc: 'Remove film grain and scratches', icon: '✨' },
                { title: 'Colorize', desc: 'Add realistic colors to B&W photos', icon: '🎨' },
                { title: 'Sharpen', desc: 'Enhance details and resolution', icon: '👁️' },
              ].map((feature, i) => (
                <div key={i} className="bg-card p-6 rounded-xl border shadow-sm">
                  <div className="text-2xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* State: UPLOADING/PROCESSING/COMPLETE/ERROR - Workspace */}
      {appState !== AppState.IDLE && originalImage && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
          
          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card rounded-xl p-6 border shadow-lg sticky top-24">
              <h3 className="font-semibold mb-4 border-b border-border pb-2">Restoration Settings</h3>
              
              <div className="space-y-1">
                <Toggle 
                  label="Colorize" 
                  description="Convert B&W to Color"
                  checked={config.colorize} 
                  onChange={(v) => setConfig({...config, colorize: v})} 
                />
                <Toggle 
                  label="Sharpen Details" 
                  description="Enhance blurred edges"
                  checked={config.sharpen} 
                  onChange={(v) => setConfig({...config, sharpen: v})} 
                />
                <Toggle 
                  label="Remove Noise" 
                  description="Smooth out film grain"
                  checked={config.denoise} 
                  onChange={(v) => setConfig({...config, denoise: v})} 
                />
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                 <label className="block text-sm font-medium text-muted-foreground mb-2">
                   Additional Instructions (Optional)
                 </label>
                 <textarea
                   className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                   rows={3}
                   placeholder="e.g., 'Make the sky brighter' or 'Fix the tear in the corner'"
                   value={config.promptEnhancement}
                   onChange={(e) => setConfig({...config, promptEnhancement: e.target.value})}
                 />
              </div>

              <div className="mt-6 space-y-3">
                <Button 
                  className="w-full" 
                  onClick={handleRestore}
                  isLoading={appState === AppState.PROCESSING}
                  disabled={appState === AppState.PROCESSING}
                >
                  {appState === AppState.COMPLETE ? 'Regenerate' : 'Restore Photo'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={handleReset}
                  disabled={appState === AppState.PROCESSING}
                >
                  Upload New Photo
                </Button>
              </div>
            </div>
          </div>

          {/* Main Viewing Area */}
          <div className="lg:col-span-3 min-h-[500px]">
            {appState === AppState.UPLOADING && (
              <div className="bg-card rounded-xl border p-4 h-full flex flex-col items-center justify-center">
                 <img src={originalImage.previewUrl} alt="Preview" className="max-h-[60vh] object-contain rounded shadow-lg" />
                 <p className="mt-4 text-muted-foreground">Ready to restore. Configure settings and click "Restore Photo".</p>
              </div>
            )}

            {appState === AppState.PROCESSING && (
              <div className="bg-card rounded-xl border p-8 h-full flex flex-col items-center justify-center relative overflow-hidden">
                 {/* Background Pulse */}
                 <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                 
                 <div className="relative z-10 text-center">
                   <div className="inline-block w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                   <h3 className="text-2xl font-semibold mb-2">Restoring Image...</h3>
                   <p className="text-muted-foreground max-w-md mx-auto">
                     Gemini is analyzing the photo structure, reducing noise, and applying enhancements. This may take a few seconds.
                   </p>
                 </div>
              </div>
            )}

            {appState === AppState.ERROR && (
              <div className="bg-card rounded-xl border border-destructive/50 p-8 h-full flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 bg-destructive/30 rounded-full flex items-center justify-center mb-4">
                   <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                 </div>
                 <h3 className="text-xl font-semibold mb-2">Restoration Failed</h3>
                 <p className="text-muted-foreground mb-6">{errorMsg}</p>
                 <Button onClick={() => setAppState(AppState.UPLOADING)}>
                   Try Again
                 </Button>
              </div>
            )}

            {appState === AppState.COMPLETE && restoredImageUrl && (
              <div className="h-full">
                <ComparisonView 
                  originalUrl={originalImage.previewUrl} 
                  restoredUrl={restoredImageUrl} 
                />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}