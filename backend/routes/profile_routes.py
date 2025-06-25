from flask import Blueprint, request, jsonify
from models import Profile

profile_bp = Blueprint('profile_bp', __name__)

@profile_bp.route('/profiles/search', methods=['GET'])
def search_profiles():
    emp_id = request.args.get('emp_id')
    name = request.args.get('name')
    vertical = request.args.get('vertical')
    skills = request.args.get('skills')
    min_exp = request.args.get('min_exp', type=float)
    max_exp = request.args.get('max_exp', type=float)

    query = Profile.query

    if emp_id:
        query = query.filter(Profile.emp_id.ilike(f"%{emp_id}%"))
    if name:
        query = query.filter(Profile.name.ilike(f"%{name}%"))
    if vertical:
        query = query.filter(Profile.vertical.ilike(f"%{vertical}%"))
    if skills:
        skill_list = [s.strip().lower() for s in skills.split(',')]
        for skill in skill_list:
            query = query.filter(Profile.skills.ilike(f"%{skill}%"))
    if min_exp:
        query = query.filter(Profile.experience_years >= min_exp)
    if max_exp:
        query = query.filter(Profile.experience_years <= max_exp)

    results = query.order_by(Profile.created_at.desc()).all()
    return jsonify([{
        "id": p.id,
        "emp_id": p.emp_id,
        "name": p.name,
        "vertical": p.vertical,
        "skills": p.skills,
        "experience_years": p.experience_years
    } for p in results])
