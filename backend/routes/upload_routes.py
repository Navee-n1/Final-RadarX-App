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

    if not file:
        return jsonify({"error": "No JD file provided"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER_JD, filename)
    file.save(save_path)

    jd = JD(file_path=save_path, uploaded_by=uploaded_by, project_code=project_code)
    db.session.add(jd)
    db.session.commit()

    return jsonify({"message": "JD uploaded", "jd_id": jd.id})


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

    if not all([file, emp_id, name]):
        return jsonify({"error": "Missing emp_id, name or file"}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(UPLOAD_FOLDER_RESUME, filename)
    file.save(save_path)

    text = extract_text(save_path)
    skills = extract_skills(text)
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
        skills=", ".join(skills),
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
def list_jds():
    jds = JD.query.order_by(JD.created_at.desc()).all()
    return jsonify([
        {
            "id": jd.id,
            "project_code": jd.project_code or "N/A",
            "uploaded_by": jd.uploaded_by or "unknown",
            "created_at": jd.created_at.strftime('%Y-%m-%d %H:%M')
        } for jd in jds
    ])


# ────────────────────────────────
# Estimate experience from raw text
# ────────────────────────────────
def estimate_experience(text):
    matches = re.findall(r'(\d{1,2})\+?\s?(?:years?|yrs?)', text.lower())
    numbers = [int(m) for m in matches if int(m) < 40]
    return max(numbers) if numbers else 0
