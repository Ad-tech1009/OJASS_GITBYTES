import fitz
import json
import re
from typing import List, Dict


def extract_pdf_text(pdf_path: str) -> List[Dict]:
    """
    Extract text from PDF page-wise
    
    Returns:
        List of dicts: [{"page_number": 1, "content": "..."}, ...]
    """
    doc = fitz.open(pdf_path)
    pages_data = []
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        
        # Get text blocks to maintain structure
        blocks = page.get_text("blocks")
        
        # Join blocks into text
        raw_text = "\n".join([b[4] for b in blocks])
        
        # Pre-process: normalize whitespace
        clean_text = re.sub(r'\s+', ' ', raw_text).strip()
        
        pages_data.append({
            "page_number": page_num + 1,
            "content": clean_text
        })
    
    doc.close()
    return pages_data


def save_extracted_text(pages_data: List[Dict], output_path: str):
    """Save extracted text to file with page markers (TXT format)"""
    with open(output_path, "w", encoding="utf-8") as f:
        for page in pages_data:
            f.write(f"--- START PAGE {page['page_number']} ---\n")
            f.write(page['content'])
            f.write(f"\n--- END PAGE {page['page_number']} ---\n\n")
    print(f"  ✓ TXT saved: {output_path}")


def save_extracted_json(pages_data: List[Dict], output_path: str):
    """Save extracted data as structured JSON"""
    data = {
        "stage": "phase1_extraction",
        "description": "PDF text extraction with page-wise structure",
        "total_pages": len(pages_data),
        "pages": pages_data
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✓ JSON saved: {output_path}")


if __name__ == "__main__":
    # Test
    pages = extract_pdf_text("full_case_distinct.txt")
    print(f"Extracted {len(pages)} pages")
    print(f"Page 1 preview: {pages[0]['content'][:200]}...")