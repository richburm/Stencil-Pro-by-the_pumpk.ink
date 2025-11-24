import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends the image to Gemini to perform a custom edit based on user prompt.
 */
export const generateImageEdit = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    // Remove header if present to get raw base64 data
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: prompt }
        ]
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
};

/**
 * specific preset function to clean up artifacts and enhance lines
 */
export const cleanImageWithAI = async (base64Image: string): Promise<string> => {
  const cleanupPrompt = `
    Redraw this image as a high-quality professional tattoo stencil. 
    Strict Requirements:
    1. Output PURE BLACK lines on a solid WHITE background only. 
    2. Remove ALL shading, gradients, shadows, texturing, and noise.
    3. Consolidate sketchy, fuzzy, or double lines into single, confident, smooth vector-style lines.
    4. Ensure line weight is consistent, clean, and appropriate for a thermal transfer machine.
    5. Maintain all essential details of the subject but simplify complex areas for tattooing.
    6. The result must look like a perfect line drawing done by a master tattoo artist.
  `;
  return generateImageEdit(base64Image, cleanupPrompt);
};

/**
 * PlaneArt generation function
 * Corrects distortion, removes skin, and flattens the design.
 */
export const generatePlaneArt = async (base64Image: string): Promise<string> => {
  const planeArtPrompt = `
    Toma la imagen proporcionada y extrae únicamente el diseño del tatuaje.
    Corrige toda la distorsión provocada por la curvatura del cuerpo, perspectiva, iluminación o movimiento.
    Endereza y reestructura el diseño para que quede totalmente plano y centrado.
    Limpia la línea sin modificar el estilo original: conserva grosor, curvaturas, puntas y formas exactas del diseño.
    Elimina cualquier ruido, sombra, piel, textura, color o fondo.
    Entrega un lineart 100% nítido, uniforme, sólido y definido, sin relleno y sin efecto de stencil sucio.
    No añadas detalles nuevos ni cambies la composición original del tatuaje; solo corrige, limpia y ordena.
  `;
  return generateImageEdit(base64Image, planeArtPrompt);
};

/**
 * Image to Professional Stencil AI
 */
export const generateStencilAI = async (base64Image: string): Promise<string> => {
  const stencilPrompt = `
    Convierte la imagen proporcionada en un lineart profesional de tatuaje.
    Genera un lineart limpio, sólido y preciso, como hecho por un tatuador profesional:
    – Contornos principales fuertes y continuos
    – Líneas internas claras, uniformes y cerradas
    – Coherencia absoluta en grosor y dirección de línea
    Transforma las sombras de color en ‘sombras guía’ para tatuaje:
    – Usa ghost lines para sombras suaves
    – Traduce sombras duras en bloques de sombreado lineal
    – Mantén proporciones y expresión fieles al diseño original
    No agregues elementos nuevos ni estilices de forma diferente.
    Solo convierte el arte digital en un esténcil profesional preparado para transferencia térmica.
    Resultado final: lineart + sombreado guía, sin fondo, en PNG o JPG.
  `;
  return generateImageEdit(base64Image, stencilPrompt);
};