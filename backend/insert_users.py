from app import app, db
from models import User
 
with app.app_context():
    user1 = User(email="addepallinaveenkumar85@gmail.com", role="Recruiter", password="Naveen@123")
    user2 = User(email="maheshmurari001@gmail.com", role="AR Requisitor", password="Mahesh@123")
    db.session.add_all([user1, user2])
    db.session.commit()
    print("Users inserted ✅")