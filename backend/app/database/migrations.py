import aiosqlite
import os
from datetime import datetime
import uuid
import json

async def create_tables(db_path: str = "./news_integrity.db"):
    """Create all database tables"""
    async with aiosqlite.connect(db_path) as db:
        # Create users table with authentication fields
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                password_hash TEXT,
                first_name TEXT,
                last_name TEXT,
                role TEXT DEFAULT 'user',
                wallet_address TEXT UNIQUE,
                trust_score INTEGER DEFAULT 50,
                location_region TEXT,
                profile_image TEXT,
                is_active BOOLEAN DEFAULT 1,
                is_verified BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME,
                last_login_at DATETIME
            )
        """)
        
        # Create events table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                event_type TEXT NOT NULL,
                description TEXT,
                latitude REAL,
                longitude REAL,
                photo_path TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                verification_status TEXT DEFAULT 'pending',
                smart_contract_tx_hash TEXT,
                payout_amount REAL
            )
        """)
        
        # Create metta_atoms table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS metta_atoms (
                id TEXT PRIMARY KEY,
                event_id TEXT REFERENCES events(id),
                atom_type TEXT,
                atom_content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes for better performance
        await db.execute("CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_events_location ON events(latitude, longitude)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_atoms_event_id ON metta_atoms(event_id)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_atoms_type ON metta_atoms(atom_type)")
        
        await db.commit()
        print("✅ Database tables created successfully")

