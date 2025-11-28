# Requirements Document: ECDSA Signature Verification

## Introduction

This specification defines the implementation of real ECDSA (Elliptic Curve Digital Signature Algorithm) signature verification for the V2V Communication System. Currently, the system uses stub implementations that always return success, creating a critical security vulnerability. This feature will implement cryptographically secure signature generation and verification to ensure only authorized vehicles can submit hazard alerts.

## Glossary

- **ECDSA**: Elliptic Curve Digital Signature Algorithm - cryptographic signature scheme
- **V2V System**: Vehicle-to-Vehicle Communication System
- **Ephemeral ID**: Temporary identifier for a vehicle in the network
- **Hazard Alert**: Message reporting road hazards (ice, debris, accidents, etc.)
- **Canonical Message**: Standardized JSON format for signing
- **C Node**: C-based cryptographic node component
- **API Server**: Node.js backend server
- **Simulator**: Python script that generates test alerts

## Requirements

### Requirement 1: C Node Cryptographic Implementation

**User Story:** As a V2V system developer, I want the C node to use real ECDSA cryptography so that message signatures are cryptographically secure.

#### Acceptance Criteria

1. WHEN the C node generates a key pair, THE System SHALL use OpenSSL's EC_KEY with secp256k1 curve to create a valid ECDSA key pair
2. WHEN the C node signs a message, THE System SHALL compute SHA-256 hash of the message and sign it using ECDSA_sign with the private key
3. WHEN the C node verifies a signature, THE System SHALL compute SHA-256 hash of the message and verify the signature using ECDSA_verify with the public key
4. WHEN signature verification fails, THE System SHALL return a non-zero error code
5. WHEN signature verification succeeds, THE System SHALL return zero

### Requirement 2: Node.js API Signature Verification

**User Story:** As an API server, I want to verify ECDSA signatures on incoming alerts so that only authenticated vehicles can submit hazard reports.

#### Acceptance Criteria

1. WHEN the API receives a hazard alert, THE System SHALL extract the ephemeral_id, signature, and message payload
2. WHEN the API verifies a signature, THE System SHALL load the public key for the ephemeral_id from the key registry
3. WHEN the public key exists, THE System SHALL compute SHA-256 hash of the canonical message and verify the signature using elliptic.js
4. WHEN signature verification fails, THE System SHALL reject the alert with HTTP 401 Unauthorized
5. WHEN signature verification succeeds, THE System SHALL process the alert and store it on blockchain and database
6. WHEN the public key does not exist, THE System SHALL reject the alert with HTTP 403 Forbidden

### Requirement 3: Python Simulator Signature Generation

**User Story:** As a simulator, I want to generate real ECDSA signatures so that my test alerts are properly authenticated.

#### Acceptance Criteria

1. WHEN the simulator starts, THE System SHALL load or generate an ECDSA private key using the ecdsa Python library
2. WHEN the simulator generates an alert, THE System SHALL create a canonical JSON message with msg_type, ephemeral_id, location, hazard_type, and confidence
3. WHEN the simulator signs a message, THE System SHALL compute SHA-256 hash and sign it using ECDSA with secp256k1 curve
4. WHEN the simulator sends an alert, THE System SHALL include the signature as a base64-encoded string in the payload
5. WHEN the simulator sends an alert, THE System SHALL include the public key in the key registry format

### Requirement 4: Key Management

**User Story:** As a system administrator, I want secure key storage and management so that private keys are protected and public keys are accessible.

#### Acceptance Criteria

1. WHEN a vehicle registers, THE System SHALL generate a unique ECDSA key pair and store it in PEM format
2. WHEN storing private keys, THE System SHALL save them to the keys/ directory with restricted file permissions (600)
3. WHEN storing public keys, THE System SHALL save them to publicKeys.json with the ephemeral_id as the key
4. WHEN loading keys, THE System SHALL validate the key format before use
5. WHEN a key file is corrupted, THE System SHALL log an error and reject operations using that key

### Requirement 5: Replay Attack Prevention

