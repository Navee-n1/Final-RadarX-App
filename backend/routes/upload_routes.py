import os
import json
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from models import db, JD, Resume
from utils.parser import extract_text
from sentence_transformers import SentenceTransformer
from models import Profile
import re
from utils.utils import log_agent_error
from utils.parser import extract_text
from utils.embedding import generate_embedding
from utils.skill_extractor import extract_skills
from flask import send_from_directory

upload_bp = Blueprint('upload_bp', __name__)

# Sentence Transformer Model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Upload Folders
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER_JD = os.path.join(BASE_DIR, '..', 'uploads', 'jds')
UPLOAD_FOLDER_RESUME = os.path.join(BASE_DIR, '..', 'uploads', 'resumes')
os.makedirs(UPLOAD_FOLDER_JD, exist_ok=True)
os.makedirs(UPLOAD_FOLDER_RESUME, exist_ok=True)



@upload_bp.route('/uploads/resumes/<path:filename>')
def serve_resume(filename):
    return send_from_directory(os.path.join(os.getcwd(), 'uploads', 'resumes'), filename)
 
 
 
@upload_bp.route('/jds/filterable', methods=['GET'])
def get_jds_for_filters():
    from utils.skill_extractor import extract_skills
    from utils.parser import extract_text
    import re
 
    clean_jds = []
 
    for jd in JD.query.all():
        jd_text = jd.extracted_text or extract_text(jd.file_path) or ""
 
        # Extract skills
        skills = extract_skills(jd_text)
        cleaned_skills = [s.lower() for s in skills if len(s) > 2 and s.isascii() and s.isalnum()]
 
        # Extract experience
        experience_match = re.search(r'(\d+)\s*\+?\s*(years|yrs)', jd_text.lower())
        if experience_match:
            experience = int(experience_match.group(1))
        elif "fresher" in jd_text.lower():
            experience = 0
        else:
            experience = 3  # <-- ✅ fallback to 3, not 1
 
        # ✅ Use real DB status from jd.status, fallback to "Pending" if not set
        status = jd.status or "Pending"
 
        clean_jds.append({
            "id": jd.id,
            "job_title": jd.job_title or "No Title",
            "uploaded_by": jd.uploaded_by,
            "project_code": jd.project_code,
            "skills": cleaned_skills[:10],
            "experience": experience,
            "status": status,  # ✅ Real status used here
            "created_at": jd.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
 
    return jsonify(clean_jds)
 

    
# Upload JD (with embedding)
# ───────────────────────────────
@upload_bp.route('/upload-jd', methods=['POST'])
def upload_jd():
    file = request.files.get('file')
    uploaded_by = request.form.get('uploaded_by', 'anonymous')
    project_code = request.form.get('project_code', 'GENERIC')
    job_title = request.form.get('job_title', 'Untitled')

    if not file:
        return jsonify({"error": "No JD file provided"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER_JD, filename)
    file.save(save_path)

    text = extract_text(save_path)
    embedding = model.encode(text).tolist()

    jd = JD(
        file_path=f"/uploads/resumes/{filename}",  # for Resume
        uploaded_by=uploaded_by,
        project_code=project_code,
        job_title=job_title,
        extracted_text=text,
        embedding_vector=json.dumps(embedding)
    )

    db.session.add(jd)
    db.session.commit()

    return jsonify({
        "message": "JD uploaded",
        "jd_id": jd.id,
        "job_title": jd.job_title
    })


# ───────────────────────────────
# Upload Resume (with embedding)
# ───────────────────────────────
@upload_bp.route('/upload-resume', methods=['POST'])
def upload_resume():
    file = request.files.get('file')
    name = request.form.get('name', file.filename)

    if not file:
        return jsonify({"error": "No resume provided"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER_RESUME, filename)
    file.save(save_path)

    text = extract_text(save_path)
    embedding = model.encode(text).tolist()

    resume = Resume(
        name=name,
        file_path=f"/uploads/resumes/{filename}",  # for Resume
        extracted_text=text,
        embedding_vector=json.dumps(embedding)
    )

    db.session.add(resume)
    db.session.commit()

    return jsonify({
        "message": "Resume uploaded",
        "resume_id": resume.id
    })

@upload_bp.route('/upload-profile', methods=['POST'])
def upload_profile():
    try:
        file = request.files.get('file')
        emp_id = request.form.get('emp_id')
        name = request.form.get('name')
        vertical = request.form.get('vertical', 'N/A')
        email = request.form.get('email')  # ✅ NEW
        manual_skills = request.form.get('skills')
        manual_experience = request.form.get('experience_years')
 
        if not all([file, emp_id, name, email]):
            return jsonify({"error": "Missing emp_id, name, email or file"}), 400
 
        filename = secure_filename(file.filename or f"{emp_id}_resume.pdf")
        save_path = os.path.join(UPLOAD_FOLDER_RESUME, filename)
        file.save(save_path)
 
        text = extract_text(save_path)
        if not text:
            raise ValueError("Resume unreadable or empty")
 
        embedding = generate_embedding(text)
        skills_to_use = manual_skills.strip() if manual_skills else ", ".join(extract_skills(text))
 
        try:
            experience_years = float(manual_experience.strip()) if manual_experience else estimate_experience(text)
        except:
            experience_years = estimate_experience(text)
 
        # Remove existing profile with same emp_id
        existing = Profile.query.filter_by(emp_id=emp_id).first()
        if existing:
            db.session.delete(existing)
            db.session.commit()
 
        profile = Profile(
            emp_id=emp_id,
            name=name,
            email=email,
            vertical=vertical,
            skills=skills_to_use,
            experience_years=experience_years,
            resume_path=f"/uploads/resumes/{filename}",
            extracted_text=text,
            embedding_vector=json.dumps(embedding)
        )
 
        db.session.add(profile)
        db.session.commit()
        return jsonify({ "message": "Profile uploaded", "profile_id": profile.id })
 
    except Exception as e:
        log_agent_error("UploadProfileError", str(e), method="upload-profile")
        return jsonify({"error": "Profile upload failed"}), 500

def estimate_experience(text):
    matches = re.findall(r'(\d{1,2})\+?\s?(?:years?|yrs?)', text.lower())
    return max([int(m) for m in matches if int(m) < 40], default=0)