async def seed_sample_data(db_path: str = "./news_integrity.db"):
    """Insert sample data for demo purposes"""
    async with aiosqlite.connect(db_path) as db:
        # Check if data already exists
        async with db.execute("SELECT COUNT(*) FROM users") as cursor:
            count = await cursor.fetchone()
            if count[0] > 0:
                print(" Sample data already exists, skipping seed")
                return
        
        # Sample users with authentication
        import bcrypt
        
        def hash_password(password: str) -> str:
            return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        users = [
            {
                'id': 'user-amina-001',
                'email': 'amina@example.com',
                'password_hash': hash_password('demo123'),
                'first_name': 'Amina',
                'last_name': 'Hassan',
                'role': 'user',
                'wallet_address': '0x742d35Cc6634C0532925a3b8D4C9db96590e4CAF',
                'trust_score': 75,
                'location_region': 'Turkana, Kenya',
                'created_at': datetime.now().isoformat()
            },
            {
                'id': 'user-john-002', 
                'email': 'john@example.com',
                'password_hash': hash_password('demo123'),
                'first_name': 'John',
                'last_name': 'Kimani',
                'role': 'researcher',
                'wallet_address': '0x8ba1f109551bD432803012645Hac136c22C177e9',
                'trust_score': 65,
                'location_region': 'Kajiado, Kenya',
                'created_at': datetime.now().isoformat()
            },
            {
                'id': 'user-mary-003',
                'email': 'mary@example.com',
                'password_hash': hash_password('demo123'),
                'first_name': 'Mary',
                'last_name': 'Wanjiku',
                'role': 'user',
                'wallet_address': '0x1234567890123456789012345678901234567890',
                'trust_score': 80,
                'location_region': 'Marsabit, Kenya',
                'created_at': datetime.now().isoformat()
            }
        ]
        
        for user in users:
            await db.execute("""
                INSERT INTO users (
                    id, email, password_hash, first_name, last_name, role,
                    wallet_address, trust_score, location_region, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user['id'], user['email'], user['password_hash'], user['first_name'],
                user['last_name'], user['role'], user['wallet_address'], user['trust_score'], 
                user['location_region'], user['created_at']
            ))
        
        # Sample events
        events = [
            {
                'id': str(uuid.uuid4()),
                'user_id': 'user-amina-001',
                'event_type': 'drought',
                'description': 'Severe drought affecting livestock in Turkana region',
                'latitude': 3.1190,
                'longitude': 35.5970,
                'photo_path': None,
                'verification_status': 'verified',
                'payout_amount': 0.01
            },
            {
                'id': str(uuid.uuid4()),
                'user_id': 'user-john-002',
                'event_type': 'flood',
                'description': 'Flash flooding after heavy rains',
                'latitude': -1.8500,
                'longitude': 36.7833,
                'photo_path': None,
                'verification_status': 'pending',
                'payout_amount': None
            },
            {
                'id': str(uuid.uuid4()),
                'user_id': 'user-mary-003',
                'event_type': 'locust',
                'description': 'Large swarm of desert locusts spotted',
                'latitude': 2.3333,
                'longitude': 37.9833,
                'photo_path': None,
                'verification_status': 'verified',
                'payout_amount': 0.005
            },
            {
                'id': str(uuid.uuid4()),
                'user_id': 'user-amina-001',
                'event_type': 'extreme_heat',
                'description': 'Temperatures exceeding 45°C for 3 consecutive days',
                'latitude': 3.1190,
                'longitude': 35.5970,
                'photo_path': None,
                'verification_status': 'manual_review',
                'payout_amount': None
            }
        ]
        
        event_ids = []
        for event in events:
            event_ids.append(event['id'])
            await db.execute("""
                INSERT INTO events (id, user_id, event_type, description, latitude, longitude, 
                                  photo_path, verification_status, payout_amount)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (event['id'], event['user_id'], event['event_type'], event['description'],
                  event['latitude'], event['longitude'], event['photo_path'], 
                  event['verification_status'], event['payout_amount']))
        
        # Sample MeTTa atoms for the first event
        sample_atoms = [
            {
                'id': str(uuid.uuid4()),
                'event_id': event_ids[0],
                'atom_type': 'user',
                'atom_content': json.dumps({
                    'atom': '(user Amina)',
                    'location': '(location Amina Turkana)',
                    'trust_score': '(trust_score Amina 75)'
                })
            },
            {
                'id': str(uuid.uuid4()),
                'event_id': event_ids[0],
                'atom_type': 'event',
                'atom_content': json.dumps({
                    'atom': '(event Drought_Aug_2025)',
                    'reports': '(reports Amina Drought_Aug_2025)',
                    'timestamp': '(timestamp Drought_Aug_2025 "2025-08-15T10:30:00Z")',
                    'gps_coords': '(gps_coords Drought_Aug_2025 (3.1190 35.5970))'
                })
            },
            {
                'id': str(uuid.uuid4()),
                'event_id': event_ids[0],
                'atom_type': 'impact',
                'atom_content': json.dumps({
                    'atom': '(impact Drought_Aug_2025 Livestock_Risk)',
                    'severity': '(severity Drought_Aug_2025 High)'
                })
            },
            {
                'id': str(uuid.uuid4()),
                'event_id': event_ids[0],
                'atom_type': 'verification',
                'atom_content': json.dumps({
                    'atom': '(verified Drought_Aug_2025)',
                    'verification_time': '(verification_time Drought_Aug_2025 "2025-08-15T10:35:00Z")',
                    'auto_verified': '(auto_verified Drought_Aug_2025 true)'
                })
            }
        ]
        
        for atom in sample_atoms:
            await db.execute("""
                INSERT INTO metta_atoms (id, event_id, atom_type, atom_content)
                VALUES (?, ?, ?, ?)
            """, (atom['id'], atom['event_id'], atom['atom_type'], atom['atom_content']))
        
        await db.commit()
        print("✅ Sample data inserted successfully")
        print(f"   - {len(users)} users created")
        print(f"   - {len(events)} events created") 
        print(f"   - {len(sample_atoms)} MeTTa atoms created")

async def reset_database(db_path: str = "./news_integrity.db"):
    """Reset database by dropping and recreating all tables"""
    if os.path.exists(db_path):
        os.remove(db_path)
        print("️ Existing database removed")
    
    await create_tables(db_path)
    await seed_sample_data(db_path)
    print(" Database reset complete")

if __name__ == "__main__":
    import asyncio
    asyncio.run(reset_database())
