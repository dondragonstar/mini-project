import os
import sqlite3
from contextlib import closing
from typing import Dict, List, Tuple

DB_PATH = os.path.join(os.path.dirname(__file__), 'users.db')


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_progress_db() -> None:
    with closing(_get_connection()) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_stats (
                user_id INTEGER PRIMARY KEY,
                words_learned INTEGER NOT NULL DEFAULT 0,
                translations INTEGER NOT NULL DEFAULT 0,
                pronunciations_correct INTEGER NOT NULL DEFAULT 0,
                reviews_completed INTEGER NOT NULL DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS user_words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                word TEXT NOT NULL,
                language TEXT NOT NULL DEFAULT 'en',
                difficulty INTEGER NOT NULL DEFAULT 1,
                confidence REAL NOT NULL DEFAULT 0.0,
                last_review_at DATETIME,
                status TEXT NOT NULL DEFAULT 'under_review', -- under_review | completed
                UNIQUE(user_id, word)
            );
            """
        )
        conn.commit()


def _ensure_user_row(user_id: int) -> None:
    with closing(_get_connection()) as conn:
        row = conn.execute("SELECT user_id FROM user_stats WHERE user_id = ?", (user_id,)).fetchone()
        if not row:
            conn.execute("INSERT INTO user_stats (user_id) VALUES (?)", (user_id,))
            conn.commit()


def increment_stat(user_id: int, field: str, amount: int = 1) -> None:
    if field not in {"words_learned", "translations", "pronunciations_correct", "reviews_completed"}:
        return
    _ensure_user_row(user_id)
    with closing(_get_connection()) as conn:
        conn.execute(f"UPDATE user_stats SET {field} = {field} + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?", (amount, user_id))
        conn.commit()


def upsert_user_word(user_id: int, word: str, language: str, difficulty: int) -> None:
    with closing(_get_connection()) as conn:
        conn.execute(
            """
            INSERT INTO user_words (user_id, word, language, difficulty, confidence, status)
            VALUES (?, ?, ?, ?, COALESCE((SELECT confidence FROM user_words WHERE user_id=? AND word=?), 0.0),
                    COALESCE((SELECT status FROM user_words WHERE user_id=? AND word=?), 'under_review'))
            ON CONFLICT(user_id, word) DO UPDATE SET
                language=excluded.language,
                difficulty=excluded.difficulty
            """,
            (user_id, word, language, difficulty, user_id, word, user_id, word),
        )
        conn.commit()


def update_confidence(user_id: int, word: str, delta: float) -> float:
    with closing(_get_connection()) as conn:
        row = conn.execute("SELECT confidence FROM user_words WHERE user_id=? AND word=?", (user_id, word)).fetchone()
        current = row["confidence"] if row else 0.0
        new_val = max(0.0, min(1.0, current + delta))
        status = 'completed' if new_val >= 0.8 else 'under_review'
        conn.execute("UPDATE user_words SET confidence=?, status=?, last_review_at=CURRENT_TIMESTAMP WHERE user_id=? AND word=?", (new_val, status, user_id, word))
        conn.commit()
        return new_val


def get_stats(user_id: int) -> Dict:
    _ensure_user_row(user_id)
    with closing(_get_connection()) as conn:
        row = conn.execute("SELECT words_learned, translations, pronunciations_correct, reviews_completed FROM user_stats WHERE user_id=?", (user_id,)).fetchone()
        return {
            "wordsLearned": row["words_learned"],
            "translations": row["translations"],
            "pronunciations": row["pronunciations_correct"],
            "reviewsCompleted": row["reviews_completed"],
        }


def get_review_items(user_id: int, threshold: float = 0.8) -> Tuple[List[str], List[str]]:
    with closing(_get_connection()) as conn:
        under = conn.execute("SELECT word FROM user_words WHERE user_id=? AND confidence < ? ORDER BY confidence ASC", (user_id, threshold)).fetchall()
        done = conn.execute("SELECT word FROM user_words WHERE user_id=? AND confidence >= ? ORDER BY last_review_at DESC", (user_id, threshold)).fetchall()
        return [r["word"] for r in under], [r["word"] for r in done]


