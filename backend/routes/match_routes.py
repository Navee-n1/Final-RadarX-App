import os
from flask import Blueprint, request, jsonify
from models import db, JD, Profile, MatchResult
from models import db, JD, Resume, MatchResult

from utils.parser import extract_text
from utils.matcher import compute_similarity_score
from utils.skill_extractor import extract_skills
from utils.explainer import generate_explanation
from utils.pdf_generator import generate_pdf_report

match_bp = Blueprint('match_bp', __name__)

# ─────────────────────────────────────────────
# Match JD → Consultant Profiles
# ─────────────────────────────────────────────
@match_bp.route('/match/jd-to-resumes', methods=['POST'])
def match_jd_to_profiles():
    jd_id = request.json.get('jd_id')
    jd = JD.query.get(jd_id)
    if not jd:
        return jsonify({"error": "JD not found"}), 404

    jd_text = extract_text(jd.file_path)
    jd_skills = extract_skills(jd_text)
    jd_domain = detect_domain(jd_text)

    results = []
    profiles = Profile.query.all()

    for profile in profiles:
        profile_text = extract_text(profile.resume_path)
        profile_skills = extract_skills(profile_text)

        base_score = compute_similarity_score(jd_text, profile_text)

        if jd_domain and jd_domain.lower() in profile_text.lower():
            base_score += 0.05  # boost if domain matches

        explanation = generate_explanation(jd_text, profile_text)
        label = get_label(base_score)

        # Save to DB
        match = MatchResult(
            jd_id=jd.id,
            profile_id=profile.id,
            score=round(base_score, 2),
            explanation=str(explanation)
        )
        db.session.add(match)
        db.session.commit()

        results.append({
            "profile_id": profile.id,
            "emp_id": profile.emp_id,
            "name": profile.name,
            "vertical": profile.vertical,
            "resume_path": profile.resume_path,
            "score": round(base_score, 2),
            "label": label,
            "explanation": explanation
        })

    results.sort(key=lambda x: x['score'], reverse=True)
    return jsonify({"top_matches": results[:3]})

# ─────────────────────────────────────────────
# RESUME TO JDs (Reverse Match)
# ─────────────────────────────────────────────
@match_bp.route('/match/resume-to-jds', methods=['POST'])
def match_resume_to_jds():
    resume_id = request.json.get('resume_id')
    resume = Resume.query.get(resume_id)
    if not resume:
        return jsonify({"error": "Resume not found"}), 404
 
    res_text = extract_text(resume.file_path)
    res_skills = extract_skills(res_text)
 
    results = []
    jds = JD.query.all()
    for jd in jds:
        jd_text = extract_text(jd.file_path)
        jd_skills = extract_skills(jd_text)
        base_score = compute_similarity_score(jd_text, res_text)
        label = get_label(base_score)
        explanation = generate_explanation(jd_text, res_text)
 
        results.append({
            "jd_id": jd.id,
            "jd_file": os.path.basename(jd.file_path),
            "job_title":jd.job_title,
            "score": round(base_score, 2),
            "label": label,
            "explanation": explanation
        })
 
    results.sort(key=lambda x: x['score'], reverse=True)
    return jsonify({"top_matches": results[:3]})
 
# ─────────────────────────────────────────────
# ONE-TO-ONE MATCH
# ─────────────────────────────────────────────
@match_bp.route('/match/one-to-one', methods=['POST'])
def one_to_one_match():
    jd_id = request.json.get('jd_id')
    resume_id = request.json.get('resume_id')
    jd = JD.query.get(jd_id)
    resume = Resume.query.get(resume_id)
 
    if not jd or not resume:
        return jsonify({"error": "Invalid IDs"}), 404
 
    jd_text = extract_text(jd.file_path)
    res_text = extract_text(resume.file_path)
 
    score = compute_similarity_score(jd_text, res_text)
    explanation = generate_explanation(jd_text, res_text)
    label = get_label(score)
 
    return jsonify({
        "score": round(score, 2),
        "label": label,
        "explanation": explanation
    })
# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def get_label(score):
    if score >= 0.85:
        return "✅ Highly Recommended"
    elif score >= 0.70:
        return "☑️ Recommended"
    elif score >= 0.50:
        return "🟡 Decent – Can Explore"
    else:
        return "🔴 Not Recommended"

def detect_domain(text):
    domains = ['banking', 'healthcare', 'ecommerce', 'automotive', 'insurance', 'retail']
    text = text.lower()
    for domain in domains:
        if domain in text:
            return domain
    return None
