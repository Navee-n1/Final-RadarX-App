from flask import Blueprint, send_file, request, jsonify
from utils.pdf_generator import generate_pdf_report
from models import JD, MatchResult, Profile
 
report_bp = Blueprint('report_bp', __name__)
 
@report_bp.route('/generate-pdf/<int:jd_id>', methods=['GET'])
def generate_pdf(jd_id):
    jd = JD.query.get(jd_id)
    if not jd:
        return jsonify({"error": "JD not found"}), 404
 
    # Get all matches sorted by score (not just 3)
    matches = MatchResult.query.filter_by(jd_id=jd_id).order_by(MatchResult.score.desc()).all()
 
    top_matches = []
    seen_profile_ids = set()
 
    for match in matches:
        if match.profile_id in seen_profile_ids:
            continue  # Skip duplicates
        profile = Profile.query.get(match.profile_id)
        if profile:
            top_matches.append({
                "name": profile.name,
                "emp_id": profile.emp_id,
                "score": round(match.score * 100, 2)
            })
            seen_profile_ids.add(match.profile_id)
        if len(top_matches) >= 3:
            break  # Only need top 3 unique profiles
 
    if not top_matches:
        return jsonify({"error": "No matches found"}), 404
 
    filepath = generate_pdf_report(jd_id,jd.project_code, top_matches)
    return send_file(filepath, as_attachment=True)