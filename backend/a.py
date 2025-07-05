from app import app, db
from models import User
 
with app.app_context():
    user = User(email="ab@gmail.com", role="admin", password="123")
    

    db.session.add_all([user])
    db.session.commit()
    print("Users inserted ✅")
