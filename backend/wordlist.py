import random
import threading

from changemanager import ChangeManager, Change, ChangeType


class Word:
    def __init__(self, word: str, identifier: str):
        self.word = word
        self.identifier = identifier


class WordList:
    def __init__(self):
        self.identifiers = []
        self.words = {}

        self.insert_lock = threading.Lock()

    def add_word_after(self, after_identifier: str, word: str):
        self.insert_lock.acquire()
        uid = "%08x" % random.getrandbits(32)
        while uid in self.identifiers:
            uid = "%08x" % random.getrandbits(32)

        new_word = Word(word, uid)

        try:
            insert_position = self.identifiers.index(after_identifier) + 1
        except ValueError:
            insert_position = len(self.identifiers)

        self.identifiers.insert(insert_position, uid)
        self.words[uid] = new_word
        self.insert_lock.release()
        return new_word

    def update_word(self, identifier: str, new_word: str):
        self.insert_lock.acquire()
        self.words[identifier].word = new_word
        self.insert_lock.release()

    def delete_word(self, identifier: str):
        self.insert_lock.acquire()
        self.identifiers.remove(identifier)
        del self.words[identifier]
        self.insert_lock.release()


class WordListProxy:
    def __init__(self, wordlist: WordList, changemanager: ChangeManager):
        self.wordlist = wordlist
        changemanager.register_change_listener(self.receive_change)

    def receive_change(self, change: Change):
        if change.change_type == ChangeType.INSERT:
            self.wordlist.add_word_after(change.target, change.new_value)
