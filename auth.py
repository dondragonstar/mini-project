import os
import sqlite3
from contextlib import closing
from typing import Optional, Dict
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), 'users.db')


def _get_connection() -> sqlite3.Connection:
    # Ensure the DB directory exists (project root in this case)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with closing(_get_connection()) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        conn.commit()


def create_user(name: str, email: str, password: str) -> Dict:
    if not name or not email or not password:
        raise ValueError("Name, email and password are required")

    password_hash = generate_password_hash(password)
    with closing(_get_connection()) as conn:
        try:
            cursor = conn.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                (name.strip(), email.strip().lower(), password_hash),
            )
            conn.commit()
            user_id = cursor.lastrowid
        except sqlite3.IntegrityError:
            raise ValueError("Email already registered")

        row = conn.execute("SELECT id, name, email FROM users WHERE id = ?", (user_id,)).fetchone()
        return {"id": row["id"], "name": row["name"], "email": row["email"]}


def authenticate(email: str, password: str) -> Optional[Dict]:
    if not email or not password:
        return None
    with closing(_get_connection()) as conn:
        row = conn.execute(
            "SELECT id, name, email, password_hash FROM users WHERE email = ?",
            (email.strip().lower(),),
        ).fetchone()
        if not row:
            return None
        if not check_password_hash(row["password_hash"], password):
            return None
        return {"id": row["id"], "name": row["name"], "email": row["email"]}


def get_user_by_email(email: str) -> Optional[Dict]:
    with closing(_get_connection()) as conn:
        row = conn.execute("SELECT id, name, email FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
        if not row:
            return None
        return {"id": row["id"], "name": row["name"], "email": row["email"]}


