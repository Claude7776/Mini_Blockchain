class Transaction:
    def __init__(self, sender, receiver, amount):
        self.sender = sender
        self.receiver = receiver
        self.amount = amount
        self.signature = None
        self.nonce = 0

        while True:
            hash = self.calculate_hash()
            if hash.startswith("0000"):
                break
            self.nonce += 1