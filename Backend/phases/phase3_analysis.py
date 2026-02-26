"""
Phase 3: Case Analysis (Core - using structure_out.ipynb logic)
Generates Output_A (Summary), Output_B (Classification), Output_C (Checklist)
"""

import os
import json
import google.generativeai as genai
from typing import Dict

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))


def load_checklists(checklist_path: str = "checklists.json") -> Dict:
    """Load static checklist configuration"""
    with open(checklist_path, "r", encoding="utf-8") as f:
        return json.load(f)


def analyze_case(english_text: str, checklists: Dict = None) -> Dict:
    """
    Analyze case and generate Output_A, Output_B, Output_C
    
    Args:
        english_text: Translated English case text
        checklists: Checklist schema (loaded from JSON)
    
    Returns:
        Dict with Output_A, Output_B, Output_C
    """
    if checklists is None:
        checklists = load_checklists()
    
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
    You are a Legal AI Assistant. Analyze the provided English Case Diary text and map it to the Checklist Schema.
    
    Case Diary Text:
    {english_text}
    
    Checklist Schema:
    {json.dumps(checklists)}
    
    TASK:
    Generate a JSON response with exactly three keys: 'Output_A', 'Output_B', and 'Output_C'.
    
    Output_A (Summary): Extract FIR number, date, Police Station, Accused/Victim names, incident facts, and Legal Sections.
    
    Output_B (Classification): Identify the crime type from the schema. If no sections match, return {{"crime_type": "UNKNOWN", "reason": "No matching sections found"}}.
    
    Output_C (Checklist): For the detected crime type, evaluate every 'required_item'. 
    - Use '✅ PRESENT' with a brief detail if found.
    - Use '❌ MISSING' if not found.
    - Use '⚠ PARTIAL' if referenced but incomplete, stating what is missing.
    
    STRICT REQUIREMENT: Return ONLY valid JSON.
    """
    
    try:
        response = model.generate_content(prompt)
        # Clean potential markdown formatting from LLM response
        json_str = response.text.replace('```json', '').replace('```', '').strip()
        result = json.loads(json_str)
        return result
    except Exception as e:
        print(f"Error in analysis: {e}")
        return {
            "Output_A": {
                "FIR_Number": "Error",
                "Date": "Error",
                "Police_Station": "Error",
                "Accused_Details": "Error",
                "Victim_Details": "Error",
                "Incident_Facts": "Error",
                "Legal_Sections": "Error"
            },
            "Output_B": {
                "crime_type": "UNKNOWN",
                "reason": f"Analysis error: {str(e)}"
            },
            "Output_C": {}
        }


def save_analysis(result: Dict, output_path: str = "final_hackathon_report.json"):
    """Save analysis result to JSON file"""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=4, ensure_ascii=False)
    print(f"Analysis saved to {output_path}")


if __name__ == "__main__":
    # Test with sample text
    sample_text = """
    Case No. 999/2020 dated 12/07/2020 at GHI Police Station.
    Accused: Unknown thieves
    Victim: XYZ, aged 28 years
    Sections: IPC 379/461
    Incident: Theft in mobile shop 'Maa Saraswati Telecom'
    Stolen: Rs. 8000 cash and mobile phones
    """
    
    result = analyze_case(sample_text)
    print(json.dumps(result, indent=2, ensure_ascii=False))