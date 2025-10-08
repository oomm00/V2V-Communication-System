#!/bin/bash

# V2V Node Key Generation Script
# Usage: ./gen_keys.sh <node_name>
# Example: ./gen_keys.sh car1

# Check if node name is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <node_name>"
    echo "Example: $0 car1"
    exit 1
fi

NODE_NAME=$1

# Create keys directory if it doesn't exist
if [ ! -d "./keys" ]; then
    mkdir -p ./keys
    echo "Created ./keys/ directory"
fi

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo "Error: OpenSSL is not installed or not in PATH"
    echo "Please install OpenSSL to generate ECDSA keys"
    exit 1
fi

# Generate private key using secp256r1 (prime256v1) curve
echo "Generating ECDSA private key for $NODE_NAME..."
openssl ecparam -genkey -name prime256v1 -noout -out "keys/${NODE_NAME}_priv.pem"

if [ $? -ne 0 ]; then
    echo "Error: Failed to generate private key"
    exit 1
fi

# Generate public key from private key
echo "Generating public key for $NODE_NAME..."
openssl ec -in "keys/${NODE_NAME}_priv.pem" -pubout -out "keys/${NODE_NAME}_pub.pem"

if [ $? -ne 0 ]; then
    echo "Error: Failed to generate public key"
    rm -f "keys/${NODE_NAME}_priv.pem"
    exit 1
fi

# Set appropriate permissions (private key should be readable only by owner)
chmod 600 "keys/${NODE_NAME}_priv.pem"
chmod 644 "keys/${NODE_NAME}_pub.pem"

echo "Keys generated for $NODE_NAME in ./keys/"
echo "  Private key: keys/${NODE_NAME}_priv.pem"
echo "  Public key:  keys/${NODE_NAME}_pub.pem"
echo ""
echo "Key details:"
openssl ec -in "keys/${NODE_NAME}_priv.pem" -text -noout | head -10
