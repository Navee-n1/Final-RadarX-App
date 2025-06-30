from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# ─────────────── USERS ────────────────
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    role = db.Column(db.String, nullable=False)  # 'recruiter' or 'ar'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    password = db.Column(db.String, nullable=False)

# ─────────────── JOB DESCRIPTIONS ────────────────
class JD(db.Model):
    __tablename__ = 'jd'
    id = db.Column(db.Integer, primary_key=True)
    file_path = db.Column(db.String, nullable=False)
    uploaded_by = db.Column(db.String)
    project_code = db.Column(db.String)
    job_title = db.Column(db.String)  # ✅ Added for dashboard display/search
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ─────────────── LEGACY RESUME (optional) ────────────────
class Resume(db.Model):
    __tablename__ = 'resume'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    file_path = db.Column(db.String, nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

# ─────────────── CONSULTANT PROFILE ────────────────
class Profile(db.Model):
    __tablename__ = 'profile'
    id = db.Column(db.Integer, primary_key=True)
    emp_id = db.Column(db.String, unique=True, nullable=False)
    name = db.Column(db.String, nullable=False)
    vertical = db.Column(db.String)
    skills = db.Column(db.Text)
    experience_years = db.Column(db.Float)
    resume_path = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ─────────────── MATCH RESULTS ────────────────
class MatchResult(db.Model):
    __tablename__ = 'match_result'
    id = db.Column(db.Integer, primary_key=True)
    jd_id = db.Column(db.Integer, db.ForeignKey('jd.id'))
    profile_id = db.Column(db.Integer, db.ForeignKey('profile.id'))
    resume_id = db.Column(db.Integer, db.ForeignKey('resume.id'), nullable=True)  # legacy support
    score = db.Column(db.Float)
    explanation = db.Column(db.Text)
    match_type = db.Column(db.String)  # ✅ Added to track 'jd-to-resume', 'resume-to-jd', etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# ─────────────── EMAIL LOG ────────────────
class EmailLog(db.Model):
    __tablename__ = 'email_log'
    id = db.Column(db.Integer, primary_key=True)
    jd_id = db.Column(db.Integer)
    sent_to = db.Column(db.String)
    cc = db.Column(db.String)
    status = db.Column(db.String)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)
    pdf_path = db.Column(db.String)
    success = db.Column(db.Boolean, default=True)  # Required for agent_console logic


# ─────────────── FEEDBACK ────────────────
class Feedback(db.Model):
    __tablename__ = 'feedback'
    id = db.Column(db.Integer, primary_key=True)
    resume_id = db.Column(db.Integer)
    jd_id = db.Column(db.Integer)
    given_by = db.Column(db.String)
    vote = db.Column(db.String)  # 'up' or 'down'
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
