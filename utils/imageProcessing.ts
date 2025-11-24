import { StencilSettings } from '../types';

/**
 * Main processing function to transform ImageData based on settings
 */
export const processStencil = (
  imageData: ImageData, 
  settings: StencilSettings
): ImageData => {
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
  const data = output.data;

  // Hex to RGB helper
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const lineRGB = hexToRgb(settings.lineColor);

  // 1. Pre-calculate lookup tables for contrast/brightness to speed up loops
  const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
  
  // Helper to get luminance
  const getLum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

  // Buffers for multi-pass processing
  // We work on a grayscale buffer for edge detection
  let grayBuffer = new Float32Array(width * height);

  // PASS 1: Grayscale & Contrast/Brightness
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply Contrast
    r = contrastFactor * (r - 128) + 128 + settings.brightness;
    g = contrastFactor * (g - 128) + 128 + settings.brightness;
    b = contrastFactor * (b - 128) + 128 + settings.brightness;

    // Clamp
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    // Convert to Grayscale
    grayBuffer[i / 4] = getLum(r, g, b);
  }

  // PASS 2: Smoothing (Box Blur approximation for performance)
  if (settings.smoothing > 0) {
    const blurRadius = Math.floor(settings.smoothing);
    const newGray = new Float32Array(width * height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        for (let by = -blurRadius; by <= blurRadius; by++) {
          for (let bx = -blurRadius; bx <= blurRadius; bx++) {
             const ny = y + by;
             const nx = x + bx;
             if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
               sum += grayBuffer[ny * width + nx];
               count++;
             }
          }
        }
        newGray[y * width + x] = sum / count;
      }
    }
    grayBuffer = newGray;
  }

  // PASS 3: Edge Detection or Thresholding based on mode
  const finalBuffer = new Uint8ClampedArray(width * height * 4);

  if (settings.mode === 'edge' || settings.mode === 'mixed') {
    // SOBEL OPERATOR
    const outputGray = new Float32Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        // Gx
        const gx = 
          -1 * grayBuffer[(y - 1) * width + (x - 1)] +
           1 * grayBuffer[(y - 1) * width + (x + 1)] +
          -2 * grayBuffer[y * width + (x - 1)] +
           2 * grayBuffer[y * width + (x + 1)] +
          -1 * grayBuffer[(y + 1) * width + (x - 1)] +
           1 * grayBuffer[(y + 1) * width + (x + 1)];

        // Gy
        const gy = 
          -1 * grayBuffer[(y - 1) * width + (x - 1)] +
          -2 * grayBuffer[(y - 1) * width + x] +
          -1 * grayBuffer[(y - 1) * width + (x + 1)] +
           1 * grayBuffer[(y + 1) * width + (x - 1)] +
           2 * grayBuffer[(y + 1) * width + x] +
           1 * grayBuffer[(y + 1) * width + (x + 1)];

        let magnitude = Math.sqrt(gx * gx + gy * gy);
        
        // Intensity Scaling
        magnitude = magnitude * (settings.edgeIntensity / 20);

        outputGray[y * width + x] = magnitude;
      }
    }

    // Apply Thickness via Dilation
    let dilatedGray = outputGray;
    if (settings.thickness > 1) {
       dilatedGray = new Float32Array(width * height);
       const radius = Math.floor(settings.thickness / 2);
       for(let y=0; y<height; y++){
         for(let x=0; x<width; x++){
            let maxVal = 0;
            for(let dy=-radius; dy<=radius; dy++){
              for(let dx=-radius; dx<=radius; dx++){
                 const ny = y+dy;
                 const nx = x+dx;
                 if(ny>=0 && ny<height && nx>=0 && nx<width){
                    maxVal = Math.max(maxVal, outputGray[ny*width+nx]);
                 }
              }
            }
            dilatedGray[y*width+x] = maxVal;
         }
       }
    }

    // Thresholding
    const threshold = settings.detail * 2.55; 
    
    for (let i = 0; i < width * height; i++) {
      let val = dilatedGray[i];
      
      // Determine if pixel is line or background
      // Standard: High magnitude = Edge = Line
      let isLine = val > threshold;

      if (settings.mode === 'mixed') {
         const originalVal = grayBuffer[i] > 128 ? false : true; // Dark parts of original
         isLine = isLine || originalVal;
      }
      
      if (settings.invert) {
        isLine = !isLine;
      }

      // Write Output
      if (isLine) {
        finalBuffer[i * 4] = lineRGB.r;
        finalBuffer[i * 4 + 1] = lineRGB.g;
        finalBuffer[i * 4 + 2] = lineRGB.b;
        finalBuffer[i * 4 + 3] = 255;
      } else {
        // Background - Always white for preview, handled in export for transparency
        finalBuffer[i * 4] = 255;
        finalBuffer[i * 4 + 1] = 255;
        finalBuffer[i * 4 + 2] = 255;
        finalBuffer[i * 4 + 3] = 255; 
      }
    }

  } else if (settings.mode === 'threshold') {
    // SIMPLE THRESHOLD MODE
    const threshold = settings.detail * 2.55;
    
    for (let i = 0; i < width * height; i++) {
      let val = grayBuffer[i];
      let isLine = val < threshold;
      
      if (settings.invert) isLine = !isLine;

      if (isLine) {
        finalBuffer[i * 4] = lineRGB.r;
        finalBuffer[i * 4 + 1] = lineRGB.g;
        finalBuffer[i * 4 + 2] = lineRGB.b;
        finalBuffer[i * 4 + 3] = 255;
      } else {
        finalBuffer[i * 4] = 255;
        finalBuffer[i * 4 + 1] = 255;
        finalBuffer[i * 4 + 2] = 255;
        finalBuffer[i * 4 + 3] = 255;
      }
    }
  }

  // Final Pass: Flip Only (Color/Invert handled in loop)
  const renderData = output.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      
      const readX = settings.flipX ? (width - 1 - x) : x;
      const readIdx = (y * width + readX) * 4;
      const writeIdx = (y * width + x) * 4;

      renderData[writeIdx] = finalBuffer[readIdx];
      renderData[writeIdx + 1] = finalBuffer[readIdx + 1];
      renderData[writeIdx + 2] = finalBuffer[readIdx + 2];
      renderData[writeIdx + 3] = finalBuffer[readIdx + 3];
    }
  }

  return output;
};