from motor.motor_asyncio import AsyncIOMotorClient
MONGO_URL = "mongodb+srv://theprithivraj:h1h2h3h4@prithiv.xaz8u.mongodb.net/?retryWrites=true&w=majority&appName=prithiv"
client = AsyncIOMotorClient(MONGO_URL)
db = client["HMS"]  
