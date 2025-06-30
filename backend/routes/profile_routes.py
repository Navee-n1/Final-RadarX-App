from flask import Blueprint, request, jsonify
from models import Profile
from sqlalchemy import or_
 
profile_bp = Blueprint('profile_bp', __name__)
 
@profile_bp.route('/profiles/search', methods=['GET'])
def search_profiles():
    emp_id = request.args.get('emp_id')  # used as shared search input
    name = request.args.get('name')      # same field in frontend
    vertical = request.args.get('vertical')
    skills = request.args.get('skills')
    min_exp = request.args.get('min_exp', type=float)
    max_exp = request.args.get('max_exp', type=float)
 
    query = Profile.query
 
    # ✅ Match by name OR emp_id from the same input field
    if emp_id or name:
        search_term = (emp_id or name).strip()
        query = query.filter(or_(
Profile.name.ilike(f"%{search_term}%"),
            Profile.emp_id.ilike(f"%{search_term}%")
        ))
 
    if vertical:
        query = query.filter(Profile.vertical.ilike(f"%{vertical}%"))
 
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(',') if s.strip()]
        for skill in skill_list:
            query = query.filter(Profile.skills.ilike(f"%{skill}%"))
 
    if min_exp is not None:
        query = query.filter(Profile.experience_years >= min_exp)
    if max_exp is not None:
        query = query.filter(Profile.experience_years <= max_exp)
 
    results = query.order_by(Profile.created_at.desc()).all()
 
    return jsonify([
        {
"id": p.id,
            "emp_id": p.emp_id,
"name": p.name,
            "vertical": p.vertical,
            "skills": p.skills,
            "experience_years": p.experience_years
        } for p in results
    ])