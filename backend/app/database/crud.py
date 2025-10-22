import aiosqlite
from typing import Optional, List
from datetime import datetime
from .models import User, Event, MeTTaAtom

DB_PATH = "./news_integrity.db"

async def create_event(event: Event, db_path: str = DB_PATH) -> bool:
    async with aiosqlite.connect(db_path) as db:
        try:
            await db.execute(
                """
                INSERT INTO events (id, user_id, event_type, description, latitude, longitude, photo_path, timestamp, created_at, verification_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event.id,
                    event.user_id,
                    event.event_type,
                    event.description,
                    event.latitude,
                    event.longitude,
                    event.photo_path,
                    event.timestamp.isoformat() if event.timestamp else None,
                    event.created_at.isoformat() if event.created_at else None,
                    event.verification_status
                )
            )
            await db.commit()
            return True
        except Exception as e:
            print(f'Failed to save event to db. error: {str(e)}')
            return False

async def get_events_by_region(min_lat: float, max_lat: float, min_lng: float, max_lng: float, db_path: str = DB_PATH) -> List[Event]:
    events = []
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM events WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?",
            (min_lat, max_lat, min_lng, max_lng)
        ) as cursor:
            async for row in cursor:
                events.append(Event(**dict(row)))
    return events

async def update_event_verification(event_id: str, status: str, tx_hash: Optional[str] = None, payout_amount: Optional[float] = None, db_path: str = DB_PATH) -> bool:
    async with aiosqlite.connect(db_path) as db:
        try:
            await db.execute(
                """
                UPDATE events SET verification_status = ?, tx_hash = ?, payout_amount = ? WHERE id = ?
                """,
                (status, tx_hash, payout_amount, event_id)
            )
            await db.commit()
            return True
        except Exception:
            return False

async def get_events_by_user(user_id: str, db_path: str = DB_PATH) -> List[Event]:
    events = []
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM events WHERE user_id = ?", (user_id,)) as cursor:
            async for row in cursor:
                events.append(Event(**dict(row)))
    return events
import aiosqlite
from typing import Optional, List
from datetime import datetime
from .models import User, Event, MeTTaAtom

DB_PATH = "./news_integrity.db"

async def get_user_by_id(user_id: str, db_path: str = DB_PATH) -> Optional[User]:
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM users WHERE id = ?", (user_id,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return User(**dict(row))
    return None

async def get_event_by_id(event_id: str, db_path: str = DB_PATH) -> Optional[Event]:
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM events WHERE id = ?", (event_id,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return Event(**dict(row))
    return None

async def get_all_atoms(db_path: str = DB_PATH) -> List[MeTTaAtom]:
    atoms = []
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM metta_atoms") as cursor:
            async for row in cursor:
                atoms.append(MeTTaAtom(**dict(row)))
    return atoms

async def create_atom(atom: MeTTaAtom, db_path: str = DB_PATH):
    async with aiosqlite.connect(db_path) as db:
        await db.execute(
            """
            INSERT INTO metta_atoms (id, event_id, atom_type, atom_content, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                atom.id,
                atom.event_id,
                atom.atom_type,
                atom.atom_content,
                atom.created_at.isoformat() if atom.created_at else datetime.now().isoformat()
            )
        )
        await db.commit()
