"""
MongoDB database connection and management.
Provides access to 'users' and 'logs' collections.
"""

import os
import logging
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env variables from .env if present
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "cybershield")

logger = logging.getLogger("cyber-detector.db")

class Database:
    def __init__(self):
        try:
            self.client = MongoClient(MONGODB_URI)
            self.db = self.client[DB_NAME]
            # Ensure indices
            self.db.users.create_index("email", unique=True)
            self.db.logs.create_index("timestamp")
            
            # Ping database to confirm connection
            self.client.admin.command('ping')
            logger.info(f"✅ Connected to MongoDB: {DB_NAME}")
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            self.db = None

    def get_collection(self, name: str):
        if self.db is None:
            return None
        return self.db[name]

    @property
    def users(self):
        return self.get_collection("users")

    @property
    def logs(self):
        return self.get_collection("logs")

# Singleton instance
db_instance = Database()

def get_db():
    return db_instance
