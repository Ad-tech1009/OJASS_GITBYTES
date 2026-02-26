"""
Phase 2: Hindi to English Translation
Translates extracted Hindi text using Gemini API
"""

import os
import google.generativeai as genai
from typing import List, Dict
import asyncio

genai.configure(api_key="AIzaSyBW6drEIITG0GEnLSJLH2fPkhS2Gb2_x-w")


async def translate_page(page: Dict, model) -> Dict:
    """
    Translate a single page from Hindi to English
    
    Args:
        page: Dict with 'page_number' and 'content' (Hindi)
        model: Gemini model instance
    
    Returns:
        Dict with 'page_number' and 'english_content'
    """
    prompt = f"""
    Translate the following Hindi text to English.
    This is a police case diary (chargesheet) document.
    Provide only the translation, no additional commentary.
    
    Hindi Text:
    {page['content']}
    """
    
    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        return {
            "page_number": page["page_number"],
            "hindi_content": page["content"],
            "english_content": response.text.strip()
        }
    except Exception as e:
        print(f"Error translating page {page['page_number']}: {e}")
        return {
            "page_number": page["page_number"],
            "hindi_content": page["content"],
            "english_content": f"[Translation Error: {str(e)}]"
        }


async def translate_hindi_to_english(pages: List[Dict], batch_size: int = 5) -> List[Dict]:
    """
    Translate all pages from Hindi to English
    
    Args:
        pages: List of page dicts with Hindi content
        batch_size: Number of concurrent translations
    
    Returns:
        List of page dicts with English content added
    """
    model = genai.GenerativeModel('gemini-2.5-flash')
    semaphore = asyncio.Semaphore(batch_size)
    
    async def translate_with_limit(page):
        async with semaphore:
            return await translate_page(page, model)
    
    # Process all pages concurrently with semaphore
    tasks = [translate_with_limit(page) for page in pages]
    translated_pages = await asyncio.gather(*tasks)
    
    # Sort by page number
    translated_pages.sort(key=lambda x: x["page_number"])
    
    return translated_pages


import json


def save_english_text(pages: List[Dict], output_path: str):
    """Save translated English text to file (TXT format)"""
    with open(output_path, "w", encoding="utf-8") as f:
        for page in pages:
            f.write(f"--- START PAGE {page['page_number']} ---\n")
            f.write(page['english_content'])
            f.write(f"\n--- END PAGE {page['page_number']} ---\n\n")
    print(f"  ✓ TXT saved: {output_path}")


def save_english_json(pages: List[Dict], output_path: str):
    """Save translated data as structured JSON"""
    data = {
        "stage": "phase2_translation",
        "description": "Hindi to English translation with page-wise structure",
        "total_pages": len(pages),
        "pages": [
            {
                "page_number": p['page_number'],
                "hindi_content": p.get('hindi_content', ''),
                "english_content": p.get('english_content', '')
            }
            for p in pages
        ]
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✓ JSON saved: {output_path}")


def get_full_english_text(pages: List[Dict]) -> str:
    """Combine all page translations into single text"""
    return "\n\n".join([p['english_content'] for p in pages])


if __name__ == "__main__":
    # Test
    test_pages = [
        {"page_number": 1, "content": "नमस्ते, यह एक परीक्षण है।"}
    ]
    
    result = asyncio.run(translate_hindi_to_english(test_pages))
    print(f"Translated: {result[0]['english_content']}")