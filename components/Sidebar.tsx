
import React, { useState } from 'react';
import { Settings, Sliders, Layers, Zap, Image as ImageIcon, RotateCcw, Download, Palette, Wand2, Sparkles, Send, Loader2, Star, ScanLine, PenTool, Printer, Eye } from 'lucide-react';
import { StencilSettings } from '../types';

interface SidebarProps {
  settings: StencilSettings;
  updateSetting: (key: keyof StencilSettings, value: any) => void;
  onReset: () => void;
  onDownload: () => void;
  onUploadClick: () => void;
  isProcessing: boolean;
  onAiEdit: (prompt: string) => void;
  onProStencil: () => void;
  onImageToStencil: () => void;
  isAiProcessing: boolean;
  activeTab: 'stencil' | 'planeart';
  setActiveTab: (tab: 'stencil' | 'planeart') => void;
  mobileContent?: React.ReactNode;
}

const SliderControl = ({ 
  label, 
  value, 
  min, 
  max, 
  onChange, 
  step = 1 
}: { 
  label: string; 
  value: number; 
  min: number; 
  max: number; 
  onChange: (val: number) => void;
  step?: number;
}) => (
  <div className="mb-5">
    <div className="flex justify-between mb-2">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-xs text-slate-400 font-mono">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
    />
  </div>
);

