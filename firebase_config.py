import firebase_admin
from firebase_admin import credentials, db
import os
from dotenv import load_dotenv

load_dotenv()

cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
database_url = os.getenv("FIREBASE_DATABASE_URL")

# INITIALIZE FIREBASE APP (ONLY ONCE)
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        'databaseURL': database_url  # ✅ 필수!
    })
