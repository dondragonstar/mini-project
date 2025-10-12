from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
from datetime import datetime
from typing import Dict, List, Optional, Union, Any
import speech_recognition as sr
from dotenv import load_dotenv
from utils import (
    HashTable, PriorityQueue, BinarySearchTree,
    process_word, translate_word, check_pronunciation
)
from auth import init_db, create_user, authenticate
from progress import (
    init_progress_db, increment_stat, upsert_user_word,
    update_confidence, get_stats, get_review_items
)
from contextlib import closing
import sqlite3
from google.generativeai import GenerativeModel
from pydub import AudioSegment

# Initialize Flask app
app = Flask(__name__)

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), 'users.db')

def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# Enable CORS
from flask_cors import CORS
CORS(app)

# Route for serving the main page
@app.route('/')
def index():
    return send_file('js_test.html')

# Configure upload folder for audio files
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'webm'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load environment variables
load_dotenv()
init_db()
init_progress_db()

# Optional: point pydub to ffmpeg binary if provided via env
ffmpeg_path = os.getenv('FFMPEG_PATH')
if ffmpeg_path and os.path.exists(ffmpeg_path):
    AudioSegment.converter = ffmpeg_path

# Initialize global data structures
hashtable = HashTable()
priority_queue = PriorityQueue()
bst = BinarySearchTree()

# Global cache for word of the day (shared across all users)
_word_of_day_cache = None
_word_of_day_date = None

def allowed_file(filename: str) -> bool:
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_error_response(message: str, status_code: int = 400) -> tuple[Dict[str, str], int]:
    """Create a standardized error response."""
    return {"error": message}, status_code

