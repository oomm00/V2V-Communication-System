# Implementation Plan: ECDSA Signature Verification

## Task List

- [x] 1. Set up development environment and dependencies


  - Install OpenSSL development libraries for C node
  - Install elliptic.js for Node.js API
  - Install ecdsa library for Python simulator
  - _Requirements: 1.1, 2.1, 3.1_





- [ ] 2. Implement C node cryptographic functions
- [ ] 2.1 Replace stub in `generate_ephemeral_keypair()`
  - Use OpenSSL EC_KEY_new_by_curve_name with NID_secp256k1
  - Generate key pair with EC_KEY_generate_key
  - Save private key with PEM_write_ECPrivateKey
  - Save public key with PEM_write_EC_PUBKEY
  - Add error handling for all OpenSSL operations
  - _Requirements: 1.1, 4.1, 4.2_

- [ ] 2.2 Replace stub in `sign_message()`
  - Load private key from PEM file using PEM_read_ECPrivateKey
  - Compute SHA-256 hash of message using SHA256()
  - Sign hash with ECDSA_sign()
  - Allocate and return signature buffer
  - Free EC_KEY after use
  - _Requirements: 1.2, 7.3_

- [ ] 2.3 Replace stub in `verify_message()`
  - Load public key from PEM file using PEM_read_EC_PUBKEY
  - Compute SHA-256 hash of message
  - Verify signature with ECDSA_verify()
  - Return 0 for valid, -1 for invalid
  - Free EC_KEY after use
  - _Requirements: 1.3, 1.4, 1.5_

- [ ]* 2.4 Write C unit tests
  - Test key generation creates valid PEM files
  - Test signing produces valid signatures




  - Test verification accepts valid signatures
  - Test verification rejects invalid signatures
  - Test verification rejects tampered messages
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 3. Implement Node.js signature verification module

- [ ] 3.1 Create SignatureVerifier class
  - Create `v2v/node/src/utils/signatureVerifier.js`
  - Implement constructor that loads key registry
  - Implement loadKeyRegistry() to read publicKeys.json
  - Implement getPublicKey() with caching
  - Add error handling for missing keys
  - _Requirements: 2.1, 2.2, 4.3, 4.4_


- [ ] 3.2 Implement verifySignature() method
  - Extract public key for ephemeral_id
  - Create canonical message from alert data
  - Compute SHA-256 hash using crypto.createHash
  - Verify signature using elliptic.js ec.keyFromPublic().verify()

  - Return true for valid, false for invalid
  - _Requirements: 2.3, 2.4, 2.5_

- [ ] 3.3 Implement createCanonicalMessage() method
  - Extract msg_type, ephemeral_id, location, hazard_type, confidence
  - Create object with sorted keys
  - Convert to JSON string with no whitespace
  - Ensure deterministic output
  - _Requirements: 2.1, 10.4_

- [ ] 3.4 Add replay attack prevention
  - Create replay cache Map structure
  - Implement checkReplay() function
  - Store sequence numbers per ephemeral_id
  - Limit cache size to prevent memory issues



  - Clear cache on restart

  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 3.5 Write Node.js unit tests
  - Test SignatureVerifier loads key registry
  - Test verifySignature accepts valid signatures
  - Test verifySignature rejects invalid signatures

  - Test verifySignature rejects unknown ephemeral_id
  - Test createCanonicalMessage produces correct format
  - Test replay attack prevention
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 4. Integrate signature verification into API
- [x] 4.1 Update POST /alert endpoint

  - Import SignatureVerifier module
  - Initialize verifier with key registry path
  - Add signature verification before processing alert
  - Return 401 for invalid signatures
  - Return 403 for unknown ephemeral_id
  - Return 409 for replay attacks



  - _Requirements: 2.4, 2.5, 2.6, 5.2_

- [ ] 4.2 Add error logging
  - Log signature verification failures with ephemeral_id
  - Log unknown ephemeral_id attempts
  - Log replay attack attempts at error level


  - Log successful verifications at debug level
  - Include alert_key in all logs
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 4.3 Add configuration support
  - Add REQUIRE_SIGNATURES environment variable

  - Add KEY_REGISTRY_PATH environment variable
  - Add REPLAY_CACHE_SIZE environment variable
  - Log warning if signatures disabled
  - Default to disabled in development mode
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5. Update Python simulator with real signatures

