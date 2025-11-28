# Design Document: ECDSA Signature Verification

## Overview

This design implements cryptographically secure ECDSA signature generation and verification across the V2V system. The implementation replaces stub functions with real cryptographic operations using industry-standard libraries (OpenSSL, elliptic.js, ecdsa) to ensure only authorized vehicles can submit hazard alerts.

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     V2V System                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │   C Node     │      │  Node.js API │      │ Simulator│ │
│  │              │      │              │      │          │ │
│  │ OpenSSL      │      │ elliptic.js  │      │  ecdsa   │ │
│  │ - EC_KEY     │      │ - secp256k1  │      │  library │ │
│  │ - ECDSA_sign │      │ - verify()   │      │          │ │
│  │ - SHA256     │      │ - SHA256     │      │          │ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
│         │                      │                    │      │
│         └──────────────────────┼────────────────────┘      │
│                                │                           │
│                    ┌───────────▼──────────┐                │
│                    │   Key Registry       │                │
│                    │  publicKeys.json     │                │
│                    │  keys/*.pem          │                │
│                    └──────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Key Generation:
   Simulator → Generate ECDSA keypair → Save to keys/
                                      → Register public key

2. Message Signing:
   Simulator → Create canonical message → SHA256 hash
           → ECDSA sign → Base64 encode → Include in alert

3. Signature Verification:
   API → Receive alert → Extract signature → Load public key
       → SHA256 hash → ECDSA verify → Accept/Reject
```

## Components and Interfaces

### 1. C Node Crypto Module (`v2v/node/src/crypto.c`)

#### Functions to Implement:

```c
/**
 * Generate ECDSA key pair using secp256k1 curve
 * @param priv_path Path to save private key (PEM format)
 * @param pub_path Path to save public key (PEM format)
 * @return 0 on success, -1 on error
 */
int generate_ephemeral_keypair(const char *priv_path, const char *pub_path);

/**
 * Sign message using ECDSA with SHA-256
 * @param priv_path Path to private key file
 * @param msg Message to sign
 * @param sig Output signature (caller must free)
 * @param sig_len Output signature length
 * @return 0 on success, -1 on error
 */
int sign_message(const char *priv_path, const char *msg, 
                 unsigned char **sig, size_t *sig_len);

/**
 * Verify ECDSA signature
 * @param pub_path Path to public key file
 * @param msg Original message
 * @param sig Signature to verify
 * @param sig_len Signature length
 * @return 0 if valid, -1 if invalid
 */
int verify_message(const char *pub_path, const char *msg,
                   const unsigned char *sig, size_t sig_len);
```

#### Implementation Details:

- **Curve**: secp256k1 (same as Bitcoin/Ethereum)
- **Hash**: SHA-256
- **Key Format**: PEM (Privacy Enhanced Mail)
- **Signature Format**: DER-encoded ECDSA signature

### 2. Node.js API Verification (`v2v/node/server.js`)

#### New Module:

```javascript
// v2v/node/src/utils/signatureVerifier.js

const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const fs = require('fs');

class SignatureVerifier {
  constructor(keyRegistryPath) {
    this.keyRegistry = this.loadKeyRegistry(keyRegistryPath);
  }

  loadKeyRegistry(path) {
    // Load publicKeys.json
  }

  verifySignature(message, signature, ephemeralId) {
    // 1. Get public key for ephemeralId
    // 2. Compute SHA-256 hash of message
    // 3. Verify signature using elliptic
    // 4. Return true/false
  }

  createCanonicalMessage(alert) {
    // Create deterministic JSON string
  }
}

