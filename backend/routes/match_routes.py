import os
from flask import Blueprint, request, jsonify
from models import db, JD, Resume, Profile, MatchResult, MatchLearningCache
from utils.parser import extract_text
from utils.skill_extractor import compute_similarity_score
from utils.explainer import generate_explanation
from utils.utils import log_agent_error
from utils.matcher import compute_full_text_score, get_label
from utils.logger import logger
from models import LiveStatusTracker
import json
import time
from models import Config

def truncate_explanation_fields(explanation):
    """Limit gpt_summary to 2000 characters and ensure clean JSON"""
    if "gpt_summary" in explanation and isinstance(explanation["gpt_summary"], str):
        explanation["gpt_summary"] = explanation["gpt_summary"][:2000]
    return explanation
 
match_bp = Blueprint('match_bp', __name__)
 


@match_bp.route('/match/jd-to-resumes', methods=['POST'])
def match_jd_to_profiles():
    jd_id = request.json.get('jd_id')
    logger.info(f"JD-to-Resumes Match Request Received for JD ID: {jd_id}")

    status = LiveStatusTracker.query.filter_by(jd_id=jd_id).first()
    if status and status.compared and status.ranked:
        logger.warning(f"⚠️ JD ID {jd_id} already matched. Ignoring duplicate call.")
        return jsonify({"message": "Already matched", "top_matches": []}), 200

    jd = JD.query.get(jd_id)
    if not jd:
        logger.warning(f"JD not found with ID: {jd_id}")
        return jsonify({"error": "JD not found"}), 404

    jd_text = jd.extracted_text or extract_text(jd.file_path)
    if not jd_text:
        logger.error("JD text could not be extracted")
        return jsonify({"error": "Failed to extract JD text"}), 500

    # Fetch threshold from config and calculate inverse boost multiplier
    threshold_cfg = Config.query.filter_by(key="match_threshold").first()
    try:
        slider_val = float(threshold_cfg.value)   # Convert 1-100 to 0.01-1.0
        max_boost = 2.0  # Max boost multiplier (adjust as needed)
        if not (0.01 <= slider_val <= 1.0):
            slider_val = 1.0
    except Exception as e:
        logger.warning(f"Invalid match_threshold config value: {e}")
        slider_val = 1.0
        max_boost = 2.0

    multiplier = 1 + (1 - slider_val) * (max_boost - 1)

    all_matches = []

    with db.session.no_autoflush:
        for profile in Profile.query.all():
            try:
                resume_text = profile.extracted_text or extract_text(profile.resume_path)
                if not resume_text:
                    continue

                start_time = time.time()
                raw_score = compute_similarity_score(jd_text, resume_text)

                # Apply inverse boost multiplier and cap score at 1.0
                boosted_score = min(1.0, raw_score * multiplier)

                exp_start = time.time()
                explanation = generate_explanation(jd_text, resume_text, use_gpt=True)
                exp_latency = round(time.time() - exp_start, 4)
                latency = round(time.time() - start_time, 4)
                label = get_label(boosted_score)

                match = MatchResult(
                    jd_id=jd.id,
                    profile_id=profile.id,
                    resume_id=None,
                    score=round(boosted_score),
                    explanation=json.dumps(truncate_explanation_fields(explanation)),
                    match_type='jd-to-resume',
                    method=explanation.get("source", "TF-IDF"),
                    latency=latency,
                    explanation_latency=exp_latency
                )
                db.session.add(match)

                all_matches.append({
                    "resume_id": None,
                    "profile_id": profile.id,
                    "emp_id": profile.emp_id,
                    "name": profile.name,
                    "email": profile.email,
                    "vertical": profile.vertical,
                    "role": profile.role,
                    "status": profile.status,
                    "resume_path": profile.resume_path,
                    "score": round(boosted_score, 4),
                    "label": label,
                    "explanation": explanation,
                    "latency": latency,
                    "rank": len(all_matches) + 1
                })

            except Exception as e:
                db.session.rollback()
                log_agent_error("MatchError", str(e), method="jd-to-resume")
                continue

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        log_agent_error("DBCommitError", str(e), method="jd-to-resume")
        return jsonify({"error": "Database commit failed"}), 500

    jd.status = "Review"
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    # Remove duplicate matches based on emp_id before slicing
    seen_ids = set()
    unique_matches = []
    for match in all_matches:
        if match["emp_id"] not in seen_ids:
            seen_ids.add(match["emp_id"])
            unique_matches.append(match)

    unique_matches.sort(key=lambda x: x["score"], reverse=True)

    logger.info(f"Matching completed. Returning top {min(3, len(unique_matches))} profiles.")
    return jsonify({"top_matches": unique_matches[:3]})

