import os
import re
import docx2txt
import PyPDF2
import spacy
import logging


nlp = spacy.load("en_core_web_sm")

logger = logging.getLogger(__name__)

def extract_text(path):
    ext = os.path.splitext(path)[1].lower()
    try:
        if ext == ".pdf":
            with open(path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                text = " ".join(page.extract_text() or "" for page in reader.pages)
        elif ext == ".docx":
            text = docx2txt.process(path)
        else:
            logger.warning(f"Unsupported file extension {ext} for file {path}")
            return None
        return clean_text(text) if text and len(text.strip()) >= 30 else None
    except Exception as e:
        logger.error(f"Error extracting text from {path}: {e}")
        return None
    
def clean_text(text):
    return "\n".join([line.strip() for line in text.split("\n") if line.strip()])

def extract_basic_info(text):
    email_match = re.search(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', text)
    email = email_match.group(0) if email_match else None
    name = None
    try:
        doc = nlp(text[:500])
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                name = ent.text.strip()
                break
    except:
        pass
    if not name:
        name = text.strip().split("\n")[0]
    return {"name": name, "email": email}

def extract_experience(text):
    matches = re.findall(r'(\d{1,2})\+?\s?(?:years?|yrs?)', text.lower())
    return max([int(m) for m in matches if int(m) < 40], default=0)

def extract_projects(text):
    return []

def extract_certifications(text):
    return []