module.exports = SignatureVerifier;
```

#### Integration Points:

- **POST /alert endpoint**: Add signature verification before processing
- **Key registry**: Load from `keys/publicKeys.json`
- **Error responses**: 401 for invalid signature, 403 for unknown key

### 3. Python Simulator (`v2v/node/scripts/simulator.py`)

#### New Dependencies:

```python
from ecdsa import SigningKey, SECP256k1
import hashlib
import base64
import json
```

#### Implementation:

```python
class V2VSimulator:
    def __init__(self, vehicle_id):
        self.vehicle_id = vehicle_id
        self.private_key = self.load_or_generate_key()
        self.public_key = self.private_key.get_verifying_key()
        
    def load_or_generate_key(self):
        # Load from keys/{vehicle_id}_priv.pem or generate new
        pass
    
    def sign_message(self, message):
        # 1. Create canonical JSON
        # 2. Compute SHA-256 hash
        # 3. Sign with ECDSA
        # 4. Base64 encode
        pass
    
    def generate_alert(self):
        alert = {
            "msg_type": "hazard_report",
            "ephemeral_id": self.vehicle_id,
            "location": [lat, lon],
            "hazard_type": hazard_type,
            "confidence": confidence
        }
        
        # Create canonical message
        canonical = json.dumps(alert, sort_keys=True)
        
        # Sign
        signature = self.sign_message(canonical)
        alert["signature"] = signature
        
        return alert
```

## Data Models

### Canonical Message Format

```json
{
  "msg_type": "hazard_report",
  "ephemeral_id": "car001",
  "location": [40.7128, -74.0060],
  "hazard_type": "ice_patch",
  "confidence": 0.85
}
```

**Rules:**
- Keys sorted alphabetically
- No whitespace
- Floating point numbers with max 6 decimal places
- UTF-8 encoding

### Key Registry Format (`keys/publicKeys.json`)

```json
{
  "car001": {
    "publicKey": "04a1b2c3d4...",
    "format": "hex",
    "curve": "secp256k1",
    "registered": "2025-11-11T12:00:00Z"
  },
  "car002": {
    "publicKey": "04e5f6g7h8...",
    "format": "hex",
    "curve": "secp256k1",
    "registered": "2025-11-11T12:05:00Z"
  }
}
```

### Signature Format

- **Encoding**: Base64
- **Algorithm**: ECDSA with secp256k1
- **Hash**: SHA-256
- **Format**: DER-encoded signature

Example:
```
"MEUCIQDx1y2z3..."
```

## Error Handling

### Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Missing signature | Reject with error message |
| 401 | Invalid signature | Reject, log attempt |
| 403 | Unknown ephemeral_id | Reject, suggest registration |
| 409 | Replay attack detected | Reject, log security event |
| 500 | Crypto operation failed | Log error, return generic message |

### Error Response Format

```json
{
  "error": "Invalid signature",
  "code": "INVALID_SIGNATURE",
  "ephemeral_id": "car001",
  "timestamp": 1699999999999,
  "details": "Signature verification failed"
}
```

### Logging Strategy

```javascript
// Success (debug level)
logger.debug(`[✅ signature] Verified: ${ephemeral_id} - ${alert_key}`);

// Failure (warn level)
logger.warn(`[❌ signature] Invalid from ${ephemeral_id}: ${reason}`);

// Security event (error level)
logger.error(`[🚨 security] Replay attack from ${ephemeral_id}`);
```

## Testing Strategy

### Unit Tests

#### C Node Tests:
```c
// test_crypto.c
void test_generate_keypair();
void test_sign_message();
void test_verify_valid_signature();
void test_verify_invalid_signature();
void test_verify_tampered_message();
```

#### Node.js Tests:
```javascript
// test/signatureVerifier.test.js
describe('SignatureVerifier', () => {
  it('should verify valid signature');
  it('should reject invalid signature');
  it('should reject unknown ephemeral_id');
  it('should handle malformed signatures');
  it('should create canonical message correctly');
});
```

#### Python Tests:
```python
# test_simulator.py
def test_key_generation():
def test_message_signing():
def test_signature_format():
def test_canonical_message():
```

### Integration Tests

```javascript
// test/integration/signature-flow.test.js
describe('End-to-End Signature Flow', () => {
  it('should accept alert with valid signature');
  it('should reject alert with invalid signature');
  it('should reject replay attack');
  it('should handle multiple vehicles');
});
```

### Performance Tests

```javascript
// test/performance/signature-perf.test.js
describe('Signature Performance', () => {
  it('should verify 100 signatures in < 1 second');
  it('should handle 1000 concurrent verifications');
  it('should not leak memory after 10000 verifications');
});
```

## Security Considerations

### Key Storage

- **Private Keys**: Stored in `keys/` with 600 permissions (owner read/write only)
- **Public Keys**: Stored in `publicKeys.json` with 644 permissions
- **Key Rotation**: Not implemented in v1, planned for future

### Replay Attack Prevention

```javascript
// Replay cache structure
const replayCache = new Map(); // ephemeral_id -> Set<sequence_number>

