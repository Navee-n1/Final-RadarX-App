# recruiter_routes.py

from flask import Blueprint, jsonify
from models import db, Profile, JD, MatchResult
from flask_jwt_extended import jwt_required

recruiter_bp = Blueprint('recruiter', __name__)

@recruiter_bp.route('/recruiter/summary', methods=['GET'])
def recruiter_summary():
    profile_count = Profile.query.count()
    jd_count = JD.query.count()
    match_count = MatchResult.query.count()

    return jsonify({
        "profiles": profile_count,
        "jds": jd_count,
        "matches": match_count
    })
