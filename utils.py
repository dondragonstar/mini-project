import heapq
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import google.generativeai as genai
from deep_translator import GoogleTranslator
import speech_recognition as sr
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API with the API key
_api_key = os.getenv('GEMINI_API_KEY')
if not _api_key:
    raise ValueError("GEMINI_API_KEY not found in environment variables")
genai.configure(api_key=_api_key, transport="rest")

def process_word(word: str, language: str, hashtable: 'HashTable',
               priority_queue: 'PriorityQueue', bst: 'BinarySearchTree') -> dict:
    """Process a word using Gemini API and store in data structures."""
    if not word or not language:
        raise ValueError("Word and language must not be empty")
        
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = (
            'You are a vocabulary learning assistant. Return ONLY a valid JSON object with these exact fields:\n'
            '{\n'
            f'    "definition": "A clear, concise definition of the word {word} in {language}",\n'
            f'    "sentence": "A natural example sentence using the word {word} in context",\n'
            f'    "mnemonic": "A helpful memory aid or trick to remember the word {word}",\n'
            '    "difficulty": 3\n'
            '}\n'
            'Rules: Return ONLY the JSON object. No markdown, no explanations, no additional text. Difficulty should be 1-5 based on word complexity.'
        )
        
        response = model.generate_content(prompt)
        if not response or not response.text:
            raise ValueError("Empty response from Gemini API")
        
        # Clean up the response - remove markdown code blocks if present
        clean_text = response.text.strip()
        if clean_text.startswith('```json'):
            clean_text = clean_text.split('\n', 1)[1]  # Remove first line
        if clean_text.endswith('```'):
            clean_text = clean_text.rsplit('\n', 1)[0]  # Remove last line
        clean_text = clean_text.strip()
            
        result = json.loads(clean_text)
        required_fields = {'sentence', 'mnemonic', 'difficulty', 'definition'}
        if not all(field in result for field in required_fields):
            raise ValueError("Missing required fields in API response")
            
        if not isinstance(result['difficulty'], (int, float)) or not 1 <= result['difficulty'] <= 5:
            raise ValueError(f"Invalid difficulty value: {result['difficulty']}")
            
        difficulty = int(result['difficulty'])
        
        hashtable.add_word(word, result['definition'], language, difficulty)
        # Make the first review due immediately so it shows up right away
        priority_queue.add_word(word, datetime.now(), 0)
        bst.insert_word(word, difficulty)
        
        return result
        
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse API response as JSON: {e}")
    except Exception as e:
        raise ValueError(f"Failed to process word: {str(e)}")

def translate_word(word: str, target_language: str) -> str:
    """Translate a word to the target language."""
    if not word:
        raise ValueError("Word must not be empty")
    if not target_language:
        raise ValueError("Target language must not be empty")
    
    try:
        translator = GoogleTranslator(source='auto', target=target_language)
        translated = translator.translate(text=word)
        if not translated:
            raise ValueError("Translation returned empty result")
        return translated
    except Exception as e:
        raise ValueError(f"Translation failed: {str(e)}")

def check_pronunciation(word: str, audio_data: sr.AudioData) -> bool:
    """Check if pronunciation matches using speech recognition."""
    if not word:
        raise ValueError("Word must not be empty")
    if not isinstance(audio_data, sr.AudioData):
        raise ValueError("Invalid audio data type")
    
    try:
        recognizer = sr.Recognizer()
        text = recognizer.recognize_sphinx(audio_data, language='en-US')
        return word.lower().strip() == text.lower().strip()
    except sr.UnknownValueError:
        return False
    except Exception as e:
        raise ValueError(f"Speech recognition failed: {str(e)}")

class HashTable:
    """Hash table for storing word details."""
    
    def __init__(self):
        self._table: Dict[str, dict] = {}
    
    def add_word(self, word: str, definition: str, language: str, difficulty: int,
                interval: int = 1, progress: float = 0) -> None:
        """Add a word to the hash table."""
        if not 1 <= difficulty <= 5:
            raise ValueError("Difficulty must be between 1 and 5")
        if not 0 <= progress <= 100:
            raise ValueError("Progress must be between 0 and 100")
            
        self._table[word] = {
            'definition': definition,
            'language': language,
            'difficulty': difficulty,
            'last_review': datetime.now(),
            'interval': interval,
            'progress': progress
        }
    
    def get_word(self, word: str) -> Optional[dict]:
        """Get word details from the hash table."""
        return self._table.get(word)
    
    def update_progress(self, word: str, new_progress: float) -> bool:
        """Update the progress of a word."""
        if not 0 <= new_progress <= 100:
            raise ValueError("Progress must be between 0 and 100")
            
        if word in self._table:
            self._table[word]['progress'] = new_progress
            return True
        return False

    def get_all_words(self) -> List[str]:
        """Return a list of all stored words."""
        return list(self._table.keys())

class PriorityQueue:
    """Priority queue for spaced repetition."""
    
    def __init__(self):
        self._queue: List[Tuple[datetime, str]] = []
        self._word_intervals: Dict[str, int] = {}
    
    def add_word(self, word: str, last_review: datetime, interval: int) -> None:
        """Add a word with its next review time."""
        next_review = last_review + timedelta(days=interval)
        heapq.heappush(self._queue, (next_review, word))
        self._word_intervals[word] = interval
    
    def pop_due_words(self, current_time: datetime) -> List[str]:
        """Get all words due for review."""
        due_words = []
        while self._queue and self._queue[0][0] <= current_time:
            _, word = heapq.heappop(self._queue)
            due_words.append(word)
        return due_words
    
    def update_interval(self, word: str, correct: bool) -> None:
        """Update interval based on review correctness."""
        if word in self._word_intervals:
            if correct:
                self._word_intervals[word] *= 2  # Double the interval
            else:
                self._word_intervals[word] = 1  # Reset to 1 day

class TreeNode:
    """Node for Binary Search Tree."""
    
    def __init__(self, difficulty: int):
        self.difficulty = difficulty
        self.words: List[str] = []
        self.left: Optional['TreeNode'] = None
        self.right: Optional['TreeNode'] = None

class BinarySearchTree:
    """BST for organizing words by difficulty."""
    
    def __init__(self):
        self.root: Optional[TreeNode] = None
    
    def insert_word(self, word: str, difficulty: int) -> None:
        """Insert a word based on difficulty."""
        if not 1 <= difficulty <= 5:
            raise ValueError("Difficulty must be between 1 and 5")
            
        if not self.root:
            self.root = TreeNode(difficulty)
            self.root.words.append(word)
            return
            
        current = self.root
        while True:
            if difficulty == current.difficulty:
                if word not in current.words:
                    current.words.append(word)
                return
            elif difficulty < current.difficulty:
                if current.left is None:
                    current.left = TreeNode(difficulty)
                    current.left.words.append(word)
                    return
                current = current.left
            else:
                if current.right is None:
                    current.right = TreeNode(difficulty)
                    current.right.words.append(word)
                    return
                current = current.right
    
    def get_words_by_difficulty(self, difficulty: int) -> List[str]:
        """Get all words of a specific difficulty."""
        if not 1 <= difficulty <= 5:
            raise ValueError("Difficulty must be between 1 and 5")
            
        def _search(node: Optional[TreeNode]) -> List[str]:
            if not node:
                return []
            if node.difficulty == difficulty:
                return node.words
            if difficulty < node.difficulty:
                return _search(node.left)
            return _search(node.right)
            
        return _search(self.root)
