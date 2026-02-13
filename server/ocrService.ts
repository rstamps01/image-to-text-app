import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface FormattingBlock {
  type: 'paragraph' | 'heading' | 'list' | 'quote';
  /** Starting line index in the extractedText */
  startLine: number;
  /** Ending line index in the extractedText */
  endLine: number;
  level?: number;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    alignment?: 'left' | 'center' | 'right' | 'justify';
  };
}

interface FormattingData {
  blocks: FormattingBlock[];
}

interface OCRResult {
  extractedText: string;
  detectedPageNumber: string | null;
  formattingData: FormattingData;
  confidence: number;
}

/**
 * Cleans up common OCR artifacts from extracted text
 * Removes duplicate spaces, stray punctuation, and formatting inconsistencies
 * while preserving intentional formatting like indentation and line breaks
 */
export function cleanupOCRText(text: string): string {
  let cleaned = text;

  // Remove multiple consecutive spaces (but preserve single spaces)
  cleaned = cleaned.replace(/ {2,}/g, ' ');

  // Fix spacing around hyphens and dashes FIRST (before other rules)
  // Remove spaces around hyphens in compound words (e.g., "well - known" → "well-known")
  cleaned = cleaned.replace(/([a-zA-Z]) +- +([a-zA-Z])/g, '$1-$2');
  
  // Fix em-dashes with inconsistent spacing (standardize to no spaces)
  cleaned = cleaned.replace(/ +— +/g, '—');
  cleaned = cleaned.replace(/ +(--+) +/g, '—');
  
  // Fix spacing around slashes (e.g., "and / or" → "and/or") BEFORE stray character removal
  cleaned = cleaned.replace(/([a-zA-Z]) +\/ +([a-zA-Z])/g, '$1/$2');

  // Remove spaces before punctuation
  cleaned = cleaned.replace(/ +([.,;:!?])/g, '$1');

  // Remove spaces after opening parentheses/brackets
  cleaned = cleaned.replace(/([\[(]) +/g, '$1');
  
  // Remove spaces before closing parentheses/brackets
  cleaned = cleaned.replace(/ +([\])])/g, '$1');
  
  // Fix spacing around quotes (only remove internal spaces, preserve external)
  // Match quote + space + content + space + quote pattern
  cleaned = cleaned.replace(/(["]) +([^"]+?) +(["]) /g, '$1$2$3 ');
  cleaned = cleaned.replace(/ (["]) +([^"]+?) +(["]) /g, ' $1$2$3 ');
  cleaned = cleaned.replace(/ (["]) +([^"]+?) +(["]) /g, ' $1$2$3 ');
  
  // Fix common OCR character confusions
  // Note: Only apply obvious fixes to avoid changing intentional content
  cleaned = cleaned.replace(/\bl\b/g, 'I'); // Standalone 'l' likely means 'I'
  cleaned = cleaned.replace(/\b0(?=[A-Za-z])/g, 'O'); // '0' before letter likely 'O'
  
  // Fix common OCR punctuation errors
  // Replace multiple periods with ellipsis
  cleaned = cleaned.replace(/\.{4,}/g, '...');
  // Fix spaced ellipsis (e.g., ". . ." → "...")
  cleaned = cleaned.replace(/\. +\. +\./g, '...');
  
  // Remove stray single characters that are likely artifacts (except common single letters like 'a', 'I')
  // Exclude slash, dash, and em-dash from removal
  cleaned = cleaned.replace(/\b[^aAiI\s\d.,;:!?()\[\]{}"'\-\/—]\b/g, '');
  
  // Fix inconsistent spacing after periods
  // Ensure single space after periods (but not in abbreviations like "U.S.")
  cleaned = cleaned.replace(/\.([A-Z])/g, '. $1');
  
  // Fix colon spacing (no space before, single space after)
  cleaned = cleaned.replace(/ +:/g, ':');
  cleaned = cleaned.replace(/:([A-Za-z])/g, ': $1');
  
  // Remove excessive line breaks (3+ consecutive newlines → 2 newlines)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Join lines that were incorrectly split mid-sentence
  // Look for line ending without punctuation followed by lowercase start
  cleaned = cleaned.replace(/([a-z,])\n([a-z])/g, '$1 $2');
  
  // Remove trailing spaces at end of lines
  cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');
  
  // Remove leading spaces at start of lines (1-3 spaces only, preserve 4+ for indentation)
  // This preserves intentional indentation while removing accidental leading spaces  
  cleaned = cleaned.split('\n').map(line => {
    // If line starts with 4+ spaces, keep all spaces (intentional indentation)
    if (line.match(/^ {4,}/)) {
      return line;
    }
    // Otherwise remove 1-3 leading spaces
    return line.replace(/^ {1,3}/, '');
  }).join('\n');

  return cleaned;
}

/**
 * Parses extracted text into structured FormattingBlock array
 */
function parseTextIntoBlocks(text: string): FormattingBlock[] {
  const blocks: FormattingBlock[] = [];
  const lines = text.split('\n');
  let currentParagraphStart: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      // If we have accumulated paragraph lines, save them
      if (currentParagraphStart !== null) {
        blocks.push({
          type: 'paragraph',
          startLine: currentParagraphStart,
          endLine: i - 1,
        });
        currentParagraphStart = null;
      }
      continue;
    }

    // Detect headings (all caps or title case with short length)
    const isAllCaps = /^[A-Z][A-Z\s\d]+$/.test(trimmedLine);
    const isShortAndBold = trimmedLine.length < 80 && /^[A-Z]/.test(trimmedLine);
    
    if (isAllCaps && trimmedLine.length < 100) {
      // Save any accumulated paragraph
      if (currentParagraphStart !== null) {
        blocks.push({
          type: 'paragraph',
          startLine: currentParagraphStart,
          endLine: i - 1,
        });
        currentParagraphStart = null;
      }
      
      // Add as heading
      blocks.push({
        type: 'heading',
        startLine: i,
        endLine: i,
        level: 1,
        formatting: { bold: true },
      });
    } else if (isShortAndBold && (trimmedLine.startsWith('Section') || trimmedLine.startsWith('Article') || trimmedLine.startsWith('Chapter'))) {
      // Save any accumulated paragraph
      if (currentParagraphStart !== null) {
        blocks.push({
          type: 'paragraph',
          startLine: currentParagraphStart,
          endLine: i - 1,
        });
        currentParagraphStart = null;
      }
      
      // Add as heading
      blocks.push({
        type: 'heading',
        startLine: i,
        endLine: i,
        level: 2,
        formatting: { bold: true },
      });
    } else {
      // Regular paragraph line
      if (currentParagraphStart === null) {
        currentParagraphStart = i;
      }
    }
  }

  // Add any remaining paragraph
  if (currentParagraphStart !== null) {
    blocks.push({
      type: 'paragraph',
      startLine: currentParagraphStart,
      endLine: lines.length - 1,
    });
  }

  return blocks;
}

/**
 * Calls Python PaddleOCR service to extract text from image
 */
async function callPythonOCR(imagePath: string): Promise<{
  text: string;
  confidence: number;
  pageNumber: string | null;
}> {
  return new Promise((resolve, reject) => {
    // Path to Python OCR service
    const scriptPath = path.join(process.cwd(), 'electron', 'ocr-service.py');
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      reject(new Error(`OCR service script not found: ${scriptPath}`));
      return;
    }
    
    // Check if image exists
    if (!fs.existsSync(imagePath)) {
      reject(new Error(`Image file not found: ${imagePath}`));
      return;
    }
    
    // Spawn Python process
    const python = spawn('python3', [scriptPath, imagePath, '--json']);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`OCR process failed with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        
        if (!result.success) {
          reject(new Error(result.error || 'OCR processing failed'));
          return;
        }
        
        resolve({
          text: result.text || '',
          confidence: result.confidence || 0,
          pageNumber: result.page_number || null,
        });
      } catch (error) {
        reject(new Error(`Failed to parse OCR result: ${error}`));
      }
    });
    
    python.on('error', (error) => {
      reject(new Error(`Failed to spawn Python process: ${error.message}`));
    });
  });
}

/**
 * Performs OCR on an image using local PaddleOCR
 * @param imagePathOrUrl - Local file path to the image
 */
export async function performOCR(imagePathOrUrl: string): Promise<OCRResult> {
  try {
    // For desktop app, imagePathOrUrl is a local file path
    const imagePath = imagePathOrUrl.replace('file://', '');
    
    // Call Python OCR service
    const ocrResult = await callPythonOCR(imagePath);
    
    // Clean up the extracted text
    const cleanedText = cleanupOCRText(ocrResult.text);
    
    // Parse text into formatting blocks
    const blocks = parseTextIntoBlocks(cleanedText);
    
    return {
      extractedText: cleanedText,
      detectedPageNumber: ocrResult.pageNumber,
      formattingData: { blocks },
      confidence: ocrResult.confidence,
    };
  } catch (error) {
    console.error('[OCR] Error processing image:', error);
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
