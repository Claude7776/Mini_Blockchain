import time

class Transaction:
    def __init__(self, sender, receiver, amount):
        if not sender or not isinstance(sender, str):
            raise ValueError("Sender invalide")
        if not receiver or not isinstance(receiver, str):
            raise ValueError("Receiver invalide")
        if not isinstance(amount, (int, float)) or amount <= 0:
            raise ValueError("Montant doit être un nombre positif")
        self.sender = sender
        self.receiver = receiver
        self.amount = float(amount)
        self.timestamp = time.time()

    def to_dict(self):
        return {
            "sender": self.sender,
            "receiver": self.receiver,
            "amount": self.amount,
            "timestamp": self.timestamp,
        }
