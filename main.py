from blockchain import Blockchain

blockchain = Blockchain()

blockchain.add_block("Skywalker envoie 5 BTC")
blockchain.add_block("Alice envoie 2 BTC")
blockchain.add_block("Bob envoie 1 BTC")

print("=== BLOCKCHAIN ===")

for block in blockchain.chain:

    print(f"\nBloc #{block.index}")
    print(f"Data : {block.data}")
    print(f"Hash : {block.hash}")
    print(f"Previous Hash : {block.previous_hash}")

print("\nBlockchain valide ?")
print(blockchain.is_chain_valid())
print("\n--- Attaque ---")

blockchain.chain[1].data = "Skywalker envoie 500 BTC"
print(blockchain.is_chain_valid())