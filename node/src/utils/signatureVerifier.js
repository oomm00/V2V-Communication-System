const crypto = require('crypto');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const fs = require('fs');
const path = require('path');

/**
 * SignatureVerifier - Verifies ECDSA signatures for V2V alerts
 * Uses secp256k1 curve (same as Bitcoin/Ethereum)
 */
class SignatureVerifier {
  constructor(keyRegistryPath) {
    this.keyRegistryPath = keyRegistryPath;
    this.keyRegistry = {};
    this.keyCache = new Map();
    this.replayCache = new Map();
    this.maxReplayCacheSize = process.env.REPLAY_CACHE_SIZE || 10000;
    
    this.loadKeyRegistry();
  }

  /**
   * Load public key registry from JSON file
   */
  loadKeyRegistry() {
    try {
      if (fs.existsSync(this.keyRegistryPath)) {
        const data = fs.readFileSync(this.keyRegistryPath, 'utf8');
        this.keyRegistry = JSON.parse(data);
        console.log(`[signature] Loaded ${Object.keys(this.keyRegistry).length} public keys`);
      } else {
        console.warn(`[signature] Key registry not found: ${this.keyRegistryPath}`);
        this.keyRegistry = {};
      }
    } catch (err) {
      console.error(`[signature] Failed to load key registry:`, err.message);
      this.keyRegistry = {};
    }
  }

  /**
   * Reload key registry (useful for adding new vehicles)
   */
  reloadKeyRegistry() {
    this.keyCache.clear();
    this.loadKeyRegistry();
  }

  /**
   * Get public key for an ephemeral ID
   * @param {string} ephemeralId - Vehicle identifier
   * @returns {string|null} Public key in hex format or null if not found
   */
  getPublicKey(ephemeralId) {
    // Check cache first
    if (this.keyCache.has(ephemeralId)) {
      return this.keyCache.get(ephemeralId);
    }

    // Load from registry
    const keyData = this.keyRegistry[ephemeralId];
    if (!keyData) {
      return null;
    }

    const publicKey = keyData.publicKey || keyData;
    
    // Cache it
    this.keyCache.set(ephemeralId, publicKey);
    
    // Limit cache size
    if (this.keyCache.size > 1000) {
      const firstKey = this.keyCache.keys().next().value;
      this.keyCache.delete(firstKey);
    }

    return publicKey;
  }

  /**
   * Create canonical message from alert data
   * @param {object} alert - Alert object
   * @returns {string} Canonical JSON string
   */
  createCanonicalMessage(alert) {
    // Extract only the fields that should be signed
    const canonical = {
      msg_type: alert.msg_type,
      ephemeral_id: alert.ephemeral_id,
      location: alert.location,
      hazard_type: alert.hazard_type,
      confidence: alert.confidence || 0.8
    };

    // Create deterministic JSON (sorted keys, no whitespace)
    return JSON.stringify(canonical, Object.keys(canonical).sort());
  }

  /**
   * Verify ECDSA signature
   * @param {string} message - Original message (canonical JSON)
   * @param {string} signature - Signature in hex or base64 format
   * @param {string} publicKey - Public key in hex format
   * @returns {boolean} True if signature is valid
   */
  verifySignatureWithKey(message, signature, publicKey) {
    try {
      // Compute SHA-256 hash of message
      const msgHash = crypto.createHash('sha256').update(message).digest();

      // Parse public key
      const key = ec.keyFromPublic(publicKey, 'hex');

      // Convert signature from base64 to hex if needed
      let sigHex = signature;
      if (!/^[0-9a-fA-F]+$/.test(signature)) {
        // Assume base64
        const sigBuffer = Buffer.from(signature, 'base64');
        sigHex = sigBuffer.toString('hex');
      }

      // Verify signature
      const isValid = key.verify(msgHash, sigHex);
      
      return isValid;
    } catch (err) {
      console.error(`[signature] Verification error:`, err.message);
      return false;
    }
  }

  /**
   * Check for replay attack
   * @param {string} ephemeralId - Vehicle identifier
   * @param {number} sequence - Message sequence number
   * @returns {boolean} True if message is new (not a replay)
   */
  checkReplay(ephemeralId, sequence) {
    if (!this.replayCache.has(ephemeralId)) {
      this.replayCache.set(ephemeralId, new Set());
    }

    const seqSet = this.replayCache.get(ephemeralId);
    
    if (seqSet.has(sequence)) {
      return false; // Replay detected
    }

    seqSet.add(sequence);

    // Limit cache size per vehicle
    if (seqSet.size > 1000) {
      const oldest = Array.from(seqSet)[0];
      seqSet.delete(oldest);
    }

    // Limit total cache size
    if (this.replayCache.size > this.maxReplayCacheSize) {
      const firstVehicle = this.replayCache.keys().next().value;
      this.replayCache.delete(firstVehicle);
    }

    return true;
  }

  /**
   * Verify alert signature (main entry point)
   * @param {object} alert - Alert object with signature
   * @returns {object} Verification result { valid, error, code }
   */
  verifySignature(alert) {
    try {
      // Extract required fields
      const { ephemeral_id, signature, seq } = alert;

      if (!ephemeral_id) {
        return { valid: false, error: 'Missing ephemeral_id', code: 'MISSING_ID' };
      }

      if (!signature) {
        return { valid: false, error: 'Missing signature', code: 'MISSING_SIGNATURE' };
      }

      // Get public key
      const publicKey = this.getPublicKey(ephemeral_id);
      if (!publicKey) {
        return { 
          valid: false, 
          error: `Unknown ephemeral_id: ${ephemeral_id}`, 
          code: 'UNKNOWN_ID' 
        };
      }

      // Check replay attack (if sequence number provided)
      if (seq !== undefined && seq !== null) {
        if (!this.checkReplay(ephemeral_id, seq)) {
          return { 
            valid: false, 
            error: 'Replay attack detected', 
            code: 'REPLAY_ATTACK' 
          };
        }
      }

      // Create canonical message
      const canonical = this.createCanonicalMessage(alert);

      // Verify signature
      const isValid = this.verifySignatureWithKey(canonical, signature, publicKey);

      if (!isValid) {
        return { 
          valid: false, 
          error: 'Invalid signature', 
          code: 'INVALID_SIGNATURE' 
        };
      }

      return { valid: true };
    } catch (err) {
      console.error(`[signature] Verification failed:`, err);
      return { 
        valid: false, 
        error: 'Verification error', 
        code: 'VERIFICATION_ERROR' 
      };
    }
  }

  /**
   * Clear replay cache (useful for testing or restart)
   */
  clearReplayCache() {
    this.replayCache.clear();
  }
}

module.exports = SignatureVerifier;