function checkReplay(ephemeralId, sequence) {
  if (!replayCache.has(ephemeralId)) {
    replayCache.set(ephemeralId, new Set());
  }
  
  const seqSet = replayCache.get(ephemeralId);
  if (seqSet.has(sequence)) {
    return false; // Replay detected
  }
  
  seqSet.add(sequence);
  
  // Limit cache size
  if (seqSet.size > 1000) {
    const oldest = Array.from(seqSet)[0];
    seqSet.delete(oldest);
  }
  
  return true;
}
```

### Timing Attack Mitigation

- Use constant-time comparison for signature verification
- Don't leak information about which part of verification failed
- Return generic error messages

## Performance Optimization

### Caching Strategy

```javascript
// Cache public keys in memory
const keyCache = new LRU({
  max: 1000,
  maxAge: 1000 * 60 * 60 // 1 hour
});

function getPublicKey(ephemeralId) {
  if (keyCache.has(ephemeralId)) {
    return keyCache.get(ephemeralId);
  }
  
  const key = loadKeyFromRegistry(ephemeralId);
  keyCache.set(ephemeralId, key);
  return key;
}
```

### Async Verification

```javascript
// Don't block on signature verification
app.post("/alert", async (req, res) => {
  try {
    // Quick validation
    validateAlertFormat(req.body);
    
    // Async signature verification
    const isValid = await verifySignatureAsync(req.body);
    
    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }
    
    // Continue processing
    await processAlert(req.body);
    res.json({ status: "verified" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

## Configuration

### Environment Variables

```bash
# Enable/disable signature verification
REQUIRE_SIGNATURES=true

# Key registry path
KEY_REGISTRY_PATH=./keys/publicKeys.json

# Replay cache size
REPLAY_CACHE_SIZE=10000

# Signature algorithm
SIGNATURE_ALGORITHM=ECDSA
SIGNATURE_CURVE=secp256k1
SIGNATURE_HASH=SHA256
```

### Development Mode

```javascript
const REQUIRE_SIGNATURES = process.env.NODE_ENV === 'production' 
  || process.env.REQUIRE_SIGNATURES === 'true';

if (!REQUIRE_SIGNATURES) {
  console.warn('⚠️  Signature verification DISABLED - development mode');
}
```

## Migration Plan

### Phase 1: Implementation (Day 1)
1. Implement C node crypto functions with OpenSSL
2. Implement Node.js signature verifier
3. Update Python simulator with ecdsa library
4. Write unit tests

### Phase 2: Integration (Day 2)
1. Integrate verifier into API endpoint
2. Update simulator to generate real signatures
3. Test end-to-end flow
4. Fix any issues

### Phase 3: Testing (Day 2-3)
1. Run integration tests
2. Performance testing
3. Security testing
4. Documentation

### Phase 4: Deployment (Day 3)
1. Update deployment scripts
2. Add monitoring
3. Deploy to staging
4. Deploy to production

## Rollback Plan

If issues arise:
1. Set `REQUIRE_SIGNATURES=false` in environment
2. System continues operating without verification
3. Fix issues offline
4. Re-enable signatures after validation

## Success Criteria

- ✅ All unit tests passing (20+ tests)
- ✅ Integration tests passing (5+ tests)
- ✅ Signature verification < 10ms average
- ✅ No memory leaks after 10,000 verifications
- ✅ Invalid signatures rejected 100% of time
- ✅ Valid signatures accepted 100% of time
- ✅ Replay attacks prevented 100% of time
- ✅ Documentation complete

---

**Design Status:** Ready for Implementation  
**Estimated Effort:** 6-8 hours  
**Risk Level:** Medium (cryptography requires careful implementation)
