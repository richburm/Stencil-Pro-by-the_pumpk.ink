
export interface StencilSettings {
  contrast: number;      // -100 to 100
  brightness: number;    // -100 to 100
  edgeIntensity: number; // 0 to 100
  thickness: number;     // 1 to 10
  detail: number;        // 0 to 100 (Threshold)
  smoothing: number;     // 0 to 10 (Blur)
  mode: 'edge' | 'threshold' | 'mixed'; // Processing mode
  invert: boolean;
  flipX: boolean;
  lineColor: string;     // Hex code for line color
  activePreset?: string; // Track which preset is active
  
  // Preview Settings
  overlayMode: boolean;   // Toggle between Split View and Overlay Mode
  overlayOpacity: number; // Opacity of the base image (0-100)
}

export const DEFAULT_SETTINGS: StencilSettings = {
  contrast: 10,
  brightness: 0,
  edgeIntensity: 80,
  thickness: 1,
  detail: 30,
  smoothing: 2,
  mode: 'edge',
  invert: false,
  flipX: false,
  lineColor: '#000000',
  activePreset: 'custom',
  overlayMode: false,
  overlayOpacity: 50,
};
