import os
from flask import Blueprint, request, jsonify
from models import db, JD, Profile, MatchResult
from utils.parser import extract_text
from utils.matcher import compute_similarity_score
from utils.skill_extractor import extract_skills
from utils.explainer import generate_explanation

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
