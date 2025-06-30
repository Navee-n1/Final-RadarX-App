from app import app, db
from models import User
 
with app.app_context():
    user = User(email="maheshmurari001@gmail.com", role="ar", password="123")
    user1 = User(email="maheshmurari003@gmail.com", role="recruiter", password="123")
    db.session.add_all([user, user1])
    db.session.commit()
    print("Users inserted ✅")