- [ ] 5.1 Install ecdsa library
  - Add ecdsa to requirements or install command
  - Import SigningKey, SECP256k1 from ecdsa
  - Import hashlib for SHA-256
  - Import base64 for encoding
  - _Requirements: 3.1_

- [ ] 5.2 Implement key management
  - Create load_or_generate_key() function
  - Check if private key exists in keys/ directory
  - Generate new key if not found using SigningKey.generate(SECP256k1)
  - Save private key to PEM file
  - Extract and save public key to publicKeys.json

  - _Requirements: 3.1, 3.5, 4.1, 4.2_




- [ ] 5.3 Implement message signing
  - Create sign_message() function
  - Compute SHA-256 hash of canonical message
  - Sign hash using private_key.sign_digest()

  - Base64 encode the signature
  - Return encoded signature string
  - _Requirements: 3.2, 3.3, 3.4_

- [ ] 5.4 Update alert generation
  - Create canonical message before signing

  - Call sign_message() to get signature
  - Include signature in alert payload
  - Ensure public key is registered
  - Add sequence number to prevent replay
  - _Requirements: 3.2, 3.3, 3.4, 5.1_


- [ ]* 5.5 Write Python unit tests
  - Test key generation creates valid keys
  - Test signing produces valid signatures
  - Test signature format is base64
  - Test canonical message format

  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 6. End-to-end integration testing
- [ ] 6.1 Test valid signature flow
  - Start API server with signature verification enabled
  - Start simulator with real key
  - Verify alert is accepted
  - Verify alert stored on blockchain
  - Verify alert stored in database
  - _Requirements: 8.4_

- [ ] 6.2 Test invalid signature rejection
  - Send alert with tampered signature
  - Verify API returns 401

  - Verify alert is not stored
  - Verify error is logged
  - _Requirements: 8.2, 8.3_

- [ ] 6.3 Test unknown vehicle rejection
  - Send alert from unregistered vehicle
  - Verify API returns 403
  - Verify error message includes ephemeral_id
  - _Requirements: 2.6, 7.2_

- [ ] 6.4 Test replay attack prevention
  - Send same alert twice with same sequence number
  - Verify first is accepted
  - Verify second is rejected with 409
  - Verify security event is logged
  - _Requirements: 5.1, 5.2, 8.5_

- [ ] 6.5 Test multiple vehicles
  - Start multiple simulators with different keys
  - Verify each vehicle's alerts are accepted
  - Verify signatures are verified independently

  - Verify no cross-contamination
  - _Requirements: 8.4_

- [ ]* 6.6 Performance testing
  - Send 100 alerts and measure verification time
  - Verify average < 10ms per verification
  - Send 1000 alerts and check memory usage
  - Verify no memory leaks
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Documentation and deployment
- [x] 7.1 Update API documentation

  - Document signature requirement in POST /alert
  - Document error codes (401, 403, 409)
  - Document canonical message format
  - Add examples of valid signatures
  - _Requirements: 10.1, 10.2, 10.3, 10.4_


- [ ] 7.2 Create key generation guide
  - Document how to generate vehicle keys
  - Document how to register public keys
  - Document key file formats
  - Add troubleshooting section
  - _Requirements: 10.1, 10.5_


- [x] 7.3 Update deployment scripts

  - Add OpenSSL to dependencies
  - Add elliptic to package.json
  - Add ecdsa to Python requirements
  - Update environment variable templates
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 7.4 Create TODO3 completion report

  - Document all changes made
  - Include test results
  - Include performance metrics
  - Add usage examples
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

---

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped for MVP
- All core implementation tasks (1-5) must be completed
- Integration testing (6.1-6.5) is required
- Performance testing (6.6) is optional but recommended
- Documentation (7) should be completed for production readiness

## Estimated Timeline

- **Day 1 (4-5 hours):** Tasks 1-3 (C node + Node.js implementation)
- **Day 2 (3-4 hours):** Tasks 4-5 (API integration + Python simulator)
- **Day 3 (2-3 hours):** Tasks 6-7 (Testing + Documentation)

**Total:** 6-8 hours over 2-3 days
