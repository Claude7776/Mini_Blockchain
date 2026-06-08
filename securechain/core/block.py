import hashlib
import time

class Block:
    def __init__(self, index, txs, prev_hash, difficulty):
        self.index = index
        self.timestamp = time.time()
        self.txs = txs
        self.prev_hash = prev_hash
        self.nonce = 0
        self.difficulty = difficulty
        self.hash = self.mine()

    def calc(self):
        data = (
            str(self.index)
            + str(self.timestamp)
            + str(self.txs)
            + str(self.prev_hash)
            + str(self.nonce)
        )
        return hashlib.sha256(data.encode()).hexdigest()

    def mine(self):
        target = "0" * self.difficulty
        while True:
            h = self.calc()
            if h.startswith(target):
                return h
            self.nonce += 1

    def to_dict(self):
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "txs": self.txs,
            "prev_hash": self.prev_hash,
            "hash": self.hash,
            "nonce": self.nonce,
            "difficulty": self.difficulty,
        }