@match_bp.route('/match/one-to-one', methods=['POST'])
def one_to_one_match():
    try:
        data = request.json
        jd_id = data.get("jd_id")
        resume_id = data.get("resume_id")
 
        if not jd_id or not resume_id:
            log_agent_error("MissingInput", f"JD_ID: {jd_id}, Resume_ID: {resume_id}", method="one-to-one")
            return jsonify({"error": "Missing JD or Resume ID"}), 400
 
        jd = JD.query.get(jd_id)
        resume = Resume.query.get(resume_id)
 
        if not jd or not resume:
            log_agent_error("MissingRecord", f"JD: {jd}, Resume: {resume}", method="one-to-one")
            return jsonify({"error": "JD or Resume not found"}), 404
 
        if not jd.embedding_vector or not resume.embedding_vector:
            log_agent_error("MissingEmbedding", f"JD or Resume missing embedding", method="one-to-one")
            return jsonify({"error": "JD or Resume missing embedding"}), 500
 
        start_time = time.time()
 
        # Compute similarity score
        score = compute_full_text_score(jd.embedding_vector, resume.embedding_vector)
        # Get label based on score
        label = get_label(score)
 
        exp_start = time.time()
        # Generate explanation dict
        explanation = generate_explanation(jd.extracted_text, resume.extracted_text, use_gpt=True)
        exp_latency = round(time.time() - exp_start, 4)
        latency = round(time.time() - start_time, 4)
 
        # ✅ Save to MatchResult
        match_entry = MatchResult(
                jd_id=jd.id,
                resume_id=resume.id,
                score=round(score, 4),
                explanation=json.dumps(truncate_explanation_fields(explanation)),
                match_type='one-to-one',
                method=explanation.get("source", "TF-IDF"),
                latency=latency,
                explanation_latency=exp_latency
         
        )
        db.session.add(match_entry)
        db.session.commit()
 
        return jsonify({
            "score": round(score, 2),
            "label": label,
            "explanation": explanation,
            "latency": latency,
            "explanation_latency": exp_latency
        })
 
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        print("Exception in one_to_one_match:", traceback_str)
        log_agent_error("OneToOneError", traceback_str, method="one-to-one")
        return jsonify({"error": "Internal server error"}), 500
 
 
# ─────────────────────────────────────────────
# JD → Consultant Profile Match
# ─────────────────────────────────────────────
@match_bp.route('/match/resume-to-jds', methods=['POST'])
def match_resume_to_jds():
    data = request.json
    resume_id = data.get('resume_id')
    profile_id = data.get('profile_id')
 
    resume = None
    if resume_id:
        resume = Resume.query.get(resume_id)
    elif profile_id:
        profile = Profile.query.get(profile_id)
        if profile:
            resume = type("ResumeLike", (), {
                "id": None,
                "extracted_text": profile.extracted_text,
                "file_path": profile.resume_path
            })()
 
    if not resume:
        return jsonify({"error": "No resume_id or profile_id provided"}), 400
 
    resume_text = resume.extracted_text or extract_text(resume.file_path)
    if not resume_text:
        return jsonify({"error": "Failed to extract resume text"}), 500
 
    all_matches = []
    for jd in JD.query.all():
        try:
            jd_text = jd.extracted_text or extract_text(jd.file_path)
            if not jd_text:
                continue
            score = compute_similarity_score(jd_text, resume_text)
            all_matches.append({
                "jd": jd,
                "jd_text": jd_text,
                "score": round(score, 4)
            })
        except Exception as e:
            log_agent_error("PreMatchError", str(e), method="resume-to-jd")
            continue
 
    top_matches = sorted(all_matches, key=lambda x: x["score"], reverse=True)[:3]
    results = []
 
    for i, match in enumerate(top_matches, start=1):
        jd = match["jd"]
        jd_text = match["jd_text"]
        score = match["score"]
        try:
            explanation = generate_explanation(jd_text, resume_text, use_gpt=True)
            new_match = MatchResult(
jd_id=jd.id,
                resume_id=resume_id if resume_id else None,
                score=score,
                explanation=json.dumps(truncate_explanation_fields(explanation)),
                match_type='resume-to-jd',
                method=explanation.get("source", "TF-IDF"),
                latency=0,
                explanation_latency=0
            )
            db.session.add(new_match)
            results.append({
"jd_id": jd.id,
                "jd_file": os.path.basename(jd.file_path),
                "job_title": jd.job_title,
                "score": score,
                "label": get_label(score),
                "explanation": explanation,
                "rank": i
            })
        except Exception as e:
            db.session.rollback()
            log_agent_error("ExplanationError", str(e), method="resume-to-jd")
            continue
 
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        log_agent_error("DBCommitError", str(e), method="resume-to-jd")
        return jsonify({"error": "Database commit failed"}), 500
 
    return jsonify({"top_matches": results})
 
# ─────────────────────────────────────────────
# Match Engine Health Check
# ─────────────────────────────────────────────
@match_bp.route('/match/health', methods=['GET'])
def match_health():
    return jsonify({"status": "Match engine ready ✅"})
 
 
 
# ─────────────────────────────────────────────
# Scoring Label
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
 
@match_bp.route('/match/results/<int:jd_id>', methods=['GET'])
def get_existing_matches(jd_id):
    matches = MatchResult.query.filter_by(jd_id=jd_id).order_by(MatchResult.score.desc()).limit(10).all()
    if not matches:
        return jsonify({"top_matches": []}), 200
 
    top_matches = []
    for match in matches:
        profile = Profile.query.get(match.profile_id)
        if not profile:
            continue
        top_matches.append({ 
            "profile_id": profile.id,
            "emp_id": profile.emp_id,
            "name": profile.name,
            "skills": profile.skills,
            "experience_years": profile.experience_years,
            "role":profile.role,
            "status":profile.status,
            "file_path": profile.resume_path,
            "score": round(match.score, 2),
            "vertical": profile.vertical
        })
 
    return jsonify({"top_matches": top_matches})