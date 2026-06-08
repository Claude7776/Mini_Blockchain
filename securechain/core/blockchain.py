from securechain.core.block import Block
from securechain.core.transaction import Transaction

class Blockchain:
    def __init__(self, config):
        self.chain = []
        self.pending = []
        self.config = config
        self.genesis()

    def genesis(self):
        self.chain.append(Block(0, "GENESIS", "0", self.config["difficulty"]))

    def add_tx(self, tx: Transaction):
        self.pending.append(tx)

    def mine(self, miner="system"):
        if not self.pending:
            return None

        reward = Transaction("system", miner, self.config.get("reward", 10))
        txs = [t.to_dict() for t in self.pending] + [reward.to_dict()]

        block = Block(
            len(self.chain),
            txs,
            self.chain[-1].hash,
            self.config["difficulty"],
        )

        self.chain.append(block)
        self.pending = []
        return block

    def balance(self, address):
        total = 0.0
        for block in self.chain:
            if isinstance(block.txs, list):
                for tx in block.txs:
                    if tx.get("receiver") == address:
                        total += tx.get("amount", 0)
                    if tx.get("sender") == address:
                        total -= tx.get("amount", 0)
        return round(total, 8)

    def valid(self):
        for i in range(1, len(self.chain)):
            c, p = self.chain[i], self.chain[i - 1]
            if c.hash != c.calc():
                return False
            if c.prev_hash != p.hash:
                return False
        return True

    def to_list(self):
        return [b.to_dict() for b in self.chain]
