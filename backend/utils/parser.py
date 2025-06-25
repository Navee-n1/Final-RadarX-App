import os
import re
import docx2txt
import PyPDF2
import spacy

nlp = spacy.load("en_core_web_sm")

def extract_text(path):
    ext = os.path.splitext(path)[1].lower()
    text = ""

    try:
        if ext == ".pdf":
            with open(path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                text = " ".join(page.extract_text() or "" for page in reader.pages)
        elif ext == ".docx":
            text = docx2txt.process(path)
        else:
            raise ValueError("Unsupported file type")
    except Exception as e:
        text = f"Error reading file: {e}"

    return clean_text(text)

def clean_text(text):
    lines = text.split("\n")
    lines = [line.strip() for line in lines if line.strip()]
    return "\n".join(lines)

def extract_basic_info(text):
    email_match = re.search(r'\b[\w\.-]+@[\w\.-]+\.\w+\b', text)
    email = email_match.group(0) if email_match else None

    # Try NLP-based name extraction (first person detected)
    doc = nlp(text[:500])
    name = None
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            name = ent.text.strip()
            break

    # Fallback to first line
    if not name:
        name = text.strip().split("\n")[0]

    return {
        "name": name,
        "email": email
    }

# Optional: Stubs to expand later
def extract_projects(text):
    return []  # Placeholder for future pattern-based extraction

def extract_certifications(text):
    return []  # Placeholder for phrases like "Certified in ..."
