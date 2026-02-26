from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import json
import uuid
from datetime import datetime
from typing import List, Dict
import asyncio
import sys
from sentence_transformers import SentenceTransformer
import numpy as np
from pydantic import BaseModel
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pipeline import process_chargesheet

app = FastAPI(title="Chargesheet Processor")
# Load embedding model once (local, no OpenAI)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage
UPLOAD_DIR = "./uploads"
RESULTS_DIR = "./results"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

cases_db: Dict[str, dict] = {}

class ChecklistItem(BaseModel):
    status: str
    detail: str
    matched_text: Optional[str] = None
    source_page: Optional[int] = None
    similarity_score: Optional[float] = None


class SimilarityRequest(BaseModel):
    document_text: str
    checklist: Dict[str, ChecklistItem]

def cosine_similarity(vec1, vec2):
    vec1 = np.array(vec1)
    vec2 = np.array(vec2)
    return float(np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2)))

@app.get("/")
async def root():
    return {"message": "Chargesheet Processor API"}

@app.post("/compute-similarity")
async def compute_similarity(payload: SimilarityRequest):
    """
    Compute cosine similarity between document text and each checklist item
    using local sentence-transformer embeddings.
    """

    document_text = payload.document_text
    checklist = payload.checklist

    # Prepare all texts at once (efficient batch embedding)
    texts = [document_text] + [
        item.matched_text if item.matched_text else item.detail
        for item in checklist.values()
    ]

    embeddings = embedding_model.encode(texts)

    document_embedding = embeddings[0]
    item_embeddings = embeddings[1:]

    updated_checklist = {}

    for (key, item), emb in zip(checklist.items(), item_embeddings):
        similarity = cosine_similarity(document_embedding, emb)

        updated_checklist[key] = {
            **item.dict(),
            "similarity_score": round(similarity, 4)
        }

    return updated_checklist

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload PDF and start processing"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(400, "Only PDF files allowed")
    
    case_id = str(uuid.uuid4())[:8]
    file_path = os.path.join(UPLOAD_DIR, f"{case_id}_{file.filename}")
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    case = {
        "id": case_id,
        "filename": file.filename,
        "status": "uploaded",
        "stages": [
            {"name": "upload", "status": "completed", "message": "File uploaded"},
            {"name": "extract", "status": "pending", "message": "Waiting..."},
            {"name": "translate", "status": "pending", "message": "Waiting..."},
            {"name": "analyze", "status": "pending", "message": "Waiting..."},
            {"name": "format", "status": "pending", "message": "Waiting..."}
        ],
        "created_at": datetime.now().isoformat(),
        "result": None
    }
    cases_db[case_id] = case
    
    # Start background processing
    asyncio.create_task(process_case(case_id, file_path))
    
    return {"case_id": case_id, "status": "processing"}


@app.get("/cases")
async def get_cases():
    """Get all processed cases"""
    return list(cases_db.values())


@app.get("/cases/{case_id}")
async def get_case(case_id: str):
    """Get specific case status"""
    if case_id not in cases_db:
        raise HTTPException(404, "Case not found")
    return cases_db[case_id]


@app.get("/cases/{case_id}/result")
async def get_result(case_id: str):
    """Get case result JSON"""
    case = cases_db.get(case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    if case["status"] != "completed":
        raise HTTPException(400, "Processing not complete")
    return case.get("result", {})


async def process_case(case_id: str, file_path: str):
    """REAL processing pipeline using modular phases"""
    case = cases_db[case_id]
    
    try:
        # Stage 1: Extract
        case["stages"][1]["status"] = "in_progress"
        case["stages"][1]["message"] = "Extracting Hindi text from PDF..."
        
        from phases.phase1_extraction import extract_pdf_text, save_extracted_json
        pages = extract_pdf_text(file_path)
        with open(os.path.join(RESULTS_DIR, f"{case_id}_extracted.txt"), "w", encoding="utf-8") as f:
            json.dump(pages, f, indent=2, ensure_ascii=False)

        case["stages"][1]["status"] = "completed"
        case["stages"][1]["message"] = f"Extracted {len(pages)} pages"
        
        # Stage 2: Translate
        case["stages"][2]["status"] = "in_progress"
        case["stages"][2]["message"] = "Translating to English..."
        
        from phases.phase2_translation import translate_hindi_to_english, get_full_english_text
        translated_pages = await translate_hindi_to_english(pages, batch_size=5)
        
        case["stages"][2]["status"] = "completed"
        case["stages"][2]["message"] = f"Translated {len(translated_pages)} pages"
        
        # Get full text
        english_text = get_full_english_text(translated_pages)
        
        # Stage 3: Analyze
        case["stages"][3]["status"] = "in_progress"
        case["stages"][3]["message"] = "Analyzing case with AI..."
        
        from phases.phase3_analysis import analyze_case
        result = analyze_case(english_text)
        
        case["stages"][3]["status"] = "completed"
        case["stages"][3]["message"] = "Analysis complete"
        
        # Stage 4: NER
        case["stages"][4]["status"] = "in_progress"
        case["stages"][4]["message"] = "Extracting entities..."
        
        from phases.phase4_ner import extract_entities
        entities = extract_entities(english_text)
        result["Output_D"] = entities
        
        case["stages"][4]["status"] = "completed"
        case["stages"][4]["message"] = f"Found {sum(len(v) for v in entities.values())} entities"
        case["status"] = "completed"
        case["result"] = result
        
        # Save to file
        result_path = os.path.join(RESULTS_DIR, f"{case_id}_result.json")
        with open(result_path, "w", encoding="utf-8") as f:
            json.dump(case, f, indent=2, ensure_ascii=False)
            
        print(f"✓ Case {case_id} processed successfully")
        
    except Exception as e:
        print(f"✗ Error processing case {case_id}: {e}")
        case["status"] = "error"
        case["error"] = str(e)
        case["stages"][-1]["status"] = "error"
        case["stages"][-1]["message"] = f"Error: {str(e)}"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)