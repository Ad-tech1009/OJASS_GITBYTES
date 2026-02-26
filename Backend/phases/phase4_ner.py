"""
Phase 4: Named Entity Recognition (NER) - Bonus Stage 2A
Extracts entities: PERSON, LEGAL_SECTION, DATE_TIME, LOCATION, DOCUMENT, AMOUNT
"""

import os
import json
import re
from typing import List, Dict
import google.generativeai as genai

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))


def extract_entities(english_text: str) -> Dict:
    """
    Extract named entities from case text
    
    Returns:
        Dict with entity types as keys
    """
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
    Extract legal entities from this police case diary text.
    
    Text:
    {english_text[:4000]}
    
    Extract these entity types:
    1. PERSON - Names of accused, victims, witnesses, officers (with role: ACCUSED/VICTIM/WITNESS/OFFICER)
    2. LEGAL_SECTION - IPC sections, NDPS sections, IT Act sections (e.g., "IPC 379", "NDPS 20")
    3. DATE_TIME - Dates and times (with role: FIR_DATE/OCCURRENCE_DATE/ARREST_DATE if identifiable)
    4. LOCATION - Addresses, police station names, crime scene locations
    5. DOCUMENT - FIR, MLC report, seizure memo, FSL report, panchnama
    6. AMOUNT - Stolen property values, drug quantities, money amounts
    
    Return ONLY JSON:
    {{
        "entities": [
            {{"text": "John Doe", "type": "PERSON", "role": "ACCUSED"}},
            {{"text": "IPC 379", "type": "LEGAL_SECTION"}},
            {{"text": "12/07/2020", "type": "DATE_TIME", "role": "FIR_DATE"}},
            {{"text": "GHI Police Station", "type": "LOCATION"}},
            {{"text": "MLC Report", "type": "DOCUMENT"}},
            {{"text": "Rs. 8000", "type": "AMOUNT"}}
        ]
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        json_str = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(json_str)
        
        # Group entities by type
        grouped = {
            "PERSON": [],
            "LEGAL_SECTION": [],
            "DATE_TIME": [],
            "LOCATION": [],
            "DOCUMENT": [],
            "AMOUNT": []
        }
        
        for entity in data.get('entities', []):
            entity_type = entity.get('type')
            if entity_type in grouped:
                entity_dict = {"text": entity.get('text', '')}
                if entity.get('role'):
                    entity_dict['role'] = entity['role']
                
                # Avoid duplicates
                if entity_dict not in grouped[entity_type]:
                    grouped[entity_type].append(entity_dict)
        
        return grouped
        
    except Exception as e:
        print(f"NER extraction error: {e}")
        # Fallback to regex
        return extract_entities_regex(english_text)


def extract_entities_regex(text: str) -> Dict:
    """Fallback regex-based extraction"""
    entities = {
        "PERSON": [],
        "LEGAL_SECTION": [],
        "DATE_TIME": [],
        "LOCATION": [],
        "DOCUMENT": [],
        "AMOUNT": []
    }
    
    # Legal Sections
    section_patterns = [
        (r'IPC\s*(\d+[/\d]*)', 'IPC'),
        (r'NDPS\s*(\d+)', 'NDPS'),
        (r'IT\s*Act\s*(\d+[A-Z]?)', 'IT Act'),
    ]
    
    for pattern, prefix in section_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            entities["LEGAL_SECTION"].append({
                "text": f"{prefix} {match.group(1)}"
            })
    
    # Dates
    date_pattern = r'\d{1,2}[/.-]\d{1,2}[/.-]\d{4}'
    matches = re.finditer(date_pattern, text)
    for match in matches:
        entities["DATE_TIME"].append({"text": match.group()})
    
    # Amounts
    amount_patterns = [
        r'Rs\.?\s*[\d,]+(?:\s*/-)?',
        r'₹\s*[\d,]+',
        r'[\d,]+\s*(?:kg|gm|gram|ml|ltr)\b',
    ]
    for pattern in amount_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            entities["AMOUNT"].append({"text": match.group()})
    
    return entities


def save_ner_json(entities: Dict, output_path: str):
    """Save NER results as structured JSON"""
    data = {
        "stage": "phase4_ner",
        "description": "Named Entity Recognition results",
        "entity_types": list(entities.keys()),
        "entities": entities
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✓ JSON saved: {output_path}")


if __name__ == "__main__":
    sample = "Case No. 999/2020 dated 12/07/2020. IPC 379 applied. Stolen: Rs. 8000."
    result = extract_entities(sample)
    print(json.dumps(result, indent=2, ensure_ascii=False))
