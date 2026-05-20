from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_obj = MongoDB()

async def connect_to_mongo():
    db_obj.client = AsyncIOMotorClient(settings.MONGO_URL)
    db_obj.db = db_obj.client[settings.DATABASE_NAME]

async def close_mongo_connection():
    db_obj.client.close()

def get_db():
    return db_obj.db