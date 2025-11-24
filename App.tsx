
import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PreviewArea } from './components/PreviewArea';
import { PlaneArtArea } from './components/PlaneArtArea';
import { StencilSettings, DEFAULT_SETTINGS } from './types';
import { processStencil } from './utils/imageProcessing';
import { generateImageEdit, cleanImageWithAI, generatePlaneArt, generateStencilAI } from './utils/gemini';
import { Download, Wand2, X, Sparkles, ArrowLeft, ArrowRight, Check, Star, Printer } from 'lucide-react';

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'stencil' | 'planeart'>('stencil');

  // Stencil State
  const [settings, setSettings] = useState<StencilSettings>(DEFAULT_SETTINGS);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // AI State (General)
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  // Layout State
  const [isMobile, setIsMobile] = useState(false);
  
  // Pro Stencil Modal State
  const [showProModal, setShowProModal] = useState(false);
  const [proStencilImage, setProStencilImage] = useState<string | null>(null);
  const [preProStencilImage, setPreProStencilImage] = useState<string | null>(null);
  const [proSliderPos, setProSliderPos] = useState(50);

  // Image to Stencil AI Modal State
  const [showImageToStencilModal, setShowImageToStencilModal] = useState(false);
  const [imageToStencilResult, setImageToStencilResult] = useState<string | null>(null);

  // PlaneArt State
  const [planeArtResult, setPlaneArtResult] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use a ref to debounce processing
  const processingTimeoutRef = useRef<number | null>(null);

  // Handle Resize for Mobile Detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateSetting = (key: keyof StencilSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    if (activeTab === 'stencil') {
        setSettings(prev => ({ ...DEFAULT_SETTINGS, mode: prev.mode, lineColor: prev.lineColor }));
    } else {
        setPlaneArtResult(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setImageLoaded(true);
        // Reset settings slightly on new image but keep mode preferred
        setSettings(prev => ({ ...DEFAULT_SETTINGS, mode: prev.mode, lineColor: prev.lineColor }));
        setPlaneArtResult(null); // Clear previous PlaneArt result
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // --- AI HANDLERS ---

  // Helper to extract current original image as Base64 for AI processing
  const getOriginalImageBase64 = (): string | null => {
    if (!originalImage) return null;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalImage.width;
    tempCanvas.height = originalImage.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(originalImage, 0, 0);
    return tempCanvas.toDataURL('image/png');
  };

  const handleAiEdit = async (prompt: string) => {
    const base64 = getOriginalImageBase64();
    if (!base64) return;

    setIsAiProcessing(true);
    try {
      const newImageBase64 = await generateImageEdit(base64, prompt);
      
      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        setIsAiProcessing(false);
      };
      img.src = newImageBase64;
    } catch (error) {
      console.error("AI Edit Failed", error);
      alert("AI Processing Failed. Please try again.");
      setIsAiProcessing(false);
    }
  };

  const handleProStencilRequest = async () => {
    if (!canvasRef.current) return;
    
    setIsAiProcessing(true);
    try {
      // 1. Snapshot the current canvas (User's manual settings)
      const currentStencilBase64 = canvasRef.current.toDataURL('image/png');
      setPreProStencilImage(currentStencilBase64);

      // 2. Generate AI Cleaned version
      const newImageBase64 = await cleanImageWithAI(currentStencilBase64);
      setProStencilImage(newImageBase64);
      
      // 3. Open Modal
      setIsAiProcessing(false);
      setShowProModal(true);
      setProSliderPos(50);
      
    } catch (error) {
      console.error("Pro Stencil Generation Failed", error);
      alert("AI Processing Failed. Please try again.");
      setIsAiProcessing(false);
    }
  };

  // --- NEW: Image to Stencil AI Handler ---
  const handleImageToStencilRequest = async () => {
      const base64 = getOriginalImageBase64();
      if (!base64) return;

      setIsAiProcessing(true);
      try {
          const result = await generateStencilAI(base64);
          setImageToStencilResult(result);
          setIsAiProcessing(false);
          setShowImageToStencilModal(true);
      } catch (error) {
          console.error("Image to Stencil AI Failed", error);
          alert("Failed to generate Stencil AI.");
          setIsAiProcessing(false);
      }
  };

  const applyImageToStencilToWorkspace = () => {
      if (!imageToStencilResult) return;
      const img = new Image();
      img.onload = () => {
          setOriginalImage(img);
          setSettings(prev => ({ 
            ...DEFAULT_SETTINGS, 
            mode: 'threshold', // Clean lines
            detail: 50,
            smoothing: 0,
            lineColor: prev.lineColor 
          }));
          setShowImageToStencilModal(false);
      };
      img.src = imageToStencilResult;
  };

  const handleImageToStencilDownload = (format: 'png' | 'jpg') => {
      if (!imageToStencilResult) return;
      
      const link = document.createElement('a');
      link.download = `stencil-ai-${Date.now()}.${format}`;
      
      if (format === 'jpg') {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0);
                  link.href = canvas.toDataURL('image/jpeg', 0.9);
                  link.click();
              }
          };
          img.src = imageToStencilResult;
      } else {
          link.href = imageToStencilResult;
          link.click();
      }
  };


  // --- PLANEART HANDLERS ---
  const handleGeneratePlaneArt = async () => {
      const base64 = getOriginalImageBase64();
      if (!base64) return;

      setIsAiProcessing(true);
      try {
          const result = await generatePlaneArt(base64);
          setPlaneArtResult(result);
          setIsAiProcessing(false);
      } catch (error) {
          console.error("PlaneArt Failed", error);
          alert("Failed to generate PlaneArt.");
          setIsAiProcessing(false);
      }
  };

  const handlePlaneArtDownload = (format: 'png' | 'jpg') => {
      if (!planeArtResult) return;
      
      const link = document.createElement('a');
      link.download = `planeart-${Date.now()}.${format}`;
      
      if (format === 'jpg') {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0);
                  link.href = canvas.toDataURL('image/jpeg', 0.9);
                  link.click();
              }
          };
          img.src = planeArtResult;
      } else {
          link.href = planeArtResult;
          link.click();
      }
  };

  const handlePlaneArtToStencil = () => {
    if (!planeArtResult) return;

    const img = new Image();
    img.onload = () => {
        setOriginalImage(img);
        setImageLoaded(true);
        setActiveTab('stencil');
        setSettings(prev => ({ 
            ...DEFAULT_SETTINGS, 
            mode: 'threshold', 
            detail: 50,
            smoothing: 0,
            lineColor: prev.lineColor 
        }));
    };
    img.src = planeArtResult;
  };

  // Main Processing Effect (Only for Stencil Mode)
  useEffect(() => {
    if (!originalImage || !canvasRef.current || activeTab !== 'stencil') return;

    if (processingTimeoutRef.current) {
      window.clearTimeout(processingTimeoutRef.current);
    }

    setIsProcessing(true);

    processingTimeoutRef.current = window.setTimeout(() => {
        if (!canvasRef.current) return;
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const MAX_DIM = 2048; 
      let width = originalImage.width;
      let height = originalImage.height;

      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(originalImage, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      setTimeout(() => {
        const processed = processStencil(imageData, settings);
        ctx.putImageData(processed, 0, 0);
        setIsProcessing(false);
      }, 10);

    }, 30); 

  }, [originalImage, settings, activeTab, isMobile]);

  const executeDownload = () => {
    if (!canvasRef.current || !imageLoaded) return;
    downloadImageFromCanvas(canvasRef.current);
  };

  const executeProDownload = () => {
    if (!proStencilImage) return;

    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0);
            downloadImageFromCanvas(canvas, "pro-stencil");
        }
    };
    img.src = proStencilImage;
  };

  const downloadImageFromCanvas = (sourceCanvas: HTMLCanvasElement, prefix = "stencil-pro") => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = sourceCanvas.width;
      tempCanvas.height = sourceCanvas.height;
      const ctx = tempCanvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(sourceCanvas, 0, 0);
        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r > 250 && g > 250 && b > 250) {
            data[i + 3] = 0; 
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const link = document.createElement('a');
        link.download = `${prefix}-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
      }
  };

  const applyProToWorkspace = () => {
      if (!proStencilImage) return;
      const img = new Image();
      img.onload = () => {
          setOriginalImage(img);
          setSettings(prev => ({ 
            ...DEFAULT_SETTINGS, 
            mode: 'threshold',
            detail: 50,
            smoothing: 0,
            lineColor: prev.lineColor 
          }));
          setShowProModal(false);
      };
      img.src = proStencilImage;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-slate-950 overflow-hidden font-sans text-slate-100">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/png, image/jpeg, image/jpg, image/webp" 
        className="hidden" 
      />

      <Sidebar 
        settings={settings} 
        updateSetting={updateSetting} 
        onReset={handleReset}
        onDownload={executeDownload} 
        onUploadClick={handleUploadClick}
        isProcessing={isProcessing}
        onAiEdit={handleAiEdit}
        onProStencil={handleProStencilRequest}
        onImageToStencil={handleImageToStencilRequest}
        isAiProcessing={isAiProcessing}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        // Inject Preview Here on Mobile
        mobileContent={
          (isMobile && activeTab === 'stencil') ? (
            <PreviewArea 
              canvasRef={canvasRef} 
              imageLoaded={imageLoaded} 
              originalImage={originalImage}
              settings={settings}
            />
          ) : undefined
        }
      />

      {/* Render Main View for Desktop OR for PlaneArt Mode */}
      {(!isMobile || activeTab === 'planeart') && (
        <main className="flex-1 flex flex-col h-full relative">
          
          {activeTab === 'stencil' ? (
              <PreviewArea 
                canvasRef={canvasRef} 
                imageLoaded={imageLoaded} 
                originalImage={originalImage}
                settings={settings}
              />
          ) : (
              <PlaneArtArea 
                originalImage={originalImage}
                resultImage={planeArtResult}
                isProcessing={isAiProcessing}
                onGenerate={handleGeneratePlaneArt}
                onDownload={handlePlaneArtDownload}
                onImportToStencil={handlePlaneArtToStencil}
              />
          )}

          {/* Pro Stencil Modal */}
          {showProModal && proStencilImage && preProStencilImage && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
                  
                  {/* Modal Header */}
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                              <Star className="w-5 h-5 text-white fill-white" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-white">Pro Stencil Result</h3>
                              <p className="text-xs text-slate-400">Compare AI Cleaned version with your previous draft</p>
                          </div>
                      </div>
                      <button 
                          onClick={() => setShowProModal(false)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                          <X className="w-6 h-6 text-slate-400" />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden p-4 group">
                      <div className="relative shadow-2xl max-h-full max-w-full aspect-auto">
                          
                          <img 
                              src={preProStencilImage} 
                              alt="Previous Draft"
                              className="max-h-[70vh] object-contain pointer-events-none select-none"
                          />
                          
                          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded text-xs font-bold text-slate-300 border border-white/10">
                              Original Draft
                          </div>

                          <div 
                              className="absolute inset-0"
                              style={{ 
                                  clipPath: `inset(0 0 0 ${proSliderPos}%)` 
                              }}
                          >
                              <img 
                                  src={proStencilImage} 
                                  alt="Pro AI Result"
                                  className="w-full h-full object-contain pointer-events-none select-none"
                              />
                              <div className="absolute top-4 right-4 bg-purple-600/80 backdrop-blur px-3 py-1 rounded text-xs font-bold text-white border border-white/10 shadow-lg">
                                  Pro Stencil (AI)
                              </div>
                          </div>

                          <div 
                              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:bg-purple-400 transition-colors"
                              style={{ left: `${proSliderPos}%` }}
                          >
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl cursor-ew-resize">
                                  <ArrowLeft className="w-3 h-3 text-slate-900" />
                                  <ArrowRight className="w-3 h-3 text-slate-900" />
                              </div>
                          </div>

                          <input 
                              type="range"
                              min="0"
                              max="100"
                              value={proSliderPos}
                              onChange={(e) => setProSliderPos(parseFloat(e.target.value))}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                          />
                      </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-5 border-t border-slate-700 bg-slate-800 flex justify-between items-center gap-4">
                      <button 
                          onClick={applyProToWorkspace}
                          className="px-6 py-3 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-500 font-medium transition-all flex items-center gap-2"
                      >
                          <Check className="w-4 h-4" />
                          Load into Workspace
                      </button>
                      
                      <button 
                          onClick={executeProDownload}
                          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                          <Download className="w-5 h-5" />
                          Download Pro Stencil
                      </button>
                  </div>

              </div>
            </div>
          )}

          {/* NEW: Image to Stencil AI Result Modal */}
          {showImageToStencilModal && imageToStencilResult && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
               <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
                  
                  {/* Header */}
                   <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                              <Printer className="w-5 h-5 text-white" />
                          </div>
                          <div>
                              <h3 className="text-lg font-bold text-white">Stencil AI Result</h3>
                              <p className="text-xs text-slate-400">Professional Lineart + Shading Guides</p>
                          </div>
                      </div>
                      <button 
                          onClick={() => setShowImageToStencilModal(false)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                          <X className="w-6 h-6 text-slate-400" />
                      </button>
                  </div>

                  {/* Image Display */}
                  <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed flex items-center justify-center p-8 overflow-hidden">
                       <img 
                          src={imageToStencilResult} 
                          alt="AI Stencil Result"
                          className="max-h-full max-w-full object-contain shadow-2xl bg-white"
                       />
                  </div>

                  {/* Footer Actions */}
                  <div className="p-5 border-t border-slate-700 bg-slate-800 flex justify-between items-center gap-4 flex-wrap">
                      <button 
                          onClick={applyImageToStencilToWorkspace}
                          className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium flex items-center gap-2"
                      >
                          <Check className="w-4 h-4" />
                          Edit in Workspace
                      </button>

                      <div className="flex gap-2">
                         <button 
                            onClick={() => handleImageToStencilDownload('jpg')}
                            className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 font-bold"
                         >
                            Download JPG
                         </button>
                         <button 
                            onClick={() => handleImageToStencilDownload('png')}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-2"
                         >
                            <Download className="w-5 h-5" />
                            Download PNG
                         </button>
                      </div>
                  </div>
               </div>
            </div>
          )}

        </main>
      )}
    </div>
  );
};

export default App;
