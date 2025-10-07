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

# Initialize Flask app
app = Flask(__name__)

# Enable CORS
from flask_cors import CORS
CORS(app)

# Route for serving the main page
@app.route('/')
def index():
    return send_file('js_test.html')

# Configure upload folder for audio files
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'wav'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load environment variables
load_dotenv()
init_db()

# Initialize global data structures
hashtable = HashTable()
priority_queue = PriorityQueue()
bst = BinarySearchTree()

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
        
        result = process_word(word, language, hashtable, priority_queue, bst)
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
        
        translation = translate_word(word, target_language)
        # Store translated word with default difficulty 1 so it appears in review and BST
        hashtable.add_word(word, definition=f"Translated to {target_language}: {translation}", language=target_language, difficulty=1)
        # Due immediately for first review
        priority_queue.add_word(word, datetime.now(), 0)
        bst.insert_word(word, 1)
        return {"translation": translation}
        
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
    - audio: file (WAV audio file, PCM 16-bit, 16kHz)
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
            return create_error_response("Invalid file type. Only WAV files are allowed")
        
        # Save the file temporarily
        safe_filename = secure_filename(filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], safe_filename)
        audio_file.save(filepath)
        
        try:
            # Convert audio file to AudioData
            recognizer = sr.Recognizer()
            with sr.AudioFile(filepath) as source:
                audio_data = recognizer.record(source)
            
            # Check pronunciation
            result = check_pronunciation(word, audio_data)
            # Ensure word is tracked so review/difficulty queries reflect usage
            existing = hashtable.get_word(word)
            if not existing:
                hashtable.add_word(word, definition="Pronunciation practice", language="en", difficulty=1)
                priority_queue.add_word(word, datetime.now(), 0)
                bst.insert_word(word, 1)
            return {"correct": result}
            
        finally:
            # Clean up the temporary file
            if os.path.exists(filepath):
                os.remove(filepath)
                
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

if __name__ == '__main__':
    if not os.getenv('GEMINI_API_KEY'):
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    app.run(host='0.0.0.0', port=5000)
