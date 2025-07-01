import os
import logging
from flask import Blueprint, request, jsonify
from models import db, JD, Resume, Profile, MatchResult
from utils.parser import extract_text
from utils.matcher import compute_similarity_score
from utils.skill_extractor import extract_skills
from utils.explainer import generate_explanation
from utils.pdf_generator import generate_pdf_report

# ─────────────────────────────────────────────
# Logger Setup
# ─────────────────────────────────────────────
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

match_bp = Blueprint('match_bp', __name__)

# ─────────────────────────────────────────────
# Match JD → Consultant Profiles
# ─────────────────────────────────────────────
@match_bp.route('/match/jd-to-resumes', methods=['POST'])
def match_jd_to_profiles():
    try:
        jd_id = request.json.get('jd_id')
        logger.info(f"Received JD to Resumes match request for JD ID: {jd_id}")

        jd = JD.query.get(jd_id)
        if not jd:
            logger.warning(f"JD not found with ID: {jd_id}")
            return jsonify({"error": "JD not found"}), 404

        jd_text = extract_text(jd.file_path)
        jd_skills = extract_skills(jd_text)
        jd_domain = detect_domain(jd_text)
        profiles = Profile.query.all()

        logger.info(f"Matching against {len(profiles)} profiles")

        results = []
        for profile in profiles:
            profile_text = extract_text(profile.resume_path)
            profile_skills = extract_skills(profile_text)

            base_score = compute_similarity_score(jd_text, profile_text)
            if jd_domain and jd_domain.lower() in profile_text.lower():
                base_score += 0.05

            explanation = generate_explanation(jd_text, profile_text)
            label = get_label(base_score)

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
        logger.info("JD to Profile match completed successfully")
        return jsonify({"top_matches": results[:3]})

    except Exception as e:
        logger.exception("Error occurred in match_jd_to_profiles")
        return jsonify({"error": "Internal server error"}), 500

# ─────────────────────────────────────────────
# RESUME TO JDs (Reverse Match)
# ─────────────────────────────────────────────
@match_bp.route('/match/resume-to-jds', methods=['POST'])
def match_resume_to_jds():
    try:
        resume_id = request.json.get('resume_id')
        logger.info(f"Received Resume to JDs match request for Resume ID: {resume_id}")

        resume = Resume.query.get(resume_id)
        if not resume:
            logger.warning(f"Resume not found with ID: {resume_id}")
            return jsonify({"error": "Resume not found"}), 404

        res_text = extract_text(resume.file_path)
        res_skills = extract_skills(res_text)

        jds = JD.query.all()
        logger.info(f"Matching resume against {len(jds)} JDs")

        results = []
        for jd in jds:
            jd_text = extract_text(jd.file_path)
            jd_skills = extract_skills(jd_text)
            base_score = compute_similarity_score(jd_text, res_text)
            label = get_label(base_score)
            explanation = generate_explanation(jd_text, res_text)

            results.append({
                "jd_id": jd.id,
                "jd_file": os.path.basename(jd.file_path),
                "job_title": jd.job_title,
                "score": round(base_score, 2),
                "label": label,
                "explanation": explanation
            })

        results.sort(key=lambda x: x['score'], reverse=True)
        logger.info("Resume to JD match completed successfully")
        return jsonify({"top_matches": results[:3]})

    except Exception as e:
        logger.exception("Error occurred in match_resume_to_jds")
        return jsonify({"error": "Internal server error"}), 500

# ─────────────────────────────────────────────
# ONE-TO-ONE MATCH
# ─────────────────────────────────────────────
@match_bp.route('/match/one-to-one', methods=['POST'])
def one_to_one_match():
    try:
        jd_id = request.json.get('jd_id')
        resume_id = request.json.get('resume_id')
        logger.info(f"Received One-to-One match request for JD ID: {jd_id} and Resume ID: {resume_id}")

        jd = JD.query.get(jd_id)
        resume = Resume.query.get(resume_id)

        if not jd or not resume:
            logger.warning(f"Invalid JD or Resume ID provided: JD={jd_id}, Resume={resume_id}")
            return jsonify({"error": "Invalid IDs"}), 404

        jd_text = extract_text(jd.file_path)
        res_text = extract_text(resume.file_path)

        score = compute_similarity_score(jd_text, res_text)
        explanation = generate_explanation(jd_text, res_text)
        label = get_label(score)

        logger.info("One-to-One match completed successfully")
        return jsonify({
            "score": round(score, 2),
            "label": label,
            "explanation": explanation
        })

    except Exception as e:
        logger.exception("Error occurred in one_to_one_match")
        return jsonify({"error": "Internal server error"}), 500

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
