#!/usr/bin/env python3
"""
PaddleOCR Service for Book Page Converter Desktop App
Provides local OCR processing without internet connectivity
"""

import sys
import json
import argparse
from pathlib import Path

try:
    from paddleocr import PaddleOCR
except ImportError:
    print(json.dumps({
        "error": "PaddleOCR not installed. Please run: pip install paddleocr paddlepaddle",
        "success": False
    }))
    sys.exit(1)

# Initialize PaddleOCR (runs once when service starts)
# use_angle_cls=True enables text orientation detection
# lang='en' for English, supports multiple languages
ocr_engine = None

def init_ocr(lang='en'):
    """Initialize OCR engine with specified language"""
    global ocr_engine
    if ocr_engine is None:
        try:
            ocr_engine = PaddleOCR(
                use_angle_cls=True,
                lang=lang,
                show_log=False,
                use_gpu=False  # Set to True if GPU available
            )
            return True
        except Exception as e:
            print(json.dumps({
                "error": f"Failed to initialize PaddleOCR: {str(e)}",
                "success": False
            }), file=sys.stderr)
            return False
    return True

def extract_text_from_image(image_path: str, lang='en') -> dict:
    """
    Extract text from image using PaddleOCR
    
    Args:
        image_path: Path to the image file
        lang: Language code (default: 'en')
        
    Returns:
        dict with extracted text, confidence, and formatting data
    """
    try:
        # Initialize OCR if not already done
        if not init_ocr(lang):
            return {
                "success": False,
                "error": "Failed to initialize OCR engine"
            }
        
        # Check if image exists
        if not Path(image_path).exists():
            return {
                "success": False,
                "error": f"Image file not found: {image_path}"
            }
        
        # Perform OCR
        result = ocr_engine.ocr(image_path, cls=True)
        
        if not result or not result[0]:
            return {
                "success": True,
                "text": "",
                "confidence": 0,
                "blocks": [],
                "page_number": None
            }
        
        # Extract text and confidence scores
        lines = []
        total_confidence = 0
        block_count = 0
        
        for line in result[0]:
            if line:
                bbox, (text, confidence) = line
                lines.append({
                    "text": text,
                    "confidence": confidence,
                    "bbox": bbox  # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                })
                total_confidence += confidence
                block_count += 1
        
        # Combine all text
        full_text = "\n".join([line["text"] for line in lines])
        
        # Calculate average confidence
        avg_confidence = int((total_confidence / block_count * 100)) if block_count > 0 else 0
        
        # Detect page number (simple heuristic - look for numbers in first/last lines)
        page_number = detect_page_number(lines)
        
        # Create formatting blocks (simplified structure)
        formatting_blocks = create_formatting_blocks(lines)
        
        return {
            "success": True,
            "text": full_text,
            "confidence": avg_confidence,
            "blocks": formatting_blocks,
            "page_number": page_number,
            "total_lines": len(lines)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"OCR processing failed: {str(e)}"
        }

def detect_page_number(lines: list) -> str | None:
    """
    Detect page number from OCR results
    Looks for isolated numbers in first or last few lines
    """
    import re
    
    # Check first 3 and last 3 lines
    check_lines = []
    if len(lines) > 0:
        check_lines.extend(lines[:3])
    if len(lines) > 3:
        check_lines.extend(lines[-3:])
    
    for line in check_lines:
        text = line["text"].strip()
        # Look for standalone numbers (Arabic or Roman numerals)
        if re.match(r'^[0-9]+$', text):
            return text
        if re.match(r'^[IVXLCDM]+$', text, re.IGNORECASE):
            return text.upper()
    
    return None

def create_formatting_blocks(lines: list) -> list:
    """
    Create simplified formatting blocks from OCR lines
    Groups consecutive lines into paragraphs based on spacing
    """
    if not lines:
        return []
    
    blocks = []
    current_paragraph = []
    prev_y = None
    
    for line in lines:
        bbox = line["bbox"]
        # Get y-coordinate of line (average of top two points)
        y_coord = (bbox[0][1] + bbox[1][1]) / 2
        
        # Check if this line is part of current paragraph or starts new one
        # Large vertical gap indicates new paragraph
        if prev_y is not None and abs(y_coord - prev_y) > 30:
            if current_paragraph:
                blocks.append({
                    "type": "paragraph",
                    "lines": current_paragraph
                })
                current_paragraph = []
        
        current_paragraph.append(line["text"])
        prev_y = y_coord
    
    # Add last paragraph
    if current_paragraph:
        blocks.append({
            "type": "paragraph",
            "lines": current_paragraph
        })
    
    return blocks

def main():
    """Main entry point for OCR service"""
    parser = argparse.ArgumentParser(description='PaddleOCR Service')
    parser.add_argument('image_path', help='Path to image file')
    parser.add_argument('--lang', default='en', help='Language code (default: en)')
    parser.add_argument('--json', action='store_true', help='Output JSON format')
    
    args = parser.parse_args()
    
    # Process image
    result = extract_text_from_image(args.image_path, args.lang)
    
    # Output result as JSON
    print(json.dumps(result, ensure_ascii=False, indent=2 if not args.json else None))
    
    # Exit with appropriate code
    sys.exit(0 if result.get("success") else 1)

if __name__ == "__main__":
    main()
