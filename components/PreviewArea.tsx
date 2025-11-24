
import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, Move, ArrowLeft, ArrowRight } from 'lucide-react';
import { StencilSettings } from '../types';

interface PreviewAreaProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imageLoaded: boolean;
  originalImage: HTMLImageElement | null;
  settings?: StencilSettings;
}

export const PreviewArea: React.FC<PreviewAreaProps> = ({ canvasRef, imageLoaded, originalImage, settings }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Pan & Drag States
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Slider State (0-100)
  const [sliderPos, setSliderPos] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  // --- Image Panning Logic ---
  const onMouseDownPan = (e: React.MouseEvent) => {
    // Only pan if we aren't clicking the slider handle
    if (!imageLoaded || isResizing) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const onMouseUp = () => {
    setIsPanning(false);
    setIsResizing(false);
  };

  // --- Touch Logic for Mobile ---
  const onTouchStart = (e: React.TouchEvent) => {
    if (!imageLoaded || isResizing) return;
    if (e.touches.length === 1) {
       setIsPanning(true);
       setPanStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    // IMPORTANT: Allow default scroll if not zoomed
    if (scale <= 1) {
        setIsPanning(false); // Cancel pan if we zoom out while dragging
        return; 
    }

    if (isPanning && e.touches.length === 1) {
      e.preventDefault(); // Block page scroll ONLY if zoomed and panning
      setPosition({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y
      });
    }
  };

  const onTouchEnd = () => {
    setIsPanning(false);
  };


  // --- Slider Dragging Logic ---
  const startResizing = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation(); // Don't trigger pan
    setIsResizing(true);
  };

  // Global mouse handlers for smooth slider dragging
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (isResizing && containerRef.current && wrapperRef.current && originalImage) {
        
        // We calculate slider based on the centered Image Wrapper dimensions
        const imgDiv = wrapperRef.current.firstElementChild as HTMLElement;
        if(imgDiv) {
            const imgRect = imgDiv.getBoundingClientRect();
            let clientX = 0;
            
            if (e instanceof MouseEvent) {
                clientX = e.clientX;
            } else if (e instanceof TouchEvent && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
            }

            const x = clientX - imgRect.left;
            const percent = Math.max(0, Math.min(100, (x / imgRect.width) * 100));
            setSliderPos(percent);
        }
      }
    };

    const handleGlobalUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalUp);
      window.addEventListener('touchmove', handleGlobalMove, { passive: false });
      window.addEventListener('touchend', handleGlobalUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isResizing, originalImage]);


  // Center image on load
  useEffect(() => {
    if (imageLoaded) {
      setScale(0.8);
      setPosition({ x: 0, y: 0 });
      setSliderPos(50);
    }
  }, [imageLoaded]);

  // View Mode Helpers
  const isOverlayMode = settings?.overlayMode || false;
  const overlayOpacity = settings?.overlayOpacity ?? 50;

  return (
    <div 
      ref={containerRef}
      className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col h-full select-none"
      onMouseDown={onMouseDownPan}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={(e) => handleZoom(e.deltaY > 0 ? -0.1 : 0.1)}
    >
      
      {/* Zoom Controls */}
      <div 
        className="absolute top-4 right-4 z-30 flex flex-col gap-2 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl p-1.5"
        onMouseDown={(e) => e.stopPropagation()} 
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button onClick={() => handleZoom(0.1)} className="p-2 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition-colors" title="Zoom In">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button onClick={() => setScale(1)} className="p-2 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white text-xs font-bold font-mono transition-colors" title="Reset Zoom">
          100%
        </button>
        <button onClick={() => handleZoom(-0.1)} className="p-2 hover:bg-slate-700 rounded-md text-slate-300 hover:text-white transition-colors" title="Zoom Out">
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-600 pointer-events-none">
           <div className="text-center">
             <Move className="w-16 h-16 mx-auto mb-4 opacity-30" />
             <p className="text-lg font-medium">Import an image to start</p>
             <p className="text-sm opacity-60 mt-1">Supports JPG, PNG, WEBP</p>
           </div>
        </div>
      )}

      {/* Main Content */}
      <div 
        ref={wrapperRef}
        className="flex-1 flex items-center justify-center w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div 
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isPanning || isResizing ? 'none' : 'transform 0.1s ease-out',
            width: originalImage ? originalImage.width : 0,
            height: originalImage ? originalImage.height : 0,
            position: 'relative',
            touchAction: scale > 1 ? 'none' : 'auto' // CSS Help
          }}
          className={`shadow-2xl origin-center ${imageLoaded ? 'bg-white' : ''}`}
        >
           {imageLoaded && (
            <>
              {/* Layer 1: Original Image (Bottom Layer) */}
              <img 
                src={originalImage?.src} 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-200" 
                style={{ 
                   opacity: isOverlayMode ? (overlayOpacity / 100) : 1,
                   // If not in overlay mode, it sits behind, but the canvas is clipped, so this shows on the LEFT.
                   // In overlay mode, it sits behind, and canvas sits on top with Multiply.
                }}
                alt="original"
              />

              {/* Layer 2: Stencil Canvas (Top Layer) */}
              <div 
                style={{ 
                   position: 'absolute',
                   inset: 0,
                   // Logic: 
                   // If Overlay Mode: No clip path, Mix Blend Mode Multiply.
                   // If Split Mode: Clip Path handles visibility, Normal Blend.
                   clipPath: isOverlayMode ? 'none' : `inset(0 0 0 ${sliderPos}%)`,
                   mixBlendMode: isOverlayMode ? 'multiply' : 'normal',
                   zIndex: 10
                }}
              >
                 <canvas 
                    ref={canvasRef} 
                    className="block w-full h-full" 
                 />
              </div>

              {/* The Slider Handle & Line - ONLY IN SPLIT MODE */}
              {!isOverlayMode && (
                <div 
                   style={{ left: `${sliderPos}%` }}
                   className="absolute top-0 bottom-0 w-0.5 bg-white z-20 cursor-ew-resize hover:bg-indigo-400 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                   onMouseDown={startResizing}
                   onTouchStart={startResizing}
                >
                    {/* Arrows Handle */}
                   <div 
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center border border-slate-200 text-slate-800 hover:scale-110 transition-transform"
                   >
                      <ArrowLeft className="w-3 h-3" />
                      <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
                      <ArrowRight className="w-3 h-3" />
                   </div>
                </div>
              )}
            </>
           )}
        </div>
      </div>
    </div>
  );
};
