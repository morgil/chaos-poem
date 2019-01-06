import threading
from enum import Enum
from queue import Queue, Empty


class ChangeType(Enum):
    UPDATE = 1
    INSERT = 2
    DELETE = 3


class Change:
    def __init__(self, change_type: ChangeType, target: str, new_value: str):
        self.change_type = change_type
        self.target = target
        self.new_value = new_value


class ChangeManager:
    def __init__(self):
        self.change_queue = Queue()
        self.change_listeners = []

        self.running = True
        self.change_distribution_thread = threading.Thread(target=self.distribute_changes)
        self.change_distribution_thread.run()

    def register_change_listener(self, listener: callable):
        self.change_listeners.append(listener)

    def unregister_change_listener(self, listener: callable):
        try:
            self.change_listeners.remove(listener)
        except ValueError:
            pass

    def incoming_change(self, change: Change):
        self.change_queue.put(change)

    def distribute_changes(self):
        while self.running:
            try:
                change = self.change_queue.get(block=True, timeout=0.1)
            except Empty:
                continue
            for listener in self.change_listeners:
                listener(change)