**User Story:** As a security system, I want to prevent replay attacks so that old signed messages cannot be reused.

#### Acceptance Criteria

1. WHEN the API receives an alert, THE System SHALL check if the message sequence number has been seen before for that ephemeral_id
2. WHEN a duplicate sequence number is detected, THE System SHALL reject the alert with HTTP 409 Conflict
3. WHEN the sequence number is valid, THE System SHALL store it in the replay cache with the ephemeral_id
4. WHEN the replay cache exceeds 10,000 entries, THE System SHALL remove the oldest entries
5. WHEN the system restarts, THE System SHALL clear the replay cache

### Requirement 6: Performance Requirements

**User Story:** As a system operator, I want signature verification to be fast so that the system can handle high message volumes.

#### Acceptance Criteria

1. WHEN verifying a signature, THE System SHALL complete verification within 10 milliseconds on average
2. WHEN processing 100 alerts per second, THE System SHALL maintain signature verification for all messages
3. WHEN signature verification fails, THE System SHALL not block other incoming requests
4. WHEN the key registry contains 1000 keys, THE System SHALL load a specific key within 5 milliseconds
5. WHEN memory usage exceeds 500MB, THE System SHALL log a warning

### Requirement 7: Error Handling and Logging

**User Story:** As a system administrator, I want detailed error logging so that I can diagnose signature verification failures.

#### Acceptance Criteria

1. WHEN signature verification fails, THE System SHALL log the ephemeral_id, alert_key, and failure reason
2. WHEN a public key is not found, THE System SHALL log the ephemeral_id and timestamp
3. WHEN OpenSSL operations fail, THE System SHALL log the OpenSSL error code and message
4. WHEN the API rejects an alert, THE System SHALL include the rejection reason in the HTTP response
5. WHEN signature verification succeeds, THE System SHALL log the ephemeral_id and alert_key at debug level

### Requirement 8: Testing and Validation

**User Story:** As a QA engineer, I want comprehensive tests so that I can verify the signature implementation works correctly.

#### Acceptance Criteria

1. WHEN running unit tests, THE System SHALL verify that valid signatures are accepted
2. WHEN running unit tests, THE System SHALL verify that invalid signatures are rejected
3. WHEN running unit tests, THE System SHALL verify that tampered messages are rejected
4. WHEN running integration tests, THE System SHALL verify end-to-end signature flow from simulator to API
5. WHEN running integration tests, THE System SHALL verify that replay attacks are prevented

### Requirement 9: Backward Compatibility

**User Story:** As a system operator, I want graceful degradation so that the system can operate if signature verification is temporarily disabled.

#### Acceptance Criteria

1. WHEN the REQUIRE_SIGNATURES environment variable is set to false, THE System SHALL accept alerts without signature verification
2. WHEN signature verification is disabled, THE System SHALL log a warning on startup
3. WHEN signature verification is disabled, THE System SHALL still store alerts on blockchain and database
4. WHEN signature verification is re-enabled, THE System SHALL immediately start verifying signatures
5. WHEN in development mode, THE System SHALL default to signature verification disabled

### Requirement 10: Documentation

**User Story:** As a developer, I want clear documentation so that I can understand how to use the signature system.

#### Acceptance Criteria

1. WHEN reading the documentation, THE System SHALL provide examples of generating key pairs
2. WHEN reading the documentation, THE System SHALL provide examples of signing messages
3. WHEN reading the documentation, THE System SHALL provide examples of verifying signatures
4. WHEN reading the documentation, THE System SHALL explain the canonical message format
5. WHEN reading the documentation, THE System SHALL provide troubleshooting steps for common errors

---

## Summary

This specification defines the complete implementation of ECDSA signature verification across all V2V system components (C node, Node.js API, Python simulator). The implementation will replace stub functions with real cryptographic operations using OpenSSL (C), elliptic.js (Node.js), and ecdsa library (Python), ensuring secure authentication of all hazard alerts while maintaining system performance and providing comprehensive error handling.
