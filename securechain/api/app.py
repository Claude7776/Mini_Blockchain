from flask import Flask, jsonify, request, send_from_directory
from securechain.core.blockchain import Blockchain
from securechain.core.transaction import Transaction
import json
import os

app = Flask(__name__)

config_path = os.path.join(os.path.dirname(__file__), "../../securechain/config.json")
with open(config_path) as f:
    config = json.load(f)

chain = Blockchain(config)

# ---------- API ----------

@app.route("/chain")
def chain_view():
    return jsonify(chain.to_list())

@app.route("/pending")
def pending_view():
    return jsonify([t.to_dict() for t in chain.pending])

@app.route("/tx", methods=["POST"])
def add_tx():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Corps JSON requis"}), 400
    try:
        tx = Transaction(data.get("sender"), data.get("receiver"), data.get("amount"))
        chain.add_tx(tx)
        return jsonify({"status": "ok", "tx": tx.to_dict()}), 201
    except (ValueError, TypeError) as e:
        return jsonify({"error": str(e)}), 400

@app.route("/mine", methods=["POST"])
def mine():
    data = request.get_json(silent=True) or {}
    miner = data.get("miner", "anonymous")
    if not chain.pending:
        return jsonify({"error": "Aucune transaction en attente"}), 400
    block = chain.mine(miner=miner)
    return jsonify({"status": "mined", "block": block.to_dict()}), 200

@app.route("/validate")
def validate():
    return jsonify({"valid": chain.valid(), "length": len(chain.chain)})

@app.route("/balance/<address>")
def balance(address):
    return jsonify({"address": address, "balance": chain.balance(address), "currency": config.get("currency", "SCoin")})

# ---------- FRONTEND ----------

@app.route("/")
def home():
    return send_from_directory("../../web", "index.html")

@app.route("/app.js")
def js():
    return send_from_directory("../../web", "app.js")

@app.route("/style.css")
def css():
    return send_from_directory("../../web", "style.css")

if __name__ == "__main__":
    app.run(port=config["port"], debug=True)
