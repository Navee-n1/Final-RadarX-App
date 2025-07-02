from app import app, db
from models import User
 
with app.app_context():
    #user = User(email="maheshmurari001@gmail.com", role="ar", password="123")
    #user1 = User(email="maheshmurari003@gmail.com", role="recruiter", password="123")
    #user3 = User(email="2000137271@hexaware.com", role="recruiter", password="123")
    #user4 = User(email="AddepalliN@hexaware.com", role="recruiter", password="123")
    user5 = User(email="addepallinaveenkumar85@gmail.com", role="recruiter", password="123")

    db.session.add_all([ user5])
    db.session.commit()
    print("Users inserted ✅")