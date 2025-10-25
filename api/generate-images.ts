// api/generate-images.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCanvas, loadImage, CanvasRenderingContext2D, CanvasTextAlign, CanvasTextBaseline, registerFont } from 'canvas';
import path from 'path';
// FIX: Import `cwd` from `process` to avoid type errors with the global `process` object.
import { cwd } from 'process';

// --- Register Custom Font ---
// This ensures the font is available in the serverless environment, fixing the "□□□" issue.
try {
  // FIX: Use the imported `cwd()` function instead of `process.cwd()`.
  const fontPath = path.join(cwd(), 'fonts', 'Arial_Bold.ttf');
  registerFont(fontPath, { family: 'Arial Bold' });
} catch (err) {
  // Log an error if font registration fails, which helps in debugging deployment issues.
  console.error('Failed to register font. Text might not render correctly.', err);
}


// --- Type Definitions ---
interface AnimalData {
  lobo: number;
  aguia: number;
  tubarao: number;
  gato: number;
}

interface BrainData {
  pensante: number;
  atuante: number;
  razao: number;
  emocao: number;
}

// --- Image Processing Logic ---

const drawTextWithShadow = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  fillStyle: string,
  textAlign: CanvasTextAlign,
  textBaseline: CanvasTextBaseline
) => {
  ctx.font = font;
  ctx.fillStyle = fillStyle;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillText(text, x, y);

  // Reset shadow for next drawing
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
};

const generateAnimalImage = async (baseImageUrl: string, data: AnimalData): Promise<string> => {
    try {
        const img = await loadImage(baseImageUrl);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');

        ctx.drawImage(img, 0, 0);

        const animalEntries = Object.entries(data) as [keyof AnimalData, number][];

        let highestAnimalName: keyof AnimalData | null = null;
        let maxPercentage = -1;

        // Find the animal with the highest percentage
        for (const [name, percentage] of animalEntries) {
            if (percentage > maxPercentage) {
                maxPercentage = percentage;
                highestAnimalName = name;
            }
        }

        const fontName = '"Arial Bold"'; // Use the registered font
        const normalFontSize = 36;
        const highestFontSize = 40;
        const normalColor = '#FFFFFF'; // White
        const highestColor = '#FFFF00'; // Yellow

        const positions: { [key in keyof AnimalData]: { x: number; y: number } } = {
          lobo:    { x: 250, y: 680 },
          aguia:   { x: 750, y: 680 },
          tubarao: { x: 250, y: 970 },
          gato:    { x: 750, y: 970 },
        };

        for (const [name, percentage] of animalEntries) {
          const isHighest = name === highestAnimalName;
          const fontSize = isHighest ? highestFontSize : normalFontSize;
          const color = isHighest ? highestColor : normalColor;
          const font = `${fontSize}px ${fontName}`;
          const text = `${percentage}%`;
          const { x, y } = positions[name];

          // Center the text at the given coordinates
          drawTextWithShadow(ctx, text, x, y, font, color, 'center', 'middle');
        }

        return canvas.toDataURL('image/png');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(`Error during animal image processing: ${errorMessage}`);
    }
};

const generateBrainImage = async (baseImageUrl: string, data: BrainData): Promise<string> => {
    try {
        const img = await loadImage(baseImageUrl);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
  
        ctx.drawImage(img, 0, 0);
        
        const brainEntries = Object.entries(data) as [keyof BrainData, number][];

        let highestBrainName: keyof BrainData | null = null;
        let maxPercentage = -1;

        // Find the brain characteristic with the highest percentage
        for (const [name, percentage] of brainEntries) {
            if (percentage > maxPercentage) {
                maxPercentage = percentage;
                highestBrainName = name;
            }
        }
        
        const fontName = '"Arial Bold"'; // Use the registered font
        const normalFontSize = 36;
        const highestFontSize = 40;
        const normalColor = '#FFFFFF'; // White
        const highestColor = '#FFFF00'; // Yellow

        const positions: { [key in keyof BrainData]: { x: number; y: number } } = {
            razao:    { x: 270, y: 480 },
            emocao:   { x: 740, y: 480 },
            pensante: { x: 500, y: 310 },
            atuante:  { x: 500, y: 710 },
        };
  
        for (const [name, percentage] of brainEntries) {
            const isHighest = name === highestBrainName;
            const fontSize = isHighest ? highestFontSize : normalFontSize;
            const color = isHighest ? highestColor : normalColor;
            const font = `${fontSize}px ${fontName}`;
            const text = `${percentage}%`;
            const { x, y } = positions[name];

            // Center the text at the given coordinates
            drawTextWithShadow(ctx, text, x, y, font, color, 'center', 'middle');
        }
  
        return canvas.toDataURL('image/png');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(`Error during brain image processing: ${errorMessage}`);
    }
};

const BASE_IMAGE_BRAIN_URL = 'https://i.postimg.cc/LXMYjwtX/Inserir-um-t-tulo-6.png';
// Updated URL as per request
const BASE_IMAGE_ANIMALS_URL = 'https://i.postimg.cc/6QDYdjPb/Design-sem-nome-17.png';


// --- Vercel Serverless Function Handler ---

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // We only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { animalData, brainData } = req.body;

    // Basic validation
    if (!animalData || !brainData) {
      return res.status(400).json({ error: 'Request body must contain "animalData" and "brainData" objects.' });
    }
    
    const [animalImage, brainImage] = await Promise.all([
      generateAnimalImage(BASE_IMAGE_ANIMALS_URL, animalData),
      generateBrainImage(BASE_IMAGE_BRAIN_URL, brainData),
    ]);

    res.status(200).json({
      animalImage,
      brainImage,
    });
  } catch (error) {
    console.error('Image generation failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    res.status(500).json({ error: 'Failed to generate images.', details: errorMessage });
  }
}