@app.route('/auth/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        if not name or not email or not password:
            return create_error_response("Missing required fields: name, email, password")
        user = create_user(name, email, password)
        return user, 201
    except ValueError as e:
        return create_error_response(str(e))
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/auth/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json() or {}
        email = data.get('email', '').strip()
        password = data.get('password', '')
        if not email or not password:
            return create_error_response("Missing required fields: email, password")
        user = authenticate(email, password)
        if not user:
            return create_error_response("Invalid credentials", 401)
        return user
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/process_word', methods=['POST'])
def process_word_endpoint() -> Union[Dict[str, Any], tuple[Dict[str, str], int]]:
    """
    Process a word using Gemini API and store in data structures.
    
    Expected JSON input:
    {
        "word": str,
        "language": str
    }
    """
    try:
        data = request.get_json()
        if not data or 'word' not in data or 'language' not in data:
            return create_error_response("Missing required fields: word, language")
        
        word = data['word']
        language = data['language']
        user_id = int(data.get('user_id', 1))
        
        result = process_word(word, language, hashtable, priority_queue, bst)
        upsert_user_word(user_id, word, language, int(result.get('difficulty', 1)))
        increment_stat(user_id, 'words_learned', 1)
        return result
        
    except ValueError as e:
        return create_error_response(str(e))
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/translate', methods=['POST'])
def translate_endpoint() -> Union[Dict[str, str], tuple[Dict[str, str], int]]:
    """
    Translate a word to target language.
    
    Expected JSON input:
    {
        "word": str,
        "target_language": str
    }
    """
    try:
        data = request.get_json()
        if not data or 'word' not in data or 'target_language' not in data:
            return create_error_response("Missing required fields: word, target_language")
        
        word = data['word']
        target_language = data['target_language']
        user_id = int(data.get('user_id', 1))
        
        translation = translate_word(word, target_language)
        
        # Store only the original word in user_words table (not the translation)
        upsert_user_word(user_id, word, 'en', 1)  # Original word only
        
        # Store in data structures for review (only original word)
        hashtable.add_word(word, definition=f"Original word", language='en', difficulty=1)
        
        # Add to priority queue for review (only original word)
        priority_queue.add_word(word, datetime.now(), 0)
        
        # Add to BST (only original word)
        bst.insert_word(word, 1)
        
        increment_stat(user_id, 'translations', 1)
        return {"translation": translation, "original_word": word, "target_language": target_language}
        
    except ValueError as e:
        return create_error_response(str(e))
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/check_pronunciation', methods=['POST'])
def check_pronunciation_endpoint() -> Union[Dict[str, bool], tuple[Dict[str, str], int]]:
    """
    Check pronunciation using uploaded audio file.
    
    Expected form data:
    - word: str (text field)
    - audio: file (any common audio; auto-converted to WAV 16k mono)
    """
    try:
        if 'word' not in request.form:
            return create_error_response("Missing word parameter")
        if 'audio' not in request.files:
            return create_error_response("No audio file provided")
            
        word = request.form['word']
        audio_file = request.files['audio']
        
        filename = audio_file.filename
        if not filename:
            return create_error_response("No selected audio file")
            
        if not allowed_file(filename):
            return create_error_response("Invalid file type")
        
        # Save the file temporarily
        safe_filename = secure_filename(filename)
        src_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
        audio_file.save(src_path)
        wav_path = os.path.splitext(src_path)[0] + '_conv.wav'
        try:
            segment = AudioSegment.from_file(src_path)
            segment = segment.set_frame_rate(16000).set_channels(1).set_sample_width(2)
            segment.export(wav_path, format='wav')
        except Exception:
            wav_path = src_path
        
        try:
            # Convert audio file to AudioData
            recognizer = sr.Recognizer()
            with sr.AudioFile(wav_path) as source:
                audio_data = recognizer.record(source)
            
            # Check pronunciation
            result = check_pronunciation(word, audio_data)
            # Ensure word is tracked so review/difficulty queries reflect usage
            existing = hashtable.get_word(word)
            if not existing:
                hashtable.add_word(word, definition="Pronunciation practice", language="en", difficulty=1)
                priority_queue.add_word(word, datetime.now(), 0)
                bst.insert_word(word, 1)
            user_id = int(request.form.get('user_id', 1))
            if result:
                increment_stat(user_id, 'pronunciations_correct', 1)
            # Upsert into per-user words so it appears in review lists
            upsert_user_word(user_id, word, 'en', 1)
            return {"correct": result}
            
        finally:
            # Clean up the temporary file
            for p in [src_path, wav_path]:
                if os.path.exists(p):
                    try:
                        os.remove(p)
                    except Exception:
                        pass
                
    except ValueError as e:
        return create_error_response(str(e))
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/review_words', methods=['GET'])
def review_words_endpoint() -> Union[Dict[str, List[str]], tuple[Dict[str, str], int]]:
    """Get all words due for review. If none are due, return all learned words."""
    try:
        due_words = priority_queue.pop_due_words(datetime.now())
        if not due_words:
            # Fallback so UI isn't empty for new users
            due_words = hashtable.get_all_words()
        return {"words": due_words}
        
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/words_by_difficulty/<int:difficulty>', methods=['GET'])
def words_by_difficulty_endpoint(difficulty: int) -> Union[Dict[str, List[str]], tuple[Dict[str, str], int]]:
    """Get all words of a specific difficulty level."""
    try:
        if not 1 <= difficulty <= 5:
            return create_error_response("Difficulty must be between 1 and 5")
            
        words = bst.get_words_by_difficulty(difficulty)
        return {"words": words}
    except ValueError as e:
        return create_error_response(str(e))
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/stats', methods=['GET'])
def stats_endpoint():
    try:
        user_id = int(request.args.get('user_id', 1))
        return get_stats(user_id)
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/review_items', methods=['GET'])
def review_items_endpoint():
    try:
        user_id = int(request.args.get('user_id', 1))
        under, completed = get_review_items(user_id, 0.8)
        return {"under_review": under, "completed": completed}
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/review_question', methods=['POST'])
def review_question_endpoint():
    try:
        data = request.get_json() or {}
        word = (data.get('word') or '').strip()
        if not word:
            return create_error_response("Missing word")
        model = GenerativeModel('gemini-2.5-flash')
        prompt = (
            "You are a vocabulary quiz generator. Return ONLY a valid JSON object with these exact fields:\n"
            "{\n"
            f'    "question": "A quiz question about the word {word} (definition, usage, or context)",\n'
            '    "options": ["Option A", "Option B", "Option C", "Option D"],\n'
            '    "correctIndex": 0\n'
            '}\n'
            f"Rules: Create a question about the word '{word}'. Make 4 options with only one correct answer. "
            "correctIndex should be 0, 1, 2, or 3. Return ONLY the JSON object. No markdown, no explanations."
        )
        resp = model.generate_content(prompt)
        text = (resp.text or '').strip()
        if text.startswith('```'):
            text = text.split('\n', 1)[1]
        if text.endswith('```'):
            text = text.rsplit('\n', 1)[0]
        import json as _json
        data = _json.loads(text)
        if not isinstance(data.get('options'), list) or len(data['options']) != 4:
            return create_error_response("Invalid question format from model", 500)
        if not isinstance(data.get('correctIndex'), int) or not 0 <= data['correctIndex'] <= 3:
            return create_error_response("Invalid correctIndex", 500)
        return data
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/review_answer', methods=['POST'])
def review_answer_endpoint():
    try:
        data = request.get_json() or {}
        user_id = int(data.get('user_id', 1))
        word = (data.get('word') or '').strip()
        selected = int(data.get('selectedIndex', -1))
        correct = int(data.get('correctIndex', -1))
        if not word or not (0 <= selected <= 3) or not (0 <= correct <= 3):
            return create_error_response("Invalid payload")
        if selected == correct:
            new_conf = update_confidence(user_id, word, +0.2)
            increment_stat(user_id, 'reviews_completed', 1)
            return {"correct": True, "confidence": new_conf}
        else:
            new_conf = update_confidence(user_id, word, -0.1)
            return {"correct": False, "confidence": new_conf}
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/related_words', methods=['GET'])
def related_words_endpoint():
    """Get related words for a user based on their learned words."""
    try:
        user_id = int(request.args.get('user_id', 1))
        
        # Get user's learned words
        with closing(_get_connection()) as conn:
            words = conn.execute(
                "SELECT word FROM user_words WHERE user_id = ? ORDER BY last_review_at DESC LIMIT 20",
                (user_id,)
            ).fetchall()
            learned_words = [row['word'] for row in words]
        
        if not learned_words:
            return {"related_words": [], "message": "Learn more words to see related suggestions!"}
        
        try:
            # Use Gemini to generate related words
            model = GenerativeModel('gemini-2.5-flash')
            prompt = (
                f"Based on these learned words: {', '.join(learned_words[:10])}, "
                "suggest 5-8 NEW related words that would be good to learn next. "
                "Do NOT include any of the input words. "
                "Return ONLY a JSON array of word strings, no explanations or other text. "
                "Example: [\"word1\", \"word2\", \"word3\"]"
            )
            
            response = model.generate_content(prompt)
            if response and response.text:
                import json
                # Clean the response
                text = response.text.strip()
                if text.startswith('```json'):
                    text = text.split('\n', 1)[1]
                if text.endswith('```'):
                    text = text.rsplit('\n', 1)[0]
                
                related_words = json.loads(text)
                if isinstance(related_words, list):
                    # Filter out any words that are already learned
                    new_words = [w for w in related_words if w.lower() not in [lw.lower() for lw in learned_words]]
                    if new_words:
                        return {"related_words": new_words[:8]}
        except Exception as e:
            print(f"AI related words failed: {e}")
        
        # Fallback: return empty array with message
        return {"related_words": [], "message": "Unable to generate related words. Try learning more words first!"}
        
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/word_of_day', methods=['GET'])
def word_of_day_endpoint():
    """Get word of the day (cached for the day)."""
    global _word_of_day_cache, _word_of_day_date
    
    try:
        from datetime import date
        today = date.today()
        
        # Return cached word if it's from today
        if _word_of_day_cache and _word_of_day_date == today:
            return _word_of_day_cache
        
        # Generate new word of the day
        try:
            model = GenerativeModel('gemini-2.5-flash')
            prompt = (
                "Generate a word of the day - a moderately difficult English word (difficulty 3-4) "
                "that would be useful for vocabulary building. Return ONLY the word, no explanations."
            )
            
            response = model.generate_content(prompt)
            if response and response.text:
                word = response.text.strip().strip('"').strip("'")
                result = {"word": word, "difficulty": 3}
            else:
                raise Exception("Empty response from AI")
        except Exception as e:
            print(f"AI word of day failed: {e}")
            # Fallback words
            fallback_words = ["serendipity", "ephemeral", "ubiquitous", "mellifluous", "perspicacious"]
            import random
            word = random.choice(fallback_words)
            result = {"word": word, "difficulty": 3}
        
        # Cache the result
        _word_of_day_cache = result
        _word_of_day_date = today
        
        return result
        
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/preload_word_of_day', methods=['GET'])
def preload_word_of_day_endpoint():
    """Preload word of the day (for loading before login)."""
    try:
        # This will generate and cache the word of the day
        return word_of_day_endpoint()
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/translated_words', methods=['GET'])
def translated_words_endpoint():
    """Get all translated words for a user."""
    try:
        user_id = int(request.args.get('user_id', 1))
        
        with closing(_get_connection()) as conn:
            # Get words that are not in English (translations) and have been explicitly learned
            words = conn.execute(
                "SELECT word, language, confidence, status FROM user_words WHERE user_id = ? AND language != 'en' AND status != 'translation_only' ORDER BY last_review_at DESC",
                (user_id,)
            ).fetchall()
            
            translated_words = []
            for row in words:
                translated_words.append({
                    'word': row['word'],
                    'language': row['language'],
                    'confidence': row['confidence'],
                    'status': row['status']
                })
            
            return {"translated_words": translated_words}
        
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/update_user_name', methods=['POST'])
def update_user_name_endpoint():
    """Update user's name."""
    try:
        data = request.get_json()
        if not data or 'user_id' not in data or 'new_name' not in data:
            return create_error_response("Missing required fields: user_id, new_name")
        
        user_id = int(data['user_id'])
        new_name = data['new_name'].strip()
        
        if not new_name:
            return create_error_response("Name cannot be empty")
        
        with closing(_get_connection()) as conn:
            conn.execute(
                "UPDATE users SET name = ? WHERE id = ?",
                (new_name, user_id)
            )
            conn.commit()
            
            # Get updated user data
            row = conn.execute("SELECT id, name, email FROM users WHERE id = ?", (user_id,)).fetchone()
            return {"id": row["id"], "name": row["name"], "email": row["email"]}
        
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/delete_user_data', methods=['POST'])
def delete_user_data_endpoint():
    """Delete all user's learning data but keep account."""
    try:
        data = request.get_json()
        if not data or 'user_id' not in data:
            return create_error_response("Missing required field: user_id")
        
        user_id = int(data['user_id'])
        
        with closing(_get_connection()) as conn:
            # Delete user's learning data
            conn.execute("DELETE FROM user_words WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM user_stats WHERE user_id = ?", (user_id,))
            conn.commit()
            
            return {"message": "User data deleted successfully"}
        
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/delete_account', methods=['POST'])
def delete_account_endpoint():
    """Delete user account and all associated data."""
    try:
        data = request.get_json()
        if not data or 'user_id' not in data:
            return create_error_response("Missing required field: user_id")
        
        user_id = int(data['user_id'])
        
        with closing(_get_connection()) as conn:
            # Delete all user data
            conn.execute("DELETE FROM user_words WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM user_stats WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
            conn.commit()
            
            return {"message": "Account deleted successfully"}
        
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

@app.route('/learn_translation', methods=['POST'])
def learn_translation_endpoint():
    """Learn a translated word by processing it."""
    try:
        data = request.get_json()
        if not data or 'word' not in data or 'language' not in data or 'user_id' not in data:
            return create_error_response("Missing required fields: word, language, user_id")
        
        word = data['word']
        language = data['language']
        user_id = int(data['user_id'])
        
        # Process the word using the existing process_word function
        result = process_word(word, language, hashtable, priority_queue, bst)
        upsert_user_word(user_id, word, language, int(result.get('difficulty', 1)))
        increment_stat(user_id, 'words_learned', 1)
        
        return result
        
    except Exception as e:
        return create_error_response(f"Server error: {str(e)}", 500)

if __name__ == '__main__':
    if not os.getenv('GEMINI_API_KEY'):
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    app.run(host='0.0.0.0', port=5000)
