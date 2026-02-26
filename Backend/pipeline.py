"""
Simplified Hackathon Pipeline
Orchestrates all 4 phases using modular imports
Saves both .txt and .json outputs for each phase
"""

import os
import json
import asyncio
from datetime import datetime
from phases import (
    extract_pdf_text, save_extracted_text, save_extracted_json,
    translate_hindi_to_english, save_english_text, save_english_json, get_full_english_text,
    analyze_case, save_analysis,
    extract_entities, save_ner_json
)


async def process_chargesheet(pdf_path: str, output_dir: str = "./results"):
    """
    Process a chargesheet PDF through all phases
    
    Args:
        pdf_path: Path to Hindi PDF file
        output_dir: Directory to save results
    
    Returns:
        Dict with all outputs (A, B, C, D)
    """
    print(f"\n{'='*70}")
    print("HACKATHON PIPELINE - CHARGESHEET PROCESSING")
    print(f"{'='*70}")
    
    case_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs(output_dir, exist_ok=True)
    
    # Phase 1: Extract PDF text
    print("\n" + "="*70)
    print("PHASE 1: PDF TEXT EXTRACTION")
    print("="*70)
    
    pages = extract_pdf_text(pdf_path)
    print(f"✓ Extracted {len(pages)} pages")
    
    # Save Phase 1 outputs
    hindi_txt_path = os.path.join(output_dir, f"{case_id}_phase1_hindi.txt")
    hindi_json_path = os.path.join(output_dir, f"{case_id}_phase1_hindi.json")
    save_extracted_text(pages, hindi_txt_path)
    save_extracted_json(pages, hindi_json_path)
    
    # Phase 2: Translate to English
    print("\n" + "="*70)
    print("PHASE 2: HINDI TO ENGLISH TRANSLATION")
    print("="*70)
    
    translated_pages = await translate_hindi_to_english(pages, batch_size=5)
    print(f"✓ Translated {len(translated_pages)} pages")
    
    # Save Phase 2 outputs
    english_txt_path = os.path.join(output_dir, f"{case_id}_phase2_english.txt")
    english_json_path = os.path.join(output_dir, f"{case_id}_phase2_english.json")
    save_english_text(translated_pages, english_txt_path)
    save_english_json(translated_pages, english_json_path)
    
    # Get full English text for analysis
    english_text = get_full_english_text(translated_pages)
    
    # Phase 3: Analysis (Output A, B, C)
    print("\n" + "="*70)
    print("PHASE 3: CASE ANALYSIS")
    print("="*70)
    
    analysis_result = analyze_case(english_text)
    print("✓ Generated Output_A (Summary)")
    print("✓ Generated Output_B (Classification)")
    print("✓ Generated Output_C (Checklist)")
    
    # Save Phase 3 output
    analysis_path = os.path.join(output_dir, f"{case_id}_phase3_analysis.json")
    save_analysis(analysis_result, analysis_path)
    
    # Phase 4: NER (Output D)
    print("\n" + "="*70)
    print("PHASE 4: NAMED ENTITY RECOGNITION")
    print("="*70)
    
    entities = extract_entities(english_text)
    analysis_result["Output_D"] = entities
    print("✓ Extracted entities:")
    for entity_type, items in entities.items():
        if items:
            print(f"  - {entity_type}: {len(items)} items")
    
    # Save Phase 4 output
    ner_path = os.path.join(output_dir, f"{case_id}_phase4_ner.json")
    save_ner_json(entities, ner_path)
    
    # Save final combined report
    final_report_path = os.path.join(output_dir, f"{case_id}_final_report.json")
    save_analysis(analysis_result, final_report_path)
    print(f"\n✓ Final report saved to {final_report_path}")
    
    # Summary of all outputs
    print("\n" + "="*70)
    print("OUTPUT FILES GENERATED")
    print("="*70)
    print(f"\nPhase 1 (Extraction):")
    print(f"  TXT: {hindi_txt_path}")
    print(f"  JSON: {hindi_json_path}")
    print(f"\nPhase 2 (Translation):")
    print(f"  TXT: {english_txt_path}")
    print(f"  JSON: {english_json_path}")
    print(f"\nPhase 3 (Analysis):")
    print(f"  JSON: {analysis_path}")
    print(f"\nPhase 4 (NER):")
    print(f"  JSON: {ner_path}")
    print(f"\nFinal Report:")
    print(f"  JSON: {final_report_path}")
    
    print("\n" + "="*70)
    print("PIPELINE COMPLETE")
    print("="*70)
    
    return analysis_result


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    else:
        pdf_path = "full_case_distinct.txt"  # Default test file
    
    result = asyncio.run(process_chargesheet(pdf_path))
    print("\nPreview of results:")
    print(json.dumps(result, indent=2, ensure_ascii=False)[:1000])