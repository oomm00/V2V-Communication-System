#!/usr/bin/env node
/**
 * Test ECDSA signature verification implementation
 */

const SignatureVerifier = require('./node/src/utils/signatureVerifier');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSignatureVerifier() {
  log('\n╔══════════════════════════════════════════════════════════╗', 'blue');
  log('║         ECDSA Signature Verification Test               ║', 'blue');
  log('╚══════════════════════════════════════════════════════════╝', 'blue');
  
  const keyRegistryPath = path.join(__dirname, 'node', 'keys', 'publicKeys.json');
  
  log('\n1️⃣  Initializing SignatureVerifier...', 'blue');
  const verifier = new SignatureVerifier(keyRegistryPath);
  log('   ✅ SignatureVerifier initialized', 'green');
  
  log('\n2️⃣  Testing canonical message creation...', 'blue');
  const alert = {
    msg_type: 'hazard_report',
    ephemeral_id: 'test_car',
    location: [40.7128, -74.0060],
    hazard_type: 'ice_patch',
    confidence: 0.85,
    signature: 'test_signature'
  };
  
  const canonical = verifier.createCanonicalMessage(alert);
  log(`   Canonical: ${canonical}`, 'yellow');
  log('   ✅ Canonical message created', 'green');
  
  log('\n3️⃣  Testing replay attack prevention...', 'blue');
  const isNew1 = verifier.checkReplay('test_car', 1);
  const isNew2 = verifier.checkReplay('test_car', 1); // Same sequence
  
  if (isNew1 && !isNew2) {
    log('   ✅ Replay attack prevention working', 'green');
  } else {
    log('   ❌ Replay attack prevention failed', 'red');
  }
  
  log('\n4️⃣  Testing signature verification with missing ID...', 'blue');
  const result1 = verifier.verifySignature({
    ...alert,
    ephemeral_id: 'unknown_vehicle'
  });
  
  if (!result1.valid && result1.code === 'UNKNOWN_ID') {
    log('   ✅ Correctly rejected unknown vehicle', 'green');
  } else {
    log('   ❌ Should have rejected unknown vehicle', 'red');
  }
  
  log('\n5️⃣  Testing signature verification with missing signature...', 'blue');
  const result2 = verifier.verifySignature({
    msg_type: 'hazard_report',
    ephemeral_id: 'test_car',
    location: [40.7128, -74.0060],
    hazard_type: 'ice_patch'
  });
  
  if (!result2.valid && result2.code === 'MISSING_SIGNATURE') {
    log('   ✅ Correctly rejected missing signature', 'green');
  } else {
    log('   ❌ Should have rejected missing signature', 'red');
  }
  
  log('\n╔══════════════════════════════════════════════════════════╗', 'green');
  log('║              Signature Verification Tests Complete       ║', 'green');
  log('╚══════════════════════════════════════════════════════════╝', 'green');
  
  log('\n📝 Next steps:', 'blue');
  log('   1. Start API server: cd node && npm start');
  log('   2. Run Python simulator: cd node/scripts && python simulator.py');
  log('   3. Enable signatures: Set REQUIRE_SIGNATURES=true in node/.env');
  log('   4. Test end-to-end flow');
}

testSignatureVerifier().catch(err => {
  log(`\n❌ Test failed: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
