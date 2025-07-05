# routes/tracker.py

from flask import Blueprint, jsonify
from sqlalchemy.sql import func
from datetime import datetime, timedelta
from models import db, MatchResult, AgentErrorLog, JD, Resume

tracker_bp = Blueprint('tracker_bp', __name__)

@tracker_bp.route('/tracker/agent-health', methods=['GET'])
def get_agent_health_summary():
    # ────────────────────────────────
    # Total Match Counts
    # ────────────────────────────────
    total_matches = db.session.query(func.count(MatchResult.id)).scalar()

    jd_to_resume = db.session.query(func.count()).filter(MatchResult.match_type == 'jd-to-resume').scalar()
    resume_to_jd = db.session.query(func.count()).filter(MatchResult.match_type == 'resume-to-jd').scalar()
    one_to_one = db.session.query(func.count()).filter(MatchResult.match_type == 'one-to-one').scalar()

    # ────────────────────────────────
    # Latency Averages (realistic, by type)
    # ────────────────────────────────
    def avg_latency(match_type):
        return round(db.session.query(func.avg(MatchResult.latency))
                     .filter(MatchResult.match_type == match_type)
                     .scalar() or 0.0, 2)

    latency_stats = {
        "jd_to_resume": avg_latency("jd-to-resume"),
        "resume_to_jd": avg_latency("resume-to-jd"),
        "one_to_one": avg_latency("one-to-one")
    }

    # ────────────────────────────────
    # Error Metrics
    # ────────────────────────────────
    total_errors = db.session.query(func.count(AgentErrorLog.id)).scalar()
    unresolved_errors = db.session.query(func.count()).filter(AgentErrorLog.resolved == False).scalar()
    resolved_errors = total_errors - unresolved_errors

    most_common_error = db.session.query(
        AgentErrorLog.error_type, func.count().label('count')
    ).group_by(AgentErrorLog.error_type).order_by(func.count().desc()).first()

    # ────────────────────────────────
    # Daily Usage Trends (last 7 days)
    # ────────────────────────────────
    today = datetime.utcnow().date()
    daily_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = db.session.query(func.count()).filter(
            func.date(MatchResult.created_at) == day
        ).scalar()
        daily_trend.append({"date": day.strftime("%b %d"), "matches": count})

    # ────────────────────────────────
    # Bonus Smart Stats
    # ────────────────────────────────
    jd_uploaded = db.session.query(func.count(JD.id)).scalar()
    resumes_uploaded = db.session.query(func.count(Resume.id)).scalar()

    avg_match_score = round(
        db.session.query(func.avg(MatchResult.score)).scalar() or 0.0, 2
    )

    # Success rate = matched results / total JD-uploaded
    match_success_rate = round((total_matches / jd_uploaded) * 100, 2) if jd_uploaded else 0

    return jsonify({
        "total_matches": total_matches,
        "jd_to_resume": jd_to_resume,
        "resume_to_jd": resume_to_jd,
        "one_to_one": one_to_one,
        "latency_stats": latency_stats,

        "total_errors": total_errors,
        "unresolved_errors": unresolved_errors,
        "resolved_errors": resolved_errors,
        "most_common_error": most_common_error[0] if most_common_error else "None",
        "most_common_error_count": most_common_error[1] if most_common_error else 0,

        "daily_usage": daily_trend,

        "jd_uploaded": jd_uploaded,
        "resumes_uploaded": resumes_uploaded,
        "avg_match_score": avg_match_score,
        "match_success_rate": match_success_rate
    })
