from utils import HashTable, PriorityQueue, BinarySearchTree, process_word, translate_word, check_pronunciation
from datetime import datetime
import speech_recognition as sr

hashtable = HashTable()
priority_queue = PriorityQueue()
bst = BinarySearchTree()

try:
    result = process_word("ephemeral", "English", hashtable, priority_queue, bst)
    print(result)
    print(hashtable.get_word("ephemeral"))
    print(priority_queue.pop_due_words(datetime.now()))
    print(bst.get_words_by_difficulty(3))
except Exception as e:
    print(f"process_word error: {e}")

try:
    spanish_word = translate_word("ephemeral", "es")
    print(spanish_word)
except Exception as e:
    print(f"translate_word error: {e}")

try:
    r = sr.Recognizer()
    with sr.AudioFile("ubiquitous.wav") as source:
        audio = r.listen(source)
    is_correct = check_pronunciation("ubiquitous", audio)
    print(f"Pronunciation correct: {is_correct}")
except Exception as e:
    print(f"check_pronunciation error: {e}")