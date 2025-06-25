from flask import Blueprint, request, jsonify
from models import User
from flask_jwt_extended import create_access_token
 
auth_bp = Blueprint('auth_bp', __name__)
 
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
 
    user = User.query.filter_by(email=email).first()
 
    if not user or user.password != password:
        return jsonify({'error': 'Invalid email or password'}), 401
 
    # Create JWT token
    access_token = create_access_token(identity={
'email': user.email,
        'role': user.role
    })
 
    return jsonify({'access_token': access_token})