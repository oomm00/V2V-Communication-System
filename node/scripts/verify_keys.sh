#!/bin/bash

# V2V Key Verification Script
# Usage: ./verify_keys.sh

echo "=== V2V Key Verification ==="
echo

# Check if keys directory exists
if [ ! -d "./keys" ]; then
    echo "❌ Keys directory not found!"
    echo "Run: ./scripts/gen_keys.sh car1"
    exit 1
fi

# Check for key files
echo "📁 Checking key files..."
for key_file in keys/*_priv.pem keys/*_pub.pem; do
    if [ -f "$key_file" ]; then
        echo "✅ Found: $key_file"
    fi
done

echo
echo "🔐 Verifying key pairs..."

# Verify each private/public key pair
for priv_key in keys/*_priv.pem; do
    if [ -f "$priv_key" ]; then
        node_name=$(basename "$priv_key" _priv.pem)
        pub_key="keys/${node_name}_pub.pem"
        
        if [ -f "$pub_key" ]; then
            echo "Checking $node_name..."
            
            # Extract public key from private key
            temp_pub=$(mktemp)
            openssl ec -in "$priv_key" -pubout -out "$temp_pub" 2>/dev/null
            
            # Compare with stored public key
            if diff -q "$temp_pub" "$pub_key" >/dev/null 2>&1; then
                echo "  ✅ Key pair is valid"
            else
                echo "  ❌ Key pair mismatch!"
            fi
            
            rm -f "$temp_pub"
        else
            echo "  ❌ Missing public key: $pub_key"
        fi
    fi
done

echo
echo "🔍 Key details:"
for priv_key in keys/*_priv.pem; do
    if [ -f "$priv_key" ]; then
        node_name=$(basename "$priv_key" _priv.pem)
        echo "--- $node_name ---"
        openssl ec -in "$priv_key" -text -noout | grep -E "(Private-Key|ASN1 OID|NIST CURVE)" 2>/dev/null || echo "  (Placeholder key - install OpenSSL for real keys)"
        echo
    fi
done

echo "=== Verification Complete ==="
