
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def main():
    # URI from server/lib/mongodb.js
    uri = "mongodb+srv://zainabsarwar58:zainab984@cluster0.zjkfo.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster0"
    print(f"Connecting to {uri}")
    client = AsyncIOMotorClient(uri)
    db_name = "mydatabase" # From URI
    db = client[db_name]
    
    print(f"Using database: {db_name}")

    print("\nRecent 5 Calls:")
    count = 0
    # Sort by _id descending to get newest first (ObjectId has timestamp)
    async for call in db["calls"].find().sort("_id", -1):
        print(f"- {call.get('_id')} | Status: {call.get('status')} | Duration: {call.get('duration')}s")
        print(f"  Client Name: '{call.get('client_name')}' | Client Email: '{call.get('client_email')}'")
        print(f"  Start Time: {call.get('start_time')}")
        count += 1
        if count >= 5: break

if __name__ == "__main__":
    asyncio.run(main())
