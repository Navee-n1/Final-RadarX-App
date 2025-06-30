import os
import re
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from models import db, JD, Resume, Profile
from utils.parser import extract_text
from utils.skill_extractor import extract_skills

upload_bp = Blueprint('upload_bp', __name__)

# Define upload paths
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER_JD = os.path.join(BASE_DIR, '..', 'uploads', 'jds')
UPLOAD_FOLDER_RESUME = os.path.join(BASE_DIR, '..', 'uploads', 'resumes')
UPLOAD_FOLDER_EXCEL = os.path.join(BASE_DIR, '..', 'uploads', 'excel')

# Ensure folders exist
os.makedirs(UPLOAD_FOLDER_JD, exist_ok=True)
os.makedirs(UPLOAD_FOLDER_RESUME, exist_ok=True)
os.makedirs(UPLOAD_FOLDER_EXCEL, exist_ok=True)

# ────────────────────────────────
# Upload JD
# ────────────────────────────────
@upload_bp.route('/upload-jd', methods=['POST'])
def upload_jd():
    file = request.files.get('file')
    uploaded_by = request.form.get('uploaded_by', 'anonymous')
    project_code = request.form.get('project_code', 'GENERIC')
    job_title = request.form.get('job_title')  # ✅ Accept job title from frontend

    if not file:
        return jsonify({"error": "No JD file provided"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER_JD, filename)
    file.save(save_path)

    jd = JD(
        file_path=save_path,
        uploaded_by=uploaded_by,
        project_code=project_code,
        job_title=job_title  # ✅ Store it in DB
    )
    db.session.add(jd)
    db.session.commit()

    return jsonify({"message": "JD uploaded", "jd_id": jd.id, "job_title": jd.job_title})


# ────────────────────────────────
# Upload Legacy Resume (no profile)
# ────────────────────────────────
@upload_bp.route('/upload-resume', methods=['POST'])
def upload_resume():
    file = request.files.get('file')
    name = request.form.get('name', file.filename)

    if not file:
        return jsonify({"error": "No resume provided"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER_RESUME, filename)
    file.save(save_path)

    resume = Resume(name=name, file_path=save_path)
    db.session.add(resume)
    db.session.commit()

    return jsonify({"message": "Resume uploaded", "resume_id": resume.id})


# ────────────────────────────────
# Upload Consultant Profile (emp_id, name, vertical + resume)
# ────────────────────────────────
@upload_bp.route('/upload-profile', methods=['POST'])
def upload_profile():
    file = request.files.get('file')
    emp_id = request.form.get('emp_id')
    name = request.form.get('name')
    vertical = request.form.get('vertical', 'N/A')
    manual_skills = request.form.get('skills')  # ✅ Get manual skills from frontend
 
    if not all([file, emp_id, name]):
        return jsonify({"error": "Missing emp_id, name or file"}), 400
 
    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER_RESUME, filename)
    file.save(save_path)
 
    text = extract_text(save_path)
 
    # ✅ Use manual skills if provided, else fallback to extracted
    if manual_skills and manual_skills.strip():
        skills_to_use = manual_skills
    else:
        extracted = extract_skills(text)
        skills_to_use = ", ".join(extracted)
 
    manual_experience = request.form.get('experience_years')  # this must match the frontend key
 
    if manual_experience and manual_experience.strip():
        try:
            experience_years = float(manual_experience.strip())
        except ValueError:
            experience_years = estimate_experience(text)  # fallback
    else:
        experience_years = estimate_experience(text)
        
    # Avoid duplicate emp_id
    existing = Profile.query.filter_by(emp_id=emp_id).first()
    if existing:
        db.session.delete(existing)
        db.session.commit()
 
    profile = Profile(
        emp_id=emp_id,
        name=name,
        vertical=vertical,
        skills=skills_to_use,  # ✅ Clean, correct value
        experience_years=experience_years,
        resume_path=save_path
    )
    db.session.add(profile)
    db.session.commit()
 
    return jsonify({"message": "Profile uploaded", "profile_id": profile.id})


# ────────────────────────────────
# View all uploaded JDs
# ────────────────────────────────
@upload_bp.route('/jds', methods=['GET'])
def get_all_jds():
    jds = JD.query.all()
    return jsonify([{
        "id": jd.id,
        "uploaded_by": jd.uploaded_by,
        "project_code": jd.project_code,
        "job_title": jd.job_title if jd.job_title else "No Title",
        "created_at": jd.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for jd in jds])

@upload_bp.route('/jds/filterable', methods=['GET'])
def get_jds_for_filters():
    clean_jds = []
 
    for jd in JD.query.all():
        jd_text = extract_text(jd.file_path)
        skills = extract_skills(jd_text)
 
        # ✅ Cleaned skills: remove symbols, short tokens
        cleaned_skills = [s.lower() for s in skills if len(s) > 2 and s.isascii() and s.isalnum()]
 
        # ✅ Improved experience extraction using regex
        experience_match = re.search(r'(\d+)\s*\+?\s*(years|yrs)', jd_text.lower())
        if experience_match:
            experience = int(experience_match.group(1))
        elif "fresher" in jd_text.lower():
            experience = 0
        else:
            experience = 1  # Default fallback
 
        # ✅ Use mock status logic (could improve later)
        status = "Open" if jd.id % 2 == 0 else "Review"
 
        print(f"JD ID: {jd.id}, Skills: {cleaned_skills}, Experience: {experience}")  # For debug
 
        clean_jds.append({
            "id": jd.id,
            "job_title": jd.job_title or "No Title",
            "uploaded_by": jd.uploaded_by,
            "project_code": jd.project_code,
            "skills": cleaned_skills[:10],   # Limit to 10 to avoid UI overload
            "experience": experience,
            "status": status,
            "created_at": jd.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
 
    return jsonify(clean_jds)

@upload_bp.route('/refresh-jd-skills', methods=['POST'])
def refresh_skills_for_all_jds():
    from utils.skill_extractor import extract_skills
    updated = 0
    for jd in JD.query.all():
        jd_text = extract_text(jd.file_path)
        skills = extract_skills(jd_text)
        cleaned = [s.lower() for s in skills if len(s) > 2 and s.isascii() and s.isalnum()]
        jd.skills = ", ".join(cleaned)
        updated += 1
    db.session.commit()
    return jsonify({"message": f"✅ Refreshed skills for {updated} JDs."})
 
# ────────────────────────────────
# Estimate experience from raw text
# ────────────────────────────────
def estimate_experience(text):
    matches = re.findall(r'(\d{1,2})\+?\s?(?:years?|yrs?)', text.lower())
    numbers = [int(m) for m in matches if int(m) < 40]
    return max(numbers) if numbers else 0
