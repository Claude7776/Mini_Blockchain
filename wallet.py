from cryptography.hazmat.primitives.asymmetric import ec

private_key = ec.generate_private_key(
    ec.SECP256K1()
)

public_key = private_key.public_key()