const ColorButton = ({ color, selected, onClick }: { color: string, selected: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-8 h-8 rounded-full border-2 transition-all ${selected ? 'border-white scale-110 shadow-lg shadow-black/50' : 'border-transparent hover:scale-105'}`}
    style={{ backgroundColor: color }}
  />
);

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  updateSetting,
  onReset,
  onDownload,
  onUploadClick,
  isProcessing,
  onAiEdit,
  onProStencil,
  onImageToStencil,
  isAiProcessing,
  activeTab,
  setActiveTab,
  mobileContent
}) => {
  const [customPrompt, setCustomPrompt] = useState('');

  const applyPreset = (name: string) => {
    let newSettings: Partial<StencilSettings> = { activePreset: name };

    switch (name) {
      case 'LINEART CLEAN PRO':
        newSettings = {
          ...newSettings,
          mode: 'edge',
          smoothing: 1,
          detail: 100,
          thickness: 1,
          contrast: 0,
          brightness: 0,
          edgeIntensity: 50,
          invert: false
        };
        break;
      case 'REALISTIC PORTRAIT SOFT':
        newSettings = {
          ...newSettings,
          mode: 'mixed',
          smoothing: 5,
          detail: 30,
          thickness: 1.5,
          contrast: 25,
          edgeIntensity: 90,
          invert: false
        };
        break;
      case 'TRADITIONAL BOLD STENCIL':
        newSettings = {
          ...newSettings,
          mode: 'threshold',
          smoothing: 1,
          detail: 60,
          thickness: 4,
          contrast: 40,
          edgeIntensity: 100,
          invert: false
        };
        break;
    }

    Object.entries(newSettings).forEach(([key, value]) => {
      updateSetting(key as keyof StencilSettings, value);
    });
  };

  const handleCustomAiSubmit = () => {
    if (customPrompt.trim()) {
      onAiEdit(customPrompt);
    }
  };

  return (
    <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-20 shadow-2xl relative">
      
      {/* AI Processing Overlay */}
      {isAiProcessing && (
        <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">AI Processing</h3>
          <p className="text-sm text-slate-400">Gemini is working...</p>
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50">
           <Zap className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-xl text-slate-100 tracking-tight">Stencil Pro</h1>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-2 bg-slate-900 border-b border-slate-800">
        <button 
          onClick={() => setActiveTab('stencil')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'stencil' 
              ? 'bg-slate-800 text-indigo-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <PenTool className="w-4 h-4" />
          Stencil
        </button>
        <button 
          onClick={() => setActiveTab('planeart')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'planeart' 
              ? 'bg-slate-800 text-teal-400 shadow-sm' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          PlaneArt
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
        
        {/* Main Actions (Common) */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onUploadClick}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-medium transition-all text-sm border border-slate-700 hover:border-slate-600"
          >
            <ImageIcon className="w-4 h-4" /> Import
          </button>
           <button 
            onClick={onReset}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-medium transition-all text-sm border border-slate-700 hover:border-slate-600"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        {/* ---------------- STENCIL MODE CONTROLS ---------------- */}
        {activeTab === 'stencil' && (
          <>
            {/* Direct Image to Stencil AI (NEW SECTION) */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 shadow-inner">
               <div className="flex items-center gap-2 mb-3 text-emerald-400 font-semibold">
                <Printer className="w-4 h-4" />
                <h3>Image to Stencil AI</h3>
              </div>
              <button
                onClick={onImageToStencil}
                disabled={isAiProcessing}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all group border border-white/10"
              >
                <Sparkles className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" /> 
                Generate Pro Stencil
              </button>
              <p className="text-[10px] text-slate-500 mt-2 px-1 text-center">
                Converts image to professional lineart + shading guides.
              </p>
            </div>

            {/* AI Enhancement Section */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 shadow-inner">
              <div className="flex items-center gap-2 mb-3 text-indigo-400 font-semibold">
                <Sparkles className="w-4 h-4" />
                <h3>AI Enhancement</h3>
              </div>
              
              <button
                onClick={onProStencil}
                disabled={isAiProcessing}
                className="w-full mb-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all group border border-white/10"
              >
                <Star className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" /> 
                Pro Stencil (AI)
              </button>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium ml-1">Custom AI Edit</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., 'Make lines thicker'..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomAiSubmit()}
                  />
                  <button 
                    onClick={handleCustomAiSubmit}
                    disabled={!customPrompt.trim() || isAiProcessing}
                    className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white p-2 rounded-lg transition-colors border border-slate-600 hover:border-slate-500"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* MOBILE PREVIEW INJECTION POINT */}
            {mobileContent && (
              <div className="md:hidden w-full h-80 my-2 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shrink-0 shadow-inner">
                {mobileContent}
              </div>
            )}

            {/* Presets */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-slate-100 font-semibold">
                <Wand2 className="w-4 h-4 text-indigo-400" />
                <h3>Pro Presets</h3>
              </div>
              <div className="space-y-2">
                {[
                  { id: 'LINEART CLEAN PRO', label: 'Clean Lineart', desc: 'Anime & Illustration' },
                  { id: 'REALISTIC PORTRAIT SOFT', label: 'Soft Portrait', desc: 'Realistic Faces' },
                  { id: 'TRADITIONAL BOLD STENCIL', label: 'Traditional Bold', desc: 'Old School / Thick' }
                ].map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      settings.activePreset === preset.id
                        ? 'bg-indigo-900/30 border-indigo-500/50 ring-1 ring-indigo-500/50'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-bold ${settings.activePreset === preset.id ? 'text-indigo-300' : 'text-slate-200'}`}>
                        {preset.label}
                      </span>
                      {settings.activePreset === preset.id && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">{preset.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-slate-800" />

            {/* NEW: Comparison / Overlay Mode */}
            <div>
              <div className="flex items-center gap-2 mb-4 text-slate-100 font-semibold">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3>Preview Layers</h3>
              </div>
              
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-4">
                 <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">View with Background</span>
                  </div>
                  <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-all duration-300 ${settings.overlayMode ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                    <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-300 ${settings.overlayMode ? 'translate-x-5' : ''}`}></div>
                    <input type="checkbox" className="hidden" checked={settings.overlayMode} onChange={(e) => updateSetting('overlayMode', e.target.checked)} />
                  </div>
                </label>

                {settings.overlayMode && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                    <SliderControl 
                      label="Base Image Opacity" 
                      value={settings.overlayOpacity} 
                      min={0} 
                      max={100} 
                      onChange={(v) => updateSetting('overlayOpacity', v)} 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="w-full h-px bg-slate-800" />

            {/* Basic Controls (Color, etc) */}
            <div className="space-y-6">
              
              <div>
                 <div className="flex items-center gap-2 mb-3 text-slate-100 font-semibold">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <h3>Stencil Color</h3>
                </div>
                <div className="flex gap-3 justify-start">
                  <ColorButton color="#000000" selected={settings.lineColor === '#000000'} onClick={() => updateSetting('lineColor', '#000000')} />
                  <ColorButton color="#dc2626" selected={settings.lineColor === '#dc2626'} onClick={() => updateSetting('lineColor', '#dc2626')} />
                  <ColorButton color="#2563eb" selected={settings.lineColor === '#2563eb'} onClick={() => updateSetting('lineColor', '#2563eb')} />
                  <ColorButton color="#16a34a" selected={settings.lineColor === '#16a34a'} onClick={() => updateSetting('lineColor', '#16a34a')} />
                </div>
              </div>

              <div className="w-full h-px bg-slate-800" />

              <div>
                <div className="flex items-center gap-2 mb-4 text-slate-100 font-semibold">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <h3>Adjustments</h3>
                </div>
                
                <SliderControl label="Line Intensity" value={settings.edgeIntensity} min={0} max={200} onChange={(v) => updateSetting('edgeIntensity', v)} />
                <SliderControl label="Line Weight" value={settings.thickness} min={1} max={10} onChange={(v) => updateSetting('thickness', v)} />
                <SliderControl label="Detail" value={settings.detail} min={0} max={100} onChange={(v) => updateSetting('detail', v)} />
                <SliderControl label="Smoothing" value={settings.smoothing} min={0} max={10} onChange={(v) => updateSetting('smoothing', v)} />
                <SliderControl label="Contrast" value={settings.contrast} min={-50} max={100} onChange={(v) => updateSetting('contrast', v)} />
                <SliderControl label="Brightness" value={settings.brightness} min={-100} max={100} onChange={(v) => updateSetting('brightness', v)} />
              </div>

               <div className="w-full h-px bg-slate-800" />

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Invert Colors</span>
                  <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${settings.invert ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${settings.invert ? 'translate-x-6' : ''}`}></div>
                    <input type="checkbox" className="hidden" checked={settings.invert} onChange={(e) => updateSetting('invert', e.target.checked)} />
                  </div>
                </label>
                 <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Flip Horizontally</span>
                  <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${settings.flipX ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${settings.flipX ? 'translate-x-6' : ''}`}></div>
                    <input type="checkbox" className="hidden" checked={settings.flipX} onChange={(e) => updateSetting('flipX', e.target.checked)} />
                  </div>
                </label>
              </div>
            </div>
            
            <div className="mt-8 pb-8">
                <button 
                  onClick={onDownload}
                  disabled={isProcessing || isAiProcessing}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:from-slate-700 disabled:to-slate-700 text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {isProcessing ? 'Processing...' : <><Download className="w-5 h-5" /> Download Stencil</>}
                </button>
            </div>
          </>
        )}

        {/* ---------------- PLANEART MODE CONTROLS ---------------- */}
        {activeTab === 'planeart' && (
          <div className="text-slate-400 text-sm space-y-4">
             <div className="p-4 bg-teal-900/20 border border-teal-500/20 rounded-xl">
                <h3 className="text-teal-400 font-bold mb-2 flex items-center gap-2">
                   <ScanLine className="w-4 h-4" />
                   What is PlaneArt?
                </h3>
                <p className="mb-2">PlaneArt intelligently flattens tattoos from photos.</p>
                <ul className="list-disc pl-4 space-y-1 text-xs opacity-80">
                   <li>Removes skin & background</li>
                   <li>Corrects body curve distortion</li>
                   <li>Repairs broken lines</li>
                   <li>Outputs flat vector-style lineart</li>
                </ul>
             </div>
             
             <p className="italic text-xs text-center opacity-60">
                Tip: Upload a clear photo of the tattoo. The AI will handle the perspective correction and cleanup.
             </p>
          </div>
        )}

      </div>
    </div>
  );
};
